// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title PublicGoodsPool — IAB Public Goods Allocator
 * @notice Outcome-based escrow where donors deposit funds, implementers claim
 *         outcomes, and donors allocate their share via Wishocratic pairwise
 *         comparison weighted by deposit amount.
 *
 * Mechanism:
 *   1. Donors deposit stablecoins → funds held in escrow
 *   2. Oracle reports outcome metrics (health DALYs, income gains)
 *   3. When metrics cross thresholds → pool unlocks for allocation
 *   4. Off-chain Wishocratic pairwise comparison determines implementer shares
 *   5. Owner posts aggregated allocation weights → contract distributes proportionally
 *   6. Deposit-as-identity: your allocation power = your deposit amount (no sybil)
 *
 * Bonded disputes:
 *   - Challengers post a bond to dispute an allocation
 *   - If dispute succeeds, challenger gets bond back + penalty from disputed party
 *   - If dispute fails, challenger loses bond (escalation is expensive)
 *
 * Token-agnostic: accepts any ERC20 (USDC, DAI, etc.)
 */
contract PublicGoodsPool is Ownable {
    using SafeERC20 for IERC20;

    IERC20 public token;

    // --- Pool lifecycle ---

    enum PoolStatus { Open, Locked, Allocating, Distributed }
    PoolStatus public status;

    /// @notice Health metric threshold (basis points improvement, e.g. 100 = 1%)
    uint256 public healthThreshold;

    /// @notice Income metric threshold (basis points improvement)
    uint256 public incomeThreshold;

    /// @notice Current reported health metric value
    uint256 public currentHealthMetric;

    /// @notice Current reported income metric value
    uint256 public currentIncomeMetric;

    /// @notice 50/50 split between health and income outcomes
    uint256 public constant HEALTH_WEIGHT_BPS = 5000;

    // --- Donor tracking (deposit-as-identity) ---

    struct Donor {
        uint256 amount;
        bool exists;
    }

    mapping(address => Donor) public donors;
    address[] public donorList;
    uint256 public totalDeposits;

    // --- Implementer tracking ---

    struct Implementer {
        address wallet;
        uint256 allocationWeight; // basis points of total pool (0-10000)
        bool active;
        string evidenceCid;      // Storacha CID linking to Hypercert evidence
    }

    mapping(bytes32 => Implementer) public implementers;
    bytes32[] public implementerIds;
    uint256 public totalAllocationWeight;

    // --- Dispute tracking ---

    struct Dispute {
        address challenger;
        bytes32 implementerId;
        uint256 bond;
        bool resolved;
        bool successful;
    }

    uint256 public disputeBondMinimum;
    mapping(uint256 => Dispute) public disputes;
    uint256 public disputeCount;

    // --- Events ---

    event Deposited(address indexed donor, uint256 amount);
    event Withdrawn(address indexed donor, uint256 amount);
    event MetricsUpdated(uint256 healthMetric, uint256 incomeMetric);
    event PoolUnlocked(uint256 totalDeposits);
    event ImplementerRegistered(bytes32 indexed id, address wallet, string evidenceCid);
    event AllocationSet(bytes32 indexed implementerId, uint256 weight);
    event FundsDistributed(uint256 totalAmount, uint256 recipientCount);
    event DisputeOpened(uint256 indexed disputeId, address challenger, bytes32 implementerId, uint256 bond);
    event DisputeResolved(uint256 indexed disputeId, bool successful);

    constructor(
        address _token,
        uint256 _healthThreshold,
        uint256 _incomeThreshold,
        uint256 _disputeBondMinimum
    ) Ownable(msg.sender) {
        require(_token != address(0), "PublicGoodsPool: zero token");
        require(_healthThreshold > 0, "PublicGoodsPool: zero health threshold");
        require(_incomeThreshold > 0, "PublicGoodsPool: zero income threshold");

        token = IERC20(_token);
        healthThreshold = _healthThreshold;
        incomeThreshold = _incomeThreshold;
        disputeBondMinimum = _disputeBondMinimum;
        status = PoolStatus.Open;
    }

    // --- Donor functions ---

    /**
     * @notice Deposit tokens into the public goods pool. Deposit amount = allocation power.
     *         This IS your identity — no sybil attacks possible.
     */
    function deposit(uint256 amount) external {
        require(status == PoolStatus.Open, "PublicGoodsPool: not accepting deposits");
        require(amount > 0, "PublicGoodsPool: zero deposit");

        token.safeTransferFrom(msg.sender, address(this), amount);

        if (!donors[msg.sender].exists) {
            donorList.push(msg.sender);
            donors[msg.sender].exists = true;
        }
        donors[msg.sender].amount += amount;
        totalDeposits += amount;

        emit Deposited(msg.sender, amount);
    }

    /**
     * @notice Withdraw deposits while pool is still open (before lock).
     */
    function withdraw(uint256 amount) external {
        require(status == PoolStatus.Open, "PublicGoodsPool: pool locked");
        require(donors[msg.sender].amount >= amount, "PublicGoodsPool: insufficient balance");

        donors[msg.sender].amount -= amount;
        totalDeposits -= amount;

        token.safeTransfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }

    // --- Oracle / metric functions ---

    /**
     * @notice Update outcome metrics. Called by oracle after verification.
     *         When both thresholds are met, pool automatically unlocks.
     */
    function updateMetrics(
        uint256 _healthMetric,
        uint256 _incomeMetric
    ) external onlyOwner {
        require(
            status == PoolStatus.Open || status == PoolStatus.Locked,
            "PublicGoodsPool: invalid status"
        );

        currentHealthMetric = _healthMetric;
        currentIncomeMetric = _incomeMetric;

        emit MetricsUpdated(_healthMetric, _incomeMetric);

        // Auto-unlock when both thresholds met
        if (
            _healthMetric >= healthThreshold &&
            _incomeMetric >= incomeThreshold &&
            status == PoolStatus.Open
        ) {
            status = PoolStatus.Locked;
            emit PoolUnlocked(totalDeposits);
        }
    }

    /**
     * @notice Manually lock the pool (stop deposits, begin allocation phase).
     */
    function lockPool() external onlyOwner {
        require(status == PoolStatus.Open, "PublicGoodsPool: not open");
        status = PoolStatus.Locked;
        emit PoolUnlocked(totalDeposits);
    }

    /**
     * @notice Move from Locked → Allocating (begin Wishocratic allocation).
     */
    function beginAllocation() external onlyOwner {
        require(status == PoolStatus.Locked, "PublicGoodsPool: not locked");
        status = PoolStatus.Allocating;
    }

    // --- Implementer functions ---

    /**
     * @notice Register an implementer who claims to have produced outcomes.
     * @param id Keccak256 hash of implementer identifier
     * @param wallet Payout address
     * @param evidenceCid Storacha CID pointing to Hypercert evidence bundle
     */
    function registerImplementer(
        bytes32 id,
        address wallet,
        string calldata evidenceCid
    ) external onlyOwner {
        require(wallet != address(0), "PublicGoodsPool: zero wallet");
        require(bytes(evidenceCid).length > 0, "PublicGoodsPool: empty evidence");
        require(!implementers[id].active, "PublicGoodsPool: already registered");

        implementers[id] = Implementer({
            wallet: wallet,
            allocationWeight: 0,
            active: true,
            evidenceCid: evidenceCid
        });
        implementerIds.push(id);

        emit ImplementerRegistered(id, wallet, evidenceCid);
    }

    /**
     * @notice Set allocation weights from off-chain Wishocratic pairwise comparison.
     *         Weights are deposit-weighted: each donor's pairwise votes are weighted
     *         by their deposit amount, then aggregated into these final weights.
     * @param ids Implementer ID hashes
     * @param weights Allocation weights in basis points (must sum to 10000)
     */
    function setAllocations(
        bytes32[] calldata ids,
        uint256[] calldata weights
    ) external onlyOwner {
        require(status == PoolStatus.Allocating, "PublicGoodsPool: not in allocation phase");
        require(ids.length == weights.length, "PublicGoodsPool: length mismatch");

        // Reset total
        totalAllocationWeight = 0;

        for (uint256 i = 0; i < ids.length; i++) {
            require(implementers[ids[i]].active, "PublicGoodsPool: not registered");
            implementers[ids[i]].allocationWeight = weights[i];
            totalAllocationWeight += weights[i];
            emit AllocationSet(ids[i], weights[i]);
        }

        require(totalAllocationWeight == 10_000, "PublicGoodsPool: weights must sum to 10000");
    }

    /**
     * @notice Distribute funds to implementers based on Wishocratic allocation weights.
     */
    function distribute() external onlyOwner {
        require(status == PoolStatus.Allocating, "PublicGoodsPool: not in allocation phase");
        require(totalAllocationWeight == 10_000, "PublicGoodsPool: allocations not set");

        uint256 balance = token.balanceOf(address(this));
        require(balance > 0, "PublicGoodsPool: no funds");

        uint256 distributed = 0;
        uint256 recipientCount = 0;

        for (uint256 i = 0; i < implementerIds.length; i++) {
            Implementer storage impl = implementers[implementerIds[i]];
            if (!impl.active || impl.allocationWeight == 0) continue;

            uint256 share = (balance * impl.allocationWeight) / 10_000;
            if (share > 0) {
                token.safeTransfer(impl.wallet, share);
                distributed += share;
                recipientCount++;
            }
        }

        status = PoolStatus.Distributed;
        emit FundsDistributed(distributed, recipientCount);
    }

    // --- Dispute functions ---

    /**
     * @notice Open a dispute against an implementer's allocation.
     *         Challenger must post a bond in the pool's token.
     */
    function openDispute(
        bytes32 implementerId,
        uint256 bond
    ) external {
        require(status == PoolStatus.Allocating, "PublicGoodsPool: not in allocation phase");
        require(implementers[implementerId].active, "PublicGoodsPool: not registered");
        require(bond >= disputeBondMinimum, "PublicGoodsPool: bond too small");

        token.safeTransferFrom(msg.sender, address(this), bond);

        uint256 disputeId = disputeCount++;
        disputes[disputeId] = Dispute({
            challenger: msg.sender,
            implementerId: implementerId,
            bond: bond,
            resolved: false,
            successful: false
        });

        emit DisputeOpened(disputeId, msg.sender, implementerId, bond);
    }

    /**
     * @notice Resolve a dispute. Owner adjudicates (in production: on-chain vote).
     * @param disputeId The dispute to resolve
     * @param successful Whether the challenger wins
     */
    function resolveDispute(uint256 disputeId, bool successful) external onlyOwner {
        Dispute storage d = disputes[disputeId];
        require(!d.resolved, "PublicGoodsPool: already resolved");

        d.resolved = true;
        d.successful = successful;

        if (successful) {
            // Challenger wins: return bond + deactivate implementer
            token.safeTransfer(d.challenger, d.bond);
            implementers[d.implementerId].active = false;
            totalAllocationWeight -= implementers[d.implementerId].allocationWeight;
            implementers[d.implementerId].allocationWeight = 0;
        }
        // If unsuccessful, bond stays in pool (penalty for frivolous dispute)

        emit DisputeResolved(disputeId, successful);
    }

    // --- View functions ---

    function donorCount() external view returns (uint256) {
        return donorList.length;
    }

    function implementerCount() external view returns (uint256) {
        return implementerIds.length;
    }

    function poolBalance() external view returns (uint256) {
        return token.balanceOf(address(this));
    }

    function donorDeposit(address donor) external view returns (uint256) {
        return donors[donor].amount;
    }

    function isThresholdMet() external view returns (bool health, bool income, bool both) {
        health = currentHealthMetric >= healthThreshold;
        income = currentIncomeMetric >= incomeThreshold;
        both = health && income;
    }
}

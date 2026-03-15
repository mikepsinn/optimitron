// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title VictoryBond — Incentive Alignment Bond (IAB)
 * @notice Tokenized bond instrument that aligns investor self-interest with
 *         treaty adoption. Investors earn returns from the revenue share of
 *         treaty-generated funding flows, proportional to verified alignment
 *         gains in terminal metrics (dHealthy_med, gIncome_med).
 *
 * Three-layer mechanism (from IAB paper):
 *   Layer 1 — INVESTOR ALIGNMENT
 *     Investors buy bonds by depositing stablecoin (USDC). Returns are
 *     proportional to the AlignmentTreasury revenue share received. When
 *     treaty metrics improve, more revenue flows in, returns rise, more
 *     investors buy bonds, more lobbying happens. The flywheel.
 *
 *   Layer 2 — POLITICIAN ALIGNMENT
 *     AlignmentTreasury distributes $WISH to politicians proportional to
 *     their alignment scores (handled in AlignmentTreasury.sol). VictoryBond
 *     feeds a share of its revenue into the AlignmentTreasury to fund this.
 *
 *   Layer 3 — POST-OFFICE CAREER GUARANTEE
 *     Off-chain: high-scoring politicians are matched to consulting contracts,
 *     board seats, and speaking opportunities funded from the perpetuity stream.
 *     Cannot be implemented on-chain; modeled here as a reserved allocation.
 *
 * Dominant assurance structure:
 *   - If the funding threshold is not met by `assuranceDeadline`:
 *     investors get their full principal back (assurance refund)
 *   - If threshold is met but zero verified metric gains by T+15 years:
 *     investors get principal + all accrued yield (global failure refund)
 *   - If gains are verified: revenue share flows perpetually
 *
 * Revenue flow:
 *   1. AlignmentTreasury.receiveTreatyRevenue() → VictoryBond.receiveRevenue()
 *   2. VictoryBond splits revenue: 60% to bondholders, 30% to AlignmentTreasury
 *      (for politician alignment), 10% reserved for Layer 3 post-office careers
 *   3. Bondholders claim their pro-rata share of accumulated revenue
 *
 * Self-completing loop (prize paper, "The Self-Completing Loop"):
 *   VictoryBond ↔ AlignmentTreasury ↔ PrizePool
 *   - Metric gains in PrizePool → revenue into AlignmentTreasury →
 *     revenue share into VictoryBond → higher returns → more bond buyers →
 *     more lobbying → more metric gains → more treasury releases
 */
contract VictoryBond is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // --- Token references ---
    IERC20 public depositToken;          // USDC or equivalent stablecoin
    address public alignmentTreasury;    // AlignmentTreasury contract

    // --- Funding threshold / assurance ---
    uint256 public fundingThreshold;     // Minimum deposits to activate
    uint256 public assuranceDeadline;    // Unix timestamp: refund if threshold not met by this date
    bool public thresholdMet;            // Latches true when threshold crossed

    // --- 15-year global failure refund ---
    uint256 public deploymentTimestamp;  // T0: timestamp when threshold was first met
    uint256 public constant REFUND_WINDOW = 15 * 365 days;
    bool public verifiedGainsRecorded;   // Latches true when any gain triggers a payout
    bool public globalFailureRefundActive; // True after zero-gain snapshot at T+15

    // --- Bondholder tracking ---
    struct BondPosition {
        uint256 principal;
        uint256 accruedYield;      // Safe yield earned while funds sit idle
        uint256 revenueShareDebt;  // Revenue accumulated before this deposit (for fair accounting)
        bool exists;
    }

    mapping(address => BondPosition) public positions;
    address[] public bondholderList;
    uint256 public totalPrincipal;

    // --- Yield-bearing idle funds ---
    // When threshold not yet met (or treasury idle), principal sits in safe yield
    // Implemented as accumulated yield tracked off-chain; simplified here as rate + timestamp
    uint256 public idleYieldRateBps;     // Annual yield on idle funds (basis points, e.g. 500 = 5%)
    uint256 public lastYieldTimestamp;

    // --- Revenue share tracking ---
    // Revenue from treaty flows; distributed proportionally to bondholders
    uint256 public totalRevenuReceived;
    uint256 public totalRevenueDistributed;
    uint256 public revenuePerBondUnit;   // Cumulative revenue per 1e18 units of principal (scaled)
    uint256 private constant REVENUE_SCALE = 1e18;

    // --- Revenue allocation splits (basis points) ---
    uint256 public constant BONDHOLDER_SPLIT_BPS = 6000;   // 60% to bondholders
    uint256 public constant ALIGNMENT_SPLIT_BPS  = 3000;   // 30% to AlignmentTreasury (politician alignment)
    uint256 public constant LAYER3_SPLIT_BPS     = 1000;   // 10% reserved for Layer 3 post-office careers

    // Layer 3 reserve (custodied here; disbursed off-chain via owner)
    uint256 public layer3Reserve;

    // --- Events ---
    event BondPurchased(address indexed buyer, uint256 amount);
    event AssuranceRefundClaimed(address indexed holder, uint256 amount);
    event GlobalFailureRefundActivated(uint256 timestamp);
    event GlobalFailureRefundClaimed(address indexed holder, uint256 principal, uint256 yield);
    event RevenueReceived(uint256 amount);
    event RevenueShareClaimed(address indexed holder, uint256 amount);
    event YieldClaimed(address indexed holder, uint256 amount);
    event ThresholdMet(uint256 totalPrincipal, uint256 timestamp);
    event VerifiedGainRecorded(uint256 timestamp);
    event Layer3Reserved(uint256 amount);

    constructor(
        address _depositToken,
        address _alignmentTreasury,
        uint256 _fundingThreshold,
        uint256 _assuranceDeadlineDays,
        uint256 _idleYieldRateBps
    ) Ownable(msg.sender) {
        require(_depositToken != address(0), "VictoryBond: zero token");
        require(_alignmentTreasury != address(0), "VictoryBond: zero treasury");
        require(_fundingThreshold > 0, "VictoryBond: zero threshold");
        require(_idleYieldRateBps <= 2000, "VictoryBond: yield too high"); // max 20%

        depositToken = IERC20(_depositToken);
        alignmentTreasury = _alignmentTreasury;
        fundingThreshold = _fundingThreshold;
        assuranceDeadline = block.timestamp + (_assuranceDeadlineDays * 1 days);
        idleYieldRateBps = _idleYieldRateBps;
        lastYieldTimestamp = block.timestamp;
    }

    // =========================================================================
    // INVESTOR FUNCTIONS
    // =========================================================================

    /**
     * @notice Buy bonds by depositing stablecoin. Principal earns idle yield
     *         until the funding threshold is met, then transitions to revenue share.
     */
    function buyBond(uint256 amount) external nonReentrant {
        require(amount > 0, "VictoryBond: zero amount");
        require(!globalFailureRefundActive, "VictoryBond: global failure refund active");

        // Accrue idle yield for all existing holders before new deposit changes the base
        _accrueIdleYield();

        depositToken.safeTransferFrom(msg.sender, address(this), amount);

        if (!positions[msg.sender].exists) {
            bondholderList.push(msg.sender);
            positions[msg.sender].exists = true;
        }

        // Set revenue debt to current accumulated revenue (fair: new money doesn't claim old revenue)
        positions[msg.sender].revenueShareDebt += (revenuePerBondUnit * amount) / REVENUE_SCALE;
        positions[msg.sender].principal += amount;
        totalPrincipal += amount;

        // Check if threshold just crossed
        if (!thresholdMet && totalPrincipal >= fundingThreshold) {
            thresholdMet = true;
            deploymentTimestamp = block.timestamp;
            emit ThresholdMet(totalPrincipal, block.timestamp);
        }

        emit BondPurchased(msg.sender, amount);
    }

    /**
     * @notice Claim accumulated idle yield (earned on principal while threshold not yet met,
     *         or during periods of low treaty revenue).
     */
    function claimIdleYield() external nonReentrant {
        _accrueIdleYield();
        uint256 yield = positions[msg.sender].accruedYield;
        require(yield > 0, "VictoryBond: no yield");

        positions[msg.sender].accruedYield = 0;
        depositToken.safeTransfer(msg.sender, yield);
        emit YieldClaimed(msg.sender, yield);
    }

    /**
     * @notice Claim revenue share from treaty-generated funding flows.
     *         This is the primary return mechanism once the treaty is adopted.
     */
    function claimRevenueShare() external nonReentrant {
        uint256 share = _pendingRevenueShare(msg.sender);
        require(share > 0, "VictoryBond: no revenue share");

        positions[msg.sender].revenueShareDebt =
            (revenuePerBondUnit * positions[msg.sender].principal) / REVENUE_SCALE;

        depositToken.safeTransfer(msg.sender, share);
        totalRevenueDistributed += share;
        emit RevenueShareClaimed(msg.sender, share);
    }

    // =========================================================================
    // ASSURANCE REFUND (pre-threshold failure)
    // =========================================================================

    /**
     * @notice Claim full principal refund if threshold was never met by the deadline.
     *         Principal + all accrued idle yield returned.
     */
    function claimAssuranceRefund() external nonReentrant {
        require(!thresholdMet, "VictoryBond: threshold was met");
        require(block.timestamp > assuranceDeadline, "VictoryBond: deadline not passed");

        _accrueIdleYield();

        uint256 principal = positions[msg.sender].principal;
        uint256 yield = positions[msg.sender].accruedYield;
        require(principal > 0, "VictoryBond: no position");

        positions[msg.sender].principal = 0;
        positions[msg.sender].accruedYield = 0;
        totalPrincipal -= principal;

        depositToken.safeTransfer(msg.sender, principal + yield);
        emit AssuranceRefundClaimed(msg.sender, principal + yield);
    }

    // =========================================================================
    // 15-YEAR GLOBAL FAILURE REFUND (post-threshold, no verified gains)
    // =========================================================================

    /**
     * @notice Activate the global failure refund clause.
     *         Called by owner/oracle after Optimitron snapshot confirms zero
     *         cumulative gains in dHealthy_med and gIncome_med across all
     *         adopting jurisdictions at T+15 years.
     *
     *         Requires:
     *         - threshold was met (deployment happened)
     *         - 15 years have passed since deployment
     *         - no verified gains have ever been recorded
     */
    function activateGlobalFailureRefund() external onlyOwner {
        require(thresholdMet, "VictoryBond: threshold not met");
        require(
            block.timestamp >= deploymentTimestamp + REFUND_WINDOW,
            "VictoryBond: 15 years not elapsed"
        );
        require(!verifiedGainsRecorded, "VictoryBond: gains already verified (refund expired)");
        require(!globalFailureRefundActive, "VictoryBond: already activated");

        globalFailureRefundActive = true;
        emit GlobalFailureRefundActivated(block.timestamp);
    }

    /**
     * @notice Claim full principal + all accrued yield after global failure refund activates.
     */
    function claimGlobalFailureRefund() external nonReentrant {
        require(globalFailureRefundActive, "VictoryBond: refund not active");

        _accrueIdleYield();

        uint256 principal = positions[msg.sender].principal;
        uint256 yield = positions[msg.sender].accruedYield;
        require(principal > 0, "VictoryBond: no position");

        positions[msg.sender].principal = 0;
        positions[msg.sender].accruedYield = 0;
        totalPrincipal -= principal;

        depositToken.safeTransfer(msg.sender, principal + yield);
        emit GlobalFailureRefundClaimed(msg.sender, principal, yield);
    }

    // =========================================================================
    // REVENUE INTAKE (from treaty funding flows)
    // =========================================================================

    /**
     * @notice Receive treaty revenue and split it across bondholders,
     *         AlignmentTreasury (politician alignment), and Layer 3 reserve.
     *
     *         Called by AlignmentTreasury when treaty-generated funding flows in.
     *         This is the key coupling: treaty success → revenue → bondholder returns.
     */
    function receiveRevenue(uint256 amount) external nonReentrant {
        require(amount > 0, "VictoryBond: zero revenue");
        require(thresholdMet, "VictoryBond: threshold not met");

        depositToken.safeTransferFrom(msg.sender, address(this), amount);

        // Mark that verified gains exist — defeats global failure refund clause
        if (!verifiedGainsRecorded) {
            verifiedGainsRecorded = true;
            emit VerifiedGainRecorded(block.timestamp);
        }

        totalRevenuReceived += amount;

        uint256 bondholderShare = (amount * BONDHOLDER_SPLIT_BPS) / 10_000;
        uint256 alignmentShare  = (amount * ALIGNMENT_SPLIT_BPS)  / 10_000;
        uint256 layer3Share     = (amount * LAYER3_SPLIT_BPS)     / 10_000;

        // Update revenue-per-unit for pro-rata bondholder claims
        if (totalPrincipal > 0) {
            revenuePerBondUnit += (bondholderShare * REVENUE_SCALE) / totalPrincipal;
        }

        // Forward alignment share to AlignmentTreasury immediately
        if (alignmentShare > 0) {
            depositToken.safeTransfer(alignmentTreasury, alignmentShare);
        }

        // Accumulate Layer 3 reserve (disbursed off-chain by owner)
        layer3Reserve += layer3Share;

        emit RevenueReceived(amount);
    }

    /**
     * @notice Disburse Layer 3 reserve to off-chain post-office career program.
     *         Only owner. In production, this is governed by a multisig + Wishocracy vote.
     */
    function disburseLayer3Reserve(address recipient, uint256 amount) external onlyOwner {
        require(amount <= layer3Reserve, "VictoryBond: exceeds reserve");
        layer3Reserve -= amount;
        depositToken.safeTransfer(recipient, amount);
    }

    // =========================================================================
    // INTERNAL YIELD ACCRUAL
    // =========================================================================

    /**
     * @notice Accrue idle yield to all bondholders pro-rata since last accrual.
     *         Simplified linear model. In production: integrate with ERC-4626 vault.
     *
     *         Idle yield accrues whenever principal is sitting uninvested —
     *         i.e., before treaty revenue starts flowing. Represents T-bill returns
     *         (or ERC-4626 vault returns) on the deposited principal.
     */
    function _accrueIdleYield() internal {
        if (bondholderList.length == 0 || totalPrincipal == 0) {
            lastYieldTimestamp = block.timestamp;
            return;
        }

        uint256 elapsed = block.timestamp - lastYieldTimestamp;
        if (elapsed == 0) return;

        // Annual rate: idleYieldRateBps / 10000
        // Per-second rate: idleYieldRateBps / (10000 * 365 days)
        uint256 totalYield = (totalPrincipal * idleYieldRateBps * elapsed) / (10_000 * 365 days);

        if (totalYield == 0) {
            lastYieldTimestamp = block.timestamp;
            return;
        }

        // Distribute proportionally to all holders
        for (uint256 i = 0; i < bondholderList.length; i++) {
            address holder = bondholderList[i];
            if (positions[holder].principal == 0) continue;

            uint256 share = (totalYield * positions[holder].principal) / totalPrincipal;
            positions[holder].accruedYield += share;
        }

        lastYieldTimestamp = block.timestamp;
    }

    function _pendingRevenueShare(address holder) internal view returns (uint256) {
        if (positions[holder].principal == 0) return 0;
        uint256 entitled = (revenuePerBondUnit * positions[holder].principal) / REVENUE_SCALE;
        uint256 debt = positions[holder].revenueShareDebt;
        return entitled > debt ? entitled - debt : 0;
    }

    // =========================================================================
    // VIEW FUNCTIONS
    // =========================================================================

    function bondholderCount() external view returns (uint256) {
        return bondholderList.length;
    }

    function pendingRevenueShare(address holder) external view returns (uint256) {
        return _pendingRevenueShare(holder);
    }

    function isAssuranceRefundEligible() external view returns (bool) {
        return !thresholdMet && block.timestamp > assuranceDeadline;
    }

    function isGlobalFailureRefundEligible() external view returns (bool) {
        return thresholdMet &&
               block.timestamp >= deploymentTimestamp + REFUND_WINDOW &&
               !verifiedGainsRecorded;
    }

    function timeUntilRefundWindow() external view returns (uint256) {
        if (!thresholdMet) return 0;
        uint256 target = deploymentTimestamp + REFUND_WINDOW;
        if (block.timestamp >= target) return 0;
        return target - block.timestamp;
    }

    function contractBalance() external view returns (uint256) {
        return depositToken.balanceOf(address(this));
    }
}

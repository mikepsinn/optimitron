// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IAavePool.sol";

/**
 * @title IABVault — Incentive Alignment Bond Vault
 * @notice Accepts stablecoins (USDC/DAI), deposits into Aave V3 for yield,
 *         and handles two outcomes:
 *
 *   1. Thresholds NOT met after maturity → depositors reclaim principal + yield
 *   2. Thresholds met → funds allocated to PrizePool for Wishocratic distribution
 *
 * Yield mechanism:
 *   Aave V3 aTokens auto-accrue yield. USDC on Aave earns ~4-8% APY.
 *   Over 15 years at ~8%, depositors roughly quadruple their money on the "fail" path.
 *
 * Separation from $WISH:
 *   IABs accept real stablecoins, not $WISH tokens. $WISH is a separate monetary
 *   reform initiative. IABs are outcome-based financial instruments.
 */
contract IABVault is Ownable {
    using SafeERC20 for IERC20;

    // --- Immutable config ---

    IERC20 public immutable stablecoin;
    IERC20 public immutable aToken;
    IAavePool public immutable aavePool;
    uint256 public immutable maturityDuration;
    uint256 public immutable healthThreshold;
    uint256 public immutable incomeThreshold;
    uint256 public immutable deployTimestamp;

    // --- Mutable state ---

    address public prizePool;
    bool public thresholdMet;
    bool public fundsAllocated;

    struct Bond {
        uint256 principal;
        uint256 depositTimestamp;
    }

    mapping(address => Bond) public bonds;
    address[] public depositorList;
    uint256 public totalPrincipal;

    // --- Events ---

    event Deposited(address indexed depositor, uint256 amount);
    event RefundClaimed(address indexed depositor, uint256 amount);
    event AllocatedToPrize(uint256 amount);
    event MetricsUpdated(uint256 health, uint256 income, bool thresholdMet);
    event PrizePoolSet(address indexed prizePool);

    constructor(
        address _stablecoin,
        address _aToken,
        address _aavePool,
        uint256 _maturityDuration,
        uint256 _healthThreshold,
        uint256 _incomeThreshold
    ) Ownable(msg.sender) {
        require(_stablecoin != address(0), "IABVault: zero stablecoin");
        require(_aToken != address(0), "IABVault: zero aToken");
        require(_aavePool != address(0), "IABVault: zero aave pool");
        require(_maturityDuration > 0, "IABVault: zero maturity");
        require(_healthThreshold > 0, "IABVault: zero health threshold");
        require(_incomeThreshold > 0, "IABVault: zero income threshold");

        stablecoin = IERC20(_stablecoin);
        aToken = IERC20(_aToken);
        aavePool = IAavePool(_aavePool);
        maturityDuration = _maturityDuration;
        healthThreshold = _healthThreshold;
        incomeThreshold = _incomeThreshold;
        deployTimestamp = block.timestamp;
    }

    // --- Depositor functions ---

    /**
     * @notice Deposit stablecoins to purchase an Incentive Alignment Bond.
     *         Funds are immediately supplied to Aave to earn yield.
     */
    function deposit(uint256 amount) external {
        require(amount > 0, "IABVault: zero deposit");
        require(!thresholdMet, "IABVault: threshold already met");
        require(
            block.timestamp < deployTimestamp + maturityDuration,
            "IABVault: matured"
        );

        // Transfer stablecoin from depositor to vault
        stablecoin.safeTransferFrom(msg.sender, address(this), amount);

        // Supply to Aave for yield
        stablecoin.forceApprove(address(aavePool), amount);
        aavePool.supply(address(stablecoin), amount, address(this), 0);

        // Track depositor
        if (bonds[msg.sender].principal == 0) {
            depositorList.push(msg.sender);
        }
        bonds[msg.sender].principal += amount;
        bonds[msg.sender].depositTimestamp = block.timestamp;
        totalPrincipal += amount;

        emit Deposited(msg.sender, amount);
    }

    /**
     * @notice Claim refund after maturity when thresholds were NOT met.
     *         Returns proportional share of principal + all accrued yield.
     */
    function claimRefund() external {
        require(
            block.timestamp >= deployTimestamp + maturityDuration,
            "IABVault: not matured"
        );
        require(!thresholdMet, "IABVault: threshold met");

        Bond storage bond = bonds[msg.sender];
        require(bond.principal > 0, "IABVault: no deposit");

        uint256 principal = bond.principal;
        uint256 share = _proportionalShare(principal);

        // Effects before interactions
        bond.principal = 0;
        totalPrincipal -= principal;

        // Withdraw from Aave and send to depositor
        aavePool.withdraw(address(stablecoin), share, msg.sender);

        emit RefundClaimed(msg.sender, share);
    }

    // --- Allocation (threshold met) ---

    /**
     * @notice Allocate all vault funds to the PrizePool for Wishocratic distribution.
     *         Only callable when health + income thresholds have both been met.
     */
    function allocateToPrize() external {
        require(thresholdMet, "IABVault: threshold not met");
        require(!fundsAllocated, "IABVault: already allocated");
        require(prizePool != address(0), "IABVault: no prize pool");

        fundsAllocated = true;

        uint256 totalValue = aToken.balanceOf(address(this));
        require(totalValue > 0, "IABVault: no funds");

        // Withdraw everything from Aave
        aavePool.withdraw(address(stablecoin), totalValue, address(this));

        // Transfer to PrizePool for Wishocratic allocation
        stablecoin.safeTransfer(prizePool, totalValue);

        emit AllocatedToPrize(totalValue);
    }

    // --- Oracle / admin ---

    /**
     * @notice Update health and income metrics from oracle.
     *         When both thresholds are met, thresholdMet flips to true permanently.
     */
    function updateMetrics(uint256 health, uint256 income) external onlyOwner {
        if (health >= healthThreshold && income >= incomeThreshold) {
            thresholdMet = true;
        }
        emit MetricsUpdated(health, income, thresholdMet);
    }

    /**
     * @notice Set the PrizePool address for fund allocation.
     */
    function setPrizePool(address _prizePool) external onlyOwner {
        require(_prizePool != address(0), "IABVault: zero prize pool");
        prizePool = _prizePool;
        emit PrizePoolSet(_prizePool);
    }

    // --- View functions ---

    /**
     * @notice Get a depositor's current balance (principal + proportional yield).
     */
    function getBalance(address depositor) external view returns (uint256) {
        if (bonds[depositor].principal == 0) return 0;
        return _proportionalShare(bonds[depositor].principal);
    }

    /**
     * @notice Total value in vault (principal + all accrued yield).
     */
    function totalPoolValue() external view returns (uint256) {
        return aToken.balanceOf(address(this));
    }

    /**
     * @notice Timestamp when the vault matures.
     */
    function maturityTimestamp() external view returns (uint256) {
        return deployTimestamp + maturityDuration;
    }

    /**
     * @notice Number of unique depositors.
     */
    function depositorCount() external view returns (uint256) {
        return depositorList.length;
    }

    // --- Internal ---

    function _proportionalShare(uint256 principal) internal view returns (uint256) {
        if (totalPrincipal == 0) return 0;
        uint256 totalValue = aToken.balanceOf(address(this));
        return (totalValue * principal) / totalPrincipal;
    }
}

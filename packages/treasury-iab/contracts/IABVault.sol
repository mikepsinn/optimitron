// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@optimitron/treasury-shared/contracts/interfaces/IAavePool.sol";

/**
 * @title IABVault — Incentive Alignment Bond Vault (Tokenized)
 * @notice Accepts stablecoins (USDC/DAI), deposits into Aave V3 for yield,
 *         and mints tradable IAB tokens representing your vault share.
 *
 * IAB tokens:
 *   - Minted on deposit proportional to vault share (share price rises as yield accrues)
 *   - Fully transferable ERC20 — trade on secondary markets
 *   - Your IAB balance = your Wishocratic allocation power
 *   - Burned on refund to reclaim proportional USDC + yield
 *
 * Two outcomes:
 *   1. Thresholds NOT met after maturity → burn IAB tokens to reclaim principal + yield
 *   2. Thresholds met → funds allocated to PublicGoodsPool for Wishocratic distribution
 *
 * Share pricing (prevents dilution):
 *   First deposit is 1:1. Subsequent deposits get shares at current exchange rate:
 *   shares = assets * totalSupply / totalAssets
 *   This ensures early depositors aren't diluted by late depositors.
 *
 * Separation from $WISH:
 *   IABs accept real stablecoins, not $WISH tokens. Completely separate systems.
 */
contract IABVault is ERC20, Ownable {
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

    address public publicGoodsPool;
    bool public thresholdMet;
    bool public fundsAllocated;

    /// @notice Track unique depositors for enumeration
    address[] public depositorList;
    mapping(address => bool) private _isDepositor;

    // Virtual offset to prevent first-depositor share price manipulation.
    // Matches OpenZeppelin ERC4626 defaults (offset of 1).
    uint256 private constant VIRTUAL_SHARES = 1;
    uint256 private constant VIRTUAL_ASSETS = 1;

    // --- Events ---

    event Deposited(address indexed depositor, uint256 assets, uint256 shares);
    event RefundClaimed(address indexed depositor, uint256 assets, uint256 sharesBurned);
    event AllocatedToPrize(uint256 amount);
    event MetricsUpdated(uint256 health, uint256 income, bool thresholdMet);
    event PublicGoodsPoolSet(address indexed publicGoodsPool);

    constructor(
        address _stablecoin,
        address _aToken,
        address _aavePool,
        uint256 _maturityDuration,
        uint256 _healthThreshold,
        uint256 _incomeThreshold
    ) ERC20("Incentive Alignment Bond", "IAB") Ownable(msg.sender) {
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

    /// @notice Match USDC decimals so 1 IAB ≈ $1 at initial share price
    function decimals() public pure override returns (uint8) {
        return 6;
    }

    // --- Depositor functions ---

    /**
     * @notice Deposit stablecoins to purchase IAB tokens.
     *         Shares are minted at the current exchange rate:
     *         First deposit: 1:1. Later: shares = assets * totalSupply / totalAssets.
     *         Funds are immediately supplied to Aave to earn yield.
     */
    function deposit(uint256 assets) external {
        require(assets > 0, "IABVault: zero deposit");
        require(!thresholdMet, "IABVault: threshold already met");
        require(
            block.timestamp < deployTimestamp + maturityDuration,
            "IABVault: matured"
        );

        uint256 shares = convertToShares(assets);
        require(shares > 0, "IABVault: zero shares");

        // Transfer stablecoin from depositor to vault
        stablecoin.safeTransferFrom(msg.sender, address(this), assets);

        // Supply to Aave for yield
        stablecoin.forceApprove(address(aavePool), assets);
        aavePool.supply(address(stablecoin), assets, address(this), 0);

        // Mint IAB tokens
        _mint(msg.sender, shares);

        // Track depositor
        if (!_isDepositor[msg.sender]) {
            depositorList.push(msg.sender);
            _isDepositor[msg.sender] = true;
        }

        emit Deposited(msg.sender, assets, shares);
    }

    /**
     * @notice Claim refund after maturity when thresholds were NOT met.
     *         Burns all your IAB tokens and returns proportional USDC + yield.
     */
    function claimRefund() external {
        require(
            block.timestamp >= deployTimestamp + maturityDuration,
            "IABVault: not matured"
        );
        require(!thresholdMet, "IABVault: threshold met");

        uint256 shares = balanceOf(msg.sender);
        require(shares > 0, "IABVault: no shares");

        uint256 assets = convertToAssets(shares);

        // Burn before external call (checks-effects-interactions)
        _burn(msg.sender, shares);

        // Withdraw from Aave and send to depositor
        aavePool.withdraw(address(stablecoin), assets, msg.sender);

        emit RefundClaimed(msg.sender, assets, shares);
    }

    // --- Allocation (threshold met) ---

    /**
     * @notice Allocate all vault funds to the PublicGoodsPool for Wishocratic distribution.
     *         Only callable when health + income thresholds have both been met.
     *         After allocation, IAB tokens remain as voting power tokens (no asset backing).
     */
    function allocateToPrize() external {
        require(thresholdMet, "IABVault: threshold not met");
        require(!fundsAllocated, "IABVault: already allocated");
        require(publicGoodsPool != address(0), "IABVault: no public goods pool");

        fundsAllocated = true;

        uint256 totalValue = totalAssets();
        require(totalValue > 0, "IABVault: no funds");

        // Withdraw everything from Aave
        aavePool.withdraw(address(stablecoin), totalValue, address(this));

        // Transfer to PublicGoodsPool for Wishocratic allocation
        stablecoin.safeTransfer(publicGoodsPool, totalValue);

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
     * @notice Set the PublicGoodsPool address for fund allocation.
     */
    function setPublicGoodsPool(address _publicGoodsPool) external onlyOwner {
        require(_publicGoodsPool != address(0), "IABVault: zero public goods pool");
        publicGoodsPool = _publicGoodsPool;
        emit PublicGoodsPoolSet(_publicGoodsPool);
    }

    // --- View functions ---

    /**
     * @notice Total stablecoin value in vault (principal + all accrued yield).
     */
    function totalAssets() public view returns (uint256) {
        return aToken.balanceOf(address(this));
    }

    /**
     * @notice Convert stablecoin amount to IAB shares at current exchange rate.
     *         Uses virtual offset to prevent first-depositor manipulation.
     */
    function convertToShares(uint256 assets) public view returns (uint256) {
        return
            (assets * (totalSupply() + VIRTUAL_SHARES)) /
            (totalAssets() + VIRTUAL_ASSETS);
    }

    /**
     * @notice Convert IAB shares to stablecoin value at current exchange rate.
     */
    function convertToAssets(uint256 shares) public view returns (uint256) {
        return
            (shares * (totalAssets() + VIRTUAL_ASSETS)) /
            (totalSupply() + VIRTUAL_SHARES);
    }

    /**
     * @notice Get a depositor's current stablecoin value (shares → assets).
     */
    function getBalance(address depositor) external view returns (uint256) {
        uint256 shares = balanceOf(depositor);
        if (shares == 0) return 0;
        return convertToAssets(shares);
    }

    /**
     * @notice Alias for totalAssets — total pool value including yield.
     */
    function totalPoolValue() external view returns (uint256) {
        return totalAssets();
    }

    /**
     * @notice Timestamp when the vault matures.
     */
    function maturityTimestamp() external view returns (uint256) {
        return deployTimestamp + maturityDuration;
    }

    /**
     * @notice Number of unique depositors (not current holders — includes historical).
     */
    function depositorCount() external view returns (uint256) {
        return depositorList.length;
    }

    /**
     * @notice Current share price: how many stablecoins 1 IAB token is worth.
     *         Returns value in stablecoin decimals (6 for USDC).
     */
    function sharePrice() external view returns (uint256) {
        return convertToAssets(10 ** decimals());
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@optimitron/treasury-shared/contracts/interfaces/IAavePool.sol";
import "@optimitron/treasury-shared/contracts/interfaces/IVoteToken.sol";

/**
 * @title VoterPrizeTreasury — Prize pool for referendum voters
 * @notice Contributors deposit stablecoins (receiving PRIZE shares).
 *         Funds are invested in Aave V3 for yield. After maturity:
 *
 *         - If outcome thresholds ARE met → VOTE holders redeem proportionally
 *         - If outcome thresholds NOT met → PRIZE holders get principal + yield back
 *
 * PRIZE token = vault share (ERC-4626-style pricing, adapted from IABVault).
 * Outcome oracle reports health/income metrics periodically.
 *
 * Redemption math (on success):
 *   voterShare = (voterVoteBalance / snapshotTotalVoteSupply) * totalAssets()
 *
 * Snapshot prevents double-redemption exploit (buy VOTE after partial
 * redemption shrinks denominator).
 */
contract VoterPrizeTreasury is ERC20, Ownable {
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

    IVoteToken public voteToken;
    bool public thresholdMet;

    /// @notice Current reported metrics
    uint256 public currentHealthMetric;
    uint256 public currentIncomeMetric;

    /// @notice Snapshot of VOTE totalSupply at redemption time (prevents exploit)
    uint256 public voteTotalSupplySnapshot;
    /// @notice Snapshot of total assets at snapshot time (ensures equal redemption)
    uint256 public totalAssetsSnapshot;
    bool public voteSupplySnapshotted;

    /// @notice Track who has already redeemed VOTE tokens
    mapping(address => bool) public hasRedeemedVotes;

    /// @notice Track unique depositors
    address[] public depositorList;
    mapping(address => bool) private _isDepositor;

    // Virtual offset to prevent first-depositor share price manipulation
    uint256 private constant VIRTUAL_SHARES = 1;
    uint256 private constant VIRTUAL_ASSETS = 1;

    // --- Events ---

    event Deposited(address indexed depositor, uint256 assets, uint256 shares);
    event RefundClaimed(address indexed depositor, uint256 assets, uint256 sharesBurned);
    event VoteRedemption(address indexed voter, uint256 voteBalance, uint256 assetsReceived);
    event MetricsUpdated(uint256 health, uint256 income, bool thresholdMet);
    event VoteTokenSet(address indexed voteToken);
    event VoteSupplySnapshotted(uint256 totalVoteSupply);

    constructor(
        address _stablecoin,
        address _aToken,
        address _aavePool,
        uint256 _maturityDuration,
        uint256 _healthThreshold,
        uint256 _incomeThreshold
    ) ERC20("Voter Prize Share", "PRIZE") Ownable(msg.sender) {
        require(_stablecoin != address(0), "VoterPrizeTreasury: zero stablecoin");
        require(_aToken != address(0), "VoterPrizeTreasury: zero aToken");
        require(_aavePool != address(0), "VoterPrizeTreasury: zero aave pool");
        require(_maturityDuration > 0, "VoterPrizeTreasury: zero maturity");
        require(_healthThreshold > 0, "VoterPrizeTreasury: zero health threshold");
        require(_incomeThreshold > 0, "VoterPrizeTreasury: zero income threshold");

        stablecoin = IERC20(_stablecoin);
        aToken = IERC20(_aToken);
        aavePool = IAavePool(_aavePool);
        maturityDuration = _maturityDuration;
        healthThreshold = _healthThreshold;
        incomeThreshold = _incomeThreshold;
        deployTimestamp = block.timestamp;
    }

    /// @notice Match USDC decimals so 1 PRIZE ≈ $1 at initial share price
    function decimals() public pure override returns (uint8) {
        return 6;
    }

    // --- Contributor functions ---

    /**
     * @notice Deposit stablecoins to receive PRIZE shares.
     *         Funds are supplied to Aave for yield.
     */
    function deposit(uint256 assets) external {
        require(assets > 0, "VoterPrizeTreasury: zero deposit");
        require(
            block.timestamp < deployTimestamp + maturityDuration,
            "VoterPrizeTreasury: matured"
        );

        uint256 shares = convertToShares(assets);
        require(shares > 0, "VoterPrizeTreasury: zero shares");

        stablecoin.safeTransferFrom(msg.sender, address(this), assets);

        stablecoin.forceApprove(address(aavePool), assets);
        aavePool.supply(address(stablecoin), assets, address(this), 0);

        _mint(msg.sender, shares);

        if (!_isDepositor[msg.sender]) {
            depositorList.push(msg.sender);
            _isDepositor[msg.sender] = true;
        }

        emit Deposited(msg.sender, assets, shares);
    }

    /**
     * @notice Claim refund after maturity when thresholds were NOT met.
     *         Burns all PRIZE shares and returns proportional stablecoins + yield.
     */
    function claimRefund() external {
        require(
            block.timestamp >= deployTimestamp + maturityDuration,
            "VoterPrizeTreasury: not matured"
        );
        require(!thresholdMet, "VoterPrizeTreasury: threshold met");

        uint256 shares = balanceOf(msg.sender);
        require(shares > 0, "VoterPrizeTreasury: no shares");

        uint256 assets = convertToAssets(shares);

        _burn(msg.sender, shares);

        aavePool.withdraw(address(stablecoin), assets, msg.sender);

        emit RefundClaimed(msg.sender, assets, shares);
    }

    // --- VOTE holder redemption (success path) ---

    /**
     * @notice Redeem VOTE tokens for proportional share of prize pool.
     *         Only callable when matured AND thresholds met AND snapshot taken.
     *
     *         voterShare = (voterVoteBalance / voteTotalSupplySnapshot) * totalAssetsSnapshot
     */
    function redeemVoteTokens() external {
        require(
            block.timestamp >= deployTimestamp + maturityDuration,
            "VoterPrizeTreasury: not matured"
        );
        require(thresholdMet, "VoterPrizeTreasury: threshold not met");
        require(voteSupplySnapshotted, "VoterPrizeTreasury: not snapshotted");
        require(!hasRedeemedVotes[msg.sender], "VoterPrizeTreasury: already redeemed");

        uint256 voterBalance = IERC20(address(voteToken)).balanceOf(msg.sender);
        require(voterBalance > 0, "VoterPrizeTreasury: no VOTE tokens");

        hasRedeemedVotes[msg.sender] = true;

        uint256 assets = (voterBalance * totalAssetsSnapshot) / voteTotalSupplySnapshot;
        require(assets > 0, "VoterPrizeTreasury: zero redemption");

        aavePool.withdraw(address(stablecoin), assets, msg.sender);

        emit VoteRedemption(msg.sender, voterBalance, assets);
    }

    // --- Oracle / admin ---

    /**
     * @notice Update health and income metrics from oracle.
     *         When both thresholds are met, thresholdMet flips true permanently.
     */
    function updateMetrics(uint256 health, uint256 income) external onlyOwner {
        currentHealthMetric = health;
        currentIncomeMetric = income;

        if (health >= healthThreshold && income >= incomeThreshold) {
            thresholdMet = true;
        }
        emit MetricsUpdated(health, income, thresholdMet);
    }

    /**
     * @notice Snapshot VOTE totalSupply for redemption calculation.
     *         Must be called before VOTE holders can redeem. Freezes the
     *         denominator to prevent manipulation.
     */
    function snapshotVoteSupply() external onlyOwner {
        require(thresholdMet, "VoterPrizeTreasury: threshold not met");
        require(!voteSupplySnapshotted, "VoterPrizeTreasury: already snapshotted");
        require(address(voteToken) != address(0), "VoterPrizeTreasury: no vote token");

        voteTotalSupplySnapshot = IERC20(address(voteToken)).totalSupply();
        require(voteTotalSupplySnapshot > 0, "VoterPrizeTreasury: zero vote supply");

        totalAssetsSnapshot = totalAssets();

        voteSupplySnapshotted = true;
        emit VoteSupplySnapshotted(voteTotalSupplySnapshot);
    }

    /**
     * @notice Set the VoteToken contract address.
     */
    function setVoteToken(address _voteToken) external onlyOwner {
        require(_voteToken != address(0), "VoterPrizeTreasury: zero vote token");
        voteToken = IVoteToken(_voteToken);
        emit VoteTokenSet(_voteToken);
    }

    // --- View functions ---

    /// @notice Total stablecoin value (principal + yield in Aave)
    function totalAssets() public view returns (uint256) {
        return aToken.balanceOf(address(this));
    }

    /// @notice Convert stablecoin amount to PRIZE shares at current rate
    function convertToShares(uint256 assets) public view returns (uint256) {
        return
            (assets * (totalSupply() + VIRTUAL_SHARES)) /
            (totalAssets() + VIRTUAL_ASSETS);
    }

    /// @notice Convert PRIZE shares to stablecoin value at current rate
    function convertToAssets(uint256 shares) public view returns (uint256) {
        return
            (shares * (totalAssets() + VIRTUAL_ASSETS)) /
            (totalSupply() + VIRTUAL_SHARES);
    }

    /// @notice Depositor's current stablecoin value
    function getBalance(address depositor) external view returns (uint256) {
        uint256 shares = balanceOf(depositor);
        if (shares == 0) return 0;
        return convertToAssets(shares);
    }

    /// @notice Total pool value including yield
    function totalPoolValue() external view returns (uint256) {
        return totalAssets();
    }

    /// @notice Timestamp when the treasury matures
    function maturityTimestamp() external view returns (uint256) {
        return deployTimestamp + maturityDuration;
    }

    /// @notice Number of unique depositors
    function depositorCount() external view returns (uint256) {
        return depositorList.length;
    }

    /// @notice Current share price (stablecoins per 1 PRIZE token)
    function sharePrice() external view returns (uint256) {
        return convertToAssets(10 ** decimals());
    }

    /// @notice Preview what a VOTE holder would receive on redemption
    function previewVoteRedemption(address voter) external view returns (uint256) {
        if (!voteSupplySnapshotted || voteTotalSupplySnapshot == 0) return 0;
        uint256 voterBalance = IERC20(address(voteToken)).balanceOf(voter);
        return (voterBalance * totalAssetsSnapshot) / voteTotalSupplySnapshot;
    }
}

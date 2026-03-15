// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IAavePool — Minimal Aave V3 Pool interface
 * @notice Only the functions IABVault needs: supply and withdraw.
 */
interface IAavePool {
    /**
     * @notice Supply an asset to the Aave pool.
     * @param asset The address of the underlying asset to supply
     * @param amount The amount to supply
     * @param onBehalfOf The address that will receive the aTokens
     * @param referralCode Referral code (use 0)
     */
    function supply(
        address asset,
        uint256 amount,
        address onBehalfOf,
        uint16 referralCode
    ) external;

    /**
     * @notice Withdraw an asset from the Aave pool.
     * @param asset The address of the underlying asset to withdraw
     * @param amount The amount to withdraw (use type(uint256).max for full balance)
     * @param to The address that will receive the underlying asset
     * @return The final amount withdrawn
     */
    function withdraw(
        address asset,
        uint256 amount,
        address to
    ) external returns (uint256);
}

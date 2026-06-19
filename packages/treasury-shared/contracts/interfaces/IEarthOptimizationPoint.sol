// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IEarthOptimizationPoint — Interface for the EOP ERC-20 token
 * @notice Transferable ERC-20 minted to verified referendum voters.
 *         1 EOP per verified vote per referendum. Tradeable on DEXs,
 *         creating an implicit prediction market on campaign success.
 */
interface IEarthOptimizationPoint {
    /// @notice Mint Earth Optimization Points for a verified voter
    /// @param voter Wallet to receive tokens
    /// @param referendumId Identifier of the referendum voted on
    /// @param nullifierHash World ID nullifier (sybil resistance)
    /// @param amount Amount of EOP to mint (1e18 = 1 EOP)
    function mintForVoter(
        address voter,
        bytes32 referendumId,
        bytes32 nullifierHash,
        uint256 amount
    ) external;

    /// @notice Batch mint for gas efficiency (~200 voters per tx)
    function batchMintForVoters(
        address[] calldata voters,
        bytes32[] calldata referendumIds,
        bytes32[] calldata nullifierHashes,
        uint256[] calldata amounts
    ) external;

    /// @notice Burn points during prize redemption
    function burnForRedemption(address holder, uint256 amount) external;

    /// @notice Set the VoterPrizeTreasury address
    function setPrizeTreasury(address treasury) external;

    /// @notice Check if a referendum+nullifier combination has already been claimed
    function claimed(bytes32 claimKey) external view returns (bool);

    /// @notice The VoterPrizeTreasury address
    function prizeTreasury() external view returns (address);
}

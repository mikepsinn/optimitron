// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@optimitron/treasury-shared/contracts/interfaces/IVoteToken.sol";

/**
 * @title VoteToken — Transferable ERC-20 for verified referendum voters
 * @notice Minted 1:1 per verified vote per referendum. The relayer verifies
 *         World ID + vote off-chain, then calls mint. Sybil resistance via
 *         keccak256(referendumId, nullifierHash) claim tracking.
 *
 * If the VoterPrizeTreasury outcome thresholds are met after 15 years,
 * VOTE holders redeem proportional shares of the prize pool. The token
 * is fully transferable, creating an implicit prediction market.
 */
contract VoteToken is ERC20, Ownable, IVoteToken {
    /// @notice keccak256(referendumId, nullifierHash) => already minted
    mapping(bytes32 => bool) public claimed;

    /// @notice VoterPrizeTreasury address (for UI reference)
    address public prizeTreasury;

    event VoteMinted(
        address indexed voter,
        bytes32 indexed referendumId,
        bytes32 nullifierHash,
        uint256 amount
    );
    event PrizeTreasurySet(address indexed treasury);

    constructor() ERC20("Optimitron Vote", "VOTE") Ownable(msg.sender) {}

    /// @notice Mint VOTE tokens for a single verified voter
    function mintForVoter(
        address voter,
        bytes32 referendumId,
        bytes32 nullifierHash,
        uint256 amount
    ) external onlyOwner {
        _mintForVoter(voter, referendumId, nullifierHash, amount);
    }

    /// @notice Batch mint for gas efficiency (~200 voters per tx on L2)
    function batchMintForVoters(
        address[] calldata voters,
        bytes32[] calldata referendumIds,
        bytes32[] calldata nullifierHashes,
        uint256[] calldata amounts
    ) external onlyOwner {
        require(
            voters.length == referendumIds.length &&
            voters.length == nullifierHashes.length &&
            voters.length == amounts.length,
            "VoteToken: length mismatch"
        );

        for (uint256 i = 0; i < voters.length; i++) {
            _mintForVoter(voters[i], referendumIds[i], nullifierHashes[i], amounts[i]);
        }
    }

    /// @notice Set the VoterPrizeTreasury address
    function setPrizeTreasury(address treasury) external onlyOwner {
        require(treasury != address(0), "VoteToken: zero treasury");
        prizeTreasury = treasury;
        emit PrizeTreasurySet(treasury);
    }

    // --- Internal ---

    function _mintForVoter(
        address voter,
        bytes32 referendumId,
        bytes32 nullifierHash,
        uint256 amount
    ) internal {
        require(voter != address(0), "VoteToken: zero voter");
        require(amount > 0, "VoteToken: zero amount");

        bytes32 claimKey = keccak256(abi.encodePacked(referendumId, nullifierHash));
        require(!claimed[claimKey], "VoteToken: already claimed");

        claimed[claimKey] = true;
        _mint(voter, amount);

        emit VoteMinted(voter, referendumId, nullifierHash, amount);
    }
}

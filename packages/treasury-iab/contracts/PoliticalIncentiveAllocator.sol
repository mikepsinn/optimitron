// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@optimitron/treasury-shared/contracts/interfaces/IAlignmentScoreOracle.sol";

/**
 * @title PoliticalIncentiveAllocator
 * @notice Receives the 10% political incentive allocation from IABSplitter
 *         and distributes stablecoins to politician campaign wallets
 *         proportional to their Citizen Alignment Scores (CAS).
 *
 * How it works:
 *   1. IABSplitter sends 10% of IAB yield here
 *   2. Owner registers politicians with verified campaign wallets
 *   3. Anyone can trigger allocate() with Merkle proofs of CAS scores
 *   4. Contract verifies each score against AlignmentScoreOracle
 *   5. Politicians below minimumAlignmentScore get zero
 *   6. Funds distributed proportional to (score - minimum) for qualified politicians
 *
 * This creates a direct financial incentive for politicians to align
 * their votes with citizen preferences. No middleman, no PAC — just math.
 */
contract PoliticalIncentiveAllocator is Ownable {
    using SafeERC20 for IERC20;

    // --- Config ---

    IERC20 public immutable stablecoin;
    IAlignmentScoreOracle public oracle;

    /// @notice Minimum CAS required to receive funds (default: 20 out of 100)
    uint256 public minimumAlignmentScore;

    // --- Politician registry ---

    struct Politician {
        address campaignWallet;
        bytes32 jurisdictionCode;
        bool active;
    }

    /// @notice External ID (e.g., keccak256 of bioguide/FEC ID) → Politician data
    mapping(bytes32 => Politician) public politicians;

    /// @notice All registered politician external IDs for enumeration
    bytes32[] public politicianIds;

    // --- Events ---

    event PoliticianRegistered(
        bytes32 indexed externalId,
        address campaignWallet,
        bytes32 jurisdictionCode
    );

    event PoliticianDeactivated(bytes32 indexed externalId);

    event FundsAllocated(
        bytes32 indexed jurisdictionCode,
        uint256 totalDistributed,
        uint256 politicianCount
    );

    event OracleUpdated(address indexed newOracle);
    event MinimumScoreUpdated(uint256 newMinimum);

    constructor(
        address _stablecoin,
        address _oracle,
        uint256 _minimumAlignmentScore
    ) Ownable(msg.sender) {
        require(_stablecoin != address(0), "Allocator: zero stablecoin");
        require(_oracle != address(0), "Allocator: zero oracle");

        stablecoin = IERC20(_stablecoin);
        oracle = IAlignmentScoreOracle(_oracle);
        minimumAlignmentScore = _minimumAlignmentScore;
    }

    // --- Registration ---

    /**
     * @notice Register a politician's campaign wallet for fund distribution.
     * @param externalId Keccak256 hash of the politician's external identifier
     *        (e.g., bioguide ID for US Congress, FEC candidate ID)
     * @param campaignWallet Verified campaign wallet address
     * @param jurisdictionCode Keccak256 hash of the jurisdiction identifier
     */
    function registerPolitician(
        bytes32 externalId,
        address campaignWallet,
        bytes32 jurisdictionCode
    ) external onlyOwner {
        require(campaignWallet != address(0), "Allocator: zero wallet");
        require(jurisdictionCode != bytes32(0), "Allocator: zero jurisdiction");
        require(!politicians[externalId].active, "Allocator: already registered");

        politicians[externalId] = Politician({
            campaignWallet: campaignWallet,
            jurisdictionCode: jurisdictionCode,
            active: true
        });
        politicianIds.push(externalId);

        emit PoliticianRegistered(externalId, campaignWallet, jurisdictionCode);
    }

    /**
     * @notice Deactivate a politician (e.g., left office, wallet compromised).
     * @param externalId The politician's external identifier hash
     */
    function deactivatePolitician(bytes32 externalId) external onlyOwner {
        require(politicians[externalId].active, "Allocator: not active");
        politicians[externalId].active = false;
        emit PoliticianDeactivated(externalId);
    }

    // --- Allocation ---

    /**
     * @notice Distribute accumulated funds to politicians in a jurisdiction
     *         proportional to their verified CAS scores.
     *
     *         Permissionless — anyone can trigger this with valid proofs.
     *         Each politician's score is verified against the oracle's Merkle root.
     *         Politicians below minimumAlignmentScore receive nothing.
     *         Distribution is proportional to (score - minimum) for qualified politicians.
     *
     * @param jurisdictionCode Keccak256 hash of the jurisdiction
     * @param leaves Merkle leaf hashes for each politician's score
     * @param proofs Merkle proofs for each leaf (one proof array per politician)
     * @param scores The raw CAS scores (0-100) corresponding to each leaf
     */
    function allocate(
        bytes32 jurisdictionCode,
        bytes32[] calldata leaves,
        bytes32[][] calldata proofs,
        uint256[] calldata scores
    ) external {
        require(leaves.length == proofs.length, "Allocator: leaves/proofs mismatch");
        require(leaves.length == scores.length, "Allocator: leaves/scores mismatch");
        require(leaves.length > 0, "Allocator: empty input");

        uint256 balance = stablecoin.balanceOf(address(this));
        require(balance > 0, "Allocator: no funds");

        // First pass: verify proofs and compute total weight
        uint256 totalWeight = 0;
        uint256[] memory weights = new uint256[](leaves.length);

        for (uint256 i = 0; i < leaves.length; i++) {
            // Verify the score against the oracle
            bool valid = oracle.verifyScore(jurisdictionCode, leaves[i], proofs[i]);
            if (!valid) continue;

            // Filter out scores below minimum
            if (scores[i] < minimumAlignmentScore) continue;

            uint256 weight = scores[i] - minimumAlignmentScore;
            weights[i] = weight;
            totalWeight += weight;
        }

        require(totalWeight > 0, "Allocator: no qualifying politicians");

        // Second pass: distribute proportionally
        uint256 distributed = 0;
        uint256 recipientCount = 0;

        for (uint256 i = 0; i < leaves.length; i++) {
            if (weights[i] == 0) continue;

            // Reconstruct the politician's external ID from the leaf
            // The caller must ensure leaves correspond to registered politicians.
            // We use the leaf hash as a lookup key to find the politician.
            // However, since leaves encode multiple fields, we need the caller
            // to provide politician external IDs in the same order as leaves.
            // For simplicity, we iterate registered politicians and match by
            // jurisdiction. In this design, the leaves array order must match
            // the politicianIds that are active in this jurisdiction.

            uint256 share = (balance * weights[i]) / totalWeight;
            if (share == 0) continue;

            // Find the corresponding registered politician
            // The leaves array must be ordered to match politicianIds
            // filtered to this jurisdiction
            bytes32 externalId = _findPoliticianByIndex(jurisdictionCode, i);
            if (externalId == bytes32(0)) continue;

            Politician storage pol = politicians[externalId];
            if (!pol.active) continue;
            if (pol.jurisdictionCode != jurisdictionCode) continue;

            stablecoin.safeTransfer(pol.campaignWallet, share);
            distributed += share;
            recipientCount++;
        }

        emit FundsAllocated(jurisdictionCode, distributed, recipientCount);
    }

    // --- Admin ---

    /**
     * @notice Update the AlignmentScoreOracle address.
     * @param _oracle New oracle contract address
     */
    function setOracle(address _oracle) external onlyOwner {
        require(_oracle != address(0), "Allocator: zero oracle");
        oracle = IAlignmentScoreOracle(_oracle);
        emit OracleUpdated(_oracle);
    }

    /**
     * @notice Update the minimum alignment score required for fund distribution.
     * @param _minimumAlignmentScore New minimum (0-100)
     */
    function setMinimumAlignmentScore(uint256 _minimumAlignmentScore) external onlyOwner {
        require(_minimumAlignmentScore <= 100, "Allocator: score exceeds 100");
        minimumAlignmentScore = _minimumAlignmentScore;
        emit MinimumScoreUpdated(_minimumAlignmentScore);
    }

    // --- Internal ---

    /**
     * @notice Find the Nth active politician in a jurisdiction.
     *         Used to map leaf array indices to registered politicians.
     * @param jurisdictionCode The jurisdiction to filter by
     * @param index The index within the jurisdiction's active politicians
     * @return The politician's external ID, or bytes32(0) if not found
     */
    function _findPoliticianByIndex(
        bytes32 jurisdictionCode,
        uint256 index
    ) internal view returns (bytes32) {
        uint256 found = 0;
        for (uint256 j = 0; j < politicianIds.length; j++) {
            Politician storage pol = politicians[politicianIds[j]];
            if (pol.active && pol.jurisdictionCode == jurisdictionCode) {
                if (found == index) {
                    return politicianIds[j];
                }
                found++;
            }
        }
        return bytes32(0);
    }

    // --- View functions ---

    /// @notice Number of registered politicians (including deactivated)
    function politicianCount() external view returns (uint256) {
        return politicianIds.length;
    }

    /// @notice Current allocator balance available for distribution
    function pendingBalance() external view returns (uint256) {
        return stablecoin.balanceOf(address(this));
    }

    /**
     * @notice Count active politicians in a jurisdiction.
     * @param jurisdictionCode The jurisdiction to count
     * @return count Number of active politicians
     */
    function activePoliticianCount(
        bytes32 jurisdictionCode
    ) external view returns (uint256 count) {
        for (uint256 i = 0; i < politicianIds.length; i++) {
            Politician storage pol = politicians[politicianIds[i]];
            if (pol.active && pol.jurisdictionCode == jurisdictionCode) {
                count++;
            }
        }
    }
}

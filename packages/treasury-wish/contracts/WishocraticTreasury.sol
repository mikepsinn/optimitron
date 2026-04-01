// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title WishocraticTreasury
 * @notice Receives $WISH from transaction tax and distributes to budget
 *         category recipients based on citizen-directed allocation weights.
 *
 * Flow:
 *   1. WishToken transaction tax (0.5%) flows here automatically
 *   2. Owner registers recipient wallets for each budget category
 *   3. Owner posts aggregated Wishocratic weights (from off-chain eigenvector)
 *   4. Anyone triggers distribute() — splits $WISH proportionally
 *
 * The UBI category's recipient is the UBIDistributor contract, which
 * distributes equally to World ID citizens. Other categories get registered
 * NGO/DAO/agency wallets.
 *
 * $WISH and IABs are completely separate systems. This handles $WISH tax only.
 */
contract WishocraticTreasury is Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable wishToken;

    struct CategoryRecipient {
        address wallet;
        bool active;
    }

    /// @notice categoryId (bytes32) → recipient
    mapping(bytes32 => CategoryRecipient) public recipients;

    /// @notice All registered category IDs for iteration
    bytes32[] public categoryIds;

    /// @notice Current allocation weights in basis points (sum to 10000)
    mapping(bytes32 => uint256) public allocationWeights;

    /// @notice Timestamp of last weights update
    uint256 public lastWeightsUpdate;

    /// @notice Number of citizens who participated in the allocation
    uint256 public totalParticipants;

    /// @notice Total pairwise comparisons used to derive weights
    uint256 public totalComparisons;

    // --- Events ---

    event RecipientRegistered(bytes32 indexed categoryId, address wallet);
    event RecipientUpdated(bytes32 indexed categoryId, address oldWallet, address newWallet);
    event RecipientDeactivated(bytes32 indexed categoryId);
    event WeightsUpdated(uint256 timestamp, uint256 participants, uint256 comparisons);
    event FundsDistributed(uint256 totalAmount, uint256 recipientCount);

    constructor(address _wishToken) Ownable(msg.sender) {
        require(_wishToken != address(0), "WishocraticTreasury: zero token");
        wishToken = IERC20(_wishToken);
    }

    // --- Recipient Management ---

    /**
     * @notice Register a wallet to receive funds for a budget category.
     * @param categoryId Keccak256 hash of the category identifier
     * @param wallet Address that receives $WISH for this category
     */
    function registerRecipient(bytes32 categoryId, address wallet) external onlyOwner {
        require(categoryId != bytes32(0), "WishocraticTreasury: zero categoryId");
        require(wallet != address(0), "WishocraticTreasury: zero wallet");
        require(!recipients[categoryId].active, "WishocraticTreasury: already registered");

        recipients[categoryId] = CategoryRecipient({
            wallet: wallet,
            active: true
        });
        categoryIds.push(categoryId);

        emit RecipientRegistered(categoryId, wallet);
    }

    /**
     * @notice Update the wallet for an existing category.
     * @param categoryId The category to update
     * @param newWallet New recipient wallet
     */
    function updateRecipient(bytes32 categoryId, address newWallet) external onlyOwner {
        require(newWallet != address(0), "WishocraticTreasury: zero wallet");
        require(recipients[categoryId].active, "WishocraticTreasury: not registered");

        address oldWallet = recipients[categoryId].wallet;
        recipients[categoryId].wallet = newWallet;

        emit RecipientUpdated(categoryId, oldWallet, newWallet);
    }

    /**
     * @notice Deactivate a category recipient.
     * @param categoryId The category to deactivate
     */
    function deactivateRecipient(bytes32 categoryId) external onlyOwner {
        require(recipients[categoryId].active, "WishocraticTreasury: not registered");
        recipients[categoryId].active = false;
        emit RecipientDeactivated(categoryId);
    }

    // --- Weight Management ---

    /**
     * @notice Post aggregated Wishocratic allocation weights.
     *         Weights are derived off-chain from citizen pairwise comparisons
     *         using eigenvector aggregation. They are independently verifiable
     *         by re-running aggregation against public preference data.
     *
     * @param ids Category IDs (must match registered recipients)
     * @param weights Allocation weights in basis points (must sum to 10000)
     * @param participants Number of citizens who participated
     * @param comparisons Total pairwise comparisons used
     */
    function updateWeights(
        bytes32[] calldata ids,
        uint256[] calldata weights,
        uint256 participants,
        uint256 comparisons
    ) external onlyOwner {
        require(ids.length == weights.length, "WishocraticTreasury: length mismatch");
        require(ids.length > 0, "WishocraticTreasury: empty input");

        uint256 totalBps = 0;
        for (uint256 i = 0; i < ids.length; i++) {
            require(recipients[ids[i]].active, "WishocraticTreasury: unregistered category");
            allocationWeights[ids[i]] = weights[i];
            totalBps += weights[i];
        }

        require(totalBps == 10000, "WishocraticTreasury: weights must sum to 10000");

        lastWeightsUpdate = block.timestamp;
        totalParticipants = participants;
        totalComparisons = comparisons;

        emit WeightsUpdated(block.timestamp, participants, comparisons);
    }

    // --- Distribution ---

    /**
     * @notice Distribute accumulated $WISH to all active recipients
     *         proportional to their allocation weights. Permissionless.
     */
    function distribute() external {
        uint256 balance = wishToken.balanceOf(address(this));
        require(balance > 0, "WishocraticTreasury: no funds");
        require(lastWeightsUpdate > 0, "WishocraticTreasury: no weights set");

        uint256 distributed = 0;
        uint256 recipientCount = 0;

        for (uint256 i = 0; i < categoryIds.length; i++) {
            bytes32 catId = categoryIds[i];
            CategoryRecipient storage recipient = recipients[catId];

            if (!recipient.active) continue;

            uint256 weight = allocationWeights[catId];
            if (weight == 0) continue;

            uint256 share = (balance * weight) / 10000;
            if (share == 0) continue;

            wishToken.safeTransfer(recipient.wallet, share);
            distributed += share;
            recipientCount++;
        }

        require(recipientCount > 0, "WishocraticTreasury: no active recipients");
        emit FundsDistributed(distributed, recipientCount);
    }

    // --- View Functions ---

    /// @notice Number of registered categories (including deactivated)
    function categoryCount() external view returns (uint256) {
        return categoryIds.length;
    }

    /// @notice Current pending balance available for distribution
    function pendingBalance() external view returns (uint256) {
        return wishToken.balanceOf(address(this));
    }

    /// @notice Count active categories with non-zero weights
    function activeCategoryCount() external view returns (uint256 count) {
        for (uint256 i = 0; i < categoryIds.length; i++) {
            if (recipients[categoryIds[i]].active && allocationWeights[categoryIds[i]] > 0) {
                count++;
            }
        }
    }
}

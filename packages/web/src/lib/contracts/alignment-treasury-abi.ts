/**
 * AlignmentTreasury ABI — $WISH transaction tax treasury.
 * Receives $WISH from transaction tax, distributes to:
 *   - Politicians proportional to alignment scores
 *   - Citizens as equal UBI shares
 *
 * This is the $WISH monetary reform system — completely separate from IABs.
 */
export const alignmentTreasuryAbi = [
  // Constructor
  {
    type: "constructor",
    inputs: [
      { name: "_wishToken", type: "address" },
      { name: "_ubiAllocationBps", type: "uint256" },
    ],
    stateMutability: "nonpayable",
  },

  // --- View functions ---

  {
    type: "function",
    name: "wishToken",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "ubiAllocationBps",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "MAX_UBI_ALLOCATION_BPS",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "totalAlignmentScore",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isRegisteredCitizen",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "treasuryBalance",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "citizenCount",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "politicianCount",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "politicians",
    inputs: [{ name: "", type: "bytes32" }],
    outputs: [
      { name: "wallet", type: "address" },
      { name: "score", type: "uint256" },
      { name: "active", type: "bool" },
    ],
    stateMutability: "view",
  },

  // --- Write functions (permissionless) ---

  {
    type: "function",
    name: "distributeUBI",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "distributeToAligned",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },

  // --- Write functions (owner only) ---

  {
    type: "function",
    name: "registerForUBI",
    inputs: [
      { name: "citizen", type: "address" },
      { name: "nullifierHash", type: "bytes32" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "updateAlignmentScores",
    inputs: [
      { name: "ids", type: "bytes32[]" },
      { name: "wallets", type: "address[]" },
      { name: "scores", type: "uint256[]" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "deactivatePolitician",
    inputs: [{ name: "politicianId", type: "bytes32" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "setUBIAllocation",
    inputs: [{ name: "_ubiAllocationBps", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },

  // --- Events ---

  {
    type: "event",
    name: "CitizenRegistered",
    inputs: [
      { name: "citizen", type: "address", indexed: true },
      { name: "nullifierHash", type: "bytes32", indexed: false },
    ],
  },
  {
    type: "event",
    name: "UBIDistributed",
    inputs: [
      { name: "totalAmount", type: "uint256", indexed: false },
      { name: "recipientCount", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "AlignmentDistributed",
    inputs: [
      { name: "totalAmount", type: "uint256", indexed: false },
      { name: "recipientCount", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "AlignmentScoreUpdated",
    inputs: [
      { name: "politicianId", type: "bytes32", indexed: true },
      { name: "wallet", type: "address", indexed: false },
      { name: "score", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "UBIAllocationUpdated",
    inputs: [
      { name: "oldBps", type: "uint256", indexed: false },
      { name: "newBps", type: "uint256", indexed: false },
    ],
  },
] as const;

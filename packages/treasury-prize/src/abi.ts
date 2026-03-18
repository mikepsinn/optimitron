/**
 * VoteToken ABI — Optimitron Vote (VOTE)
 * ERC20 token minted 1:1 for verified referendum voters.
 * Redeemable for proportional share of VoterPrizeTreasury if outcome thresholds met.
 */
export const voteTokenAbi = [
  // --- ERC20 standard ---

  {
    type: "function",
    name: "name",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "symbol",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "decimals",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "totalSupply",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "transfer",
    inputs: [
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "allowance",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "approve",
    inputs: [
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
  },

  // --- VoteToken-specific ---

  {
    type: "function",
    name: "prizeTreasury",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },

  // --- Events ---

  {
    type: "event",
    name: "VoteMinted",
    inputs: [
      { name: "voter", type: "address", indexed: true },
      { name: "referendumId", type: "bytes32", indexed: true },
      { name: "nullifierHash", type: "bytes32", indexed: false },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "PrizeTreasurySet",
    inputs: [{ name: "treasury", type: "address", indexed: true }],
  },
  {
    type: "event",
    name: "Transfer",
    inputs: [
      { name: "from", type: "address", indexed: true },
      { name: "to", type: "address", indexed: true },
      { name: "value", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "Approval",
    inputs: [
      { name: "owner", type: "address", indexed: true },
      { name: "spender", type: "address", indexed: true },
      { name: "value", type: "uint256", indexed: false },
    ],
  },
] as const;

/**
 * VoterPrizeTreasury ABI — Voter Prize Treasury (PRIZE)
 * ERC20 vault that accepts stablecoin deposits (routed to Aave V3 for yield).
 * If health/income thresholds met → VOTE holders redeem proportional share.
 * If thresholds NOT met → depositors claim refund (principal + yield).
 */
export const voterPrizeTreasuryAbi = [
  // --- ERC20 standard ---

  {
    type: "function",
    name: "name",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "symbol",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "decimals",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "totalSupply",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },

  // --- Contributor functions ---

  {
    type: "function",
    name: "deposit",
    inputs: [{ name: "assets", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "claimRefund",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },

  // --- VOTE holder redemption ---

  {
    type: "function",
    name: "redeemVoteTokens",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },

  // --- View functions ---

  {
    type: "function",
    name: "totalAssets",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "convertToShares",
    inputs: [{ name: "assets", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "convertToAssets",
    inputs: [{ name: "shares", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getBalance",
    inputs: [{ name: "depositor", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "sharePrice",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "totalPoolValue",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "maturityTimestamp",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "depositorCount",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "thresholdMet",
    inputs: [],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "voteSupplySnapshotted",
    inputs: [],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "voteTotalSupplySnapshot",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "totalAssetsSnapshot",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "currentHealthMetric",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "currentIncomeMetric",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "healthThreshold",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "incomeThreshold",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "previewVoteRedemption",
    inputs: [{ name: "voter", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },

  // --- Events ---

  {
    type: "event",
    name: "Deposited",
    inputs: [
      { name: "depositor", type: "address", indexed: true },
      { name: "assets", type: "uint256", indexed: false },
      { name: "shares", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "RefundClaimed",
    inputs: [
      { name: "depositor", type: "address", indexed: true },
      { name: "assets", type: "uint256", indexed: false },
      { name: "sharesBurned", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "VoteRedemption",
    inputs: [
      { name: "voter", type: "address", indexed: true },
      { name: "voteBalance", type: "uint256", indexed: false },
      { name: "assetsReceived", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "MetricsUpdated",
    inputs: [
      { name: "health", type: "uint256", indexed: false },
      { name: "income", type: "uint256", indexed: false },
      { name: "thresholdMet", type: "bool", indexed: false },
    ],
  },
  {
    type: "event",
    name: "VoteTokenSet",
    inputs: [{ name: "voteToken", type: "address", indexed: true }],
  },
  {
    type: "event",
    name: "VoteSupplySnapshotted",
    inputs: [{ name: "totalVoteSupply", type: "uint256", indexed: false }],
  },
  {
    type: "event",
    name: "Transfer",
    inputs: [
      { name: "from", type: "address", indexed: true },
      { name: "to", type: "address", indexed: true },
      { name: "value", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "Approval",
    inputs: [
      { name: "owner", type: "address", indexed: true },
      { name: "spender", type: "address", indexed: true },
      { name: "value", type: "uint256", indexed: false },
    ],
  },
] as const;

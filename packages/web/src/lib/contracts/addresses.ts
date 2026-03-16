import { type Address } from "viem";

/**
 * Contract addresses per chain.
 * After deployment, update these with actual addresses.
 */
export const CONTRACT_ADDRESSES = {
  // Sepolia testnet
  11155111: {
    iabVault: "0x0000000000000000000000000000000000000000" as Address,
    prizePool: "0x0000000000000000000000000000000000000000" as Address,
    usdc: "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8" as Address, // Aave testnet USDC
    wishToken: "0x0000000000000000000000000000000000000000" as Address,
    ubiDistributor: "0x0000000000000000000000000000000000000000" as Address,
    wishocraticTreasury: "0x0000000000000000000000000000000000000000" as Address,
    voteToken: "0x0000000000000000000000000000000000000000" as Address,
    voterPrizeTreasury: "0x0000000000000000000000000000000000000000" as Address,
  },
  // Base Sepolia testnet (primary deployment target)
  84532: {
    iabVault: "0x0000000000000000000000000000000000000000" as Address,
    prizePool: "0x0000000000000000000000000000000000000000" as Address,
    usdc: "0x036CbD53842c5426634e7929541eC2318f3dCF7e" as Address, // USDC on Base Sepolia
    wishToken: "0x0000000000000000000000000000000000000000" as Address,
    ubiDistributor: "0x0000000000000000000000000000000000000000" as Address,
    wishocraticTreasury: "0x0000000000000000000000000000000000000000" as Address,
    voteToken: "0x0000000000000000000000000000000000000000" as Address,
    voterPrizeTreasury: "0x0000000000000000000000000000000000000000" as Address,
  },
  // Localhost (Hardhat)
  31337: {
    iabVault: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9" as Address,
    prizePool: "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707" as Address,
    usdc: "0x5FbDB2315678afecb367f032d93F642f64180aa3" as Address,
    wishToken: "0x0000000000000000000000000000000000000000" as Address,
    ubiDistributor: "0x0000000000000000000000000000000000000000" as Address,
    wishocraticTreasury: "0x0000000000000000000000000000000000000000" as Address,
    voteToken: "0x0000000000000000000000000000000000000000" as Address,
    voterPrizeTreasury: "0x0000000000000000000000000000000000000000" as Address,
  },
} as const;

export type SupportedChainId = keyof typeof CONTRACT_ADDRESSES;

export function getContracts(chainId: number) {
  return CONTRACT_ADDRESSES[chainId as SupportedChainId] ?? null;
}

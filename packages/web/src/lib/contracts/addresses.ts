import { type Address } from "viem";

/**
 * Contract addresses per chain.
 * After deployment, update these with actual addresses.
 */
export const CONTRACT_ADDRESSES = {
  // Sepolia testnet
  11155111: {
    prizePool: "0x0000000000000000000000000000000000000000" as Address,
    wishToken: "0x0000000000000000000000000000000000000000" as Address,
  },
  // Localhost (Hardhat)
  31337: {
    prizePool: "0x0000000000000000000000000000000000000000" as Address,
    wishToken: "0x0000000000000000000000000000000000000000" as Address,
  },
} as const;

export type SupportedChainId = keyof typeof CONTRACT_ADDRESSES;

export function getContracts(chainId: number) {
  return CONTRACT_ADDRESSES[chainId as SupportedChainId] ?? null;
}

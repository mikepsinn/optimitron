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
    usdc: "0xba50Cd2A20f6DA35D788639E581bca8d0B5d4D5f" as Address, // Aave testnet USDC on Base Sepolia
    wishToken: "0x0000000000000000000000000000000000000000" as Address,
    ubiDistributor: "0x0000000000000000000000000000000000000000" as Address,
    wishocraticTreasury: "0x0000000000000000000000000000000000000000" as Address,
    voteToken: "0xfA6238e810E2e93b129c0dAB873f94f2D3587E64" as Address,
    voterPrizeTreasury: "0xd10f84cb234faFb781C90e74E27a12aa84CbC007" as Address,
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

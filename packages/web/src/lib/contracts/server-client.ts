import { ethers } from "ethers";
import { getContracts } from "@optimitron/treasury-shared/addresses";
import { serverEnv } from "@/lib/env";

/**
 * Server-side ethers.js client for on-chain interactions.
 * Uses env vars for RPC URL and private key — never expose to client.
 */

function getRpcUrl(chainId: number): string {
  switch (chainId) {
    case 84532: // Base Sepolia
      return serverEnv.BASE_SEPOLIA_RPC_URL ?? "https://sepolia.base.org";
    case 8453: // Base Mainnet
      return serverEnv.BASE_RPC_URL ?? "https://mainnet.base.org";
    case 31337: // Hardhat
      return "http://127.0.0.1:8545";
    default:
      throw new Error(`Unsupported chain ID: ${chainId}`);
  }
}

export function getProvider(chainId: number): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider(getRpcUrl(chainId));
}

export function getMinterWallet(chainId: number): ethers.Wallet {
  const key = serverEnv.VOTE_TOKEN_MINTER_PRIVATE_KEY;
  if (!key) {
    throw new Error("VOTE_TOKEN_MINTER_PRIVATE_KEY is not set");
  }
  return new ethers.Wallet(key, getProvider(chainId));
}

export function getVoteTokenContract(
  chainId: number,
  signer: ethers.Signer,
): ethers.Contract {
  const addresses = getContracts(chainId);
  if (!addresses) {
    throw new Error(`No contract addresses for chain ${chainId}`);
  }
  const { voteToken } = addresses;
  if (voteToken === "0x0000000000000000000000000000000000000000") {
    throw new Error(`VoteToken not deployed on chain ${chainId}`);
  }

  // Minimal ABI for server-side minting
  const abi = [
    "function batchMintForVoters(address[] voters, bytes32[] referendumIds, bytes32[] nullifierHashes, uint256[] amounts) external",
    "function totalSupply() view returns (uint256)",
  ];
  return new ethers.Contract(voteToken, abi, signer);
}

export function getVoterPrizeTreasuryContract(
  chainId: number,
  provider: ethers.Provider,
): ethers.Contract {
  const addresses = getContracts(chainId);
  if (!addresses) {
    throw new Error(`No contract addresses for chain ${chainId}`);
  }
  const { voterPrizeTreasury } = addresses;
  if (voterPrizeTreasury === "0x0000000000000000000000000000000000000000") {
    throw new Error(`VoterPrizeTreasury not deployed on chain ${chainId}`);
  }

  const abi = [
    "event Deposited(address indexed depositor, uint256 assets, uint256 shares)",
    "function totalAssets() view returns (uint256)",
    "function currentHealthMetric() view returns (uint256)",
    "function currentIncomeMetric() view returns (uint256)",
    "function thresholdMet() view returns (bool)",
    "function maturityTimestamp() view returns (uint256)",
    "function voteTotalSupplySnapshot() view returns (uint256)",
    "function totalAssetsSnapshot() view returns (uint256)",
    "function sharePrice() view returns (uint256)",
    "function depositorCount() view returns (uint256)",
  ];
  return new ethers.Contract(voterPrizeTreasury, abi, provider);
}

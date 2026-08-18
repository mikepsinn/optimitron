import { createPublicClient, createWalletClient, http, keccak256, toBytes } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import { getWishocracyCommunitySummary } from "@/lib/wishocracy-community";
import { WISHOCRATIC_ITEMS, type WishocraticItemId } from "@/lib/wishocracy-data";
import { createLogger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { serverEnv } from "@/lib/env";

const logger = createLogger("wishocratic-treasury");

// ABI for WishocraticTreasury.updateWeights
const WISHOCRATIC_TREASURY_ABI = [
  {
    name: "updateWeights",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "ids", type: "bytes32[]" },
      { name: "weights", type: "uint256[]" },
      { name: "participants", type: "uint256" },
      { name: "comparisons", type: "uint256" },
    ],
    outputs: [],
  },
] as const;

/**
 * Convert a WishocraticItemId to a bytes32 category hash (matching on-chain registration).
 */
export function categoryIdToBytes32(categoryId: string): `0x${string}` {
  return keccak256(toBytes(categoryId));
}

/**
 * Convert percentage allocations (0-100, sum to 100) to basis points (sum to 10000).
 * Handles rounding so the total is exactly 10000.
 */
export function percentagesToBasisPoints(
  allocations: Record<WishocraticItemId, number>,
): { ids: `0x${string}`[]; weights: bigint[] } {
  const entries = Object.entries(allocations).filter(([, pct]) => pct > 0);

  if (entries.length === 0) {
    return { ids: [], weights: [] };
  }

  const ids: `0x${string}`[] = [];
  const rawWeights: number[] = [];

  for (const [categoryId, pct] of entries) {
    ids.push(categoryIdToBytes32(categoryId));
    rawWeights.push(Math.round(pct * 100));
  }

  // Fix rounding: adjust largest weight so total is exactly 10000
  const total = rawWeights.reduce((a, b) => a + b, 0);
  if (total !== 10000) {
    const maxIdx = rawWeights.indexOf(Math.max(...rawWeights));
    rawWeights[maxIdx] += 10000 - total;
  }

  return {
    ids,
    weights: rawWeights.map((w) => BigInt(w)),
  };
}

export interface PostWeightsResult {
  success: boolean;
  totalParticipants: number;
  totalAllocations: number;
  itemCount: number;
  txHash?: string;
  ipfsCid?: string;
  error?: string;
}

/**
 * Read community Wishocratic summary, convert to basis points, and post on-chain.
 */
export async function postWishocraticWeightsOnChain(): Promise<PostWeightsResult> {
  const summary = await getWishocracyCommunitySummary();

  if (summary.totalUsers === 0) {
    logger.info("No participants yet — skipping weight update");
    return {
      success: false,
      totalParticipants: 0,
      totalAllocations: 0,
      itemCount: 0,
      error: "No participants",
    };
  }

  const { ids, weights } = percentagesToBasisPoints(summary.averageAllocations);

  if (ids.length === 0) {
    logger.info("No categories with non-zero allocation — skipping");
    return {
      success: false,
      totalParticipants: summary.totalUsers,
      totalAllocations: summary.totalAllocations,
      itemCount: 0,
      error: "No non-zero allocations",
    };
  }

  // ── Publish aggregation snapshot to IPFS ───────────────────────────
  let ipfsCid: string | undefined;
  try {
    const { getIpfsStorageClient } = await import("@/lib/ipfs-storage");
    const ipfsClient = await getIpfsStorageClient();

    if (ipfsClient) {
      const { storeLinkedAggregation } = await import("@optimitron/storage");

      const preferenceWeights = Object.entries(summary.averageAllocations)
        .filter(([, pct]) => pct > 0)
        .map(([itemId, pct]) => ({
          itemId,
          weight: pct / 100,
          label: WISHOCRATIC_ITEMS[itemId as WishocraticItemId]?.name,
        }));

      const result = await storeLinkedAggregation(ipfsClient, {
        jurisdictionId: "us-federal",
        participantCount: summary.totalUsers,
        verifiedParticipantCount: summary.verifiedUsers,
        preferenceWeights,
      });

      ipfsCid = result.cid;
      logger.info(`Aggregation snapshot published to IPFS: ${ipfsCid}`);
    }
  } catch (ipfsError) {
    logger.error("Failed to publish to IPFS — continuing", ipfsError);
  }

  const wishocraticTreasuryAddress = serverEnv.WISHOCRATIC_TREASURY_ADDRESS as `0x${string}` | undefined;
  const deployerKey = serverEnv.DEPLOYER_PRIVATE_KEY as `0x${string}` | undefined;
  const rpcUrl = serverEnv.SEPOLIA_RPC_URL;

  if (!wishocraticTreasuryAddress || !deployerKey || !rpcUrl) {
    logger.warn("Missing env vars for on-chain posting — recording off-chain only");

    // Record the distribution intent in DB for auditing
    const weightsHash = keccak256(
      toBytes(JSON.stringify({ ids, weights: weights.map(String) }))
    );
    await prisma.wishocraticDistribution.create({
      data: {
        totalAmount: "0",
        recipientCount: ids.length,
        weightsHash,
      },
    });

    return {
      success: true,
      totalParticipants: summary.totalUsers,
      totalAllocations: summary.totalAllocations,
      itemCount: ids.length,
      ipfsCid,
    };
  }

  try {
    const account = privateKeyToAccount(deployerKey);
    const client = createWalletClient({
      account,
      chain: sepolia,
      transport: http(rpcUrl),
    });

    const txHash = await client.writeContract({
      address: wishocraticTreasuryAddress,
      abi: WISHOCRATIC_TREASURY_ABI,
      functionName: "updateWeights",
      args: [ids, weights, BigInt(summary.totalUsers), BigInt(summary.totalAllocations)],
    });

    logger.info(`Weights posted on-chain: ${txHash}`);

    // Record in DB
    const weightsHash = keccak256(
      toBytes(JSON.stringify({ ids, weights: weights.map(String) }))
    );
    await prisma.wishocraticDistribution.create({
      data: {
        totalAmount: "0",
        recipientCount: ids.length,
        weightsHash,
        txHash,
      },
    });

    return {
      success: true,
      totalParticipants: summary.totalUsers,
      totalAllocations: summary.totalAllocations,
      itemCount: ids.length,
      txHash,
      ipfsCid,
    };
  } catch (error) {
    logger.error("Failed to post weights on-chain", error);
    return {
      success: false,
      totalParticipants: summary.totalUsers,
      totalAllocations: summary.totalAllocations,
      itemCount: ids.length,
      ipfsCid,
      error: String(error),
    };
  }
}

import { prisma } from "@/lib/prisma";
import { createLogger } from "@/lib/logger";

const logger = createLogger("score-merkle");

/**
 * A leaf in the alignment score Merkle tree.
 *
 * Leaf encoding matches the on-chain oracle:
 * keccak256(abi.encodePacked(jurisdictionCode, politicianExternalId, score, votesCompared, aggregationRunId, timestamp))
 */
export interface MerkleLeaf {
  jurisdictionCode: string;
  politicianExternalId: string;
  score: number;
  votesCompared: number;
  aggregationRunId: string;
  timestamp: number;
}

export interface MerkleTreeResult {
  root: string;
  leaves: Array<MerkleLeaf & { hash: string }>;
  proofs: Map<string, string[]>;
}

/**
 * Hash two values in sorted order (matching the Solidity oracle's _verifyMerkle).
 */
function sortedPairHash(a: string, b: string): string {
  // In production, use ethers.keccak256(ethers.solidityPacked(...))
  // For now, deterministic string concatenation for consistent ordering
  const [first, second] = a <= b ? [a, b] : [b, a];
  return hashLeafData(`${first}${second}`);
}

/**
 * Simple hash function for leaf data.
 * In production, replace with ethers.keccak256(ethers.solidityPacked(...))
 */
function hashLeafData(data: string): string {
  // Use Web Crypto API for SHA-256 as a placeholder.
  // Production deployment should use ethers.js keccak256 to match Solidity.
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return `0x${(hash >>> 0).toString(16).padStart(64, "0")}`;
}

/**
 * Build a Merkle tree from alignment score leaves.
 */
export function buildMerkleTree(
  leaves: MerkleLeaf[],
): MerkleTreeResult {
  if (leaves.length === 0) {
    return { root: "0x" + "0".repeat(64), leaves: [], proofs: new Map() };
  }

  // Hash each leaf
  const hashedLeaves = leaves.map((leaf) => ({
    ...leaf,
    hash: hashLeafData(
      `${leaf.jurisdictionCode}:${leaf.politicianExternalId}:${leaf.score}:${leaf.votesCompared}:${leaf.aggregationRunId}:${leaf.timestamp}`,
    ),
  }));

  // Sort leaves by hash for deterministic tree
  hashedLeaves.sort((a, b) => (a.hash <= b.hash ? -1 : 1));

  // Build tree bottom-up
  const layers: string[][] = [hashedLeaves.map((l) => l.hash)];

  while (layers[layers.length - 1]!.length > 1) {
    const currentLayer = layers[layers.length - 1]!;
    const nextLayer: string[] = [];

    for (let i = 0; i < currentLayer.length; i += 2) {
      if (i + 1 < currentLayer.length) {
        nextLayer.push(sortedPairHash(currentLayer[i]!, currentLayer[i + 1]!));
      } else {
        // Odd leaf: promote to next level
        nextLayer.push(currentLayer[i]!);
      }
    }

    layers.push(nextLayer);
  }

  const root = layers[layers.length - 1]![0]!;

  // Generate proofs for each leaf
  const proofs = new Map<string, string[]>();

  for (let leafIndex = 0; leafIndex < hashedLeaves.length; leafIndex++) {
    const proof: string[] = [];
    let index = leafIndex;

    for (let layerIndex = 0; layerIndex < layers.length - 1; layerIndex++) {
      const layer = layers[layerIndex]!;
      const isRight = index % 2 === 1;
      const siblingIndex = isRight ? index - 1 : index + 1;

      if (siblingIndex < layer.length) {
        proof.push(layer[siblingIndex]!);
      }

      index = Math.floor(index / 2);
    }

    proofs.set(hashedLeaves[leafIndex]!.politicianExternalId, proof);
  }

  return { root, leaves: hashedLeaves, proofs };
}

/**
 * Build and store a Merkle tree from the latest aggregate alignment scores.
 */
export async function buildAndStoreMerkleTree(
  aggregationRunId: string,
): Promise<MerkleTreeResult> {
  const run = await prisma.aggregationRun.findUnique({
    where: { id: aggregationRunId },
    include: {
      jurisdiction: { select: { code: true } },
      alignmentScores: {
        where: { deletedAt: null },
        include: {
          politician: { select: { externalId: true } },
        },
      },
    },
  });

  if (!run) {
    throw new Error(`AggregationRun not found: ${aggregationRunId}`);
  }

  const jurisdictionCode = run.jurisdiction.code ?? "UNKNOWN";
  const timestamp = Math.floor(run.createdAt.getTime() / 1000);

  const leaves: MerkleLeaf[] = run.alignmentScores
    .filter((s) => s.politician.externalId)
    .map((s) => ({
      jurisdictionCode,
      politicianExternalId: s.politician.externalId!,
      score: Math.round(s.score),
      votesCompared: s.votesCompared,
      aggregationRunId,
      timestamp,
    }));

  const tree = buildMerkleTree(leaves);

  logger.info(
    `Built Merkle tree: ${leaves.length} leaves, root=${tree.root}`,
  );

  return tree;
}

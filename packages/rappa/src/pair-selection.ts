/**
 * Optimal Pair Selection for RAPPA
 *
 * Determines which pair of items should be presented next to maximise
 * information gain. Combines two signals:
 *
 * 1. **Comparison count**: Pairs with fewer comparisons have higher
 *    statistical uncertainty (variance ∝ 1/n).
 * 2. **Weight uncertainty**: Pairs whose items have high bootstrap
 *    weight variance contribute more entropy to the overall result.
 *
 * The combined priority score identifies pairs where additional
 * comparisons would most reduce uncertainty in the preference weights.
 *
 * @see Wishocracy paper §3.4 – "Computational Complexity and Scalability"
 *       (comparison density ρ and minimum nk requirements)
 */

import type { PairwiseComparison } from './types.js';

// ─── Public types ────────────────────────────────────────────────────

export interface PairRecommendation {
  /** First item in the pair */
  itemAId: string;
  /** Second item in the pair */
  itemBId: string;
  /** Priority score (higher = more valuable to compare next) */
  priorityScore: number;
  /** Number of existing comparisons for this pair */
  comparisonCount: number;
  /** Normalised key "itemA:itemB" (alphabetically sorted) */
  pairKey: string;
}

export interface PairSelectionOptions {
  /**
   * Explicit list of item ids to consider. If not provided, items are
   * extracted from comparisons. Provide this when there are items with
   * zero comparisons that should still be considered.
   */
  itemIds?: string[];
  /** Maximum number of recommendations to return (default: 10) */
  maxRecommendations?: number;
  /**
   * Optional per-item weight variance (e.g. from bootstrap CI).
   * Keyed by item id. Pairs involving high-variance items get higher
   * priority. If omitted, only comparison counts are used.
   */
  weightVariances?: Record<string, number>;
  /** Optional seed for tie-breaking (reproducibility) */
  seed?: number;
}

export interface PairSelectionResult {
  /** Ranked list of recommended pairs (highest priority first) */
  recommendations: PairRecommendation[];
  /** Comparison count for every observed pair (keyed by "A:B") */
  pairCounts: Record<string, number>;
  /** Total unique pairs possible */
  totalPossiblePairs: number;
  /** Number of pairs with at least one comparison */
  coveredPairs: number;
  /** Coverage ratio (coveredPairs / totalPossiblePairs) */
  coverageRatio: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────

function pairKey(a: string, b: string): string {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

function seededRng(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s * 1664525 + 1013904223) | 0;
    return (s >>> 0) / 0x100000000;
  };
}

function extractItems(comparisons: PairwiseComparison[]): string[] {
  const set = new Set<string>();
  for (const c of comparisons) {
    set.add(c.itemAId);
    set.add(c.itemBId);
  }
  return [...set].sort();
}

// ─── Main export ─────────────────────────────────────────────────────

/**
 * Select optimal pairs for the next round of comparisons.
 *
 * Scoring algorithm for each possible pair (A, B):
 *
 *   countScore = 1 / (1 + comparisonCount)
 *     → Pairs with fewer comparisons get higher count scores.
 *
 *   varianceScore = (variance(A) + variance(B)) / 2
 *     → Pairs involving uncertain items get higher variance scores.
 *     → Only used if weightVariances is provided.
 *
 *   priorityScore = countScore * (1 + varianceScore * itemCount)
 *     → Combines both signals. The variance term is scaled by item
 *       count so it remains meaningful regardless of the number of items.
 *
 * Pairs are ranked by priorityScore descending.
 */
export function selectNextPairs(
  comparisons: PairwiseComparison[],
  options: PairSelectionOptions = {},
): PairSelectionResult {
  const {
    maxRecommendations = 10,
    weightVariances,
    seed,
  } = options;

  const rng = seed !== undefined ? seededRng(seed) : Math.random;

  // Determine item set
  const itemsFromComparisons = extractItems(comparisons);
  const explicitItems = options.itemIds ?? [];
  const itemSet = new Set([...itemsFromComparisons, ...explicitItems]);
  const items = [...itemSet].sort();
  const n = items.length;

  if (n < 2) {
    return {
      recommendations: [],
      pairCounts: {},
      totalPossiblePairs: 0,
      coveredPairs: 0,
      coverageRatio: 1,
    };
  }

  // Count comparisons per pair
  const pairCounts: Record<string, number> = {};
  for (const comp of comparisons) {
    const key = pairKey(comp.itemAId, comp.itemBId);
    pairCounts[key] = (pairCounts[key] ?? 0) + 1;
  }

  const totalPossiblePairs = (n * (n - 1)) / 2;
  const coveredPairs = Object.keys(pairCounts).length;

  // Score all possible pairs
  const scored: PairRecommendation[] = [];

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const a = items[i]!;
      const b = items[j]!;
      const key = pairKey(a, b);
      const count = pairCounts[key] ?? 0;

      // Count-based score: inverse of (1 + count)
      const countScore = 1 / (1 + count);

      // Variance-based score (optional)
      let varianceScore = 0;
      if (weightVariances) {
        const varA = weightVariances[a] ?? 0;
        const varB = weightVariances[b] ?? 0;
        varianceScore = (varA + varB) / 2;
      }

      // Combined priority: count score boosted by variance
      const priorityScore =
        countScore * (1 + varianceScore * n) +
        rng() * 1e-10; // tiny jitter for deterministic tie-breaking

      scored.push({
        itemAId: a,
        itemBId: b,
        priorityScore,
        comparisonCount: count,
        pairKey: key,
      });
    }
  }

  // Sort by priority descending
  scored.sort((a, b) => b.priorityScore - a.priorityScore);

  return {
    recommendations: scored.slice(0, maxRecommendations),
    pairCounts,
    totalPossiblePairs,
    coveredPairs,
    coverageRatio: coveredPairs / totalPossiblePairs,
  };
}

/**
 * Select a single random pair, weighted by information need.
 *
 * Convenience wrapper: picks from the top recommendations with
 * probability proportional to their priority scores. Useful for
 * presenting one comparison at a time to a participant.
 */
export function selectRandomPair(
  comparisons: PairwiseComparison[],
  options: PairSelectionOptions = {},
): PairRecommendation | null {
  const result = selectNextPairs(comparisons, {
    ...options,
    maxRecommendations: Math.max(options.maxRecommendations ?? 10, 10),
  });

  if (result.recommendations.length === 0) return null;

  const rng = options.seed !== undefined
    ? seededRng(options.seed + 999)
    : Math.random;

  // Weighted random selection from top candidates
  const candidates = result.recommendations;
  const totalScore = candidates.reduce((s, c) => s + c.priorityScore, 0);

  if (totalScore <= 0) return candidates[0]!;

  const r = rng() * totalScore;
  let cumulative = 0;
  for (const c of candidates) {
    cumulative += c.priorityScore;
    if (cumulative >= r) return c;
  }

  return candidates[candidates.length - 1]!;
}

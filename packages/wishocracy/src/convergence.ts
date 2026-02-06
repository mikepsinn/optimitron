/**
 * Statistical Convergence Analysis for RAPPA
 *
 * Estimates how many pairwise comparisons are needed for stable preference
 * weights.  Uses bootstrap resampling: subsample comparisons, compute
 * weights via the existing eigenvector pipeline, and measure variance.
 *
 * Key insight from the Wishocracy paper: ~20 comparisons per participant
 * yields statistical convergence for moderate item sets.  This module
 * lets callers verify that empirically for their data.
 *
 * @see Wishocracy paper §3.4 "Computational Complexity and Scalability"
 */

import type { PairwiseComparison } from './types.js';
import { aggregateComparisons, buildComparisonMatrix, principalEigenvector } from './pairwise.js';

// ─── Public types ────────────────────────────────────────────────────

export interface ConvergenceResult {
  /** Minimum number of comparisons (of those tested) where weights stabilise */
  minComparisons: number;
  /**
   * Per-item weight variance at the current sample size (mean across items).
   * Lower is better — indicates tighter bootstrap CIs.
   */
  weightVariance: number;
  /** True when weightVariance < convergenceThreshold */
  isConverged: boolean;
  /** Variance of each item's weight across bootstrap runs (keyed by item id) */
  perItemVariance: Record<string, number>;
  /** Bootstrap mean weights (keyed by item id) */
  meanWeights: Record<string, number>;
}

export interface ConvergenceOptions {
  /** Number of bootstrap resamples at each sample-size step (default 50) */
  bootstrapIterations?: number;
  /**
   * Fractions of the comparison pool to test, sorted ascending.
   * e.g. [0.1, 0.25, 0.5, 0.75, 1.0]
   * Default: [0.1, 0.2, 0.3, 0.5, 0.75, 1.0]
   */
  sampleFractions?: number[];
  /** Mean weight-variance threshold below which we declare convergence (default 1e-4) */
  convergenceThreshold?: number;
  /** Optional deterministic seed for reproducibility (simple LCG) */
  seed?: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────

/**
 * Simple seeded PRNG (linear congruential generator).
 * Returns a function that yields values in [0, 1).
 */
function seededRng(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s * 1664525 + 1013904223) | 0;
    return (s >>> 0) / 0x100000000;
  };
}

/**
 * Fisher-Yates shuffle (in-place) using the supplied rng.
 */
function shuffle<T>(arr: T[], rng: () => number): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

/**
 * Extract unique item ids from comparisons.
 */
function extractItems(comparisons: PairwiseComparison[]): string[] {
  const set = new Set<string>();
  for (const c of comparisons) {
    set.add(c.itemAId);
    set.add(c.itemBId);
  }
  return [...set].sort();
}

/**
 * Run the RAPPA pipeline on a subset of comparisons and return weights
 * keyed by item id.
 */
function computeWeights(
  comparisons: PairwiseComparison[],
  items: string[],
): Record<string, number> {
  if (comparisons.length === 0) {
    const out: Record<string, number> = {};
    for (const id of items) out[id] = 1 / items.length;
    return out;
  }
  const entries = aggregateComparisons(comparisons);
  const matrix = buildComparisonMatrix(items, entries);
  const weights = principalEigenvector(matrix);
  const out: Record<string, number> = {};
  for (let i = 0; i < items.length; i++) {
    out[items[i]!] = weights[i]!;
  }
  return out;
}

// ─── Main export ─────────────────────────────────────────────────────

/**
 * Analyse convergence of preference weights as the number of comparisons
 * grows.
 *
 * Algorithm:
 * 1. For each sample fraction f in sampleFractions:
 *    a. Draw `bootstrapIterations` random subsets of size ceil(n * f).
 *    b. Compute preference weights for each subset.
 *    c. Compute per-item variance across the bootstrap runs.
 * 2. The first fraction where mean(per-item variance) < threshold is the
 *    convergence point; minComparisons = ceil(n * fraction).
 * 3. Return full-sample statistics plus the convergence point.
 */
export function analyseConvergence(
  comparisons: PairwiseComparison[],
  options: ConvergenceOptions = {},
): ConvergenceResult {
  const {
    bootstrapIterations = 50,
    sampleFractions = [0.1, 0.2, 0.3, 0.5, 0.75, 1.0],
    convergenceThreshold = 1e-4,
    seed,
  } = options;

  const rng = seed !== undefined ? seededRng(seed) : Math.random;
  const items = extractItems(comparisons);
  const n = comparisons.length;

  if (n === 0 || items.length === 0) {
    return {
      minComparisons: 0,
      weightVariance: 0,
      isConverged: true,
      perItemVariance: {},
      meanWeights: {},
    };
  }

  let firstConvergedCount = n; // default: needs all
  let converged = false;
  let lastPerItemVariance: Record<string, number> = {};
  let lastMeanWeights: Record<string, number> = {};
  let lastMeanVariance = Infinity;

  const sortedFractions = [...sampleFractions].sort((a, b) => a - b);

  for (const frac of sortedFractions) {
    const sampleSize = Math.min(n, Math.max(1, Math.ceil(n * frac)));

    // Collect bootstrap weight vectors
    const weightVectors: Record<string, number[]> = {};
    for (const id of items) weightVectors[id] = [];

    for (let b = 0; b < bootstrapIterations; b++) {
      // Sample with replacement
      const subset: PairwiseComparison[] = [];
      for (let s = 0; s < sampleSize; s++) {
        const idx = Math.floor(rng() * n);
        subset.push(comparisons[idx]!);
      }
      const w = computeWeights(subset, items);
      for (const id of items) {
        weightVectors[id]!.push(w[id]!);
      }
    }

    // Compute per-item variance and mean
    const perItemVar: Record<string, number> = {};
    const meanW: Record<string, number> = {};
    for (const id of items) {
      const vals = weightVectors[id]!;
      const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
      const variance = vals.reduce((sum, v) => sum + (v - mean) ** 2, 0) / vals.length;
      perItemVar[id] = variance;
      meanW[id] = mean;
    }

    const meanVariance =
      Object.values(perItemVar).reduce((a, b) => a + b, 0) / items.length;

    lastPerItemVariance = perItemVar;
    lastMeanWeights = meanW;
    lastMeanVariance = meanVariance;

    if (!converged && meanVariance < convergenceThreshold) {
      firstConvergedCount = sampleSize;
      converged = true;
      // Don't break — we still want full-sample stats
    }
  }

  return {
    minComparisons: firstConvergedCount,
    weightVariance: lastMeanVariance,
    isConverged: converged,
    perItemVariance: lastPerItemVariance,
    meanWeights: lastMeanWeights,
  };
}

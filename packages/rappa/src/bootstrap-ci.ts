/**
 * Bootstrap Confidence Intervals for RAPPA Preference Weights
 *
 * Resamples pairwise comparisons with replacement N times, computes
 * eigenvector weights each time, and returns percentile-based confidence
 * intervals for each item's weight.
 *
 * This quantifies uncertainty: "Given this set of comparisons, how
 * confident are we in the resulting preference weights?"
 *
 * @see Wishocracy paper §3.4 – Convergence Properties
 */

import type { PairwiseComparison, PreferenceWeight } from './types.js';
import {
  aggregateComparisons,
  buildComparisonMatrix,
  principalEigenvector,
} from './pairwise.js';

// ─── Public types ────────────────────────────────────────────────────

export interface BootstrapCIOptions {
  /** Number of bootstrap iterations (default 1000) */
  iterations?: number;
  /** Confidence level as a fraction, e.g. 0.95 for 95% CI (default 0.95) */
  confidenceLevel?: number;
  /** Optional seed for reproducible results (simple LCG) */
  seed?: number;
}

export interface BootstrapCIResult {
  /** Preference weights with confidence intervals */
  weights: PreferenceWeight[];
  /** Number of bootstrap iterations actually run */
  iterations: number;
  /** Confidence level used */
  confidenceLevel: number;
  /** Per-item bootstrap distributions (sorted ascending) for further analysis */
  distributions: Record<string, number[]>;
}

// ─── Helpers ─────────────────────────────────────────────────────────

/**
 * Simple seeded PRNG (linear congruential generator).
 * Returns a function yielding values in [0, 1).
 */
function seededRng(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s * 1664525 + 1013904223) | 0;
    return (s >>> 0) / 0x100000000;
  };
}

/** Extract unique sorted item ids from comparisons. */
function extractItems(comparisons: PairwiseComparison[]): string[] {
  const set = new Set<string>();
  for (const c of comparisons) {
    set.add(c.itemAId);
    set.add(c.itemBId);
  }
  return [...set].sort();
}

/** Resample an array with replacement using the given rng. */
function resampleWithReplacement<T>(
  arr: readonly T[],
  n: number,
  rng: () => number,
): T[] {
  const result: T[] = [];
  for (let i = 0; i < n; i++) {
    const idx = Math.floor(rng() * arr.length);
    result.push(arr[idx]!);
  }
  return result;
}

/** Compute eigenvector weights from a set of comparisons. */
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

/** Get the value at a given percentile from a sorted array. */
function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo]!;
  const frac = idx - lo;
  return sorted[lo]! * (1 - frac) + sorted[hi]! * frac;
}

// ─── Main export ─────────────────────────────────────────────────────

/**
 * Compute bootstrap confidence intervals for RAPPA preference weights.
 *
 * Algorithm:
 * 1. Extract items from comparisons.
 * 2. Compute point-estimate weights from the full dataset.
 * 3. For each bootstrap iteration:
 *    a. Resample comparisons with replacement (same size as original).
 *    b. Compute eigenvector weights on the resampled set.
 * 4. For each item, sort bootstrap weights and extract percentiles
 *    corresponding to the desired confidence interval.
 * 5. Return weights with CIs and rank ordering.
 */
export function bootstrapConfidenceIntervals(
  comparisons: PairwiseComparison[],
  options: BootstrapCIOptions = {},
): BootstrapCIResult {
  const {
    iterations = 1000,
    confidenceLevel = 0.95,
    seed,
  } = options;

  const rng = seed !== undefined ? seededRng(seed) : Math.random;
  const items = extractItems(comparisons);
  const n = comparisons.length;

  // Empty input: return uniform weights, no CI
  if (n === 0 || items.length === 0) {
    return {
      weights: [],
      iterations,
      confidenceLevel,
      distributions: {},
    };
  }

  // Point estimates from full dataset
  const pointWeights = computeWeights(comparisons, items);

  // Collect bootstrap distributions
  const distributions: Record<string, number[]> = {};
  for (const id of items) distributions[id] = [];

  for (let b = 0; b < iterations; b++) {
    const resampled = resampleWithReplacement(comparisons, n, rng);
    const w = computeWeights(resampled, items);
    for (const id of items) {
      distributions[id]!.push(w[id]!);
    }
  }

  // Sort distributions for percentile calculation
  for (const id of items) {
    distributions[id]!.sort((a, b) => a - b);
  }

  // Calculate CI bounds
  const alpha = 1 - confidenceLevel;
  const lowerPct = (alpha / 2) * 100; // e.g. 2.5 for 95% CI
  const upperPct = (1 - alpha / 2) * 100; // e.g. 97.5 for 95% CI

  // Build PreferenceWeight[] with CIs
  const weightEntries: Array<{ itemId: string; weight: number; ciLow: number; ciHigh: number }> = [];
  for (const id of items) {
    const dist = distributions[id]!;
    weightEntries.push({
      itemId: id,
      weight: pointWeights[id]!,
      ciLow: percentile(dist, lowerPct),
      ciHigh: percentile(dist, upperPct),
    });
  }

  // Sort by weight descending, assign ranks
  weightEntries.sort((a, b) => b.weight - a.weight);
  const weights: PreferenceWeight[] = weightEntries.map((e, i) => ({
    itemId: e.itemId,
    weight: e.weight,
    rank: i + 1,
    ciLow: e.ciLow,
    ciHigh: e.ciHigh,
  }));

  return {
    weights,
    iterations,
    confidenceLevel,
    distributions,
  };
}

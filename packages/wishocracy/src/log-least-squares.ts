/**
 * Logarithmic Least Squares (LLSM) Preference Weights for Sparse RAPPA Data
 *
 * The Wishocracy paper ("Priority Synthesis") prescribes LLSM for sparse
 * comparison data: find weights w with a_jk ≈ w_j / w_k. Every answer is one
 * observation of log(w_j / w_k), so a pair answered by more participants
 * carries more weight, and a pair nobody answered adds nothing. Dense-matrix
 * methods instead read an unanswered pair as a tie, which flattens sparse
 * results toward equal weights.
 *
 * A weak prior toward equal weights ("Low Comparison Density": Bayesian
 * priors for sparse regions) keeps items identifiable when the comparison
 * graph is disconnected.
 *
 * @see https://wishocracy.warondisease.org — Wishocracy paper
 */

import type { PairwiseComparison, PreferenceWeight } from './types.js';

export interface LogLeastSquaresOptions {
  /** Pull toward equal weights, in units of answers (default 0.01). Must be positive. */
  priorStrength?: number;
}

export interface LogLeastSquaresIntervalOptions extends LogLeastSquaresOptions {
  /** Number of bootstrap resamples (default 200) */
  iterations?: number;
  /** Confidence level as a fraction (default 0.95) */
  confidenceLevel?: number;
  /** Seed for the resampling generator (default 1) */
  seed?: number;
}

export interface AnswerAgreement {
  /** Answers whose favored item also has the larger weight */
  agreed: number;
  /** Answers that favored one item (50-50 splits are excluded) */
  total: number;
}

const DEFAULT_PRIOR_STRENGTH = 0.01;

/** Same floor as aggregateComparisons: a 100-0 split is read as 100:0.5. */
function answerLogRatio(allocationA: number): number {
  return Math.log(Math.max(allocationA, 0.5) / Math.max(100 - allocationA, 0.5));
}

/**
 * Solve the normal equations (L + λI) x = b, where L is the Laplacian of the
 * comparison graph. The matrix is strictly diagonally dominant, so
 * elimination without pivoting is stable.
 */
function solveLogWeights(
  comparisons: PairwiseComparison[],
  itemIds: string[],
  priorStrength: number,
): number[] {
  const n = itemIds.length;
  const index = new Map(itemIds.map((id, i) => [id, i]));
  const a = new Float64Array(n * n);
  const b = new Float64Array(n);

  for (let i = 0; i < n; i++) a[i * n + i] = priorStrength;
  for (const comparison of comparisons) {
    const j = index.get(comparison.itemAId);
    const k = index.get(comparison.itemBId);
    if (j === undefined || k === undefined || j === k) continue;
    const y = answerLogRatio(comparison.allocationA);
    a[j * n + j] = (a[j * n + j] ?? 0) + 1;
    a[k * n + k] = (a[k * n + k] ?? 0) + 1;
    a[j * n + k] = (a[j * n + k] ?? 0) - 1;
    a[k * n + j] = (a[k * n + j] ?? 0) - 1;
    b[j] = (b[j] ?? 0) + y;
    b[k] = (b[k] ?? 0) - y;
  }

  for (let col = 0; col < n; col++) {
    const pivot = a[col * n + col] ?? 1;
    for (let row = col + 1; row < n; row++) {
      const factor = (a[row * n + col] ?? 0) / pivot;
      if (factor === 0) continue;
      for (let c = col; c < n; c++) {
        a[row * n + c] = (a[row * n + c] ?? 0) - factor * (a[col * n + c] ?? 0);
      }
      b[row] = (b[row] ?? 0) - factor * (b[col] ?? 0);
    }
  }
  const x = new Array<number>(n).fill(0);
  for (let row = n - 1; row >= 0; row--) {
    let sum = b[row] ?? 0;
    for (let c = row + 1; c < n; c++) sum -= (a[row * n + c] ?? 0) * (x[c] ?? 0);
    x[row] = sum / (a[row * n + row] ?? 1);
  }
  return x;
}

function normalize(itemIds: string[], logWeights: number[]): Record<string, number> {
  const max = Math.max(...logWeights);
  const exp = logWeights.map((value) => Math.exp(value - max));
  const total = exp.reduce((sum, value) => sum + value, 0);
  const weights: Record<string, number> = {};
  itemIds.forEach((id, i) => {
    weights[id] = (exp[i] ?? 0) / total;
  });
  return weights;
}

/**
 * Compute preference weights (summing to 1 over `itemIds`) from pairwise
 * answers. Answers that name an item outside `itemIds` are ignored.
 */
export function logLeastSquaresWeights(
  comparisons: PairwiseComparison[],
  itemIds: string[],
  options: LogLeastSquaresOptions = {},
): Record<string, number> {
  const { priorStrength = DEFAULT_PRIOR_STRENGTH } = options;
  if (!(priorStrength > 0)) throw new Error('priorStrength must be positive');
  if (itemIds.length === 0) return {};
  return normalize(
    itemIds,
    solveLogWeights(comparisons, itemIds, priorStrength),
  );
}

function seededRng(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s * 1664525 + 1013904223) | 0;
    return (s >>> 0) / 0x100000000;
  };
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  const frac = idx - lo;
  return (sorted[lo] ?? 0) * (1 - frac) + (sorted[hi] ?? 0) * frac;
}

/**
 * Point weights plus percentile bootstrap intervals. Resamples participants,
 * not single answers, because one person's answers are not independent.
 * Returns weights sorted from highest to lowest, with ranks.
 */
export function logLeastSquaresConfidenceIntervals(
  comparisons: PairwiseComparison[],
  itemIds: string[],
  options: LogLeastSquaresIntervalOptions = {},
): PreferenceWeight[] {
  const { iterations = 200, confidenceLevel = 0.95, seed = 1, ...fitOptions } = options;
  const point = logLeastSquaresWeights(comparisons, itemIds, fitOptions);

  const byParticipant = new Map<string, PairwiseComparison[]>();
  for (const comparison of comparisons) {
    const rows = byParticipant.get(comparison.participantId) ?? [];
    rows.push(comparison);
    byParticipant.set(comparison.participantId, rows);
  }
  const participants = [...byParticipant.values()];
  const rng = seededRng(seed);
  const distributions = new Map(itemIds.map((id) => [id, [] as number[]]));

  if (participants.length > 0) {
    for (let iteration = 0; iteration < iterations; iteration++) {
      const resample: PairwiseComparison[] = [];
      for (let i = 0; i < participants.length; i++) {
        resample.push(...(participants[Math.floor(rng() * participants.length)] ?? []));
      }
      const weights = logLeastSquaresWeights(resample, itemIds, fitOptions);
      for (const id of itemIds) distributions.get(id)?.push(weights[id] ?? 0);
    }
  }

  const alpha = 1 - confidenceLevel;
  return itemIds
    .map((itemId) => {
      const sorted = (distributions.get(itemId) ?? []).sort((x, y) => x - y);
      const weight = point[itemId] ?? 0;
      return {
        itemId,
        weight,
        ciLow: sorted.length ? percentile(sorted, (alpha / 2) * 100) : weight,
        ciHigh: sorted.length ? percentile(sorted, (1 - alpha / 2) * 100) : weight,
      };
    })
    .sort((x, y) => y.weight - x.weight || x.itemId.localeCompare(y.itemId))
    .map((entry, i) => ({ ...entry, rank: i + 1 }));
}

/**
 * Count how many answers the weights reproduce: an answer that gave item A
 * more than item B agrees when A's weight is larger than B's.
 */
export function answerAgreement(
  comparisons: PairwiseComparison[],
  weights: Record<string, number>,
): AnswerAgreement {
  let agreed = 0;
  let total = 0;
  for (const comparison of comparisons) {
    const weightA = weights[comparison.itemAId];
    const weightB = weights[comparison.itemBId];
    if (weightA === undefined || weightB === undefined || comparison.allocationA === 50) continue;
    total++;
    if ((comparison.allocationA > 50) === (weightA > weightB)) agreed++;
  }
  return { agreed, total };
}

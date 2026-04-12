/**
 * Matrix Completion for RAPPA
 *
 * Given a sparse set of pairwise preference ratios, infer missing pairs
 * via transitivity in **log-space** (log ratios are additive).
 *
 * Core idea from the Wishocracy paper §3.1:
 *   If A:B = 3 and B:C = 2, then A:C ≈ 3 × 2 = 6.
 *   In log-space: log(A:C) = log(A:B) + log(B:C).
 *
 * Implementation uses shortest-path (Floyd-Warshall) over a graph where
 * edges are observed log-ratios and "shortest" means "fewest hops" so
 * we prefer direct observations over long transitive chains.
 *
 * @see Wishocracy paper §3 "Mechanism Design: RAPPA"
 */

import type { MatrixEntry } from './types.js';

// ─── Public types ────────────────────────────────────────────────────

export interface CompletedMatrix {
  /** All pairwise entries (observed + inferred) */
  entries: MatrixEntry[];
  /** Full n×n ratio matrix indexed by item order in `items` */
  matrix: number[][];
  /** Ordered item ids */
  items: string[];
  /** Number of pairs that were directly observed */
  observedPairs: number;
  /** Number of pairs inferred via transitivity */
  inferredPairs: number;
  /** Number of pairs that could not be inferred (disconnected components) */
  missingPairs: number;
  /**
   * Confidence for each inferred pair: the number of intermediate hops used.
   * Fewer hops → higher confidence. Direct observations have hops = 0.
   * Keyed by "itemA:itemB" (alphabetically normalised).
   */
  hopCounts: Record<string, number>;
}

export interface MatrixCompletionOptions {
  /**
   * Maximum number of transitive hops to allow when inferring a missing pair.
   * Higher = more aggressive completion but lower confidence.
   * Default: Infinity (complete as much as possible).
   */
  maxHops?: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────

function pairKey(a: string, b: string): string {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

/**
 * Extract unique item ids from entries.
 */
function extractItems(entries: MatrixEntry[]): string[] {
  const set = new Set<string>();
  for (const e of entries) {
    set.add(e.itemAId);
    set.add(e.itemBId);
  }
  return [...set].sort();
}

// ─── Main export ─────────────────────────────────────────────────────

/**
 * Complete a sparse pairwise comparison matrix using log-space transitivity.
 *
 * Algorithm (modified Floyd-Warshall in log-space):
 *
 * 1. Build an n×n matrix of log-ratios from observed entries.
 *    logRatio[i][j] = ln(ratio_ij) for observed pairs; NaN otherwise.
 *    Also track hop counts: hops[i][j] = 0 for observed, Infinity otherwise.
 *
 * 2. For each intermediate node k, for each (i, j):
 *    If logRatio[i][k] + logRatio[k][j] is defined and the hop count
 *    through k is lower than the current hop count for (i, j), update:
 *      logRatio[i][j] = logRatio[i][k] + logRatio[k][j]
 *      hops[i][j] = hops[i][k] + hops[k][j] + 1
 *
 * 3. Convert back from log-space: ratio[i][j] = exp(logRatio[i][j]).
 */
export function completeMatrix(
  observedEntries: MatrixEntry[],
  options: MatrixCompletionOptions = {},
): CompletedMatrix {
  const { maxHops = Infinity } = options;
  const items = extractItems(observedEntries);
  const n = items.length;
  const idx = new Map(items.map((id, i) => [id, i]));

  // Initialise n×n matrices
  const logRatio: number[][] = Array.from({ length: n }, () =>
    Array.from({ length: n }, () => NaN),
  );
  const hops: number[][] = Array.from({ length: n }, () =>
    Array.from({ length: n }, () => Infinity),
  );

  // Diagonal
  for (let i = 0; i < n; i++) {
    const logRow = logRatio[i];
    const hopRow = hops[i];
    if (!logRow || !hopRow) continue;
    logRow[i] = 0;
    hopRow[i] = 0;
  }

  // Seed observed entries
  const observedKeys = new Set<string>();
  for (const e of observedEntries) {
    const i = idx.get(e.itemAId);
    const j = idx.get(e.itemBId);
    if (i === undefined || j === undefined) continue;

    const logRowI = logRatio[i];
    const logRowJ = logRatio[j];
    const hopRowI = hops[i];
    const hopRowJ = hops[j];
    if (!logRowI || !logRowJ || !hopRowI || !hopRowJ) continue;

    logRowI[j] = Math.log(e.ratio);
    logRowJ[i] = -Math.log(e.ratio); // reciprocal in log-space
    hopRowI[j] = 0;
    hopRowJ[i] = 0;

    observedKeys.add(pairKey(e.itemAId, e.itemBId));
  }

  // Floyd-Warshall in log-space, preferring fewer hops
  for (let k = 0; k < n; k++) {
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        const logRowI = logRatio[i];
        const logRowK = logRatio[k];
        const hopRowI = hops[i];
        const hopRowK = hops[k];
        if (!logRowI || !logRowK || !hopRowI || !hopRowK) continue;

        const lrIK = logRowI[k];
        const lrKJ = logRowK[j];
        if (lrIK === undefined || lrKJ === undefined) continue;
        if (Number.isNaN(lrIK) || Number.isNaN(lrKJ)) continue;

        const candidateLR = lrIK + lrKJ;
        const hopIK = hopRowI[k];
        const hopKJ = hopRowK[j];
        if (hopIK === undefined || hopKJ === undefined) continue;
        const candidateHops = hopIK + hopKJ + 1;

        if (candidateHops > maxHops) continue;

        const currentHops = hopRowI[j];
        if (currentHops === undefined) continue;
        // Prefer fewer hops; if tied, keep existing (direct observations win)
        if (candidateHops < currentHops) {
          logRowI[j] = candidateLR;
          hopRowI[j] = candidateHops;
        }
      }
    }
  }

  // Build output
  const ratioMatrix: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => {
      const logRow = logRatio[i];
      const lr = logRow?.[j];
      return lr === undefined || Number.isNaN(lr) ? 1 : Math.exp(lr); // default 1 for unreachable
    }),
  );

  const allEntries: MatrixEntry[] = [];
  const hopCounts: Record<string, number> = {};
  let observedPairs = 0;
  let inferredPairs = 0;
  let missingPairs = 0;

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const itemAId = items[i];
      const itemBId = items[j];
      const logRow = logRatio[i];
      const hopRow = hops[i];
      if (!itemAId || !itemBId || !logRow || !hopRow) continue;

      const key = pairKey(itemAId, itemBId);
      const lr = logRow[j];
      const h = hopRow[j];
      if (lr === undefined || h === undefined) continue;

      if (observedKeys.has(key)) {
        observedPairs++;
        hopCounts[key] = 0;
      } else if (!Number.isNaN(lr) && Number.isFinite(h)) {
        inferredPairs++;
        hopCounts[key] = h;
      } else {
        missingPairs++;
        hopCounts[key] = -1; // sentinel for "unreachable"
        continue; // don't emit an entry for missing pairs
      }

      allEntries.push({
        itemAId,
        itemBId,
        ratio: Math.exp(lr),
        count: observedKeys.has(key)
          ? (observedEntries.find(
              e => pairKey(e.itemAId, e.itemBId) === key,
            )?.count ?? 0)
          : 0, // inferred entries have count 0
      });
    }
  }

  return {
    entries: allEntries,
    matrix: ratioMatrix,
    items,
    observedPairs,
    inferredPairs,
    missingPairs,
    hopCounts,
  };
}

/**
 * Convenience: given items and a sparse set of comparisons (as a simple
 * record of "A:B" → ratio), complete the matrix and return a full ratio
 * map.
 */
export function inferMissingRatios(
  ratios: Record<string, number>,
  options?: MatrixCompletionOptions,
): CompletedMatrix {
  const entries: MatrixEntry[] = [];
  for (const [key, ratio] of Object.entries(ratios)) {
    const parts = key.split(':');
    if (parts.length !== 2) continue;
    const [a, b] = parts as [string, string];
    entries.push({
      itemAId: a,
      itemBId: b,
      ratio,
      count: 1,
    });
  }
  return completeMatrix(entries, options);
}

/**
 * Manipulation Resistance Analysis for RAPPA
 *
 * Analyzes how much a single strategic voter can shift preference weights.
 * Given existing comparisons, simulates one adversarial participant
 * submitting extreme preferences and measures the resulting weight shifts.
 *
 * From the Wishocracy paper §3.2 – "Manipulation Resistance":
 *   "Random pair assignment makes strategic manipulation difficult.
 *    A participant cannot know which pairs they will receive, making
 *    truthful reporting a robust heuristic. With sufficiently large
 *    participant pools, individual strategic behavior has negligible
 *    impact on outcomes."
 *
 * This module quantifies that claim empirically for any dataset.
 *
 * @see Wishocracy paper §3.2 "Formal Properties"
 */

import type { PairwiseComparison, PreferenceWeight } from './types.js';
import {
  aggregateComparisons,
  buildComparisonMatrix,
  principalEigenvector,
} from './pairwise.js';

// ─── Public types ────────────────────────────────────────────────────

export interface ManipulationAnalysisOptions {
  /**
   * Number of comparisons the adversary submits (default: same as
   * average participant's count, or 20 if no participants exist).
   */
  adversaryComparisons?: number;
  /** Optional seed for reproducible results */
  seed?: number;
  /**
   * Strategies to test. Default: all three.
   * - 'boost': Adversary maximises weight of the target item.
   * - 'suppress': Adversary minimises weight of the target item.
   * - 'random-extreme': Adversary submits random 100/0 allocations.
   */
  strategies?: Array<'boost' | 'suppress' | 'random-extreme'>;
}

export interface ItemVulnerability {
  itemId: string;
  /** Max absolute weight shift achievable by a single adversary */
  maxWeightShift: number;
  /** Direction of worst-case shift: 'boost' | 'suppress' */
  worstCaseDirection: 'boost' | 'suppress';
  /** Weight shift under boost strategy */
  boostShift: number;
  /** Weight shift under suppress strategy */
  suppressShift: number;
}

export interface ManipulationAnalysisResult {
  /** Baseline weights (no adversary) */
  baselineWeights: PreferenceWeight[];
  /** Per-item vulnerability analysis */
  itemVulnerabilities: ItemVulnerability[];
  /**
   * Overall vulnerability score (0–1).
   * Mean of max weight shifts across all items, normalised by 1/n
   * (the uniform weight). 0 = invulnerable, 1 = fully manipulable.
   */
  vulnerabilityScore: number;
  /** Number of existing comparisons (context for interpreting the score) */
  existingComparisonCount: number;
  /** Number of unique participants in existing data */
  existingParticipantCount: number;
  /** Comparisons injected by the simulated adversary */
  adversaryComparisonCount: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────

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

function computeWeightMap(
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

function weightsToPreference(
  weightMap: Record<string, number>,
): PreferenceWeight[] {
  const entries = Object.entries(weightMap)
    .map(([itemId, weight]) => ({ itemId, weight }))
    .sort((a, b) => b.weight - a.weight);
  return entries.map((e, i) => ({
    itemId: e.itemId,
    weight: e.weight,
    rank: i + 1,
  }));
}

/**
 * Generate adversarial comparisons for a "boost" strategy:
 * The adversary gives 100% to the target item whenever it appears,
 * and distributes pairs to maximise exposure of the target item.
 */
function generateBoostComparisons(
  targetItemId: string,
  items: string[],
  count: number,
  rng: () => number,
): PairwiseComparison[] {
  const others = items.filter(id => id !== targetItemId);
  if (others.length === 0) return [];

  const comps: PairwiseComparison[] = [];
  for (let i = 0; i < count; i++) {
    const otherIdx = Math.floor(rng() * others.length);
    const otherId = others[otherIdx]!;
    comps.push({
      id: `adversary-boost-${i}`,
      participantId: '__adversary__',
      itemAId: targetItemId,
      itemBId: otherId,
      allocationA: 100, // max allocation to target
      timestamp: Date.now(),
    });
  }
  return comps;
}

/**
 * Generate adversarial comparisons for a "suppress" strategy:
 * The adversary gives 0% to the target item whenever it appears.
 */
function generateSuppressComparisons(
  targetItemId: string,
  items: string[],
  count: number,
  rng: () => number,
): PairwiseComparison[] {
  const others = items.filter(id => id !== targetItemId);
  if (others.length === 0) return [];

  const comps: PairwiseComparison[] = [];
  for (let i = 0; i < count; i++) {
    const otherIdx = Math.floor(rng() * others.length);
    const otherId = others[otherIdx]!;
    comps.push({
      id: `adversary-suppress-${i}`,
      participantId: '__adversary__',
      itemAId: targetItemId,
      itemBId: otherId,
      allocationA: 0, // zero allocation to target
      timestamp: Date.now(),
    });
  }
  return comps;
}

// ─── Main export ─────────────────────────────────────────────────────

/**
 * Analyse manipulation resistance of a RAPPA dataset.
 *
 * For each item, simulates a single adversary who attempts to either
 * maximise (boost) or minimise (suppress) that item's weight. Returns
 * the maximum achievable weight shift for each item plus an overall
 * vulnerability score.
 *
 * A low vulnerability score means the dataset has enough comparisons
 * that no single participant can meaningfully distort results.
 */
export function analyzeManipulation(
  comparisons: PairwiseComparison[],
  options: ManipulationAnalysisOptions = {},
): ManipulationAnalysisResult {
  const items = extractItems(comparisons);
  const n = items.length;

  if (n === 0 || comparisons.length === 0) {
    return {
      baselineWeights: [],
      itemVulnerabilities: [],
      vulnerabilityScore: 1, // fully manipulable with no data
      existingComparisonCount: 0,
      existingParticipantCount: 0,
      adversaryComparisonCount: 0,
    };
  }

  const {
    seed,
    strategies = ['boost', 'suppress'],
  } = options;

  // Default adversary comparisons: average per participant, min 10
  const participantIds = new Set(comparisons.map(c => c.participantId));
  const avgComparisons = Math.ceil(comparisons.length / participantIds.size);
  const adversaryCount = options.adversaryComparisons ?? Math.max(avgComparisons, 10);

  const rng = seed !== undefined ? seededRng(seed) : Math.random;

  // Baseline weights (no adversary)
  const baselineMap = computeWeightMap(comparisons, items);
  const baselineWeights = weightsToPreference(baselineMap);

  // Test each item as a target
  const vulnerabilities: ItemVulnerability[] = [];

  for (const targetId of items) {
    let boostShift = 0;
    let suppressShift = 0;

    if (strategies.includes('boost')) {
      const adversarial = generateBoostComparisons(
        targetId, items, adversaryCount, rng,
      );
      const combined = [...comparisons, ...adversarial];
      const shiftedMap = computeWeightMap(combined, items);
      boostShift = (shiftedMap[targetId] ?? 0) - (baselineMap[targetId] ?? 0);
    }

    if (strategies.includes('suppress')) {
      const adversarial = generateSuppressComparisons(
        targetId, items, adversaryCount, rng,
      );
      const combined = [...comparisons, ...adversarial];
      const shiftedMap = computeWeightMap(combined, items);
      suppressShift = (baselineMap[targetId] ?? 0) - (shiftedMap[targetId] ?? 0);
    }

    const maxShift = Math.max(Math.abs(boostShift), Math.abs(suppressShift));
    const worstDirection = Math.abs(boostShift) >= Math.abs(suppressShift)
      ? 'boost' as const
      : 'suppress' as const;

    vulnerabilities.push({
      itemId: targetId,
      maxWeightShift: maxShift,
      worstCaseDirection: worstDirection,
      boostShift,
      suppressShift,
    });
  }

  // Sort by vulnerability (most vulnerable first)
  vulnerabilities.sort((a, b) => b.maxWeightShift - a.maxWeightShift);

  // Overall vulnerability score: mean max shift normalised by uniform weight
  const uniformWeight = 1 / n;
  const meanMaxShift =
    vulnerabilities.reduce((sum, v) => sum + v.maxWeightShift, 0) / n;
  // Normalise: a shift of uniformWeight would be "fully manipulable"
  const vulnerabilityScore = Math.min(1, meanMaxShift / uniformWeight);

  return {
    baselineWeights,
    itemVulnerabilities: vulnerabilities,
    vulnerabilityScore,
    existingComparisonCount: comparisons.length,
    existingParticipantCount: participantIds.size,
    adversaryComparisonCount: adversaryCount,
  };
}

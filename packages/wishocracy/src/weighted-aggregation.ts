/**
 * Weighted Preference Aggregation
 * 
 * Extends basic pairwise aggregation with:
 * - Confidence weighting: weight participants by their consistency ratio (CR)
 * - Time-decay weighting: weight recent comparisons more than old ones
 * - Combined weighting: both confidence and time-decay applied together
 * 
 * @see https://wishocracy.warondisease.org — Wishocracy paper (RAPPA algorithm)
 */

import type { PairwiseComparison, MatrixEntry } from './types.js';

// ─── Types ───────────────────────────────────────────────────────────

export interface WeightedAggregationOptions {
  /** Enable confidence weighting by participant CR. Default: false */
  useConfidence?: boolean;
  /** Enable time-decay weighting. Default: false */
  useTimeDecay?: boolean;
  /** Time-decay parameter λ. Default: 0.01 (~69 day half-life) */
  decayLambda?: number;
  /** Reference date for time decay (defaults to now) */
  referenceDate?: Date;
  /** Map of participantId → consistency ratio (CR) */
  participantCRs?: Map<string, number>;
}

/** Default decay parameter: λ = 0.01 → half-life ≈ ln(2)/0.01 ≈ 69.3 days */
const DEFAULT_DECAY_LAMBDA = 0.01;

// ─── Weight Calculations ─────────────────────────────────────────────

/**
 * Confidence weight from consistency ratio.
 * Lower CR = more consistent = higher weight.
 * 
 * w = 1 / (1 + CR)
 * 
 * - CR = 0   → w = 1.0  (perfectly consistent)
 * - CR = 0.1 → w ≈ 0.91
 * - CR = 0.5 → w ≈ 0.67
 * - CR = 1.0 → w = 0.5
 */
export function confidenceWeight(cr: number): number {
  return 1 / (1 + Math.max(0, cr));
}

/**
 * Time-decay weight based on comparison age.
 * 
 * w = exp(-λ × age_days)
 * 
 * - age = 0 days  → w = 1.0
 * - age = 69 days → w ≈ 0.5 (with default λ = 0.01)
 * - age = 365 days → w ≈ 0.026
 */
export function timeDecayWeight(
  comparisonTimestamp: number | string,
  referenceDate: Date,
  decayLambda: number = DEFAULT_DECAY_LAMBDA,
): number {
  const compTime = typeof comparisonTimestamp === 'string'
    ? new Date(comparisonTimestamp).getTime()
    : comparisonTimestamp;
  
  const ageDays = Math.max(0, (referenceDate.getTime() - compTime) / (1000 * 60 * 60 * 24));
  return Math.exp(-decayLambda * ageDays);
}

// ─── Weighted Geometric Mean Helper ──────────────────────────────────

/**
 * Compute the weighted geometric mean of ratios.
 * 
 * Weighted geometric mean = exp( Σ(w_i × ln(r_i)) / Σ(w_i) )
 */
function weightedGeometricMean(ratios: number[], weights: number[]): number {
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  if (totalWeight === 0) {
    // Fall back to unweighted geometric mean
    const logSum = ratios.reduce((sum, r) => sum + Math.log(r), 0);
    return Math.exp(logSum / ratios.length);
  }
  
  let weightedLogSum = 0;
  for (let i = 0; i < ratios.length; i++) {
    weightedLogSum += (weights[i] ?? 0) * Math.log(ratios[i] ?? 1);
  }
  
  return Math.exp(weightedLogSum / totalWeight);
}

/**
 * Compute the weighted mean of allocations (for stdDev calculation).
 */
function weightedMean(values: number[], weights: number[]): number {
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  if (totalWeight === 0) {
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }
  let weightedSum = 0;
  for (let i = 0; i < values.length; i++) {
    weightedSum += (weights[i] ?? 0) * (values[i] ?? 0);
  }
  return weightedSum / totalWeight;
}

/**
 * Compute the weighted standard deviation.
 */
function weightedStdDev(values: number[], weights: number[], mean: number): number {
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  if (totalWeight === 0) {
    const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
    return Math.sqrt(variance);
  }
  let weightedVariance = 0;
  for (let i = 0; i < values.length; i++) {
    weightedVariance += (weights[i] ?? 0) * ((values[i] ?? 0) - mean) ** 2;
  }
  return Math.sqrt(weightedVariance / totalWeight);
}

// ─── Core Aggregation ────────────────────────────────────────────────

/**
 * Internal: aggregate comparisons with per-comparison weights.
 */
function aggregateWithWeights(
  comparisons: PairwiseComparison[],
  getWeight: (comp: PairwiseComparison) => number,
): MatrixEntry[] {
  // Group by pair (normalize order so A < B)
  const pairMap = new Map<string, PairwiseComparison[]>();
  
  for (const comp of comparisons) {
    const [first, second] = comp.itemAId < comp.itemBId
      ? [comp.itemAId, comp.itemBId]
      : [comp.itemBId, comp.itemAId];
    
    const key = `${first}:${second}`;
    
    if (!pairMap.has(key)) {
      pairMap.set(key, []);
    }
    const pairComparisons = pairMap.get(key);
    if (pairComparisons) {
      pairComparisons.push(comp);
    }
  }
  
  const entries: MatrixEntry[] = [];
  
  for (const [key, comps] of pairMap) {
    const [itemAId, itemBId] = key.split(':') as [string, string];
    
    // Calculate ratios and weights
    const ratios: number[] = [];
    const weights: number[] = [];
    const allocations: number[] = [];
    
    for (const c of comps) {
      const allocA = c.itemAId === itemAId ? c.allocationA : 100 - c.allocationA;
      const allocB = 100 - allocA;
      
      // Avoid division by zero: treat extreme allocations with epsilon
      const safeA = Math.max(allocA, 0.5);
      const safeB = Math.max(allocB, 0.5);
      
      ratios.push(safeA / safeB);
      weights.push(getWeight(c));
      allocations.push(allocA);
    }
    
    // Weighted geometric mean of ratios
    const geometricMean = weightedGeometricMean(ratios, weights);
    
    // Weighted standard deviation of allocations
    const mean = weightedMean(allocations, weights);
    const stdDev = weightedStdDev(allocations, weights, mean);
    
    entries.push({
      itemAId,
      itemBId,
      ratio: geometricMean,
      count: comps.length,
      stdDev,
    });
  }
  
  return entries;
}

// ─── Public API ──────────────────────────────────────────────────────

/**
 * Aggregate comparisons weighted by participant consistency ratio (CR).
 * 
 * More consistent participants (lower CR) have more influence on the result.
 * Weight formula: w_i = 1 / (1 + CR_i)
 * 
 * @param comparisons - Raw pairwise comparisons
 * @param participantCRs - Map of participantId → consistency ratio
 * @returns Weighted comparison matrix entries
 */
export function calculateConfidenceWeightedMatrix(
  comparisons: PairwiseComparison[],
  participantCRs: Map<string, number>,
): MatrixEntry[] {
  return aggregateWithWeights(comparisons, (comp) => {
    const cr = participantCRs.get(comp.participantId);
    if (cr === undefined) return 1; // Default weight if CR unknown
    return confidenceWeight(cr);
  });
}

/**
 * Aggregate comparisons with time-decay weighting.
 * 
 * Recent comparisons count more than old ones.
 * Weight formula: w = exp(-λ × age_days)
 * 
 * @param comparisons - Raw pairwise comparisons
 * @param referenceDate - Reference date for age calculation (default: now)
 * @param decayLambda - Decay parameter λ (default: 0.01, half-life ~69 days)
 * @returns Time-weighted comparison matrix entries
 */
export function calculateTimeWeightedMatrix(
  comparisons: PairwiseComparison[],
  referenceDate?: Date,
  decayLambda?: number,
): MatrixEntry[] {
  const refDate = referenceDate ?? new Date();
  const lambda = decayLambda ?? DEFAULT_DECAY_LAMBDA;
  
  return aggregateWithWeights(comparisons, (comp) => {
    return timeDecayWeight(comp.timestamp, refDate, lambda);
  });
}

/**
 * Aggregate comparisons with combined confidence and time-decay weighting.
 * 
 * Combined weight: w = confidenceWeight(CR) × timeDecayWeight(age)
 *                    = (1/(1+CR)) × exp(-λ × age_days)
 * 
 * @param comparisons - Raw pairwise comparisons
 * @param options - Weighting configuration
 * @returns Weighted comparison matrix entries
 */
export function calculateWeightedMatrix(
  comparisons: PairwiseComparison[],
  options?: WeightedAggregationOptions,
): MatrixEntry[] {
  const {
    useConfidence = false,
    useTimeDecay = false,
    decayLambda = DEFAULT_DECAY_LAMBDA,
    referenceDate = new Date(),
    participantCRs = new Map<string, number>(),
  } = options ?? {};
  
  // If no weighting requested, fall back to equal weights (standard aggregation)
  if (!useConfidence && !useTimeDecay) {
    return aggregateWithWeights(comparisons, () => 1);
  }
  
  return aggregateWithWeights(comparisons, (comp) => {
    let weight = 1;
    
    if (useConfidence) {
      const cr = participantCRs.get(comp.participantId);
      if (cr !== undefined) {
        weight *= confidenceWeight(cr);
      }
      // If CR not found, confidence weight defaults to 1
    }
    
    if (useTimeDecay) {
      weight *= timeDecayWeight(comp.timestamp, referenceDate, decayLambda);
    }
    
    return weight;
  });
}

/**
 * Welfare Evidence Score (WES) Calculation
 *
 * Measures how strong the evidence is that a spending category's current
 * level contributes to general welfare. An F grade means "no demonstrated
 * welfare benefit" — putting the burden of proof on the program.
 *
 * @see https://obg.warondisease.org/#budget-impact-score-bis
 */

import type { AnalysisMethod } from '@optomitron/opg';
import { METHOD_WEIGHTS } from '@optomitron/opg';
import type { EvidenceGrade } from '@optomitron/opg';

export interface EffectEstimate {
  beta: number;           // Effect size
  standardError: number;  // Standard error
  method: AnalysisMethod; // Identification strategy
  year: number;           // Publication year
}

export interface WESCalculationResult {
  score: number;              // 0-1
  grade: EvidenceGrade;       // A-F
  qualityWeight: number;      // Aggregate quality weight
  precisionWeight: number;    // Aggregate precision weight
  recencyWeight: number;      // Aggregate recency weight
  estimateCount: number;
  /** How the WES was derived */
  methodology?: 'causal' | 'literature' | 'domestic' | 'estimated';
}

/** Decay rate for recency weighting (per year) */
const RECENCY_DECAY = 0.03;

/**
 * Calibration constant for WES normalization.
 *
 * With K=10, a single estimate with SE=0.08 produces wP~156, yielding
 * wQ*wP*wR/10 ~ 9.83 -> capped at 1.0 for nearly every category.
 * K=500 creates actual differentiation:
 *   - Single weak (cross_sectional, SE=0.20): ~0.006 (Grade F)
 *   - Single strong (RDD, SE=0.06): ~0.49 (Grade C)
 *   - Three strong estimates: ~1.46 -> capped 1.0 (Grade A)
 */
const WES_CALIBRATION_K = 500;

/**
 * Calculate quality weight for an estimate based on identification method
 */
export function qualityWeight(method: AnalysisMethod): number {
  return METHOD_WEIGHTS[method];
}

/**
 * Calculate precision weight (inverse variance)
 */
export function precisionWeight(standardError: number): number {
  // Clamp to prevent Infinity when SE is 0
  const clampedSE = Math.max(standardError, 0.001);
  return 1 / (clampedSE ** 2);
}

/**
 * Calculate recency weight with exponential decay
 */
export function recencyWeight(
  estimateYear: number,
  currentYear: number = new Date().getFullYear(),
  decayRate: number = RECENCY_DECAY
): number {
  return Math.exp(-decayRate * (currentYear - estimateYear));
}

/**
 * Calculate Welfare Evidence Score from effect estimates
 */
export function calculateWES(
  estimates: EffectEstimate[],
  currentYear: number = new Date().getFullYear()
): WESCalculationResult {
  if (estimates.length === 0) {
    return {
      score: 0,
      grade: 'F',
      qualityWeight: 0,
      precisionWeight: 0,
      recencyWeight: 0,
      estimateCount: 0,
    };
  }

  let totalWeightedScore = 0;
  let totalQualityWeight = 0;
  let totalPrecisionWeight = 0;
  let totalRecencyWeight = 0;

  for (const est of estimates) {
    const wQ = qualityWeight(est.method);
    const wP = precisionWeight(est.standardError);
    const wR = recencyWeight(est.year, currentYear);

    totalWeightedScore += wQ * wP * wR;
    totalQualityWeight += wQ;
    totalPrecisionWeight += wP;
    totalRecencyWeight += wR;
  }

  // Normalize to 0-1
  const score = Math.min(1, totalWeightedScore / WES_CALIBRATION_K);

  // Convert score to grade
  const grade = scoreToGrade(score);

  return {
    score,
    grade,
    qualityWeight: totalQualityWeight / estimates.length,
    precisionWeight: totalPrecisionWeight / estimates.length,
    recencyWeight: totalRecencyWeight / estimates.length,
    estimateCount: estimates.length,
  };
}

/**
 * Convert WES score to evidence grade
 */
export function scoreToGrade(score: number): EvidenceGrade {
  if (score >= 0.80) return 'A';
  if (score >= 0.60) return 'B';
  if (score >= 0.40) return 'C';
  if (score >= 0.20) return 'D';
  return 'F';
}

/**
 * Calculate priority score for reallocation.
 *
 * Direction-aware: for underspend, high WES increases priority (we know
 * it works, fund it). For overspend, low WES increases priority (no
 * evidence this helps, why are we spending this much?).
 */
export function calculatePriorityScore(
  gapUsd: number,
  wesScore: number
): number {
  if (gapUsd >= 0) {
    // Underspend: scale UP priority with evidence strength
    return gapUsd * wesScore;
  }
  // Overspend: low evidence INCREASES urgency to reduce
  return Math.abs(gapUsd) * (1 - wesScore * 0.5);
}

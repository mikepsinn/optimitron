/**
 * Budget Impact Score (BIS) Calculation
 * 
 * Measures confidence in OSL estimates based on the quality
 * and quantity of causal evidence.
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

export interface BISCalculationResult {
  score: number;              // 0-1
  grade: EvidenceGrade;       // A-F
  qualityWeight: number;      // Aggregate quality weight
  precisionWeight: number;    // Aggregate precision weight
  recencyWeight: number;      // Aggregate recency weight
  estimateCount: number;
}

/** Decay rate for recency weighting (per year) */
const RECENCY_DECAY = 0.03;

/** Calibration constant for BIS normalization */
const BIS_CALIBRATION_K = 10;

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
 * Calculate Budget Impact Score from effect estimates
 */
export function calculateBIS(
  estimates: EffectEstimate[],
  currentYear: number = new Date().getFullYear()
): BISCalculationResult {
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
  const score = Math.min(1, totalWeightedScore / BIS_CALIBRATION_K);
  
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
 * Convert BIS score to evidence grade
 */
export function scoreToGrade(score: number): EvidenceGrade {
  if (score >= 0.80) return 'A';
  if (score >= 0.60) return 'B';
  if (score >= 0.40) return 'C';
  if (score >= 0.20) return 'D';
  return 'F';
}

/**
 * Calculate priority score for reallocation
 * Priority = |Gap| × BIS
 */
export function calculatePriorityScore(
  gapUsd: number,
  bisScore: number
): number {
  return Math.abs(gapUsd) * bisScore;
}

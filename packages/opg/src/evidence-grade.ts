import { z } from 'zod';
import type { FullAnalysisResult } from '@optimitron/optimizer';
import type { CausalConfidenceScore } from './bradford-hill.js';

export const PolicyEvidenceGradeSchema = z.enum(['A', 'B', 'C', 'D', 'F']);
export type PolicyEvidenceGrade = z.infer<typeof PolicyEvidenceGradeSchema>;

const CONSISTENCY_SIGNAL_THRESHOLD = 0.6;
const NO_SIGNAL_THRESHOLD = 0.1;
const STRONG_CORRELATION_THRESHOLD = 0.6;
const MODERATE_CORRELATION_THRESHOLD = 0.4;
const SIGNIFICANCE_THRESHOLD = 0.05;

const CONSISTENCY_CRITERIA = [
  'consistency',
  'specificity',
  'temporality',
  'coherence',
  'plausibility',
] as const;

export interface EvidenceGradeBreakdown {
  predictivePearson: number;
  correlationStrength: number;
  pValue: number;
  significant: boolean;
  consistencyScore: number;
  consistencySignals: number;
  bradfordHill: Pick<
    FullAnalysisResult['bradfordHill'],
    typeof CONSISTENCY_CRITERIA[number]
  >;
}

export interface EvidenceGradeResult {
  grade: PolicyEvidenceGrade;
  score: number;
  breakdown: EvidenceGradeBreakdown;
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function computeConsistencyScore(
  bradfordHill: FullAnalysisResult['bradfordHill'],
): number {
  let total = 0;
  for (const key of CONSISTENCY_CRITERIA) {
    total += clamp01(bradfordHill[key]);
  }
  return total / CONSISTENCY_CRITERIA.length;
}

function countConsistencySignals(
  bradfordHill: FullAnalysisResult['bradfordHill'],
): number {
  let signals = 0;
  for (const key of CONSISTENCY_CRITERIA) {
    if (clamp01(bradfordHill[key]) >= CONSISTENCY_SIGNAL_THRESHOLD) {
      signals += 1;
    }
  }
  return signals;
}

function computeEvidenceGradeFromSignals(
  correlationStrength: number,
  significant: boolean,
  consistencySignals: number,
): PolicyEvidenceGrade {
  if (correlationStrength < NO_SIGNAL_THRESHOLD && consistencySignals === 0) {
    return 'F';
  }
  if (
    correlationStrength > STRONG_CORRELATION_THRESHOLD &&
    consistencySignals >= 3
  ) {
    return 'A';
  }
  if (
    correlationStrength > MODERATE_CORRELATION_THRESHOLD &&
    consistencySignals >= 2
  ) {
    return 'B';
  }
  if (correlationStrength > 0 && significant) {
    return 'C';
  }
  return 'D';
}

function buildBradfordHillBreakdown(
  bradfordHill: FullAnalysisResult['bradfordHill'],
): EvidenceGradeBreakdown['bradfordHill'] {
  return {
    consistency: bradfordHill.consistency,
    specificity: bradfordHill.specificity,
    temporality: bradfordHill.temporality,
    coherence: bradfordHill.coherence,
    plausibility: bradfordHill.plausibility,
  };
}

export function computeEvidenceGrade(
  analysisResult: FullAnalysisResult,
): EvidenceGradeResult {
  const predictivePearson = analysisResult.predictivePearson;
  const correlationStrength = Math.abs(predictivePearson);
  const pValue = analysisResult.pValue;
  const significant = Number.isFinite(pValue) && pValue < SIGNIFICANCE_THRESHOLD;
  const consistencySignals = countConsistencySignals(analysisResult.bradfordHill);
  const consistencyScore = computeConsistencyScore(analysisResult.bradfordHill);
  const score = 0.6 * clamp01(correlationStrength) + 0.4 * consistencyScore;
  const grade = computeEvidenceGradeFromSignals(
    correlationStrength,
    significant,
    consistencySignals,
  );

  return {
    grade,
    score,
    breakdown: {
      predictivePearson,
      correlationStrength,
      pValue,
      significant,
      consistencyScore,
      consistencySignals,
      bradfordHill: buildBradfordHillBreakdown(analysisResult.bradfordHill),
    },
  };
}

export function derivePolicyEvidenceGrade(
  causalConfidenceScore: CausalConfidenceScore,
  predictivePearson: number,
): PolicyEvidenceGrade {
  const weightedScore = 0.6 * causalConfidenceScore + 0.4 * Math.abs(predictivePearson);

  if (weightedScore >= 0.5) return 'A';
  if (weightedScore >= 0.3) return 'B';
  if (weightedScore >= 0.1) return 'C';
  if (weightedScore >= 0.05) return 'D';
  return 'F';
}

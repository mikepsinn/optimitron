import { describe, expect, it } from 'vitest';
import type { FullAnalysisResult } from '@optimitron/optimizer';
import { computeEvidenceGrade, derivePolicyEvidenceGrade } from '../evidence-grade.js';

const BASE_RESULT: FullAnalysisResult = {
  predictorName: 'Policy A',
  outcomeName: 'Outcome A',
  numberOfMeasurements: { predictor: 120, outcome: 118 },
  dateRange: { start: '2020-01-01', end: '2024-01-01' },
  onsetDelay: 1800,
  durationOfAction: 86_400,
  numberOfPairs: 120,
  forwardPearson: 0.4,
  reversePearson: 0.1,
  predictivePearson: 0.3,
  spearmanCorrelation: 0.35,
  pValue: 0.05,
  effectSize: {
    percentChange: 12,
    absoluteChange: 2,
    baselineMean: 10,
    followUpMean: 12,
    zScore: 1.2,
    baselineStd: 3,
    baselineN: 60,
    followUpN: 60,
  },
  baselineFollowup: {
    baselinePairs: [],
    followupPairs: [],
    outcomeBaselineAverage: 10,
    outcomeBaselineStandardDeviation: 3,
    outcomeBaselineRelativeStandardDeviation: 30,
    outcomeFollowUpAverage: 12,
    outcomeFollowUpPercentChangeFromBaseline: 20,
    predictorBaselineAverage: 5,
    predictorFollowUpAverage: 7,
    zScore: 1.2,
  },
  optimalValues: {
    valuePredictingHighOutcome: 7,
    valuePredictingLowOutcome: 4,
    averageOutcomeFollowingHighPredictor: 12,
    averageOutcomeFollowingLowPredictor: 10,
    averageDailyHighPredictor: 7,
    averageDailyLowPredictor: 4,
    groupedValueClosestToValuePredictingHighOutcome: 7,
    groupedValueClosestToValuePredictingLowOutcome: 4,
    predictsHighOutcomeChange: 0.2,
    predictsLowOutcomeChange: -0.1,
    optimalDailyValue: 7,
  },
  bradfordHill: {
    strength: 0.7,
    consistency: 0.6,
    temporality: 1,
    gradient: 0.5,
    experiment: 0.8,
    plausibility: 0.7,
    coherence: 0.6,
    analogy: 0.4,
    specificity: 0.5,
  },
  pis: {
    score: 0.6,
    forwardCorrelation: { pearson: 0.4, pValue: 0.05, n: 120 },
    reverseCorrelation: { pearson: 0.1, pValue: 0.3, n: 120 },
    effectSize: {
      percentChange: 12,
      absoluteChange: 2,
      baselineMean: 10,
      followUpMean: 12,
      zScore: 1.2,
      baselineStd: 3,
      baselineN: 60,
      followUpN: 60,
    },
    bradfordHill: {
      strength: 0.7,
      consistency: 0.6,
      temporality: 1,
      gradient: 0.5,
      experiment: 0.8,
      plausibility: 0.7,
      coherence: 0.6,
      analogy: 0.4,
      specificity: 0.5,
    },
    temporalityFactor: 0.8,
    evidenceGrade: 'B',
    recommendation: 'moderate_priority',
  },
  dataQuality: {
    hasPredicorVariance: true,
    hasOutcomeVariance: true,
    hasMinimumPairs: true,
    hasAdequateBaseline: true,
    hasAdequateFollowUp: true,
    predictorChanges: 20,
    outcomeChanges: 18,
    pairCount: 120,
    baselineFraction: 0.5,
    followUpFraction: 0.5,
    isValid: true,
    failureReasons: [],
    numberOfPairs: 120,
  },
};

const cloneResult = (): FullAnalysisResult => structuredClone(BASE_RESULT);

describe('derivePolicyEvidenceGrade', () => {
  it('returns grade A for strong causal confidence and prediction', () => {
    expect(derivePolicyEvidenceGrade(0.8, 0.6)).toBe('A');
  });

  it('returns grade B or C for moderate evidence', () => {
    const grade = derivePolicyEvidenceGrade(0.3, 0.2);
    expect(['B', 'C']).toContain(grade);
  });

  it('returns grade F for zero evidence', () => {
    expect(derivePolicyEvidenceGrade(0.0, 0.0)).toBe('F');
  });
});

describe('computeEvidenceGrade', () => {
  it('returns grade A for strong correlation with multiple consistency signals', () => {
    const result = cloneResult();
    result.predictivePearson = 0.7;
    result.pValue = 0.001;
    result.bradfordHill.consistency = 0.8;
    result.bradfordHill.temporality = 1;
    result.bradfordHill.coherence = 0.7;
    result.bradfordHill.plausibility = 0.6;
    const grade = computeEvidenceGrade(result);
    expect(grade.grade).toBe('A');
    expect(grade.breakdown.consistencySignals).toBeGreaterThanOrEqual(3);
  });

  it('returns grade B for moderate correlation with some consistency', () => {
    const result = cloneResult();
    result.predictivePearson = 0.5;
    result.pValue = 0.02;
    result.bradfordHill.consistency = 0.7;
    result.bradfordHill.temporality = 1;
    const grade = computeEvidenceGrade(result);
    expect(grade.grade).toBe('B');
  });

  it('returns grade C for weak but significant correlation', () => {
    const result = cloneResult();
    result.predictivePearson = 0.2;
    result.pValue = 0.01;
    result.bradfordHill.consistency = 0.2;
    result.bradfordHill.temporality = 0.2;
    const grade = computeEvidenceGrade(result);
    expect(grade.grade).toBe('C');
  });

  it('returns grade D for inconclusive evidence', () => {
    const result = cloneResult();
    result.predictivePearson = 0.2;
    result.pValue = 0.4;
    result.bradfordHill.consistency = 0.2;
    result.bradfordHill.temporality = 0.2;
    const grade = computeEvidenceGrade(result);
    expect(grade.grade).toBe('D');
  });

  it('returns grade F for no signal', () => {
    const result = cloneResult();
    result.predictivePearson = 0.05;
    result.pValue = 0.9;
    result.bradfordHill.consistency = 0;
    result.bradfordHill.specificity = 0;
    result.bradfordHill.temporality = 0;
    result.bradfordHill.coherence = 0;
    result.bradfordHill.plausibility = 0;
    const grade = computeEvidenceGrade(result);
    expect(grade.grade).toBe('F');
  });
});

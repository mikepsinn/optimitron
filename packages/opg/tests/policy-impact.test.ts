import { describe, expect, it } from 'vitest';
import type { FullAnalysisResult } from '@optimitron/optimizer';
import { computePolicyImpactScore } from '../src/policy-impact-score.js';

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

describe('computePolicyImpactScore', () => {
  it('combines Bradford Hill total, direction, and significance', () => {
    const score = computePolicyImpactScore(cloneResult());
    const expectedBradfordHillTotal =
      0.7 + 0.6 + 1 + 0.5 + 0.7 + 0.6 + 0.8 + 0.4;
    expect(score.bradfordHillTotal).toBeCloseTo(expectedBradfordHillTotal, 6);
    expect(score.effectDirection).toBe(1);
    expect(score.statisticalSignificance).toBeCloseTo(0.95, 6);
    expect(score.score).toBeCloseTo(
      expectedBradfordHillTotal * score.effectDirection * score.statisticalSignificance,
      6,
    );
  });

  it('treats missing gradient as zero in the Bradford Hill total', () => {
    const result = cloneResult();
    result.bradfordHill.gradient = null;
    const score = computePolicyImpactScore(result);
    const expectedBradfordHillTotal =
      0.7 + 0.6 + 1 + 0 + 0.7 + 0.6 + 0.8 + 0.4;
    expect(score.bradfordHillTotal).toBeCloseTo(expectedBradfordHillTotal, 6);
  });
});

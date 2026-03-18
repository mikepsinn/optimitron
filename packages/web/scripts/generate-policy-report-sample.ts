#!/usr/bin/env tsx
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

import type { FullAnalysisResult } from '../../optimizer/src/index.js';
import {
  calculateCCS,
  computeEvidenceGrade,
  computePolicyImpactScore,
  type BradfordHillScores,
  type Jurisdiction,
  type Policy,
  type PolicyRecommendation,
} from '../../opg/src/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outputPath = resolve(__dirname, '..', 'public', 'data', 'policy-report-sample.json');

const MAX_BRADFORD_HILL_TOTAL = 8;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

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

function toBradfordHill(scores: FullAnalysisResult['bradfordHill']): BradfordHillScores {
  return {
    strength: scores.strength,
    consistency: scores.consistency,
    temporality: scores.temporality,
    gradient: scores.gradient ?? 0,
    experiment: scores.experiment,
    plausibility: scores.plausibility,
    coherence: scores.coherence,
    analogy: scores.analogy,
    specificity: scores.specificity,
  };
}

function main() {
  const policy: Policy = {
    id: 'policy-a',
    name: 'Policy A',
    type: 'regulation',
    categoryId: 'environment',
    description: 'Illustrative regulation used for the sample report.',
    isContinuous: true,
    typicalOnsetDelayDays: 30,
    typicalDurationYears: 2,
  };

  const jurisdiction: Jurisdiction = {
    id: 'sample-country',
    name: 'Sample Federation',
    type: 'country',
    population: 48_000_000,
    gdpPerCapita: 58_000,
    dataQualityScore: 0.82,
  };

  const impactScore = computePolicyImpactScore(BASE_RESULT);
  const evidenceGrade = computeEvidenceGrade(BASE_RESULT);
  const bradfordHill = toBradfordHill(BASE_RESULT.bradfordHill);
  const causalConfidenceScore = calculateCCS(bradfordHill);
  const normalizedImpactScore = clamp(
    Math.abs(impactScore.score) / MAX_BRADFORD_HILL_TOTAL,
    0,
    1,
  );

  const recommendation: PolicyRecommendation = {
    jurisdictionId: jurisdiction.id,
    policyId: policy.id,
    recommendationType: impactScore.effectDirection >= 0 ? 'enact' : 'repeal',
    currentStatus: 'Pilot phase only',
    recommendedTarget: 'Scale nationally within two years',
    welfareEffect: {
      incomeEffect: 0.03,
      healthEffect: 0.2,
    },
    evidenceGrade: evidenceGrade.grade,
    policyImpactScore: normalizedImpactScore,
    priorityScore: clamp(normalizedImpactScore * (0.5 + causalConfidenceScore / 2), 0, 1),
    blockingFactors: ['implementation_capacity', 'budget_constraint'],
    rationale: 'Synthetic example using FullAnalysisResult from optimizer test fixtures.',
    similarJurisdictions: ['DEMO-1', 'DEMO-2'],
  };

  const output = {
    generatedAt: '2026-02-07T00:00:00.000Z',
    generatedBy: '@optimitron/opg',
    methodology:
      'Sample report derived from @optimitron/optimizer FullAnalysisResult and @optimitron/opg PolicyImpactScore logic.',
    jurisdiction,
    analysisDate: '2026-02-07',
    policies: [
      {
        policy,
        recommendation,
        bradfordHillScores: bradfordHill,
        causalConfidenceScore,
        policyImpactScore: impactScore,
        evidenceGrade,
        analysis: BASE_RESULT,
      },
    ],
  };

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`Sample policy report written to ${outputPath}`);
}

main();

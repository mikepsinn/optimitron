import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { FullAnalysisResult } from '@optimitron/optimizer';
import type { EvidenceGrade } from '../src/policy.js';
import type { PolicyImpactScore } from '../src/policy-impact-score.js';
import { computePolicyImpactScore } from '../src/policy-impact-score.js';
import { computeEvidenceGrade } from '../src/evidence-grade.js';

interface PolicyReportPolicy {
  id: string;
  name: string;
  predictorName: string;
  outcomeName: string;
  evidenceGrade: EvidenceGrade;
  policyImpactScore: PolicyImpactScore;
  summary: string;
}

interface PolicyReportSample {
  generatedAt: string;
  analysisDate: string;
  jurisdiction: string;
  policies: PolicyReportPolicy[];
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = path.resolve(
  __dirname,
  '../../web/public/data/policy-report-sample.json',
);

const baseAnalysis: FullAnalysisResult = {
  predictorName: 'Baseline Predictor',
  outcomeName: 'Baseline Outcome',
  numberOfMeasurements: { predictor: 120, outcome: 120 },
  dateRange: { start: '2024-01-01', end: '2024-12-31' },
  onsetDelay: 86_400,
  durationOfAction: 604_800,
  numberOfPairs: 90,
  forwardPearson: 0.35,
  reversePearson: 0.1,
  predictivePearson: 0.25,
  spearmanCorrelation: 0.32,
  pValue: 0.03,
  effectSize: {
    percentChange: 12,
    absoluteChange: 2.4,
    baselineMean: 20,
    followUpMean: 22.4,
    zScore: 0.8,
    baselineStd: 3.1,
    baselineN: 45,
    followUpN: 45,
  },
  baselineFollowup: {
    baselinePairs: [],
    followupPairs: [],
    outcomeBaselineAverage: 20,
    outcomeBaselineStandardDeviation: 3.1,
    outcomeBaselineRelativeStandardDeviation: 15.5,
    outcomeFollowUpAverage: 22.4,
    outcomeFollowUpPercentChangeFromBaseline: 12,
    predictorBaselineAverage: 48,
    predictorFollowUpAverage: 55,
    zScore: 0.8,
  },
  optimalValues: {
    valuePredictingHighOutcome: 60,
    valuePredictingLowOutcome: 40,
    averageOutcomeFollowingHighPredictor: 24,
    averageOutcomeFollowingLowPredictor: 19,
    averageDailyHighPredictor: 58,
    averageDailyLowPredictor: 42,
    groupedValueClosestToValuePredictingHighOutcome: 60,
    groupedValueClosestToValuePredictingLowOutcome: 40,
    predictsHighOutcomeChange: 0.18,
    predictsLowOutcomeChange: -0.06,
    optimalDailyValue: 60,
  },
  bradfordHill: {
    strength: 0.65,
    consistency: 0.6,
    temporality: 0.7,
    gradient: 0.55,
    experiment: 0.5,
    plausibility: 0.6,
    coherence: 0.62,
    analogy: 0.58,
    specificity: 0.45,
  },
  pis: {
    score: 0.42,
    forwardCorrelation: {
      pearson: 0.35,
      spearman: 0.32,
      pValue: 0.03,
      n: 90,
    },
    reverseCorrelation: {
      pearson: 0.1,
      spearman: 0.12,
      pValue: 0.2,
      n: 90,
    },
    effectSize: {
      percentChange: 12,
      absoluteChange: 2.4,
      baselineMean: 20,
      followUpMean: 22.4,
      zScore: 0.8,
      baselineStd: 3.1,
      baselineN: 45,
      followUpN: 45,
    },
    bradfordHill: {
      strength: 0.65,
      consistency: 0.6,
      temporality: 0.7,
      gradient: 0.55,
      experiment: 0.5,
      plausibility: 0.6,
      coherence: 0.62,
      analogy: 0.58,
      specificity: 0.45,
    },
    temporalityFactor: 0.78,
    optimalValue: {
      valuePredictingHighOutcome: 60,
      valuePredictingLowOutcome: 40,
      groupedValueHigh: 60,
      groupedValueLow: 40,
      highOutcomeN: 45,
      lowOutcomeN: 45,
    },
    interestingFactor: 0.9,
    tTestPValue: 0.04,
    evidenceGrade: 'B',
    recommendation: 'moderate_priority',
  },
  dataQuality: {
    hasPredicorVariance: true,
    hasOutcomeVariance: true,
    hasMinimumPairs: true,
    hasAdequateBaseline: true,
    hasAdequateFollowUp: true,
    predictorChanges: 48,
    outcomeChanges: 51,
    pairCount: 90,
    baselineFraction: 0.5,
    followUpFraction: 0.5,
    isValid: true,
    failureReasons: [],
    numberOfPairs: 90,
  },
};

const policyAnalyses: Array<{ id: string; name: string; summary: string; analysis: FullAnalysisResult }> = [
  {
    id: 'housing_voucher_expansion',
    name: 'Housing Voucher Expansion',
    summary: 'Increase voucher coverage to reduce rent burden and improve stability.',
    analysis: {
      ...baseAnalysis,
      predictorName: 'Voucher Coverage Rate',
      outcomeName: 'Housing Stability Index',
      forwardPearson: 0.48,
      predictivePearson: 0.42,
      pValue: 0.01,
      bradfordHill: {
        ...baseAnalysis.bradfordHill,
        strength: 0.72,
        consistency: 0.68,
        temporality: 0.74,
        gradient: 0.62,
        specificity: 0.52,
      },
    },
  },
  {
    id: 'grid_efficiency_grants',
    name: 'Grid Efficiency Grants',
    summary: 'Targeted efficiency upgrades to lower peak load and outage risk.',
    analysis: {
      ...baseAnalysis,
      predictorName: 'Efficiency Grant Coverage',
      outcomeName: 'Peak Load Reduction',
      forwardPearson: 0.22,
      predictivePearson: 0.18,
      pValue: 0.08,
      bradfordHill: {
        ...baseAnalysis.bradfordHill,
        strength: 0.42,
        consistency: 0.45,
        temporality: 0.52,
        gradient: 0.4,
        specificity: 0.38,
      },
    },
  },
];

const report: PolicyReportSample = {
  generatedAt: new Date().toISOString(),
  analysisDate: new Date().toISOString().slice(0, 10),
  jurisdiction: 'Sample Jurisdiction',
  policies: policyAnalyses.map(({ id, name, summary, analysis }) => {
    const impact = computePolicyImpactScore(analysis);
    const evidenceGrade: EvidenceGrade = computeEvidenceGrade(analysis).grade;

    return {
      id,
      name,
      predictorName: analysis.predictorName,
      outcomeName: analysis.outcomeName,
      evidenceGrade,
      policyImpactScore: impact,
      summary,
    };
  }),
};

fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(report, null, 2), 'utf-8');

console.log(`✅ Sample policy report written to ${OUTPUT_PATH}`);

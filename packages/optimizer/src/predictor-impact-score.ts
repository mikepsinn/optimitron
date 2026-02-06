/**
 * Predictor Impact Score (PIS) Module
 * 
 * Composite metric operationalizing Bradford Hill causality criteria
 * for automated signal detection from time series data.
 * 
 * @see https://dfda-spec.warondisease.org — dFDA Specification: "Predictor Impact Score" section
 * 
 * legacy API equivalent: QM Score (CorrelationQmScoreProperty)
 * Reference: https://github.com/mikepsinn/curedao-api/blob/main/app/Properties/Correlation/CorrelationQmScoreProperty.php
 * legacy API simplified QM Score = |coefficient| × statisticalSignificance × interestingFactor
 * legacy API legacy QM Score (Stats::qmScore): factors in skewness, kurtosis, predictive difference
 * Reference: https://github.com/mikepsinn/curedao-api/blob/main/app/Utils/Stats.php#L160
 * 
 * legacy API statistical significance uses product of 6 saturation factors:
 * https://github.com/mikepsinn/curedao-api/blob/main/app/Properties/Correlation/CorrelationStatisticalSignificanceProperty.php
 */

import type {
  AlignedPair,
  BradfordHillScores,
  CorrelationResult,
  EffectSize,
  OptimalValue,
  PredictorImpactScore,
  DataQuality,
} from './types.js';
import { mean, std, calculateCorrelation, calculateEffectSize, calculateTTestPValue } from './statistics.js';
import { calculateInterestingFactor } from './interesting-factor.js';
import type { InterestingFactorConfig } from './interesting-factor.js';

/**
 * Saturation constants for Bradford Hill scoring
 */
export const SATURATION_CONSTANTS = {
  /** Number of subjects for consistency saturation */
  N_SIG: 10,
  /** Number of pairs for sample saturation */
  N_PAIRS_SIG: 100,
  /** Percent change for effect saturation */
  DELTA_SIG: 10,
  /** Z-score reference for significance */
  Z_REF: 2,
};

/**
 * Saturation function: approaches 1 asymptotically
 * φ(x) = 1 - e^(-x / x_sig)
 */
export function saturation(value: number, sigConstant: number): number {
  return 1 - Math.exp(-value / sigConstant);
}

/**
 * Calculate strength score from correlation
 * S_strength = 1 - e^(-|r| / r_sig)
 * 
 * Legacy API uses |r| directly multiplied by significance rather than saturation,
 * but the saturation constants in statisticalSignificance are similar: 1 - exp(-x/30)
 * Reference: https://github.com/mikepsinn/curedao-api/blob/main/app/Properties/Correlation/CorrelationStatisticalSignificanceProperty.php#L40
 */
export function scoreStrength(correlation: number, sigConstant: number = 0.3): number {
  return 1 - Math.exp(-Math.abs(correlation) / sigConstant);
}

/**
 * Calculate consistency score (saturation on subject count)
 */
export function scoreConsistency(subjectCount: number): number {
  return saturation(subjectCount, SATURATION_CONSTANTS.N_SIG);
}

/**
 * Calculate temporality factor
 * φ_temporal = |r_forward| / (|r_forward| + |r_reverse|)
 * 
 * legacy API equivalent: predictivePearsonCorrelationCoefficient = forward - reverse
 * Reference: https://github.com/mikepsinn/curedao-api/blob/main/app/Properties/Correlation/CorrelationPredictivePearsonCorrelationCoefficientProperty.php
 * Legacy API uses subtraction; Optomitron uses ratio. Both penalize reverse causation.
 */
export function scoreTemporality(
  forwardCorrelation: number,
  reverseCorrelation: number
): number {
  const absForward = Math.abs(forwardCorrelation);
  const absReverse = Math.abs(reverseCorrelation);
  
  if (absForward + absReverse === 0) return 0.5;
  return absForward / (absForward + absReverse);
}

/**
 * Calculate biological gradient (dose-response) score
 */
export function scoreGradient(pairs: AlignedPair[]): number {
  if (pairs.length < 10) return 0;
  
  const predictorValues = pairs.map(p => p.predictorValue);
  const outcomeValues = pairs.map(p => p.outcomeValue);
  
  const meanPredictor = mean(predictorValues);
  const meanOutcome = mean(outcomeValues);
  const stdPredictor = std(predictorValues, 1);
  
  if (stdPredictor === 0) return 0;
  
  // Calculate predictor values that predict high vs low outcomes
  const highOutcomePairs = pairs.filter(p => p.outcomeValue > meanOutcome);
  const lowOutcomePairs = pairs.filter(p => p.outcomeValue <= meanOutcome);
  
  if (highOutcomePairs.length === 0 || lowOutcomePairs.length === 0) return 0;
  
  const meanPredictorHigh = mean(highOutcomePairs.map(p => p.predictorValue));
  const meanPredictorLow = mean(lowOutcomePairs.map(p => p.predictorValue));
  
  // Standardized difference
  const gradient = Math.abs(
    (meanPredictorHigh - meanPredictor) / stdPredictor -
    (meanPredictorLow - meanPredictor) / stdPredictor
  );
  
  // Normalize to 0-1 using saturation
  return Math.min(1, gradient / 2);
}

/**
 * Calculate z-score factor for effect magnitude
 * φ_z = |z| / (|z| + z_ref)
 */
export function scoreZFactor(zScore: number): number {
  return Math.abs(zScore) / (Math.abs(zScore) + SATURATION_CONSTANTS.Z_REF);
}

/**
 * Calculate optimal predictor values
 * 
 * Reference: https://github.com/mikepsinn/curedao-api/blob/main/app/Properties/Correlation/CorrelationValuePredictingHighOutcomeProperty.php
 * Reference: https://github.com/mikepsinn/curedao-api/blob/main/app/Properties/Correlation/CorrelationValuePredictingLowOutcomeProperty.php
 * legacy API splits pairs into high/low effect groups using mean as cutoff,
 * then averages cause values within each group.
 * 
 * TODO: Port from legacy API — grouped cause value rounding for actionable display
 * legacy API rounds optimal values to practical amounts (e.g., nearest 50mg).
 * See CorrelationGroupedCauseValueClosestToValuePredictingHighOutcomeProperty.php
 */
export function calculateOptimalValues(pairs: AlignedPair[]): OptimalValue {
  const outcomeValues = pairs.map(p => p.outcomeValue);
  const meanOutcome = mean(outcomeValues);
  
  const highOutcomePairs = pairs.filter(p => p.outcomeValue > meanOutcome);
  const lowOutcomePairs = pairs.filter(p => p.outcomeValue <= meanOutcome);
  
  const valuePredictingHighOutcome = highOutcomePairs.length > 0
    ? mean(highOutcomePairs.map(p => p.predictorValue))
    : NaN;
  
  const valuePredictingLowOutcome = lowOutcomePairs.length > 0
    ? mean(lowOutcomePairs.map(p => p.predictorValue))
    : NaN;
  
  // Calculate confidence interval for high outcome value
  let confidenceInterval: [number, number] | undefined;
  if (highOutcomePairs.length > 2) {
    const highPredictorValues = highOutcomePairs.map(p => p.predictorValue);
    const stdHigh = std(highPredictorValues, 1);
    const seHigh = stdHigh / Math.sqrt(highOutcomePairs.length);
    confidenceInterval = [
      valuePredictingHighOutcome - 1.96 * seHigh,
      valuePredictingHighOutcome + 1.96 * seHigh,
    ];
  }
  
  return {
    valuePredictingHighOutcome,
    valuePredictingLowOutcome,
    highOutcomeN: highOutcomePairs.length,
    lowOutcomeN: lowOutcomePairs.length,
    confidenceInterval,
  };
}

/**
 * Validate data quality for analysis
 * 
 * Reference: https://github.com/mikepsinn/curedao-api/blob/main/app/Correlations/QMUserCorrelation.php#L2657
 * legacy API validates: minimum unique values (≥2), minimum changes,
 * chronological ordering, minimum pairs, variance in both cause and effect.
 */
export function validateDataQuality(pairs: AlignedPair[]): DataQuality {
  const failureReasons: string[] = [];
  
  const predictorValues = pairs.map(p => p.predictorValue);
  const outcomeValues = pairs.map(p => p.outcomeValue);
  
  // Count value changes
  let predictorChanges = 0;
  let outcomeChanges = 0;
  for (let i = 1; i < pairs.length; i++) {
    if (predictorValues[i] !== predictorValues[i - 1]) predictorChanges++;
    if (outcomeValues[i] !== outcomeValues[i - 1]) outcomeChanges++;
  }
  
  // Check minimum thresholds
  const hasPredicorVariance = predictorChanges >= 5;
  if (!hasPredicorVariance) failureReasons.push('Insufficient predictor variance (<5 changes)');
  
  const hasOutcomeVariance = outcomeChanges >= 5;
  if (!hasOutcomeVariance) failureReasons.push('Insufficient outcome variance (<5 changes)');
  
  const hasMinimumPairs = pairs.length >= 30;
  if (!hasMinimumPairs) failureReasons.push('Insufficient pairs (<30)');
  
  // Check baseline/follow-up fractions
  const meanPredictor = mean(predictorValues);
  const baselineCount = predictorValues.filter(v => v < meanPredictor).length;
  const followUpCount = predictorValues.filter(v => v >= meanPredictor).length;
  
  const baselineFraction = baselineCount / pairs.length;
  const followUpFraction = followUpCount / pairs.length;
  
  const hasAdequateBaseline = baselineFraction >= 0.1;
  if (!hasAdequateBaseline) failureReasons.push('Inadequate baseline fraction (<10%)');
  
  const hasAdequateFollowUp = followUpFraction >= 0.1;
  if (!hasAdequateFollowUp) failureReasons.push('Inadequate follow-up fraction (<10%)');
  
  const isValid = failureReasons.length === 0;
  
  return {
    hasPredicorVariance,
    hasOutcomeVariance,
    hasMinimumPairs,
    hasAdequateBaseline,
    hasAdequateFollowUp,
    predictorChanges,
    outcomeChanges,
    pairCount: pairs.length,
    baselineFraction,
    followUpFraction,
    isValid,
    failureReasons,
  };
}

/**
 * Determine evidence grade from PIS score
 */
export function getEvidenceGrade(pis: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (pis >= 0.5) return 'A';
  if (pis >= 0.3) return 'B';
  if (pis >= 0.1) return 'C';
  if (pis >= 0.05) return 'D';
  return 'F';
}

/**
 * Determine recommended action based on PIS
 */
export function getRecommendation(
  pis: number
): PredictorImpactScore['recommendation'] {
  if (pis >= 0.5) return 'high_priority_trial';
  if (pis >= 0.3) return 'moderate_priority';
  if (pis >= 0.1) return 'monitor';
  return 'insufficient_evidence';
}

/**
 * Calculate complete Predictor Impact Score
 * 
 * legacy API equivalent: analyzePartially() + analyzeFully() pipeline
 * Reference: https://github.com/mikepsinn/curedao-api/blob/main/app/Correlations/QMUserCorrelation.php#L610
 * legacy API pipeline: setPairs → Pearson/Spearman → baseline stats → optimal values →
 *   effect predictions → optimalPearsonProduct → statisticalSignificance → QmScore →
 *   reversePearson → correlationsOverDelays/Durations
 * 
 * TODO: Port from legacy API — auto-generate reverse pairs from the same data
 * TODO: Port from legacy API — vote-weighted significance (upVotes+4)/(upVotes+downVotes+4)
 */
export function calculatePredictorImpactScore(
  forwardPairs: AlignedPair[],
  reversePairs?: AlignedPair[],
  options?: {
    subjectCount?: number;
    plausibilityScore?: number;
    coherenceScore?: number;
    analogyScore?: number;
    specificityScore?: number;
    /** Interesting factor configuration — penalizes tautological/non-actionable pairs */
    interestingFactorConfig?: InterestingFactorConfig;
  }
): PredictorImpactScore {
  const {
    subjectCount = 1,
    plausibilityScore = 0.5, // Default to neutral if unknown
    coherenceScore = 0.5,
    analogyScore = 0.5,
    specificityScore = 0.5,
    interestingFactorConfig,
  } = options ?? {};
  
  // Calculate forward correlation
  const forwardCorrelation = calculateCorrelation(forwardPairs);
  
  // Calculate reverse correlation if provided
  let reverseCorrelation: CorrelationResult | undefined;
  let temporalityFactor = 1.0;
  
  if (reversePairs && reversePairs.length >= 30) {
    reverseCorrelation = calculateCorrelation(reversePairs);
    temporalityFactor = scoreTemporality(
      forwardCorrelation.pearson,
      reverseCorrelation.pearson
    );
  }
  
  // Calculate effect size
  const effectSize = calculateEffectSize(forwardPairs);
  
  // Calculate optimal values
  const optimalValue = calculateOptimalValues(forwardPairs);
  
  // Calculate Bradford Hill scores
  const bradfordHill: BradfordHillScores = {
    strength: scoreStrength(forwardCorrelation.pearson),
    consistency: scoreConsistency(subjectCount),
    temporality: temporalityFactor,
    gradient: scoreGradient(forwardPairs),
    experiment: 0.5, // Default for observational data
    plausibility: plausibilityScore,
    coherence: coherenceScore,
    analogy: analogyScore,
    specificity: specificityScore,
  };
  
  // Calculate composite PIS
  const r = Math.abs(forwardCorrelation.pearson);
  const S = 1 - forwardCorrelation.pValue;
  const φZ = scoreZFactor(effectSize.zScore);
  
  // User-level PIS formula
  const pis = r * S * φZ * temporalityFactor;
  
  // Aggregate modifiers (if multiple subjects)
  const φUsers = saturation(subjectCount, SATURATION_CONSTANTS.N_SIG);
  const φPairs = saturation(forwardPairs.length, SATURATION_CONSTANTS.N_PAIRS_SIG);
  let aggregatePIS = pis * φUsers * φPairs;

  // Interesting factor: penalize non-actionable / tautological relationships
  let interestingFactor: number | undefined;
  if (interestingFactorConfig) {
    interestingFactor = calculateInterestingFactor(interestingFactorConfig);
    aggregatePIS *= interestingFactor;
  }

  // Independent t-test p-value for outcome group comparison
  const tTestPValue = calculateTTestPValue(forwardPairs);

  return {
    score: aggregatePIS,
    forwardCorrelation,
    reverseCorrelation,
    effectSize,
    bradfordHill,
    temporalityFactor,
    optimalValue,
    interestingFactor,
    tTestPValue,
    evidenceGrade: getEvidenceGrade(aggregatePIS),
    recommendation: getRecommendation(aggregatePIS),
  };
}

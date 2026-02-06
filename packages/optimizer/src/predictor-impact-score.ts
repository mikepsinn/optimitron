/**
 * Predictor Impact Score (PIS) Module
 * 
 * Composite metric operationalizing Bradford Hill causality criteria
 * for automated signal detection from time series data.
 * 
 * @see dFDA Spec: "Predictor Impact Score" section
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
import { mean, std, calculateCorrelation, calculateEffectSize } from './statistics.js';

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
  }
): PredictorImpactScore {
  const {
    subjectCount = 1,
    plausibilityScore = 0.5, // Default to neutral if unknown
    coherenceScore = 0.5,
    analogyScore = 0.5,
    specificityScore = 0.5,
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
  const aggregatePIS = pis * φUsers * φPairs;
  
  return {
    score: aggregatePIS,
    forwardCorrelation,
    reverseCorrelation,
    effectSize,
    bradfordHill,
    temporalityFactor,
    optimalValue,
    evidenceGrade: getEvidenceGrade(aggregatePIS),
    recommendation: getRecommendation(aggregatePIS),
  };
}

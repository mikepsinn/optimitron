/**
 * Change-from-Baseline Analysis & Optimal Daily Value Calculations
 *
 * Splits aligned pairs into baseline (predictor < mean) and follow-up
 * (predictor >= mean) groups, then calculates outcome statistics for
 * each group. Also determines optimal predictor values by splitting
 * on outcome mean.
 *
 * @see https://dfda-spec.warondisease.org — dFDA Specification
 *
 * Legacy API references:
 * - generateBaselineAndFollowupPairs(): QMUserCorrelation.php ~line 2886
 * - calculateOutcomeBaselineStatistics(): QMUserCorrelation.php ~line 2811
 * - calculateAverageCauseForPairSubset(): QMUserCorrelation.php ~line 2434
 * - getHighEffectCutoffMinimumValue(): QMUserCorrelation.php ~line 2513
 * - CorrelationEffectBaselineAverageProperty.php
 * - CorrelationEffectFollowUpAverageProperty.php
 * - CorrelationEffectFollowUpPercentChangeFromBaselineProperty.php
 * - CorrelationValuePredictingHighOutcomeProperty.php
 * - CorrelationValuePredictingLowOutcomeProperty.php
 * - CorrelationAverageDailyHighCauseProperty.php
 * - CorrelationAverageDailyLowCauseProperty.php
 * - CorrelationAverageEffectFollowingHighCauseProperty.php
 * - CorrelationAverageEffectFollowingLowCauseProperty.php
 * - CorrelationGroupedCauseValueClosestToValuePredictingHighOutcomeProperty.php
 * - CorrelationPredictsHighEffectChangeProperty.php
 * - CorrelationPredictsLowEffectChangeProperty.php
 */

import type { AlignedPair } from './types.js';
import { mean, std } from './statistics.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Result of splitting pairs by predictor mean and computing
 * outcome statistics in each group.
 *
 * Baseline = pairs where predictor < mean predictor value
 * Follow-up = pairs where predictor >= mean predictor value
 */
export interface BaselineFollowupAnalysis {
  /** Pairs where predictor value < predictor mean (low-dose / no-treatment) */
  baselinePairs: AlignedPair[];
  /** Pairs where predictor value >= predictor mean (treatment dose) */
  followupPairs: AlignedPair[];

  // -- Outcome stats in each group --
  /** Mean outcome in the baseline group */
  effectBaselineAverage: number;
  /** Sample standard deviation of outcome in the baseline group */
  effectBaselineStandardDeviation: number;
  /**
   * Relative standard deviation of baseline outcomes (coefficient of variation × 100).
   * RSD = (stddev / mean) × 100.  Returns 0 when baseline mean is 0.
   */
  effectBaselineRelativeStandardDeviation: number;
  /** Mean outcome in the follow-up group */
  effectFollowUpAverage: number;
  /**
   * Percent change from baseline.
   * When baseline mean is 0 we fall back to the absolute difference
   * (followUp − baseline) instead of dividing by zero.
   * Legacy: CorrelationEffectFollowUpPercentChangeFromBaselineProperty
   */
  effectFollowUpPercentChangeFromBaseline: number;

  // -- Predictor stats --
  /** Average predictor in the baseline group (low dose) */
  predictorBaselineAverage: number;
  /** Average predictor in the follow-up group (treatment dose) */
  predictorFollowUpAverage: number;

  /**
   * Z-score = |effectFollowUpPercentChangeFromBaseline| / effectBaselineRelativeStandardDeviation.
   * Returns 0 when RSD is 0 or not meaningful.
   * Legacy: CorrelationZScoreProperty
   */
  zScore: number;
}

/**
 * Optimal predictor values derived by splitting on outcome mean.
 *
 * "High outcome" pairs: outcome > mean outcome
 * "Low outcome"  pairs: outcome <= mean outcome
 */
export interface OptimalValueAnalysis {
  /** Average predictor when outcome > mean outcome */
  valuePredictingHighOutcome: number;
  /** Average predictor when outcome <= mean outcome */
  valuePredictingLowOutcome: number;

  /** Average outcome following high-predictor days (predictor >= predictor mean) */
  averageEffectFollowingHighPredictor: number;
  /** Average outcome following low-predictor days (predictor < predictor mean) */
  averageEffectFollowingLowPredictor: number;

  /** Average predictor value on high-predictor days */
  averageDailyHighPredictor: number;
  /** Average predictor value on low-predictor days */
  averageDailyLowPredictor: number;

  /**
   * Rounded / grouped value closest to valuePredictingHighOutcome.
   * Legacy: CorrelationGroupedCauseValueClosestToValuePredictingHighOutcomeProperty
   */
  groupedValueClosestToValuePredictingHighOutcome: number;
  /**
   * Rounded / grouped value closest to valuePredictingLowOutcome.
   */
  groupedValueClosestToValuePredictingLowOutcome: number;

  /**
   * Predicted effect change (percent of spread) when predictor is at
   * valuePredictingHighOutcome.
   * Legacy: CorrelationPredictsHighEffectChangeProperty
   */
  predictsHighEffectChange: number;
  /**
   * Predicted effect change (percent of spread) when predictor is at
   * valuePredictingLowOutcome.
   * Legacy: CorrelationPredictsLowEffectChangeProperty
   */
  predictsLowEffectChange: number;

  /**
   * The main recommendation: optimal daily predictor value.
   * Currently set to valuePredictingHighOutcome (the average predictor
   * value on days with above-average outcomes).
   */
  optimalDailyValue: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Round a value to a "practical" amount.
 *
 * The goal is actionable recommendations that humans can follow:
 * "Take about 500 mg" is more useful than "Take 487.3 mg".
 *
 * Ranges (absolute value):
 *   0                → 0
 *   (0, 0.1]         → nearest 0.01
 *   (0.1, 1]         → nearest 0.1
 *   (1, 10]          → nearest 0.5
 *   (10, 100]        → nearest 5
 *   (100, 1000]      → nearest 50
 *   (1000, 10000]    → nearest 500
 *   > 10000          → nearest 1000
 *
 * Legacy: CorrelationGroupedCauseValueClosestToValuePredictingHighOutcomeProperty
 */
export function groupToPracticalValue(value: number): number {
  if (value === 0 || !isFinite(value)) return 0;

  const sign = Math.sign(value);
  const abs = Math.abs(value);

  let step: number;
  if (abs <= 0.1) {
    step = 0.01;
  } else if (abs <= 1) {
    step = 0.1;
  } else if (abs <= 10) {
    step = 0.5;
  } else if (abs <= 100) {
    step = 5;
  } else if (abs <= 1000) {
    step = 50;
  } else if (abs <= 10000) {
    step = 500;
  } else {
    step = 1000;
  }

  return sign * Math.round(abs / step) * step;
}

// ---------------------------------------------------------------------------
// Core functions
// ---------------------------------------------------------------------------

/**
 * Split pairs by predictor mean and calculate outcome statistics
 * for baseline (predictor < mean) and follow-up (predictor >= mean) groups.
 *
 * Legacy API equivalent: generateBaselineAndFollowupPairs() +
 * calculateOutcomeBaselineStatistics()
 *
 * @param pairs - Temporally aligned predictor-outcome pairs
 * @returns Full baseline / follow-up analysis
 * @throws Error when fewer than 2 pairs are supplied
 */
export function calculateBaselineFollowup(
  pairs: AlignedPair[],
): BaselineFollowupAnalysis {
  if (pairs.length < 2) {
    throw new Error(
      `Insufficient data: need at least 2 pairs, got ${pairs.length}`,
    );
  }

  const predictorValues = pairs.map((p) => p.predictorValue);
  const predictorMean = mean(predictorValues);

  // Split — legacy API uses strict < for baseline (see generateBaselineAndFollowupPairs)
  const baselinePairs = pairs.filter((p) => p.predictorValue < predictorMean);
  const followupPairs = pairs.filter((p) => p.predictorValue >= predictorMean);

  // Outcome arrays
  const baselineOutcomes = baselinePairs.map((p) => p.outcomeValue);
  const followupOutcomes = followupPairs.map((p) => p.outcomeValue);

  // Outcome stats — use 0 / NaN for degenerate groups
  const effectBaselineAverage =
    baselineOutcomes.length > 0 ? mean(baselineOutcomes) : 0;
  const effectBaselineStandardDeviation =
    baselineOutcomes.length > 1 ? std(baselineOutcomes, 1) : 0;
  const effectBaselineRelativeStandardDeviation =
    effectBaselineAverage !== 0
      ? (effectBaselineStandardDeviation / Math.abs(effectBaselineAverage)) * 100
      : 0;
  const effectFollowUpAverage =
    followupOutcomes.length > 0 ? mean(followupOutcomes) : 0;

  // Percent change — legacy: if baseline == 0, fall back to absolute difference
  let effectFollowUpPercentChangeFromBaseline: number;
  if (effectBaselineAverage === 0) {
    effectFollowUpPercentChangeFromBaseline =
      effectFollowUpAverage - effectBaselineAverage;
  } else {
    effectFollowUpPercentChangeFromBaseline =
      ((effectFollowUpAverage - effectBaselineAverage) /
        effectBaselineAverage) *
      100;
  }
  // Round to 1 decimal like legacy
  effectFollowUpPercentChangeFromBaseline = Math.round(effectFollowUpPercentChangeFromBaseline * 10) / 10;

  // Predictor stats
  const predictorBaselineAverage =
    baselinePairs.length > 0
      ? mean(baselinePairs.map((p) => p.predictorValue))
      : 0;
  const predictorFollowUpAverage =
    followupPairs.length > 0
      ? mean(followupPairs.map((p) => p.predictorValue))
      : 0;

  // Z-score
  const zScore =
    effectBaselineRelativeStandardDeviation !== 0
      ? Math.abs(effectFollowUpPercentChangeFromBaseline) /
        effectBaselineRelativeStandardDeviation
      : 0;

  return {
    baselinePairs,
    followupPairs,
    effectBaselineAverage,
    effectBaselineStandardDeviation,
    effectBaselineRelativeStandardDeviation,
    effectFollowUpAverage,
    effectFollowUpPercentChangeFromBaseline,
    predictorBaselineAverage,
    predictorFollowUpAverage,
    zScore,
  };
}

/**
 * Calculate optimal predictor values by splitting pairs on outcome mean.
 *
 * For each pair the outcome is compared to the overall outcome mean.
 * Pairs with outcome > mean form the "high effect" group; others the "low
 * effect" group. The average predictor in each group tells us what
 * predictor value is associated with high vs low outcomes.
 *
 * Also computes:
 * - averageDailyHighPredictor / averageDailyLowPredictor  (predictor split)
 * - averageEffectFollowingHighPredictor / Low             (outcome split by predictor)
 * - predictsHighEffectChange / Low                        (% of spread)
 * - groupedValueClosestToValuePredictingHigh / Low        (rounded)
 * - optimalDailyValue                                     (main recommendation)
 *
 * Legacy API references:
 * - CorrelationValuePredictingHighOutcomeProperty::calculate()
 * - CorrelationValuePredictingLowOutcomeProperty::calculate()
 * - CorrelationAverageDailyHighCauseProperty::calculate()
 * - CorrelationAverageDailyLowCauseProperty::calculate()
 * - CorrelationAverageEffectFollowingHighCauseProperty::calculate()
 * - CorrelationAverageEffectFollowingLowCauseProperty::calculate()
 * - CorrelationPredictsHighEffectChangeProperty::calculate()
 * - CorrelationPredictsLowEffectChangeProperty::calculate()
 *
 * @param pairs - Temporally aligned predictor-outcome pairs
 * @returns Full optimal value analysis
 * @throws Error when fewer than 2 pairs
 */
export function calculateOptimalValues(
  pairs: AlignedPair[],
): OptimalValueAnalysis {
  if (pairs.length < 2) {
    throw new Error(
      `Insufficient data: need at least 2 pairs, got ${pairs.length}`,
    );
  }

  const outcomeValues = pairs.map((p) => p.outcomeValue);
  const predictorValues = pairs.map((p) => p.predictorValue);
  const outcomeMean = mean(outcomeValues);
  const predictorMean = mean(predictorValues);
  const overallEffectAverage = outcomeMean;

  // --- Split by outcome mean (high-effect vs low-effect) ---
  // Legacy: getHighEffectCutoffMinimumValue() returns averageEffect
  const highEffectPairs = pairs.filter((p) => p.outcomeValue > outcomeMean);
  const lowEffectPairs = pairs.filter((p) => p.outcomeValue <= outcomeMean);

  const valuePredictingHighOutcome =
    highEffectPairs.length > 0
      ? mean(highEffectPairs.map((p) => p.predictorValue))
      : mean(predictorValues);
  const valuePredictingLowOutcome =
    lowEffectPairs.length > 0
      ? mean(lowEffectPairs.map((p) => p.predictorValue))
      : mean(predictorValues);

  // --- Split by predictor mean (high-predictor vs low-predictor) ---
  const highPredictorPairs = pairs.filter(
    (p) => p.predictorValue >= predictorMean,
  );
  const lowPredictorPairs = pairs.filter(
    (p) => p.predictorValue < predictorMean,
  );

  const averageEffectFollowingHighPredictor =
    highPredictorPairs.length > 0
      ? mean(highPredictorPairs.map((p) => p.outcomeValue))
      : outcomeMean;
  const averageEffectFollowingLowPredictor =
    lowPredictorPairs.length > 0
      ? mean(lowPredictorPairs.map((p) => p.outcomeValue))
      : outcomeMean;

  const averageDailyHighPredictor =
    highPredictorPairs.length > 0
      ? mean(highPredictorPairs.map((p) => p.predictorValue))
      : predictorMean;
  const averageDailyLowPredictor =
    lowPredictorPairs.length > 0
      ? mean(lowPredictorPairs.map((p) => p.predictorValue))
      : predictorMean;

  // --- Grouped / rounded values ---
  const groupedValueClosestToValuePredictingHighOutcome =
    groupToPracticalValue(valuePredictingHighOutcome);
  const groupedValueClosestToValuePredictingLowOutcome =
    groupToPracticalValue(valuePredictingLowOutcome);

  // --- Predicted effect changes ---
  // Legacy: predictsHighEffectChange = 100 * (avgEffectWhenExpectedHigh - avgEffect) / spread
  // "spread" = max outcome - min outcome (from legacy getSpread())
  const outcomeMin = Math.min(...outcomeValues);
  const outcomeMax = Math.max(...outcomeValues);
  const spread = outcomeMax - outcomeMin;

  // "Effect values expected to be higher" = high-effect group outcomes
  const avgHighEffectOutcome =
    highEffectPairs.length > 0
      ? mean(highEffectPairs.map((p) => p.outcomeValue))
      : overallEffectAverage;
  const avgLowEffectOutcome =
    lowEffectPairs.length > 0
      ? mean(lowEffectPairs.map((p) => p.outcomeValue))
      : overallEffectAverage;

  let predictsHighEffectChange: number;
  let predictsLowEffectChange: number;
  if (spread !== 0) {
    predictsHighEffectChange =
      Math.round(
        ((avgHighEffectOutcome - overallEffectAverage) / spread) * 100 * 100,
      ) / 100;
    predictsLowEffectChange =
      Math.round(
        ((avgLowEffectOutcome - overallEffectAverage) / spread) * 100 * 100,
      ) / 100;
  } else {
    predictsHighEffectChange = 0;
    predictsLowEffectChange = 0;
  }

  // Optimal daily value = the predictor value associated with high outcomes
  const optimalDailyValue = valuePredictingHighOutcome;

  return {
    valuePredictingHighOutcome,
    valuePredictingLowOutcome,
    averageEffectFollowingHighPredictor,
    averageEffectFollowingLowPredictor,
    averageDailyHighPredictor,
    averageDailyLowPredictor,
    groupedValueClosestToValuePredictingHighOutcome,
    groupedValueClosestToValuePredictingLowOutcome,
    predictsHighEffectChange,
    predictsLowEffectChange,
    optimalDailyValue,
  };
}

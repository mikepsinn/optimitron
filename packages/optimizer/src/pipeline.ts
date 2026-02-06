/**
 * End-to-End Analysis Pipeline
 *
 * Single function that runs the entire analysis:
 * temporal alignment → correlation → reverse Pearson → baseline/followup →
 * optimal values → Bradford Hill → PIS → data quality.
 *
 * @see https://dfda-spec.warondisease.org — dFDA Specification
 *
 * Legacy API equivalent: QMUserCorrelation::analyzePartially() + analyzeFully()
 * Reference: https://github.com/mikepsinn/curedao-api/blob/main/app/Correlations/QMUserCorrelation.php#L610
 */

import type {
  TimeSeries,
  PredictorConfig,
  AlignedPair,
  EffectSize,
  BradfordHillScores,
  PredictorImpactScore,
  DataQuality,
} from './types.js';
import type {
  BaselineFollowupAnalysis,
  OptimalValueAnalysis,
} from './change-from-baseline.js';
import {
  alignTimeSeries,
  toUnixMs,
} from './temporal-alignment.js';
import {
  pearsonCorrelation,
  spearmanCorrelation,
  calculateCorrelation,
  calculateReversePearson,
  calculatePredictivePearson,
} from './statistics.js';
import {
  calculatePredictorImpactScore,
  validateDataQuality,
} from './predictor-impact-score.js';
import {
  calculateBaselineFollowup,
  calculateOptimalValues,
} from './change-from-baseline.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Optional configuration for the full analysis pipeline.
 */
export interface AnalysisConfig {
  /** Onset delay in seconds (default: 1800 = 30 min) */
  onsetDelaySeconds?: number;
  /** Duration of action in seconds (default: 86400 = 24 hr) */
  durationOfActionSeconds?: number;
  /** Filling type for missing predictor values */
  fillingType?: 'zero' | 'value' | 'none' | 'interpolation';
  /** Filling value when fillingType is 'value' */
  fillingValue?: number;
  /** Number of subjects (for Bradford Hill consistency) */
  subjectCount?: number;
  /** Plausibility score (0–1, default 0.5) */
  plausibilityScore?: number;
  /** Coherence score (0–1, default 0.5) */
  coherenceScore?: number;
  /** Analogy score (0–1, default 0.5) */
  analogyScore?: number;
  /** Specificity score (0–1, default 0.5) */
  specificityScore?: number;
}

/**
 * Result of data quality validation, extended with pair count for the report.
 */
export interface DataQualityResult extends DataQuality {
  /** Total number of aligned pairs (alias for pairCount) */
  numberOfPairs: number;
}

/**
 * Complete result of the full analysis pipeline.
 *
 * Combines input summary, alignment, correlation, effect,
 * scoring, and data quality into a single object.
 */
export interface FullAnalysisResult {
  // -- Input summary --
  /** Name of the predictor variable */
  predictorName: string;
  /** Name of the outcome variable */
  outcomeName: string;
  /** Number of raw measurements for each variable */
  numberOfMeasurements: { predictor: number; outcome: number };
  /** Date range of the analysis */
  dateRange: { start: string; end: string };

  // -- Alignment --
  /** Onset delay used (seconds) */
  onsetDelay: number;
  /** Duration of action used (seconds) */
  durationOfAction: number;
  /** Number of aligned pairs */
  numberOfPairs: number;

  // -- Correlation --
  /** Forward Pearson r (predictor → outcome) */
  forwardPearson: number;
  /** Reverse Pearson r (outcome → predictor) */
  reversePearson: number;
  /** Predictive Pearson = forward − reverse */
  predictivePearson: number;
  /** Spearman rank correlation */
  spearmanCorrelation: number;
  /** p-value for the forward Pearson correlation */
  pValue: number;

  // -- Effect --
  /** Effect size metrics (baseline vs follow-up) */
  effectSize: EffectSize;
  /** Baseline / follow-up analysis */
  baselineFollowup: BaselineFollowupAnalysis;
  /** Optimal value analysis */
  optimalValues: OptimalValueAnalysis;

  // -- Scoring --
  /** Bradford Hill causality criteria scores */
  bradfordHill: BradfordHillScores;
  /** Full Predictor Impact Score result */
  pis: PredictorImpactScore;

  // -- Data quality --
  /** Data quality validation result */
  dataQuality: DataQualityResult;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Determine the overall date range from predictor and outcome measurements.
 */
function computeDateRange(
  predictor: TimeSeries,
  outcome: TimeSeries,
): { start: string; end: string } {
  const allTimestamps: number[] = [];
  for (const m of predictor.measurements) {
    allTimestamps.push(toUnixMs(m.timestamp));
  }
  for (const m of outcome.measurements) {
    allTimestamps.push(toUnixMs(m.timestamp));
  }
  if (allTimestamps.length === 0) {
    return { start: 'N/A', end: 'N/A' };
  }
  const minMs = Math.min(...allTimestamps);
  const maxMs = Math.max(...allTimestamps);
  return {
    start: new Date(minMs).toISOString().slice(0, 10),
    end: new Date(maxMs).toISOString().slice(0, 10),
  };
}

// ---------------------------------------------------------------------------
// Main pipeline
// ---------------------------------------------------------------------------

/**
 * Run the full analysis pipeline on a predictor and outcome time series.
 *
 * Executes the complete sequence:
 * 1. Temporal alignment (creates paired observations)
 * 2. Data quality validation
 * 3. Forward Pearson & Spearman correlation
 * 4. Reverse Pearson & predictive Pearson
 * 5. Baseline / follow-up analysis (change-from-baseline)
 * 6. Optimal value analysis
 * 7. Bradford Hill criteria scoring
 * 8. Predictor Impact Score (PIS)
 *
 * @param predictor - Predictor time series (e.g., Vitamin D intake)
 * @param outcome   - Outcome time series (e.g., mood rating)
 * @param config    - Optional analysis configuration
 * @returns Complete analysis result
 * @throws Error if fewer than 2 aligned pairs are produced
 */
export function runFullAnalysis(
  predictor: TimeSeries,
  outcome: TimeSeries,
  config?: AnalysisConfig,
): FullAnalysisResult {
  const onsetDelay = config?.onsetDelaySeconds ?? 1800;
  const durationOfAction = config?.durationOfActionSeconds ?? 86400;
  const fillingType = config?.fillingType ?? 'zero';
  const fillingValue = config?.fillingValue;

  // 1. Temporal alignment
  const predictorConfig: PredictorConfig = {
    onsetDelaySeconds: onsetDelay,
    durationOfActionSeconds: durationOfAction,
    fillingType,
    fillingValue,
  };

  const pairs: AlignedPair[] = alignTimeSeries(predictor, outcome, predictorConfig);

  if (pairs.length < 2) {
    throw new Error(
      `Insufficient aligned pairs: got ${pairs.length}, need at least 2. ` +
      `Check that predictor and outcome measurements overlap temporally.`,
    );
  }

  // 2. Data quality
  const dq = validateDataQuality(pairs);
  const dataQuality: DataQualityResult = {
    ...dq,
    numberOfPairs: dq.pairCount,
  };

  // 3. Forward correlation
  const forwardCorrelation = calculateCorrelation(pairs);
  const forwardPearson = forwardCorrelation.pearson;
  const spearman = forwardCorrelation.spearman ?? spearmanCorrelation(
    pairs.map(p => p.predictorValue),
    pairs.map(p => p.outcomeValue),
  );
  const pValue = forwardCorrelation.pValue;

  // 4. Reverse Pearson & predictive Pearson
  const reversePearsonR = calculateReversePearson(pairs);
  const predictivePearsonR = calculatePredictivePearson(forwardPearson, reversePearsonR);

  // 5. Baseline / follow-up
  const baselineFollowup = calculateBaselineFollowup(pairs);

  // 6. Optimal values
  const optimalValues = calculateOptimalValues(pairs);

  // 7–8. PIS (includes Bradford Hill & effect size)
  const pis = calculatePredictorImpactScore(pairs, undefined, {
    subjectCount: config?.subjectCount,
    plausibilityScore: config?.plausibilityScore,
    coherenceScore: config?.coherenceScore,
    analogyScore: config?.analogyScore,
    specificityScore: config?.specificityScore,
  });

  // Date range
  const dateRange = computeDateRange(predictor, outcome);

  return {
    // Input summary
    predictorName: predictor.name,
    outcomeName: outcome.name,
    numberOfMeasurements: {
      predictor: predictor.measurements.length,
      outcome: outcome.measurements.length,
    },
    dateRange,

    // Alignment
    onsetDelay,
    durationOfAction,
    numberOfPairs: pairs.length,

    // Correlation
    forwardPearson,
    reversePearson: reversePearsonR,
    predictivePearson: predictivePearsonR,
    spearmanCorrelation: spearman,
    pValue,

    // Effect
    effectSize: pis.effectSize,
    baselineFollowup,
    optimalValues,

    // Scoring
    bradfordHill: pis.bradfordHill,
    pis,

    // Data quality
    dataQuality,
  };
}

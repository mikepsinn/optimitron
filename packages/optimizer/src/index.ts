/**
 * @optomitron/optimizer
 * 
 * Time series causal inference engine - the agnostic core.
 * 
 * This library provides domain-agnostic algorithms for:
 * - Temporal alignment of predictor/outcome time series
 * - Bradford Hill criteria scoring
 * - Predictor Impact Score calculation
 * - Effect size estimation
 * - Optimal value analysis
 * 
 * Used by:
 * - dFDA: predictor=drug/supplement, outcome=symptom/biomarker
 * - OPG: predictor=policy, outcome=welfare metrics
 * - OBG: predictor=spending, outcome=welfare metrics
 * 
 * legacy API equivalent: QMUserCorrelation analysis pipeline
 * Reference: https://github.com/mikepsinn/curedao-api/blob/main/app/Correlations/QMUserCorrelation.php
 * Reference: https://github.com/mikepsinn/curedao-api/blob/main/app/Correlations/QMCorrelation.php
 * Reference: https://github.com/mikepsinn/curedao-api/blob/main/app/Correlations/QMAggregateCorrelation.php
 * See CUREDAO_GAPS.md in repo root for full cross-reference audit.
 * 
 * @example
 * ```typescript
 * import {
 *   alignTimeSeries,
 *   calculatePredictorImpactScore,
 *   validateDataQuality,
 * } from '@optomitron/optimizer';
 * 
 * // Align time series with onset delay and duration
 * const pairs = alignTimeSeries(predictor, outcome, {
 *   onsetDelaySeconds: 1800,      // 30 min
 *   durationOfActionSeconds: 86400, // 24 hr
 *   fillingType: 'zero',
 * });
 * 
 * // Validate data quality
 * const quality = validateDataQuality(pairs);
 * if (!quality.isValid) {
 *   console.warn('Data quality issues:', quality.failureReasons);
 * }
 * 
 * // Calculate Predictor Impact Score
 * const pis = calculatePredictorImpactScore(pairs);
 * console.log(`PIS: ${pis.score.toFixed(3)} (${pis.evidenceGrade})`);
 * console.log(`Effect: ${pis.effectSize.percentChange.toFixed(1)}%`);
 * console.log(`Recommendation: ${pis.recommendation}`);
 * ```
 */

// Types
export * from './types.js';

// Temporal alignment
export {
  alignTimeSeries,
  alignOutcomeBased,
  alignPredictorBased,
  optimizeTemporalParameters,
  toUnixMs,
  getMeasurementsInWindow,
  meanValue,
} from './temporal-alignment.js';

// Statistics
export {
  mean,
  std,
  pearsonCorrelation,
  spearmanCorrelation,
  calculateCorrelation,
  calculateEffectSize,
  calculateTTestPValue,
  correlationTStatistic,
  tToPValue,
  calculateReversePearson,
  calculatePredictivePearson,
  partialCorrelation,
  aggregateCorrelations,
} from './statistics.js';

// Predictor Impact Score
export {
  calculatePredictorImpactScore,
  calculateOptimalValues,
  validateDataQuality,
  scoreStrength,
  scoreConsistency,
  scoreTemporality,
  scoreGradient,
  scoreZFactor,
  saturation,
  getEvidenceGrade,
  getRecommendation,
  SATURATION_CONSTANTS,
} from './predictor-impact-score.js';

// Interesting factor & trivial filtering
export {
  calculateInterestingFactor,
  isTrivial,
  editDistance,
  TRIVIAL_FACTOR_THRESHOLD,
} from './interesting-factor.js';
export type { InterestingFactorConfig } from './interesting-factor.js';

// Change-from-baseline analysis & optimal daily values
export {
  calculateBaselineFollowup,
  calculateOptimalValues as calculateOptimalDailyValues,
  groupToPracticalValue,
} from './change-from-baseline.js';
export type {
  BaselineFollowupAnalysis,
  OptimalValueAnalysis,
} from './change-from-baseline.js';

// Pipeline (end-to-end analysis)
export {
  runFullAnalysis,
} from './pipeline.js';
export type {
  AnalysisConfig,
  DataQualityResult,
  FullAnalysisResult,
} from './pipeline.js';

// Report generator
export {
  generateMarkdownReport,
} from './report.js';

// Hypothesis-driven tests
export {
  runHypothesisTestCase,
  resolveHypothesisData,
  evaluateHypothesis,
  isEvidenceGradeAtLeast,
} from './hypothesis-test.js';
export type {
  EvidenceGrade,
  HypothesisDirection,
  HypothesisExpected,
  HypothesisActual,
  HypothesisDataSource,
  HypothesisTestCase,
  HypothesisTestResult,
} from './hypothesis-test.js';

// Version
export const VERSION = '0.1.0';

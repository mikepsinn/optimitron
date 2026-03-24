/**
 * @optimitron/optimizer
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
 * } from '@optimitron/optimizer';
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
export * from './pair-study.js';
export * from './variable-relationship-runner.js';
export * from './outcome-mega-study-ranking.js';

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
  aggregateNOf1VariableRelationships,
} from './statistics.js';

// Adaptive binning
export {
  buildAdaptiveNumericBins,
} from './adaptive-binning.js';
export type {
  NumericBin,
  AdaptiveBinningOptions,
} from './adaptive-binning.js';

// Response curve diagnostics (diminishing returns + MED)
export {
  estimateDiminishingReturns,
  estimateMinimumEffectiveDose,
  estimateSaturationRange,
  deriveSupportConstrainedTargets,
  assessSparseOutcomeSupport,
} from './response-curve.js';
export type {
  ResponseCurveBin,
  ResponseCurveRange,
  DiminishingReturnsOptions,
  DiminishingReturnsEstimate,
  MinimumEffectiveDoseOptions,
  MinimumEffectiveDoseEstimate,
  MinimumEffectiveDoseObjective,
  SaturationRangeOptions,
  SaturationRangeEstimate,
  ResponseCurveObjective,
  SupportConstrainedTargetOptions,
  SupportConstrainedTargetsEstimate,
  SparseOutcomeDiagnostics,
} from './response-curve.js';

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

// Shared report formatting utilities (used by opg and obg)
export {
  describeGrade,
  fmt,
  reportTimestamp,
} from './report-utils.js';

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


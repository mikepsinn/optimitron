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
  correlationTStatistic,
  tToPValue,
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

// Version
export const VERSION = '0.1.0';

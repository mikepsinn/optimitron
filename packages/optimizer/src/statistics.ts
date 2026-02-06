/**
 * Statistical Analysis Module
 * 
 * Core statistical functions for correlation, effect size,
 * and significance testing.
 * 
 * @see https://dfda-spec.warondisease.org — dFDA Specification (sections on correlation, effect size, significance)
 * @see https://github.com/mikepsinn/curedao-api/blob/main/app/Utils/Stats.php
 * @see https://github.com/mikepsinn/curedao-api/blob/main/app/Properties/Correlation/CorrelationForwardPearsonCorrelationCoefficientProperty.php
 */

import type { AlignedPair, CorrelationResult, EffectSize, UserCorrelationSummary, AggregateCorrelation } from './types.js';

/**
 * Calculate mean of an array
 */
export function mean(values: number[]): number {
  if (values.length === 0) return NaN;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Calculate standard deviation
 */
export function std(values: number[], ddof: number = 0): number {
  if (values.length <= ddof) return NaN;
  const m = mean(values);
  const squaredDiffs = values.map(v => (v - m) ** 2);
  return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / (values.length - ddof));
}

/**
 * Calculate Pearson correlation coefficient
 * Reference: https://github.com/mikepsinn/curedao-api/blob/main/app/Utils/Stats.php#L352
 * Legacy API uses covariance/(stddevX × stddevY); equivalent formula here.
 */
export function pearsonCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length < 2) return NaN;
  
  const n = x.length;
  const meanX = mean(x);
  const meanY = mean(y);
  
  let numerator = 0;
  let denomX = 0;
  let denomY = 0;
  
  for (let i = 0; i < n; i++) {
    const dx = x[i]! - meanX;
    const dy = y[i]! - meanY;
    numerator += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  }
  
  const denominator = Math.sqrt(denomX) * Math.sqrt(denomY);
  if (denominator === 0) return 0;
  
  return numerator / denominator;
}

/**
 * Calculate Spearman rank correlation
 * Reference: https://github.com/mikepsinn/curedao-api/blob/main/app/Properties/Correlation/CorrelationForwardSpearmanCorrelationCoefficientProperty.php
 */
export function spearmanCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length < 2) return NaN;
  
  // Convert to ranks
  const rankX = toRanks(x);
  const rankY = toRanks(y);
  
  return pearsonCorrelation(rankX, rankY);
}

/**
 * Convert values to ranks (handles ties with average rank)
 */
function toRanks(values: number[]): number[] {
  const indexed = values.map((v, i) => ({ value: v, index: i }));
  indexed.sort((a, b) => a.value - b.value);
  
  const ranks = new Array(values.length);
  let i = 0;
  
  while (i < indexed.length) {
    // Find all tied values
    let j = i;
    while (j < indexed.length && indexed[j]!.value === indexed[i]!.value) {
      j++;
    }
    
    // Assign average rank to all tied values
    const avgRank = (i + j + 1) / 2; // +1 because ranks are 1-indexed
    for (let k = i; k < j; k++) {
      ranks[indexed[k]!.index] = avgRank;
    }
    
    i = j;
  }
  
  return ranks;
}

/**
 * Calculate t-statistic for correlation significance
 */
export function correlationTStatistic(r: number, n: number): number {
  if (n <= 2 || Math.abs(r) === 1) return Infinity * Math.sign(r);
  return (r * Math.sqrt(n - 2)) / Math.sqrt(1 - r * r);
}

/**
 * Approximate p-value from t-statistic using normal approximation
 * (Good for n > 30)
 */
export function tToPValue(t: number, df: number): number {
  // Use normal approximation for large df
  if (df > 30) {
    const z = Math.abs(t);
    // Two-tailed p-value using standard normal CDF approximation
    const p = 2 * (1 - normalCDF(z));
    return Math.max(0, Math.min(1, p));
  }
  
  // For smaller df, use a more accurate approximation
  const x = df / (df + t * t);
  const p = incompleteBeta(df / 2, 0.5, x);
  return Math.max(0, Math.min(1, p));
}

/**
 * Standard normal CDF approximation
 */
function normalCDF(z: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  
  const sign = z < 0 ? -1 : 1;
  z = Math.abs(z) / Math.sqrt(2);
  
  const t = 1.0 / (1.0 + p * z);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-z * z);
  
  return 0.5 * (1 + sign * y);
}

/**
 * Incomplete beta function approximation
 */
function incompleteBeta(a: number, b: number, x: number): number {
  // Simple approximation using continued fraction
  if (x === 0) return 0;
  if (x === 1) return 1;
  
  // Use power series for small x
  let sum = 0;
  let term = 1;
  for (let n = 0; n < 100; n++) {
    term *= (n === 0 ? 1 : (a + n - 1) * x / n);
    const contrib = term / (a + n);
    sum += contrib;
    if (Math.abs(contrib) < 1e-10) break;
  }
  
  return Math.pow(x, a) * sum / beta(a, b);
}

/**
 * Beta function
 */
function beta(a: number, b: number): number {
  return gamma(a) * gamma(b) / gamma(a + b);
}

/**
 * Gamma function approximation (Stirling)
 */
function gamma(z: number): number {
  if (z < 0.5) {
    return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z));
  }
  z -= 1;
  const g = 7;
  const c = [
    0.99999999999980993,
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.13857109526572012,
    9.9843695780195716e-6,
    1.5056327351493116e-7,
  ];
  
  let x = c[0]!;
  for (let i = 1; i < g + 2; i++) {
    x += c[i]! / (z + i);
  }
  
  const t = z + g + 0.5;
  return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
}

/**
 * Calculate correlation with full statistics
 * Reference: https://github.com/mikepsinn/curedao-api/blob/main/app/Correlations/QMUserCorrelation.php#L610
 * Legacy API's analyzePartially() calls ForwardPearsonCorrelationCoefficientProperty::calculate(),
 * ForwardSpearmanCorrelationCoefficientProperty::calculate(), then sets confidence intervals.
 */
export function calculateCorrelation(pairs: AlignedPair[]): CorrelationResult {
  const x = pairs.map(p => p.predictorValue);
  const y = pairs.map(p => p.outcomeValue);
  
  const r = pearsonCorrelation(x, y);
  const n = pairs.length;
  const t = correlationTStatistic(r, n);
  const pValue = tToPValue(t, n - 2);
  
  // Standard error of correlation
  const se = Math.sqrt((1 - r * r) / (n - 2));
  
  // 95% CI using Fisher z-transformation
  const zr = 0.5 * Math.log((1 + r) / (1 - r));
  const seZ = 1 / Math.sqrt(n - 3);
  const zLow = zr - 1.96 * seZ;
  const zHigh = zr + 1.96 * seZ;
  const ciLow = (Math.exp(2 * zLow) - 1) / (Math.exp(2 * zLow) + 1);
  const ciHigh = (Math.exp(2 * zHigh) - 1) / (Math.exp(2 * zHigh) + 1);
  
  return {
    pearson: r,
    spearman: spearmanCorrelation(x, y),
    pValue,
    n,
    standardError: se,
    confidenceInterval: [ciLow, ciHigh],
  };
}

/**
 * Calculate effect size (baseline vs follow-up comparison)
 * Reference: https://github.com/mikepsinn/curedao-api/blob/main/app/Correlations/QMUserCorrelation.php#L2811
 * Legacy API's calculateOutcomeBaselineStatistics() and generateBaselineAndFollowupPairs() split pairs
 * by mean cause value and compare outcome means. Also computes z-score as |percentChange|/RSD.
 * legacy API z-score: https://github.com/mikepsinn/curedao-api/blob/main/app/Properties/Correlation/CorrelationZScoreProperty.php
 *
 * TODO: Port from legacy API — separate t-test p-value for high vs low predictor outcome groups
 * Legacy API calculates a dedicated p-value using t-test between the two outcome groups, with
 * confidence interval and critical t-value. See QMUserCorrelation.php#L2373
 */
export function calculateEffectSize(pairs: AlignedPair[]): EffectSize {
  const predictorValues = pairs.map(p => p.predictorValue);
  const meanPredictor = mean(predictorValues);
  
  // Partition into baseline (below mean) and follow-up (above mean)
  const baseline = pairs.filter(p => p.predictorValue < meanPredictor);
  const followUp = pairs.filter(p => p.predictorValue >= meanPredictor);
  
  const baselineOutcomes = baseline.map(p => p.outcomeValue);
  const followUpOutcomes = followUp.map(p => p.outcomeValue);
  
  const baselineMean = mean(baselineOutcomes);
  const followUpMean = mean(followUpOutcomes);
  const baselineStd = std(baselineOutcomes, 1);
  
  const absoluteChange = followUpMean - baselineMean;
  const percentChange = baselineMean !== 0
    ? (absoluteChange / baselineMean) * 100
    : absoluteChange * 100; // Fallback for zero baseline
  
  // Z-score: effect magnitude relative to baseline variability
  const rsd = baselineStd / baselineMean * 100; // Relative standard deviation
  const zScore = rsd !== 0 ? Math.abs(percentChange) / rsd : 0;
  
  return {
    percentChange,
    absoluteChange,
    baselineMean,
    followUpMean,
    zScore,
    baselineStd,
    baselineN: baseline.length,
    followUpN: followUp.length,
  };
}

/**
 * Calculate reverse Pearson correlation by swapping predictor/outcome roles.
 *
 * The legacy API computes this by creating a new QMUserCorrelation with
 * effect variable as cause and cause variable as effect, then calling
 * ForwardPearsonCorrelationCoefficientProperty::calculate() on the swapped pair.
 *
 * If |reverseR| > |forwardR|, the assumed causality direction may be wrong
 * (the outcome might actually be driving the predictor).
 *
 * @see https://github.com/mikepsinn/curedao-api/blob/main/app/Properties/Correlation/CorrelationReversePearsonCorrelationCoefficientProperty.php
 */
export function calculateReversePearson(pairs: AlignedPair[]): number {
  if (pairs.length < 2) return NaN;

  // Swap roles: outcome becomes predictor, predictor becomes outcome
  const x = pairs.map(p => p.outcomeValue);
  const y = pairs.map(p => p.predictorValue);

  return pearsonCorrelation(x, y);
}

/**
 * Calculate predictive Pearson correlation coefficient.
 *
 * predictivePearson = forwardPearson - reversePearson
 *
 * Interpretation:
 *   > 0  → forward direction (predictor → outcome) is stronger — correct direction
 *   = 0  → no clear directionality
 *   < 0  → reverse direction is stronger — outcome may actually drive predictor (suspicious)
 *
 * @see https://github.com/mikepsinn/curedao-api/blob/main/app/Properties/Correlation/CorrelationPredictivePearsonCorrelationCoefficientProperty.php
 */
export function calculatePredictivePearson(forwardR: number, reverseR: number): number {
  return forwardR - reverseR;
}

/**
 * Aggregate user-level correlations into a population-level summary.
 *
 * Follows the legacy API approach: weight each user's metrics by their
 * statistical significance, normalized by the average significance across users.
 *
 * weight_i = statisticalSignificance_i / mean(statisticalSignificance)
 * aggregateMetric = mean(metric_i × weight_i)
 *
 * This means users with higher statistical significance (more data, stronger signal)
 * contribute more to the population estimate.
 *
 * @see https://github.com/mikepsinn/curedao-api/blob/main/app/Traits/HasMany/HasManyCorrelations.php#L57
 * @see https://github.com/mikepsinn/curedao-api/blob/main/app/Correlations/QMAggregateCorrelation.php
 */
export function aggregateCorrelations(userCorrelations: UserCorrelationSummary[]): AggregateCorrelation {
  // Edge case: no users
  if (userCorrelations.length === 0) {
    return {
      numberOfUsers: 0,
      aggregateForwardPearson: 0,
      aggregateReversePearson: 0,
      aggregatePredictivePearson: 0,
      aggregateEffectSize: 0,
      aggregateStatisticalSignificance: 0,
      aggregateValuePredictingHighOutcome: null,
      aggregateValuePredictingLowOutcome: null,
      aggregateOptimalDailyValue: null,
      aggregateEffectFollowUpPercentChangeFromBaseline: null,
      weightedAveragePIS: 0,
      totalPairs: 0,
    };
  }

  const n = userCorrelations.length;

  // Calculate average statistical significance for normalization
  const avgSignificance = userCorrelations.reduce((sum, u) => sum + u.statisticalSignificance, 0) / n;

  /**
   * Weighted average following the legacy PHP pattern:
   *   weight_i = significance_i / avgSignificance  (or 1 if avgSignificance is 0)
   *   result = mean(value_i × weight_i)
   *
   * When all significances are equal, weights are 1 and this reduces to simple mean.
   * When avgSignificance is 0, fall back to simple mean (all weights = 1).
   */
  function weightedAvg(values: number[]): number {
    if (values.length === 0) return 0;
    let sum = 0;
    let count = 0;
    for (let i = 0; i < values.length; i++) {
      const val = values[i]!;
      const sig = userCorrelations[i]!.statisticalSignificance;
      const weight = avgSignificance > 0 ? sig / avgSignificance : 1;
      sum += val * weight;
      count++;
    }
    return count > 0 ? sum / count : 0;
  }

  /**
   * Weighted average for optional numeric fields.
   * Only includes users that have a defined value for the field.
   * Returns null if no users have the field defined.
   */
  function weightedAvgOptional(extractor: (u: UserCorrelationSummary) => number | undefined): number | null {
    const validEntries: { value: number; significance: number }[] = [];
    for (const u of userCorrelations) {
      const val = extractor(u);
      if (val !== undefined && val !== null) {
        validEntries.push({ value: val, significance: u.statisticalSignificance });
      }
    }
    if (validEntries.length === 0) return null;

    const localAvgSig = validEntries.reduce((s, e) => s + e.significance, 0) / validEntries.length;
    let sum = 0;
    for (const entry of validEntries) {
      const weight = localAvgSig > 0 ? entry.significance / localAvgSig : 1;
      sum += entry.value * weight;
    }
    return sum / validEntries.length;
  }

  const totalPairs = userCorrelations.reduce((sum, u) => sum + u.numberOfPairs, 0);

  return {
    numberOfUsers: n,
    aggregateForwardPearson: weightedAvg(userCorrelations.map(u => u.forwardPearson)),
    aggregateReversePearson: weightedAvg(userCorrelations.map(u => u.reversePearson)),
    aggregatePredictivePearson: weightedAvg(userCorrelations.map(u => u.predictivePearson)),
    aggregateEffectSize: weightedAvg(userCorrelations.map(u => u.effectSize)),
    aggregateStatisticalSignificance: weightedAvg(userCorrelations.map(u => u.statisticalSignificance)),
    aggregateValuePredictingHighOutcome: weightedAvgOptional(u => u.valuePredictingHighOutcome),
    aggregateValuePredictingLowOutcome: weightedAvgOptional(u => u.valuePredictingLowOutcome),
    aggregateOptimalDailyValue: weightedAvgOptional(u => u.optimalDailyValue),
    aggregateEffectFollowUpPercentChangeFromBaseline: weightedAvgOptional(u => u.effectFollowUpPercentChangeFromBaseline),
    weightedAveragePIS: weightedAvg(userCorrelations.map(u => {
      // PIS approximation: |forwardPearson| × statisticalSignificance
      // This mirrors the legacy qm_score weighting
      return Math.abs(u.forwardPearson) * u.statisticalSignificance;
    })),
    totalPairs,
  };
}

/**
 * Statistical Analysis Module
 * 
 * Core statistical functions for correlation, effect size,
 * and significance testing.
 */

import type { AlignedPair, CorrelationResult, EffectSize } from './types.js';

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

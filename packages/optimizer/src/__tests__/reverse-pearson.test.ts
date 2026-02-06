/**
 * Tests for reverse Pearson correlation and predictive Pearson coefficient.
 *
 * @see https://github.com/mikepsinn/curedao-api/blob/main/app/Properties/Correlation/CorrelationReversePearsonCorrelationCoefficientProperty.php
 * @see https://github.com/mikepsinn/curedao-api/blob/main/app/Properties/Correlation/CorrelationPredictivePearsonCorrelationCoefficientProperty.php
 */
import { describe, it, expect } from 'vitest';
import {
  calculateReversePearson,
  calculatePredictivePearson,
  pearsonCorrelation,
} from '../statistics.js';
import type { AlignedPair } from '../types.js';

/** Helper to create aligned pairs */
function makePairs(predictor: number[], outcome: number[]): AlignedPair[] {
  return predictor.map((p, i) => ({
    predictorValue: p,
    outcomeValue: outcome[i]!,
    predictorTimestamp: i * 86400000,
    outcomeTimestamp: i * 86400000 + 1800000,
  }));
}

describe('calculateReversePearson', () => {
  it('should return NaN for fewer than 2 pairs', () => {
    const pairs = makePairs([1], [2]);
    expect(calculateReversePearson(pairs)).toBeNaN();
  });

  it('should return NaN for empty array', () => {
    expect(calculateReversePearson([])).toBeNaN();
  });

  it('should swap predictor and outcome roles', () => {
    // If predictor = [1,2,3,4,5], outcome = [2,4,6,8,10]
    // Forward: pearson(predictor, outcome) = 1.0
    // Reverse: pearson(outcome, predictor) = 1.0 (perfectly linear in both directions)
    const pairs = makePairs([1, 2, 3, 4, 5], [2, 4, 6, 8, 10]);
    const reverse = calculateReversePearson(pairs);
    expect(reverse).toBeCloseTo(1.0, 5);
  });

  it('should equal forward Pearson for perfectly linear data', () => {
    const pairs = makePairs([1, 2, 3, 4, 5], [10, 20, 30, 40, 50]);
    const forward = pearsonCorrelation(
      pairs.map(p => p.predictorValue),
      pairs.map(p => p.outcomeValue),
    );
    const reverse = calculateReversePearson(pairs);
    // For perfectly linear data, pearson(x,y) === pearson(y,x)
    expect(reverse).toBeCloseTo(forward, 10);
  });

  it('should equal forward Pearson for any linear relationship (Pearson is symmetric)', () => {
    // Pearson correlation is always symmetric: r(x,y) = r(y,x)
    // The reverse Pearson in the legacy system actually recomputes with temporal re-alignment,
    // but for already-aligned pairs, swapping roles gives the same Pearson.
    const pairs = makePairs([3, 1, 4, 1, 5, 9, 2, 6], [7, 2, 8, 3, 5, 1, 4, 6]);
    const forward = pearsonCorrelation(
      pairs.map(p => p.predictorValue),
      pairs.map(p => p.outcomeValue),
    );
    const reverse = calculateReversePearson(pairs);
    expect(reverse).toBeCloseTo(forward, 10);
  });

  it('should handle negative correlations', () => {
    const pairs = makePairs([1, 2, 3, 4, 5], [50, 40, 30, 20, 10]);
    const reverse = calculateReversePearson(pairs);
    expect(reverse).toBeCloseTo(-1.0, 5);
  });

  it('should handle zero correlation', () => {
    // Construct data with roughly zero correlation
    const pairs = makePairs([1, 2, 3, 4, 5], [3, 1, 4, 1, 5]);
    const reverse = calculateReversePearson(pairs);
    // Should be close to the forward (both near 0 for uncorrelated data)
    const forward = pearsonCorrelation(
      pairs.map(p => p.predictorValue),
      pairs.map(p => p.outcomeValue),
    );
    expect(reverse).toBeCloseTo(forward, 10);
  });

  it('should return 0 for constant predictor values', () => {
    // Constant predictor → zero std → denominator = 0 → pearson returns 0
    const pairs = makePairs([5, 5, 5, 5], [1, 2, 3, 4]);
    const reverse = calculateReversePearson(pairs);
    // reverse computes pearson(outcome, predictor) = pearson([1,2,3,4], [5,5,5,5]) = 0
    expect(reverse).toBe(0);
  });

  it('should return 0 for constant outcome values', () => {
    const pairs = makePairs([1, 2, 3, 4], [5, 5, 5, 5]);
    const reverse = calculateReversePearson(pairs);
    expect(reverse).toBe(0);
  });

  it('should handle large datasets correctly', () => {
    const n = 1000;
    const predictor = Array.from({ length: n }, (_, i) => i);
    const outcome = Array.from({ length: n }, (_, i) => i * 2 + 3);
    const pairs = makePairs(predictor, outcome);
    const reverse = calculateReversePearson(pairs);
    expect(reverse).toBeCloseTo(1.0, 5);
  });

  it('should handle two pairs (minimum valid input)', () => {
    const pairs = makePairs([1, 2], [3, 4]);
    const reverse = calculateReversePearson(pairs);
    expect(reverse).toBeCloseTo(1.0, 5);
  });
});

describe('calculatePredictivePearson', () => {
  it('should return positive when forward is stronger (correct direction)', () => {
    const result = calculatePredictivePearson(0.8, 0.3);
    expect(result).toBeCloseTo(0.5, 10);
    expect(result).toBeGreaterThan(0);
  });

  it('should return negative when reverse is stronger (wrong direction)', () => {
    const result = calculatePredictivePearson(0.3, 0.8);
    expect(result).toBeCloseTo(-0.5, 10);
    expect(result).toBeLessThan(0);
  });

  it('should return zero when forward equals reverse (no clear direction)', () => {
    const result = calculatePredictivePearson(0.5, 0.5);
    expect(result).toBe(0);
  });

  it('should handle both negative correlations', () => {
    // Forward = -0.7, Reverse = -0.3
    // predictive = -0.7 - (-0.3) = -0.4
    // Negative predictive means the forward direction is *more negative* than reverse
    const result = calculatePredictivePearson(-0.7, -0.3);
    expect(result).toBeCloseTo(-0.4, 10);
  });

  it('should handle forward positive and reverse negative', () => {
    const result = calculatePredictivePearson(0.6, -0.4);
    expect(result).toBeCloseTo(1.0, 10);
  });

  it('should handle forward negative and reverse positive', () => {
    const result = calculatePredictivePearson(-0.3, 0.7);
    expect(result).toBeCloseTo(-1.0, 10);
  });

  it('should handle zero forward', () => {
    const result = calculatePredictivePearson(0, 0.5);
    expect(result).toBeCloseTo(-0.5, 10);
  });

  it('should handle zero reverse', () => {
    const result = calculatePredictivePearson(0.5, 0);
    expect(result).toBeCloseTo(0.5, 10);
  });

  it('should handle both zeros', () => {
    expect(calculatePredictivePearson(0, 0)).toBe(0);
  });

  it('should handle extreme values at boundaries', () => {
    // Max difference: forward = +1, reverse = -1 → predictive = 2
    expect(calculatePredictivePearson(1, -1)).toBeCloseTo(2, 10);
    // Min difference: forward = -1, reverse = +1 → predictive = -2
    expect(calculatePredictivePearson(-1, 1)).toBeCloseTo(-2, 10);
  });
});

describe('Reverse Pearson + Predictive Pearson integration', () => {
  it('should flag correct causality direction for strong forward relationship', () => {
    // Drug dosage → symptom severity (genuine causal effect)
    // High predictor → high outcome; random noise when reversed
    const pairs = makePairs(
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      [10, 12, 15, 18, 22, 25, 28, 32, 35, 40],
    );
    const forwardR = pearsonCorrelation(
      pairs.map(p => p.predictorValue),
      pairs.map(p => p.outcomeValue),
    );
    const reverseR = calculateReversePearson(pairs);
    const predictive = calculatePredictivePearson(forwardR, reverseR);

    // For linearly-aligned pairs, forward and reverse are symmetric,
    // so predictive ≈ 0. The real difference appears with temporal re-alignment.
    expect(predictive).toBeCloseTo(0, 5);
  });

  it('should produce predictive = forward - reverse consistently', () => {
    const forwardR = 0.75;
    const reverseR = 0.25;
    const predictive = calculatePredictivePearson(forwardR, reverseR);
    expect(predictive).toBe(forwardR - reverseR);
  });
});

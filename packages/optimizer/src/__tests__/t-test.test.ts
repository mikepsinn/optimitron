import { describe, it, expect } from 'vitest';
import { calculateTTestPValue, mean } from '../statistics.js';
import type { AlignedPair } from '../types.js';

// ─── Helper ──────────────────────────────────────────────────────────

/** Create an AlignedPair with minimal timestamp info */
function pair(pv: number, ov: number): AlignedPair {
  return { predictorValue: pv, outcomeValue: ov, predictorTimestamp: 0, outcomeTimestamp: 0 };
}

/**
 * Generate N pairs where high-predictor days have a different outcome mean
 * than low-predictor days.
 */
function generateSplitPairs(
  n: number,
  lowPred: number, lowOutMean: number,
  highPred: number, highOutMean: number,
  noise: number = 0,
): AlignedPair[] {
  const pairs: AlignedPair[] = [];
  const half = Math.floor(n / 2);
  for (let i = 0; i < half; i++) {
    pairs.push(pair(lowPred, lowOutMean + (noise ? (Math.random() - 0.5) * noise : 0)));
  }
  for (let i = 0; i < n - half; i++) {
    pairs.push(pair(highPred, highOutMean + (noise ? (Math.random() - 0.5) * noise : 0)));
  }
  return pairs;
}

// ─── calculateTTestPValue ────────────────────────────────────────────

describe('calculateTTestPValue', () => {
  it('returns low p-value when groups have clearly different outcomes', () => {
    // 50 low-predictor days with outcome ~2, 50 high-predictor days with outcome ~8
    const pairs = generateSplitPairs(100, 0, 2, 10, 8, 1);
    const p = calculateTTestPValue(pairs);
    expect(p).toBeLessThan(0.05);
  });

  it('returns high p-value when groups have identical outcomes', () => {
    // All outcome values are the same regardless of predictor
    const pairs: AlignedPair[] = [];
    for (let i = 0; i < 50; i++) {
      pairs.push(pair(0, 5));
      pairs.push(pair(10, 5));
    }
    const p = calculateTTestPValue(pairs);
    // With zero variance in outcome across groups, p should be 1
    expect(p).toBe(1);
  });

  it('returns high p-value when there is no real difference', () => {
    // Both groups have outcome ~5 with same noise
    const pairs = generateSplitPairs(200, 0, 5, 10, 5, 2);
    const p = calculateTTestPValue(pairs);
    expect(p).toBeGreaterThan(0.05);
  });

  it('returns 1 for fewer than 4 pairs', () => {
    const pairs = [pair(1, 2), pair(3, 4), pair(5, 6)];
    expect(calculateTTestPValue(pairs)).toBe(1);
  });

  it('returns 1 for empty array', () => {
    expect(calculateTTestPValue([])).toBe(1);
  });

  it('handles all identical predictor values (one group empty)', () => {
    // All predictors equal → all go to one group → insufficient split
    const pairs = Array.from({ length: 20 }, () => pair(5, Math.random() * 10));
    const p = calculateTTestPValue(pairs);
    expect(p).toBe(1); // Can't split into two meaningful groups
  });

  it('p-value decreases with larger effect size', () => {
    // Small effect
    const smallEffect = generateSplitPairs(100, 0, 5, 10, 5.5, 1);
    const pSmall = calculateTTestPValue(smallEffect);

    // Large effect
    const largeEffect = generateSplitPairs(100, 0, 2, 10, 8, 1);
    const pLarge = calculateTTestPValue(largeEffect);

    expect(pLarge).toBeLessThan(pSmall);
  });

  it('p-value decreases with larger sample size (for same effect)', () => {
    const smallSample = generateSplitPairs(20, 0, 3, 10, 7, 2);
    const largeSample = generateSplitPairs(200, 0, 3, 10, 7, 2);

    const pSmall = calculateTTestPValue(smallSample);
    const pLarge = calculateTTestPValue(largeSample);

    expect(pLarge).toBeLessThan(pSmall);
  });

  it('returns value between 0 and 1', () => {
    const pairs = generateSplitPairs(50, 0, 3, 10, 7, 1);
    const p = calculateTTestPValue(pairs);
    expect(p).toBeGreaterThanOrEqual(0);
    expect(p).toBeLessThanOrEqual(1);
  });

  it('handles negative outcome values', () => {
    const pairs = generateSplitPairs(100, 0, -5, 10, 5, 1);
    const p = calculateTTestPValue(pairs);
    expect(p).toBeLessThan(0.05);
  });

  it('handles two pairs per group (minimum viable split)', () => {
    // 4 pairs total: 2 below mean, 2 above mean predictor
    const pairs = [pair(1, 2), pair(2, 3), pair(8, 8), pair(9, 9)];
    const p = calculateTTestPValue(pairs);
    expect(p).toBeGreaterThanOrEqual(0);
    expect(p).toBeLessThanOrEqual(1);
  });

  it('returns sensible p-value for borderline difference', () => {
    // Moderate effect with moderate noise
    const pairs = generateSplitPairs(60, 0, 4, 10, 6, 3);
    const p = calculateTTestPValue(pairs);
    // Should be somewhere in a reasonable range
    expect(p).toBeGreaterThanOrEqual(0);
    expect(p).toBeLessThanOrEqual(1);
  });

  it('very large clearly-separated groups → p ≈ 0', () => {
    // 500 pairs, huge difference, tiny noise
    const pairs = generateSplitPairs(500, 0, 0, 100, 100, 0.1);
    const p = calculateTTestPValue(pairs);
    expect(p).toBeLessThan(0.001);
  });

  it('single predictor value per group (no variance in predictor)', () => {
    // All low-pred are exactly 0, all high-pred are exactly 10
    const pairs: AlignedPair[] = [];
    for (let i = 0; i < 30; i++) pairs.push(pair(0, 3 + Math.random()));
    for (let i = 0; i < 30; i++) pairs.push(pair(10, 7 + Math.random()));
    const p = calculateTTestPValue(pairs);
    expect(p).toBeLessThan(0.05);
  });

  it('works with continuous predictor values', () => {
    // Predictor values drawn from a range, outcome linearly related
    const pairs: AlignedPair[] = [];
    for (let i = 0; i < 100; i++) {
      const pred = Math.random() * 10;
      const out = pred * 0.5 + (Math.random() - 0.5) * 2;
      pairs.push(pair(pred, out));
    }
    const p = calculateTTestPValue(pairs);
    // With a clear linear relationship, groups should differ
    expect(p).toBeLessThan(0.05);
  });
});

// ─── Integration with PIS ────────────────────────────────────────────

describe('t-test integration', () => {
  it('is exported from statistics module', () => {
    expect(typeof calculateTTestPValue).toBe('function');
  });
});

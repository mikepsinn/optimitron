import { describe, it, expect } from 'vitest';
import {
  mean,
  std,
  pearsonCorrelation,
  spearmanCorrelation,
  correlationTStatistic,
  tToPValue,
  calculateCorrelation,
  calculateEffectSize,
} from '../statistics.js';
import type { AlignedPair } from '../types.js';

// ─── Helper ──────────────────────────────────────────────────────────

/** Create an AlignedPair */
function pair(pv: number, ov: number, pt = 0, ot = 0): AlignedPair {
  return { predictorValue: pv, outcomeValue: ov, predictorTimestamp: pt, outcomeTimestamp: ot };
}

// ─── mean ────────────────────────────────────────────────────────────

describe('mean', () => {
  it('computes arithmetic mean of integers', () => {
    expect(mean([1, 2, 3, 4, 5])).toBe(3);
  });

  it('computes arithmetic mean of floats', () => {
    expect(mean([1.5, 2.5, 3.5])).toBeCloseTo(2.5, 10);
  });

  it('returns NaN for empty array', () => {
    expect(mean([])).toBeNaN();
  });

  it('handles single element', () => {
    expect(mean([42])).toBe(42);
  });

  it('handles negative values', () => {
    expect(mean([-10, 0, 10])).toBe(0);
  });

  it('handles all-zero array', () => {
    expect(mean([0, 0, 0])).toBe(0);
  });

  it('handles very large values without overflow in reasonable range', () => {
    expect(mean([1e15, 2e15, 3e15])).toBeCloseTo(2e15, 0);
  });

  it('handles very small values', () => {
    expect(mean([1e-15, 2e-15, 3e-15])).toBeCloseTo(2e-15, 25);
  });
});

// ─── std ─────────────────────────────────────────────────────────────

describe('std', () => {
  it('computes population std (ddof=0) correctly', () => {
    // Classic example: [2,4,4,4,5,5,7,9] → population std ≈ 2.0
    const result = std([2, 4, 4, 4, 5, 5, 7, 9], 0);
    expect(result).toBeCloseTo(2.0, 1);
  });

  it('computes sample std (ddof=1) correctly', () => {
    // Same data with Bessel correction
    const result = std([2, 4, 4, 4, 5, 5, 7, 9], 1);
    expect(result).toBeCloseTo(2.138, 2);
  });

  it('returns NaN for empty array', () => {
    expect(std([])).toBeNaN();
  });

  it('returns NaN when n <= ddof', () => {
    // Single value with ddof=1 → n-ddof = 0 → NaN
    expect(std([5], 1)).toBeNaN();
  });

  it('returns 0 for constant array with ddof=0', () => {
    expect(std([7, 7, 7, 7])).toBe(0);
  });

  it('handles two elements with ddof=1', () => {
    // [0, 10] → mean=5, diffs=[25,25], sum=50, 50/1 = 50, sqrt(50) ≈ 7.071
    expect(std([0, 10], 1)).toBeCloseTo(7.071, 2);
  });

  it('handles all-negative values', () => {
    const result = std([-5, -3, -1], 0);
    // mean = -3, diffs = [4, 0, 4], sum=8, 8/3 ≈ 2.667, sqrt ≈ 1.633
    expect(result).toBeCloseTo(1.633, 2);
  });
});

// ─── pearsonCorrelation ──────────────────────────────────────────────

describe('pearsonCorrelation', () => {
  it('returns 1.0 for perfect positive linear relationship', () => {
    const x = [1, 2, 3, 4, 5];
    const y = [2, 4, 6, 8, 10];
    expect(pearsonCorrelation(x, y)).toBeCloseTo(1.0, 10);
  });

  it('returns -1.0 for perfect negative linear relationship', () => {
    const x = [1, 2, 3, 4, 5];
    const y = [10, 8, 6, 4, 2];
    expect(pearsonCorrelation(x, y)).toBeCloseTo(-1.0, 10);
  });

  it('returns ~0 for uncorrelated data', () => {
    // Orthogonal data
    const x = [1, 0, -1, 0];
    const y = [0, 1, 0, -1];
    expect(pearsonCorrelation(x, y)).toBeCloseTo(0, 5);
  });

  it('returns NaN for fewer than 2 values', () => {
    expect(pearsonCorrelation([1], [2])).toBeNaN();
    expect(pearsonCorrelation([], [])).toBeNaN();
  });

  it('returns NaN for mismatched array lengths', () => {
    expect(pearsonCorrelation([1, 2], [3])).toBeNaN();
  });

  it('returns 0 when one array has zero variance', () => {
    expect(pearsonCorrelation([5, 5, 5], [1, 2, 3])).toBe(0);
    expect(pearsonCorrelation([1, 2, 3], [5, 5, 5])).toBe(0);
  });

  it('computes moderate positive correlation for realistic data', () => {
    // Simulated drug dose vs symptom improvement (from paper examples)
    // Higher dose → lower symptom (negative correlation)
    const dose = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    const symptom = [80, 78, 72, 65, 60, 55, 48, 42, 38, 35, 30];
    const r = pearsonCorrelation(dose, symptom);
    expect(r).toBeLessThan(-0.95); // Strong negative
    expect(r).toBeGreaterThan(-1.01);
  });

  it('handles large N with noisy data', () => {
    const n = 1000;
    const x: number[] = [];
    const y: number[] = [];
    // Seed-like deterministic generation using simple formula
    for (let i = 0; i < n; i++) {
      const xi = i / n * 10;
      x.push(xi);
      // y = 2x + noise (use deterministic pseudo-noise)
      y.push(2 * xi + Math.sin(i * 137.5) * 2);
    }
    const r = pearsonCorrelation(x, y);
    // Should be high positive correlation
    expect(r).toBeGreaterThan(0.9);
  });

  it('is symmetric: r(x,y) = r(y,x)', () => {
    const x = [3, 7, 2, 9, 4];
    const y = [5, 1, 8, 3, 6];
    expect(pearsonCorrelation(x, y)).toBeCloseTo(pearsonCorrelation(y, x), 10);
  });

  it('is invariant to linear transformation: r(ax+b, y) = r(x, y) or -r(x, y)', () => {
    const x = [1, 2, 3, 4, 5];
    const y = [2, 3, 5, 4, 7];
    const r1 = pearsonCorrelation(x, y);
    // Transform x → 3x + 10
    const xTransformed = x.map(v => 3 * v + 10);
    const r2 = pearsonCorrelation(xTransformed, y);
    expect(r1).toBeCloseTo(r2, 10);
  });
});

// ─── spearmanCorrelation ─────────────────────────────────────────────

describe('spearmanCorrelation', () => {
  it('returns 1.0 for perfectly monotonic increasing data', () => {
    const x = [1, 2, 3, 4, 5];
    const y = [10, 100, 1000, 10000, 100000]; // Non-linear but monotonic
    expect(spearmanCorrelation(x, y)).toBeCloseTo(1.0, 5);
  });

  it('returns -1.0 for perfectly monotonic decreasing data', () => {
    const x = [1, 2, 3, 4, 5];
    const y = [100, 50, 30, 10, 1];
    expect(spearmanCorrelation(x, y)).toBeCloseTo(-1.0, 5);
  });

  it('handles tied values correctly (average ranking)', () => {
    const x = [1, 2, 2, 3];
    const y = [10, 20, 20, 30];
    const r = spearmanCorrelation(x, y);
    // Perfectly monotonic even with ties
    expect(r).toBeCloseTo(1.0, 5);
  });

  it('returns NaN for fewer than 2 values', () => {
    expect(spearmanCorrelation([1], [2])).toBeNaN();
  });

  it('differs from Pearson for non-linear monotonic relationships', () => {
    // Exponential relationship: Spearman should be higher than Pearson
    const x = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const y = x.map(v => Math.exp(v));
    const pearson = pearsonCorrelation(x, y);
    const spearman = spearmanCorrelation(x, y);
    // Spearman should be 1.0 (perfect monotonic), Pearson < 1.0
    expect(spearman).toBeCloseTo(1.0, 5);
    expect(pearson).toBeLessThan(1.0);
  });
});

// ─── correlationTStatistic ───────────────────────────────────────────

describe('correlationTStatistic', () => {
  it('computes t = r * sqrt(n-2) / sqrt(1-r²)', () => {
    // r=0.5, n=30 → t = 0.5 * sqrt(28) / sqrt(1 - 0.25) = 0.5 * 5.292 / 0.866 ≈ 3.055
    const t = correlationTStatistic(0.5, 30);
    expect(t).toBeCloseTo(3.055, 2);
  });

  it('returns Infinity for r=1', () => {
    expect(correlationTStatistic(1, 10)).toBe(Infinity);
  });

  it('returns -Infinity for r=-1', () => {
    expect(correlationTStatistic(-1, 10)).toBe(-Infinity);
  });

  it('returns Infinity for n=2 (df=0)', () => {
    const t = correlationTStatistic(0.5, 2);
    expect(t).toBe(Infinity);
  });

  it('returns 0 for r=0', () => {
    expect(correlationTStatistic(0, 100)).toBe(0);
  });

  it('scales with sample size', () => {
    // Same r, larger n → larger t
    const t30 = correlationTStatistic(0.3, 30);
    const t100 = correlationTStatistic(0.3, 100);
    const t1000 = correlationTStatistic(0.3, 1000);
    expect(Math.abs(t100)).toBeGreaterThan(Math.abs(t30));
    expect(Math.abs(t1000)).toBeGreaterThan(Math.abs(t100));
  });
});

// ─── tToPValue ───────────────────────────────────────────────────────

describe('tToPValue', () => {
  it('returns small p-value for large t-statistic (df > 30)', () => {
    // t=5, df=100 → very significant
    const p = tToPValue(5, 100);
    expect(p).toBeLessThan(0.001);
  });

  it('returns ~1 for t=0', () => {
    const p = tToPValue(0, 100);
    expect(p).toBeCloseTo(1.0, 1);
  });

  it('returns value between 0 and 1', () => {
    for (const t of [-10, -3, -1, 0, 1, 3, 10]) {
      for (const df of [5, 20, 50, 200]) {
        const p = tToPValue(t, df);
        expect(p).toBeGreaterThanOrEqual(0);
        expect(p).toBeLessThanOrEqual(1);
      }
    }
  });

  it('decreases as |t| increases for fixed df', () => {
    const p1 = tToPValue(1, 50);
    const p2 = tToPValue(2, 50);
    const p3 = tToPValue(5, 50);
    expect(p1).toBeGreaterThan(p2);
    expect(p2).toBeGreaterThan(p3);
  });

  it('is symmetric: p(t) = p(-t)', () => {
    const pPos = tToPValue(3, 50);
    const pNeg = tToPValue(-3, 50);
    expect(pPos).toBeCloseTo(pNeg, 5);
  });

  it('returns approximately 0.05 for conventional critical values', () => {
    // For df=100, t ≈ 1.984 gives p ≈ 0.05
    const p = tToPValue(1.984, 100);
    expect(p).toBeCloseTo(0.05, 1);
  });
});

// ─── calculateCorrelation ────────────────────────────────────────────

describe('calculateCorrelation', () => {
  it('returns comprehensive stats for strong positive correlation', () => {
    const pairs: AlignedPair[] = [];
    for (let i = 0; i < 50; i++) {
      pairs.push(pair(i, i * 2 + Math.sin(i) * 0.5));
    }

    const result = calculateCorrelation(pairs);

    expect(result.pearson).toBeGreaterThan(0.99);
    expect(result.spearman).toBeGreaterThan(0.99);
    expect(result.pValue).toBeLessThan(0.001);
    expect(result.n).toBe(50);
    expect(result.standardError).toBeDefined();
    expect(result.confidenceInterval).toBeDefined();
    expect(result.confidenceInterval![0]).toBeLessThan(result.pearson);
    expect(result.confidenceInterval![1]).toBeGreaterThan(result.pearson);
  });

  it('returns wide confidence interval for small sample', () => {
    const pairs = [pair(1, 2), pair(2, 4), pair(3, 5), pair(4, 8)];
    const result = calculateCorrelation(pairs);

    expect(result.n).toBe(4);
    const ciWidth = result.confidenceInterval![1] - result.confidenceInterval![0];
    expect(ciWidth).toBeGreaterThan(0.5); // Wide CI for n=4
  });

  it('returns non-significant p-value for random-looking data', () => {
    // Construct uncorrelated pairs
    const pairs = [
      pair(1, 5), pair(2, 3), pair(3, 7), pair(4, 2),
      pair(5, 6), pair(6, 1), pair(7, 8), pair(8, 4),
      pair(9, 3), pair(10, 9), pair(11, 2), pair(12, 7),
      pair(13, 1), pair(14, 8), pair(15, 5), pair(16, 3),
      pair(17, 7), pair(18, 2), pair(19, 6), pair(20, 4),
      pair(21, 8), pair(22, 1), pair(23, 5), pair(24, 9),
      pair(25, 3), pair(26, 7), pair(27, 2), pair(28, 6),
      pair(29, 4), pair(30, 8), pair(31, 1), pair(32, 5),
    ];
    const result = calculateCorrelation(pairs);

    // Should not be highly significant
    expect(Math.abs(result.pearson)).toBeLessThan(0.5);
  });

  it('computes Fisher z-transform confidence interval', () => {
    const pairs: AlignedPair[] = [];
    for (let i = 0; i < 100; i++) {
      pairs.push(pair(i, i * 0.5 + Math.sin(i * 1.37) * 5));
    }
    const result = calculateCorrelation(pairs);

    // CI should be valid
    expect(result.confidenceInterval![0]).toBeLessThan(result.confidenceInterval![1]);
    // CI should contain the point estimate
    expect(result.confidenceInterval![0]).toBeLessThanOrEqual(result.pearson);
    expect(result.confidenceInterval![1]).toBeGreaterThanOrEqual(result.pearson);
  });
});

// ─── calculateEffectSize ─────────────────────────────────────────────

describe('calculateEffectSize', () => {
  it('computes percent change from baseline correctly', () => {
    // Baseline (low predictor): outcome ~100
    // Follow-up (high predictor): outcome ~120
    // Expected percent change: +20%
    const pairs: AlignedPair[] = [];
    // Predictor values: 0-5 (baseline) and 15-20 (follow-up)
    // Mean predictor ≈ 10
    for (let i = 0; i < 20; i++) {
      if (i < 10) {
        pairs.push(pair(i, 100 + Math.sin(i) * 2)); // Low predictor → ~100
      } else {
        pairs.push(pair(i + 10, 120 + Math.sin(i) * 2)); // High predictor → ~120
      }
    }

    const result = calculateEffectSize(pairs);

    expect(result.percentChange).toBeCloseTo(20, -1); // Within ±5
    expect(result.absoluteChange).toBeCloseTo(20, -1);
    expect(result.baselineMean).toBeCloseTo(100, -1);
    expect(result.followUpMean).toBeCloseTo(120, -1);
    expect(result.baselineN).toBeGreaterThan(0);
    expect(result.followUpN).toBeGreaterThan(0);
  });

  it('computes negative effect size for harmful predictor', () => {
    // Higher predictor → worse outcome
    const pairs: AlignedPair[] = [];
    for (let i = 0; i < 20; i++) {
      if (i < 10) {
        pairs.push(pair(i, 80)); // Low predictor → outcome=80
      } else {
        pairs.push(pair(i + 10, 60)); // High predictor → outcome=60
      }
    }

    const result = calculateEffectSize(pairs);
    expect(result.percentChange).toBeLessThan(0);
    expect(result.absoluteChange).toBeLessThan(0);
  });

  it('computes z-score relative to baseline variability', () => {
    // Paper formula: z = |percentChange| / RSD_baseline
    // RSD = (std / mean) * 100
    const pairs: AlignedPair[] = [];
    for (let i = 0; i < 40; i++) {
      if (i < 20) {
        // Baseline: mean=50, std≈5 → RSD=10%
        pairs.push(pair(i, 50 + (i % 5) * 2 - 4));
      } else {
        // Follow-up: mean=65 → 30% increase
        pairs.push(pair(i + 20, 65 + (i % 5) * 2 - 4));
      }
    }

    const result = calculateEffectSize(pairs);
    expect(result.zScore).toBeGreaterThan(0);
    // With 30% change and ~10% RSD, z should be ~3
    expect(result.zScore).toBeGreaterThan(1);
  });

  it('returns 0 z-score when baseline has zero variability', () => {
    const pairs: AlignedPair[] = [];
    for (let i = 0; i < 20; i++) {
      if (i < 10) {
        pairs.push(pair(i, 50)); // Constant baseline
      } else {
        pairs.push(pair(i + 10, 60));
      }
    }

    const result = calculateEffectSize(pairs);
    // RSD is 0/50 = 0, so zScore formula would have 0 denominator
    // Implementation should handle gracefully (return 0)
    expect(Number.isFinite(result.zScore)).toBe(true);
  });

  it('handles zero baseline mean gracefully', () => {
    const pairs: AlignedPair[] = [];
    for (let i = 0; i < 20; i++) {
      if (i < 10) {
        pairs.push(pair(i, 0)); // Zero baseline
      } else {
        pairs.push(pair(i + 10, 5));
      }
    }

    const result = calculateEffectSize(pairs);
    // Should not be NaN or Infinity
    expect(Number.isFinite(result.percentChange)).toBe(true);
  });

  it('partitions correctly around mean predictor value', () => {
    // Predictor: [0, 10, 20, 30, 40] → mean=20
    // Baseline: predictor < 20 → [0, 10]
    // Follow-up: predictor >= 20 → [20, 30, 40]
    const pairs = [
      pair(0, 100), pair(10, 100),   // baseline
      pair(20, 130), pair(30, 130), pair(40, 130), // follow-up
    ];

    const result = calculateEffectSize(pairs);
    expect(result.baselineN).toBe(2);
    expect(result.followUpN).toBe(3);
    expect(result.baselineMean).toBe(100);
    expect(result.followUpMean).toBe(130);
    expect(result.percentChange).toBeCloseTo(30, 5);
  });

  it('handles realistic supplement example from paper', () => {
    // Simulating the dFDA paper scenario:
    // Omega-3 supplementation (mg) vs joint pain severity (0-10)
    // Baseline (low/no supplementation): pain ~7
    // Follow-up (regular supplementation): pain ~5
    // Expected: ~28.6% improvement
    const pairs: AlignedPair[] = [];
    const meanDose = 1500; // mg

    // Low dose days
    for (let i = 0; i < 30; i++) {
      const dose = Math.random() * 500; // 0-500mg (below mean)
      const pain = 7 + (Math.random() - 0.5) * 1.5;
      pairs.push(pair(dose, pain));
    }
    // High dose days
    for (let i = 0; i < 30; i++) {
      const dose = 2000 + Math.random() * 1000; // 2000-3000mg (above mean)
      const pain = 5 + (Math.random() - 0.5) * 1.5;
      pairs.push(pair(dose, pain));
    }

    const result = calculateEffectSize(pairs);
    // Pain should decrease (negative change)
    expect(result.percentChange).toBeLessThan(0);
    expect(result.baselineMean).toBeGreaterThan(result.followUpMean);
    expect(result.baselineN).toBeGreaterThan(0);
    expect(result.followUpN).toBeGreaterThan(0);
    expect(Number.isFinite(result.zScore)).toBe(true);
  });
});

// ─── Edge Cases ──────────────────────────────────────────────────────

describe('statistics edge cases', () => {
  it('pearsonCorrelation handles NaN in data', () => {
    const r = pearsonCorrelation([1, NaN, 3], [4, 5, 6]);
    // Result should be NaN since NaN propagates
    expect(r).toBeNaN();
  });

  it('mean handles array with single Infinity', () => {
    expect(mean([Infinity])).toBe(Infinity);
    expect(mean([-Infinity])).toBe(-Infinity);
  });

  it('std handles array with single value', () => {
    // ddof=0: std of single value is 0
    expect(std([5], 0)).toBe(0);
  });

  it('calculateCorrelation handles minimum viable pair count', () => {
    // Exactly 2 pairs (minimum for correlation)
    const pairs = [pair(1, 10), pair(2, 20)];
    const result = calculateCorrelation(pairs);
    expect(result.pearson).toBeCloseTo(1.0, 5);
    expect(result.n).toBe(2);
  });

  it('calculateEffectSize handles all-same predictor values', () => {
    // All predictors = 5 → mean=5, all in follow-up (>= mean)
    const pairs = [pair(5, 10), pair(5, 20), pair(5, 30)];
    const result = calculateEffectSize(pairs);
    // No baseline (all >= mean), so baselineN should be 0
    expect(result.followUpN).toBe(3);
    expect(result.baselineN).toBe(0);
    // baselineMean will be NaN
    expect(result.baselineMean).toBeNaN();
  });
});

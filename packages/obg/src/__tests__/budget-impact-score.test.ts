import { describe, it, expect } from 'vitest';
import {
  qualityWeight,
  precisionWeight,
  recencyWeight,
  calculateWES,
  scoreToGrade,
  calculatePriorityScore,
  type EffectEstimate,
} from '../budget-impact-score.js';

// Method weights from @optomitron/opg
// rct: 1.00, diff-in-diff: 0.80, cross_sectional: 0.25, etc.

// =========================== qualityWeight =================================

describe('qualityWeight', () => {
  it('returns 1.0 for RCT', () => {
    expect(qualityWeight('rct')).toBe(1.0);
  });

  it('returns 0.80 for difference-in-differences', () => {
    expect(qualityWeight('difference_in_differences')).toBe(0.80);
  });

  it('returns 0.25 for cross-sectional', () => {
    expect(qualityWeight('cross_sectional')).toBe(0.25);
  });

  it('returns 0.90 for regression discontinuity', () => {
    expect(qualityWeight('regression_discontinuity')).toBe(0.90);
  });

  it('returns higher weight for more rigorous methods', () => {
    expect(qualityWeight('rct')).toBeGreaterThan(qualityWeight('difference_in_differences'));
    expect(qualityWeight('difference_in_differences')).toBeGreaterThan(
      qualityWeight('cross_sectional'),
    );
  });
});

// ========================== precisionWeight ================================

describe('precisionWeight', () => {
  it('computes 1/SE² (inverse variance)', () => {
    // SE = 0.5 → 1/0.25 = 4
    expect(precisionWeight(0.5)).toBe(4);
  });

  it('higher precision for smaller standard errors', () => {
    expect(precisionWeight(0.1)).toBeGreaterThan(precisionWeight(1.0));
  });

  it('returns 1 for SE = 1', () => {
    expect(precisionWeight(1.0)).toBe(1);
  });

  it('returns very large weight for very small SE', () => {
    expect(precisionWeight(0.01)).toBe(10_000);
  });

  it('returns clamped precision for SE = 0 (no Infinity)', () => {
    // SE is clamped to 0.001 minimum, so 1/0.001² = 1_000_000
    const w = precisionWeight(0);
    expect(Number.isFinite(w)).toBe(true);
    expect(w).toBe(1_000_000);
  });

  it('returns clamped precision for very small SE below clamp', () => {
    // SE = 0.0001 is below the 0.001 clamp
    const w = precisionWeight(0.0001);
    expect(w).toBe(1_000_000); // clamped to 0.001
  });
});

// ============================ recencyWeight ================================

describe('recencyWeight', () => {
  it('returns 1.0 for current year', () => {
    expect(recencyWeight(2025, 2025)).toBeCloseTo(1.0, 10);
  });

  it('decays exponentially with age', () => {
    // e^(-0.03 × 10) ≈ 0.7408
    expect(recencyWeight(2015, 2025)).toBeCloseTo(Math.exp(-0.03 * 10), 5);
  });

  it('is higher for more recent studies', () => {
    expect(recencyWeight(2020, 2025)).toBeGreaterThan(recencyWeight(2010, 2025));
  });

  it('handles studies from same year', () => {
    expect(recencyWeight(2025, 2025)).toBe(1.0);
  });

  it('handles very old studies', () => {
    // 50 years old: e^(-0.03×50) ≈ 0.223
    expect(recencyWeight(1975, 2025)).toBeCloseTo(Math.exp(-0.03 * 50), 5);
  });

  it('uses custom decay rate', () => {
    // Faster decay: e^(-0.10 × 10) ≈ 0.3679
    expect(recencyWeight(2015, 2025, 0.10)).toBeCloseTo(Math.exp(-0.10 * 10), 5);
  });

  it('returns >1 for future studies (edge case)', () => {
    // e^(-0.03 × (-5)) = e^(0.15) ≈ 1.162
    expect(recencyWeight(2030, 2025)).toBeGreaterThan(1);
  });
});

// ============================== calculateWES ===============================

describe('calculateWES', () => {
  it('returns zero score and grade F for empty estimates', () => {
    const result = calculateWES([]);
    expect(result.score).toBe(0);
    expect(result.grade).toBe('F');
    expect(result.estimateCount).toBe(0);
  });

  it('calculates WES for a single RCT estimate', () => {
    const estimates: EffectEstimate[] = [
      { beta: 0.5, standardError: 0.1, method: 'rct', year: 2023 },
    ];
    const result = calculateWES(estimates, 2025);

    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(1);
    expect(result.estimateCount).toBe(1);
    expect(result.qualityWeight).toBe(1.0); // RCT
    // precisionWeight is average: 1/0.1² = 100, but floating point
    expect(result.precisionWeight).toBeCloseTo(100, 5);
    expect(result.recencyWeight).toBeCloseTo(Math.exp(-0.03 * 2), 5);
  });

  it('weights RCT evidence higher than cross-sectional', () => {
    const rctEstimate: EffectEstimate[] = [
      { beta: 0.5, standardError: 2.0, method: 'rct', year: 2023 },
    ];
    const csEstimate: EffectEstimate[] = [
      { beta: 0.5, standardError: 2.0, method: 'cross_sectional', year: 2023 },
    ];
    const rctResult = calculateWES(rctEstimate, 2025);
    const csResult = calculateWES(csEstimate, 2025);

    expect(rctResult.score).toBeGreaterThan(csResult.score);
  });

  it('more precise estimates get higher WES', () => {
    const precise: EffectEstimate[] = [
      { beta: 0.5, standardError: 1.0, method: 'cross_sectional', year: 2023 },
    ];
    const imprecise: EffectEstimate[] = [
      { beta: 0.5, standardError: 5.0, method: 'cross_sectional', year: 2023 },
    ];
    const preciseResult = calculateWES(precise, 2025);
    const impreciseResult = calculateWES(imprecise, 2025);

    expect(preciseResult.score).toBeGreaterThan(impreciseResult.score);
  });

  it('recent studies get higher WES', () => {
    const recent: EffectEstimate[] = [
      { beta: 0.5, standardError: 3.0, method: 'cross_sectional', year: 2024 },
    ];
    const old: EffectEstimate[] = [
      { beta: 0.5, standardError: 3.0, method: 'cross_sectional', year: 2000 },
    ];
    const recentResult = calculateWES(recent, 2025);
    const oldResult = calculateWES(old, 2025);

    expect(recentResult.score).toBeGreaterThan(oldResult.score);
  });

  it('multiple estimates increase WES (more evidence = more confidence)', () => {
    const single: EffectEstimate[] = [
      { beta: 0.5, standardError: 3.0, method: 'cross_sectional', year: 2023 },
    ];
    const multiple: EffectEstimate[] = [
      { beta: 0.5, standardError: 3.0, method: 'cross_sectional', year: 2023 },
      { beta: 0.6, standardError: 4.0, method: 'cross_sectional', year: 2022 },
      { beta: 0.4, standardError: 5.0, method: 'cross_sectional', year: 2020 },
    ];
    const singleResult = calculateWES(single, 2025);
    const multipleResult = calculateWES(multiple, 2025);

    expect(multipleResult.score).toBeGreaterThan(singleResult.score);
  });

  it('score is capped at 1.0', () => {
    // Many very precise, high-quality, recent estimates
    const estimates: EffectEstimate[] = Array.from({ length: 50 }, (_, i) => ({
      beta: 0.5,
      standardError: 0.01,
      method: 'rct' as const,
      year: 2024,
    }));
    const result = calculateWES(estimates, 2025);
    expect(result.score).toBe(1);
  });

  it('returns correct averages for quality/precision/recency', () => {
    const estimates: EffectEstimate[] = [
      { beta: 0.5, standardError: 0.1, method: 'rct', year: 2023 },
      { beta: 0.3, standardError: 0.2, method: 'cross_sectional', year: 2020 },
    ];
    const result = calculateWES(estimates, 2025);

    // Average quality: (1.0 + 0.25) / 2 = 0.625
    expect(result.qualityWeight).toBeCloseTo(0.625, 5);
    // Average precision: (100 + 25) / 2 = 62.5
    expect(result.precisionWeight).toBeCloseTo(62.5, 5);
    // Average recency: (e^(-0.03*2) + e^(-0.03*5)) / 2
    const expectedRecency =
      (Math.exp(-0.03 * 2) + Math.exp(-0.03 * 5)) / 2;
    expect(result.recencyWeight).toBeCloseTo(expectedRecency, 5);
  });

  it('handles paper priority ranking scenario', () => {
    // From paper: Pragmatic trials WES = 0.90
    // We can't reproduce exactly without knowing K, but can test relative ordering
    const highEvidence: EffectEstimate[] = [
      { beta: 2.0, standardError: 0.1, method: 'rct', year: 2024 },
      { beta: 1.8, standardError: 0.12, method: 'rct', year: 2022 },
    ];
    const lowEvidence: EffectEstimate[] = [
      { beta: 0.5, standardError: 0.5, method: 'cross_sectional', year: 2015 },
    ];

    const highResult = calculateWES(highEvidence, 2025);
    const lowResult = calculateWES(lowEvidence, 2025);

    expect(highResult.score).toBeGreaterThan(lowResult.score);
    expect(highResult.grade).not.toBe('F');
  });
});

// ============================== scoreToGrade ===============================

describe('scoreToGrade', () => {
  it('assigns grade A for score >= 0.80', () => {
    expect(scoreToGrade(0.80)).toBe('A');
    expect(scoreToGrade(0.95)).toBe('A');
    expect(scoreToGrade(1.0)).toBe('A');
  });

  it('assigns grade B for score 0.60-0.79', () => {
    expect(scoreToGrade(0.60)).toBe('B');
    expect(scoreToGrade(0.79)).toBe('B');
  });

  it('assigns grade C for score 0.40-0.59', () => {
    expect(scoreToGrade(0.40)).toBe('C');
    expect(scoreToGrade(0.59)).toBe('C');
  });

  it('assigns grade D for score 0.20-0.39', () => {
    expect(scoreToGrade(0.20)).toBe('D');
    expect(scoreToGrade(0.39)).toBe('D');
  });

  it('assigns grade F for score < 0.20', () => {
    expect(scoreToGrade(0.0)).toBe('F');
    expect(scoreToGrade(0.19)).toBe('F');
  });

  it('matches paper grading table exactly', () => {
    // Paper: A = 0.80-1.00, B = 0.60-0.79, C = 0.40-0.59, D = 0.20-0.39, F = 0.00-0.19
    expect(scoreToGrade(0.85)).toBe('A'); // "Strong evidence of welfare benefit"
    expect(scoreToGrade(0.70)).toBe('B'); // "Probable welfare benefit"
    expect(scoreToGrade(0.50)).toBe('C'); // "Possible welfare benefit"
    expect(scoreToGrade(0.30)).toBe('D'); // "Weak evidence of welfare benefit"
    expect(scoreToGrade(0.10)).toBe('F'); // "No demonstrated welfare benefit"
  });
});

// ======================== calculatePriorityScore ============================

describe('calculatePriorityScore', () => {
  it('computes gap × WES for underspend', () => {
    // Underspend: priority = gap × WES
    expect(calculatePriorityScore(49_500_000_000, 0.90)).toBeCloseTo(
      44_550_000_000,
      -3,
    );
  });

  it('uses inverted formula for overspend (low WES = high priority)', () => {
    // Overspend: priority = |gap| × (1 - WES × 0.5)
    // Military: gap = -719B, WES = 0.036
    // priority = 719B × (1 - 0.036 × 0.5) = 719B × 0.982 = ~706B
    const priority = calculatePriorityScore(-719_000_000_000, 0.036);
    const expected = 719_000_000_000 * (1 - 0.036 * 0.5);
    expect(priority).toBeCloseTo(expected, -3);
  });

  it('overspend with high WES gets moderate priority', () => {
    // Overspend + A grade: priority = |gap| × (1 - 0.90 × 0.5) = |gap| × 0.55
    const priority = calculatePriorityScore(-100_000_000_000, 0.90);
    expect(priority).toBeCloseTo(100_000_000_000 * 0.55, -3);
  });

  it('overspend with F grade gets near-full priority', () => {
    // Overspend + F grade: priority = |gap| × (1 - 0.05 × 0.5) = |gap| × 0.975
    const priority = calculatePriorityScore(-100_000_000_000, 0.05);
    expect(priority).toBeCloseTo(100_000_000_000 * 0.975, -3);
  });

  it('returns 0 for zero gap', () => {
    expect(calculatePriorityScore(0, 0.90)).toBe(0);
  });

  it('returns 0 for zero WES on underspend', () => {
    expect(calculatePriorityScore(49_500_000_000, 0)).toBe(0);
  });

  it('returns full gap for zero WES on overspend', () => {
    // priority = |gap| × (1 - 0 × 0.5) = |gap|
    expect(calculatePriorityScore(-100_000_000_000, 0)).toBe(100_000_000_000);
  });

  it('ranks overspend+low-WES higher than overspend+high-WES', () => {
    const lowWES = calculatePriorityScore(-391_000_000_000, 0.10);
    const highWES = calculatePriorityScore(-391_000_000_000, 0.90);
    expect(lowWES).toBeGreaterThan(highWES);
  });
});

// ======================== SE=0 edge case ===================================

describe('WES with standardError=0', () => {
  it('produces finite score when SE is exactly 0', () => {
    const estimates: EffectEstimate[] = [
      { beta: 0.5, standardError: 0, method: 'rct', year: 2024 },
    ];
    const result = calculateWES(estimates, 2025);
    expect(Number.isFinite(result.score)).toBe(true);
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(1);
    expect(Number.isFinite(result.precisionWeight)).toBe(true);
  });

  it('mixed SE=0 and normal SE produces finite results', () => {
    const estimates: EffectEstimate[] = [
      { beta: 0.5, standardError: 0, method: 'rct', year: 2024 },
      { beta: 0.3, standardError: 0.5, method: 'cross_sectional', year: 2020 },
    ];
    const result = calculateWES(estimates, 2025);
    expect(Number.isFinite(result.score)).toBe(true);
    expect(Number.isFinite(result.precisionWeight)).toBe(true);
    expect(Number.isFinite(result.qualityWeight)).toBe(true);
    expect(Number.isFinite(result.recencyWeight)).toBe(true);
  });
});

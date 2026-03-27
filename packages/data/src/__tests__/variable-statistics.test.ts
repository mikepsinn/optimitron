import { describe, it, expect } from 'vitest';
import {
  calculateNOf1VariableStatistics,
  aggregateGlobalStatistics,
  type NOf1VariableStatistics,
  type GlobalVariableStatistics,
} from '../variable-statistics';

// ─── Helper ──────────────────────────────────────────────────────────────────

/** Round to N decimal places for floating-point comparison */
const round = (v: number, dp = 6) => Math.round(v * 10 ** dp) / 10 ** dp;

// ─── calculateNOf1VariableStatistics ─────────────────────────────────────────

describe('calculateNOf1VariableStatistics', () => {
  // ── Empty array ──────────────────────────────────────────────────────────

  it('returns zeros and nulls for an empty array', () => {
    const stats = calculateNOf1VariableStatistics([]);
    expect(stats.mean).toBe(0);
    expect(stats.median).toBe(0);
    expect(stats.standardDeviation).toBe(0);
    expect(stats.variance).toBe(0);
    expect(stats.skewness).toBe(0);
    expect(stats.kurtosis).toBe(0);
    expect(stats.minimumRecordedValue).toBe(0);
    expect(stats.maximumRecordedValue).toBe(0);
    expect(stats.numberOfMeasurements).toBe(0);
    expect(stats.numberOfUniqueValues).toBe(0);
    expect(stats.mostCommonValue).toBeNull();
    expect(stats.secondMostCommonValue).toBeNull();
    expect(stats.firstMeasurementAt).toBeNull();
    expect(stats.lastMeasurementAt).toBeNull();
    expect(stats.medianSecondsBetweenMeasurements).toBeNull();
  });

  // ── Single value ─────────────────────────────────────────────────────────

  it('handles a single value', () => {
    const stats = calculateNOf1VariableStatistics([42]);
    expect(stats.mean).toBe(42);
    expect(stats.median).toBe(42);
    expect(stats.standardDeviation).toBe(0);
    expect(stats.variance).toBe(0);
    expect(stats.skewness).toBe(0);
    expect(stats.kurtosis).toBe(0);
    expect(stats.minimumRecordedValue).toBe(42);
    expect(stats.maximumRecordedValue).toBe(42);
    expect(stats.numberOfMeasurements).toBe(1);
    expect(stats.numberOfUniqueValues).toBe(1);
    expect(stats.mostCommonValue).toBe(42);
    expect(stats.secondMostCommonValue).toBeNull();
  });

  // ── Two values ───────────────────────────────────────────────────────────

  it('handles two values (skewness=0 because n<3)', () => {
    const stats = calculateNOf1VariableStatistics([10, 20]);
    expect(stats.mean).toBe(15);
    expect(stats.median).toBe(15);
    expect(round(stats.variance)).toBe(50); // sample variance: 50
    expect(round(stats.standardDeviation, 4)).toBe(round(Math.sqrt(50), 4));
    expect(stats.skewness).toBe(0); // n < 3
    expect(stats.kurtosis).toBe(0); // n < 4
    expect(stats.minimumRecordedValue).toBe(10);
    expect(stats.maximumRecordedValue).toBe(20);
    expect(stats.numberOfMeasurements).toBe(2);
  });

  // ── All same values ──────────────────────────────────────────────────────

  it('handles all identical values (zero variance)', () => {
    const stats = calculateNOf1VariableStatistics([5, 5, 5, 5, 5]);
    expect(stats.mean).toBe(5);
    expect(stats.median).toBe(5);
    expect(stats.standardDeviation).toBe(0);
    expect(stats.variance).toBe(0);
    expect(stats.skewness).toBe(0);
    expect(stats.kurtosis).toBe(0);
    expect(stats.numberOfUniqueValues).toBe(1);
    expect(stats.mostCommonValue).toBe(5);
    expect(stats.secondMostCommonValue).toBeNull();
  });

  // ── Known data set ───────────────────────────────────────────────────────

  it('calculates correct mean for known data [1,2,3,4,5]', () => {
    const stats = calculateNOf1VariableStatistics([1, 2, 3, 4, 5]);
    expect(stats.mean).toBe(3);
  });

  it('calculates correct median for odd-length sorted data', () => {
    const stats = calculateNOf1VariableStatistics([1, 2, 3, 4, 5]);
    expect(stats.median).toBe(3);
  });

  it('calculates correct median for even-length data', () => {
    const stats = calculateNOf1VariableStatistics([1, 2, 3, 4]);
    expect(stats.median).toBe(2.5);
  });

  it('calculates correct sample variance for [2, 4, 4, 4, 5, 5, 7, 9]', () => {
    const stats = calculateNOf1VariableStatistics([2, 4, 4, 4, 5, 5, 7, 9]);
    // mean = 5, sample variance = Σ(xi-5)² / 7 = 32/7 ≈ 4.571429
    expect(round(stats.variance)).toBe(round(32 / 7));
    expect(round(stats.standardDeviation, 4)).toBe(
      round(Math.sqrt(32 / 7), 4),
    );
  });

  it('calculates min and max correctly', () => {
    const stats = calculateNOf1VariableStatistics([9, 1, 5, 3, 7]);
    expect(stats.minimumRecordedValue).toBe(1);
    expect(stats.maximumRecordedValue).toBe(9);
  });

  it('reports correct numberOfMeasurements', () => {
    const stats = calculateNOf1VariableStatistics([1, 2, 3, 4, 5, 6, 7]);
    expect(stats.numberOfMeasurements).toBe(7);
  });

  it('reports correct numberOfUniqueValues', () => {
    const stats = calculateNOf1VariableStatistics([1, 1, 2, 2, 3, 3, 3]);
    expect(stats.numberOfUniqueValues).toBe(3);
  });

  // ── Skewness ─────────────────────────────────────────────────────────────

  it('returns approximately zero skewness for symmetric data', () => {
    // Symmetric about 5: [1,2,3,4,5,6,7,8,9]
    const stats = calculateNOf1VariableStatistics([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(Math.abs(stats.skewness)).toBeLessThan(0.01);
  });

  it('returns positive skewness for right-skewed data', () => {
    // Right-skewed: most values small, few large
    const stats = calculateNOf1VariableStatistics([1, 1, 1, 1, 2, 2, 3, 10, 20]);
    expect(stats.skewness).toBeGreaterThan(0);
  });

  it('returns negative skewness for left-skewed data', () => {
    // Left-skewed: most values large, few small
    const stats = calculateNOf1VariableStatistics([
      1, 10, 18, 19, 19, 20, 20, 20, 20,
    ]);
    expect(stats.skewness).toBeLessThan(0);
  });

  it('returns zero skewness when stddev is zero (all same values, n>=3)', () => {
    const stats = calculateNOf1VariableStatistics([7, 7, 7, 7, 7]);
    expect(stats.skewness).toBe(0);
  });

  // ── Kurtosis ─────────────────────────────────────────────────────────────

  it('returns approximately zero excess kurtosis for near-normal data', () => {
    // A rough normal-ish sample — excess kurtosis ≈ 0
    // Using a large symmetric uniform: excess kurtosis is -1.2 for uniform,
    // so let's just verify it's a reasonable number
    const normal = [
      -3, -2.5, -2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2, 2.5, 3,
    ];
    const stats = calculateNOf1VariableStatistics(normal);
    // Uniform-ish data has negative excess kurtosis (platykurtic)
    expect(stats.kurtosis).toBeLessThan(1);
    expect(stats.kurtosis).toBeGreaterThan(-3);
  });

  it('returns positive excess kurtosis for leptokurtic data (heavy tails)', () => {
    // Data with extreme outliers → heavy tails → positive excess kurtosis
    const data = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 100, -100];
    const stats = calculateNOf1VariableStatistics(data);
    expect(stats.kurtosis).toBeGreaterThan(0);
  });

  it('returns negative excess kurtosis for platykurtic data (light tails)', () => {
    // Uniform distribution: excess kurtosis ≈ -1.2
    const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
    const stats = calculateNOf1VariableStatistics(data);
    expect(stats.kurtosis).toBeLessThan(0);
  });

  it('returns zero kurtosis when stddev is zero', () => {
    const stats = calculateNOf1VariableStatistics([3, 3, 3, 3, 3, 3]);
    expect(stats.kurtosis).toBe(0);
  });

  it('returns zero kurtosis when n < 4', () => {
    const stats = calculateNOf1VariableStatistics([1, 5, 9]);
    expect(stats.kurtosis).toBe(0);
  });

  // ── Most Common Value ────────────────────────────────────────────────────

  it('identifies the most common value', () => {
    const stats = calculateNOf1VariableStatistics([1, 2, 2, 3, 3, 3, 4]);
    expect(stats.mostCommonValue).toBe(3);
  });

  it('identifies the second most common value', () => {
    const stats = calculateNOf1VariableStatistics([1, 2, 2, 3, 3, 3, 4]);
    expect(stats.secondMostCommonValue).toBe(2);
  });

  it('returns null secondMostCommonValue when only one unique value', () => {
    const stats = calculateNOf1VariableStatistics([5, 5, 5]);
    expect(stats.mostCommonValue).toBe(5);
    expect(stats.secondMostCommonValue).toBeNull();
  });

  it('breaks ties in most-common by smaller value', () => {
    // 2 and 3 both appear twice — smaller should be mostCommon
    const stats = calculateNOf1VariableStatistics([2, 3, 2, 3]);
    expect(stats.mostCommonValue).toBe(2);
    expect(stats.secondMostCommonValue).toBe(3);
  });

  // ── Timestamps ───────────────────────────────────────────────────────────

  it('calculates first and last measurement dates', () => {
    const ts = [
      new Date('2024-03-15T10:00:00Z'),
      new Date('2024-01-01T00:00:00Z'),
      new Date('2024-06-20T14:30:00Z'),
    ];
    const stats = calculateNOf1VariableStatistics([1, 2, 3], ts);
    expect(stats.firstMeasurementAt!.getTime()).toBe(
      new Date('2024-01-01T00:00:00Z').getTime(),
    );
    expect(stats.lastMeasurementAt!.getTime()).toBe(
      new Date('2024-06-20T14:30:00Z').getTime(),
    );
  });

  it('calculates medianSecondsBetweenMeasurements for evenly spaced timestamps', () => {
    // 3 timestamps, 60s apart each → diffs = [60, 60], median = 60
    const ts = [
      new Date('2024-01-01T00:00:00Z'),
      new Date('2024-01-01T00:01:00Z'),
      new Date('2024-01-01T00:02:00Z'),
    ];
    const stats = calculateNOf1VariableStatistics([1, 2, 3], ts);
    expect(stats.medianSecondsBetweenMeasurements).toBe(60);
  });

  it('calculates medianSecondsBetweenMeasurements for unevenly spaced timestamps', () => {
    // diffs = [60, 120, 60, 300] → sorted [60, 60, 120, 300] → median = (60+120)/2 = 90
    const ts = [
      new Date('2024-01-01T00:00:00Z'),
      new Date('2024-01-01T00:01:00Z'),
      new Date('2024-01-01T00:03:00Z'),
      new Date('2024-01-01T00:04:00Z'),
      new Date('2024-01-01T00:09:00Z'),
    ];
    const stats = calculateNOf1VariableStatistics([1, 2, 3, 4, 5], ts);
    expect(stats.medianSecondsBetweenMeasurements).toBe(90);
  });

  it('returns null medianSecondsBetweenMeasurements for a single timestamp', () => {
    const ts = [new Date('2024-01-01T00:00:00Z')];
    const stats = calculateNOf1VariableStatistics([1], ts);
    expect(stats.medianSecondsBetweenMeasurements).toBeNull();
  });

  it('returns null timestamps when no timestamps provided', () => {
    const stats = calculateNOf1VariableStatistics([1, 2, 3]);
    expect(stats.firstMeasurementAt).toBeNull();
    expect(stats.lastMeasurementAt).toBeNull();
    expect(stats.medianSecondsBetweenMeasurements).toBeNull();
  });

  // ── Negative values ──────────────────────────────────────────────────────

  it('handles negative values correctly', () => {
    const stats = calculateNOf1VariableStatistics([-5, -3, -1, 0, 2, 4]);
    expect(round(stats.mean, 4)).toBe(round(-0.5, 4));
    expect(stats.minimumRecordedValue).toBe(-5);
    expect(stats.maximumRecordedValue).toBe(4);
    expect(stats.median).toBe(-0.5);
  });

  // ── Floating point values ────────────────────────────────────────────────

  it('handles floating point values', () => {
    const stats = calculateNOf1VariableStatistics([1.5, 2.7, 3.14, 4.2, 5.9]);
    expect(round(stats.mean, 2)).toBe(round(17.44 / 5, 2));
    expect(stats.median).toBe(3.14);
  });

  // ── Large dataset ────────────────────────────────────────────────────────

  it('handles a large dataset without errors', () => {
    const values = Array.from({ length: 10000 }, (_, i) => i);
    const stats = calculateNOf1VariableStatistics(values);
    expect(stats.numberOfMeasurements).toBe(10000);
    expect(stats.mean).toBe(4999.5);
    expect(stats.minimumRecordedValue).toBe(0);
    expect(stats.maximumRecordedValue).toBe(9999);
    expect(stats.median).toBe(4999.5);
  });

  // ── Unordered input ──────────────────────────────────────────────────────

  it('produces correct median regardless of input order', () => {
    const stats = calculateNOf1VariableStatistics([5, 1, 3, 2, 4]);
    expect(stats.median).toBe(3);
  });
});

// ─── aggregateGlobalStatistics ───────────────────────────────────────────────

describe('aggregateGlobalStatistics', () => {
  // Helper to build a minimal NOf1VariableStatistics
  function makeUnitStats(
    overrides: Partial<NOf1VariableStatistics> = {},
  ): NOf1VariableStatistics {
    return {
      mean: 0,
      median: 0,
      standardDeviation: 0,
      variance: 0,
      skewness: 0,
      kurtosis: 0,
      minimumRecordedValue: 0,
      maximumRecordedValue: 0,
      numberOfMeasurements: 0,
      numberOfUniqueValues: 0,
      mostCommonValue: null,
      secondMostCommonValue: null,
      lastMeasurementAt: null,
      firstMeasurementAt: null,
      medianSecondsBetweenMeasurements: null,
      ...overrides,
    };
  }

  it('returns zeros for an empty array', () => {
    const global = aggregateGlobalStatistics([]);
    expect(global.numberOfNOf1Variables).toBe(0);
    expect(global.globalMean).toBe(0);
    expect(global.globalStandardDeviation).toBe(0);
    expect(global.totalMeasurements).toBe(0);
  });

  it('returns correct stats for a single unit', () => {
    const global = aggregateGlobalStatistics([
      makeUnitStats({
        mean: 10,
        variance: 4,
        standardDeviation: 2,
        numberOfMeasurements: 100,
        minimumRecordedValue: 5,
        maximumRecordedValue: 15,
      }),
    ]);
    expect(global.numberOfNOf1Variables).toBe(1);
    expect(global.globalMean).toBe(10);
    expect(round(global.globalStandardDeviation)).toBe(2);
    expect(global.globalMinimumRecordedValue).toBe(5);
    expect(global.globalMaximumRecordedValue).toBe(15);
    expect(global.totalMeasurements).toBe(100);
  });

  it('calculates weighted mean across two units', () => {
    const global = aggregateGlobalStatistics([
      makeUnitStats({ mean: 10, variance: 0, numberOfMeasurements: 100, minimumRecordedValue: 5, maximumRecordedValue: 15 }),
      makeUnitStats({ mean: 20, variance: 0, numberOfMeasurements: 100, minimumRecordedValue: 10, maximumRecordedValue: 25 }),
    ]);
    expect(global.globalMean).toBe(15); // (10×100 + 20×100) / 200
  });

  it('weights mean by numberOfMeasurements', () => {
    const global = aggregateGlobalStatistics([
      makeUnitStats({ mean: 10, variance: 0, numberOfMeasurements: 900, minimumRecordedValue: 5, maximumRecordedValue: 15 }),
      makeUnitStats({ mean: 20, variance: 0, numberOfMeasurements: 100, minimumRecordedValue: 10, maximumRecordedValue: 25 }),
    ]);
    // Weighted: (10×900 + 20×100) / 1000 = 11
    expect(global.globalMean).toBe(11);
  });

  it('takes global min and max across units', () => {
    const global = aggregateGlobalStatistics([
      makeUnitStats({ mean: 5, numberOfMeasurements: 10, minimumRecordedValue: 1, maximumRecordedValue: 10 }),
      makeUnitStats({ mean: 15, numberOfMeasurements: 10, minimumRecordedValue: 8, maximumRecordedValue: 20 }),
    ]);
    expect(global.globalMinimumRecordedValue).toBe(1);
    expect(global.globalMaximumRecordedValue).toBe(20);
  });

  it('sums totalMeasurements across units', () => {
    const global = aggregateGlobalStatistics([
      makeUnitStats({ mean: 5, numberOfMeasurements: 50, minimumRecordedValue: 0, maximumRecordedValue: 10 }),
      makeUnitStats({ mean: 10, numberOfMeasurements: 150, minimumRecordedValue: 5, maximumRecordedValue: 15 }),
      makeUnitStats({ mean: 15, numberOfMeasurements: 300, minimumRecordedValue: 10, maximumRecordedValue: 20 }),
    ]);
    expect(global.totalMeasurements).toBe(500);
  });

  it('calculates combined standard deviation accounting for within-group and between-group variance', () => {
    // User A: mean=10, var=4, n=100
    // User B: mean=20, var=9, n=100
    // Weighted mean = 15
    // Combined var = (100*(4 + (10-15)²) + 100*(9 + (20-15)²)) / 200
    //              = (100*(4+25) + 100*(9+25)) / 200
    //              = (2900 + 3400) / 200 = 31.5
    // Combined sd  = sqrt(31.5) ≈ 5.612486
    const global = aggregateGlobalStatistics([
      makeUnitStats({ mean: 10, variance: 4, numberOfMeasurements: 100, minimumRecordedValue: 5, maximumRecordedValue: 15 }),
      makeUnitStats({ mean: 20, variance: 9, numberOfMeasurements: 100, minimumRecordedValue: 10, maximumRecordedValue: 25 }),
    ]);
    expect(round(global.globalStandardDeviation, 4)).toBe(
      round(Math.sqrt(31.5), 4),
    );
  });

  it('skips units with zero measurements', () => {
    const global = aggregateGlobalStatistics([
      makeUnitStats({ mean: 10, variance: 4, numberOfMeasurements: 100, minimumRecordedValue: 5, maximumRecordedValue: 15 }),
      makeUnitStats({ mean: 999, variance: 999, numberOfMeasurements: 0 }),
    ]);
    expect(global.numberOfNOf1Variables).toBe(2); // still counted
    expect(global.globalMean).toBe(10); // only unit A matters
    expect(global.totalMeasurements).toBe(100);
  });

  it('handles all units having zero measurements', () => {
    const global = aggregateGlobalStatistics([
      makeUnitStats({ numberOfMeasurements: 0 }),
      makeUnitStats({ numberOfMeasurements: 0 }),
    ]);
    expect(global.numberOfNOf1Variables).toBe(2);
    expect(global.globalMean).toBe(0);
    expect(global.totalMeasurements).toBe(0);
  });

  it('handles many units with varying measurement counts', () => {
    const units = Array.from({ length: 50 }, (_, i) =>
      makeUnitStats({
        mean: i * 2,
        variance: 1,
        numberOfMeasurements: 10 + i,
        minimumRecordedValue: i * 2 - 5,
        maximumRecordedValue: i * 2 + 5,
      }),
    );
    const global = aggregateGlobalStatistics(units);
    expect(global.numberOfNOf1Variables).toBe(50);
    expect(global.totalMeasurements).toBe(
      units.reduce((s, u) => s + u.numberOfMeasurements, 0),
    );
    expect(global.globalMinimumRecordedValue).toBe(-5);
    expect(global.globalMaximumRecordedValue).toBe(103);
    // Weighted mean should be between 0 and 98
    expect(global.globalMean).toBeGreaterThan(0);
    expect(global.globalMean).toBeLessThan(98);
  });
});

// ─── Integration: calculate then aggregate ───────────────────────────────────

describe('end-to-end: calculate then aggregate', () => {
  it('calculates unit stats and aggregates into global stats', () => {
    const unitA = calculateNOf1VariableStatistics([5, 10, 15, 20, 25]);
    const unitB = calculateNOf1VariableStatistics([100, 200, 300]);
    const global = aggregateGlobalStatistics([unitA, unitB]);

    expect(global.numberOfNOf1Variables).toBe(2);
    expect(global.totalMeasurements).toBe(8);
    // Weighted mean: (15×5 + 200×3) / 8 = (75+600)/8 = 84.375
    expect(round(global.globalMean, 3)).toBe(84.375);
    expect(global.globalMinimumRecordedValue).toBe(5);
    expect(global.globalMaximumRecordedValue).toBe(300);
  });

  it('correctly propagates zero-measurement unit in aggregation', () => {
    const unitA = calculateNOf1VariableStatistics([10, 20, 30]);
    const unitEmpty = calculateNOf1VariableStatistics([]);
    const global = aggregateGlobalStatistics([unitA, unitEmpty]);

    expect(global.numberOfNOf1Variables).toBe(2);
    expect(global.totalMeasurements).toBe(3);
    expect(global.globalMean).toBe(20);
  });
});

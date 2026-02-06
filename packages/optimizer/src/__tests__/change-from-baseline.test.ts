/**
 * Tests for change-from-baseline analysis and optimal daily value calculations.
 *
 * @see packages/optimizer/src/change-from-baseline.ts
 */

import { describe, it, expect } from 'vitest';
import type { AlignedPair } from '../types.js';
import {
  calculateBaselineFollowup,
  calculateOptimalValues,
  groupToPracticalValue,
  type BaselineFollowupAnalysis,
  type OptimalValueAnalysis,
} from '../change-from-baseline.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Shorthand for creating an AlignedPair */
function pair(predictorValue: number, outcomeValue: number): AlignedPair {
  return {
    predictorValue,
    outcomeValue,
    predictorTimestamp: Date.now(),
    outcomeTimestamp: Date.now(),
  };
}

/** Create N evenly-spaced pairs */
function evenPairs(
  n: number,
  predictorRange: [number, number],
  outcomeRange: [number, number],
): AlignedPair[] {
  const pairs: AlignedPair[] = [];
  for (let i = 0; i < n; i++) {
    const pVal =
      predictorRange[0] +
      (predictorRange[1] - predictorRange[0]) * (i / (n - 1));
    const oVal =
      outcomeRange[0] + (outcomeRange[1] - outcomeRange[0]) * (i / (n - 1));
    pairs.push(pair(pVal, oVal));
  }
  return pairs;
}

// ---------------------------------------------------------------------------
// groupToPracticalValue
// ---------------------------------------------------------------------------

describe('groupToPracticalValue', () => {
  it('returns 0 for 0', () => {
    expect(groupToPracticalValue(0)).toBe(0);
  });

  it('returns 0 for NaN', () => {
    expect(groupToPracticalValue(NaN)).toBe(0);
  });

  it('returns 0 for Infinity', () => {
    expect(groupToPracticalValue(Infinity)).toBe(0);
  });

  it('rounds tiny values to nearest 0.01', () => {
    expect(groupToPracticalValue(0.037)).toBe(0.04);
    expect(groupToPracticalValue(0.094)).toBe(0.09);
  });

  it('rounds small values (0.1–1) to nearest 0.1', () => {
    expect(groupToPracticalValue(0.54)).toBe(0.5);
    expect(groupToPracticalValue(0.86)).toBe(0.9);
  });

  it('rounds values 1–10 to nearest 0.5', () => {
    expect(groupToPracticalValue(3.3)).toBe(3.5);
    expect(groupToPracticalValue(7.1)).toBe(7);
  });

  it('rounds values 10–100 to nearest 5', () => {
    expect(groupToPracticalValue(47)).toBe(45);
    expect(groupToPracticalValue(73)).toBe(75);
  });

  it('rounds values 100–1000 to nearest 50', () => {
    expect(groupToPracticalValue(487)).toBe(500);
    expect(groupToPracticalValue(123)).toBe(100);
    expect(groupToPracticalValue(875)).toBe(900);
  });

  it('rounds values 1000–10000 to nearest 500', () => {
    expect(groupToPracticalValue(2200)).toBe(2000);
    expect(groupToPracticalValue(2750)).toBe(3000);
  });

  it('rounds values >10000 to nearest 1000', () => {
    expect(groupToPracticalValue(15500)).toBe(16000);
    expect(groupToPracticalValue(12400)).toBe(12000);
  });

  it('handles negative values', () => {
    expect(groupToPracticalValue(-487)).toBe(-500);
    expect(groupToPracticalValue(-0.037)).toBe(-0.04);
    expect(groupToPracticalValue(-73)).toBe(-75);
  });
});

// ---------------------------------------------------------------------------
// calculateBaselineFollowup
// ---------------------------------------------------------------------------

describe('calculateBaselineFollowup', () => {
  it('throws on fewer than 2 pairs', () => {
    expect(() => calculateBaselineFollowup([])).toThrow('Insufficient data');
    expect(() => calculateBaselineFollowup([pair(1, 2)])).toThrow(
      'Insufficient data',
    );
  });

  it('splits pairs correctly by predictor mean', () => {
    // Mean predictor = (1+2+3+4)/4 = 2.5
    const pairs = [pair(1, 10), pair(2, 20), pair(3, 30), pair(4, 40)];
    const result = calculateBaselineFollowup(pairs);

    // 1 < 2.5 and 2 < 2.5 → baseline
    expect(result.baselinePairs).toHaveLength(2);
    // 3 >= 2.5 and 4 >= 2.5 → followup
    expect(result.followupPairs).toHaveLength(2);
  });

  it('calculates correct baseline and followup averages', () => {
    // predictor: 0, 0, 10, 10 → mean = 5
    // baseline (pred < 5): pairs with pred=0 → outcomes 100, 100
    // followup (pred >= 5): pairs with pred=10 → outcomes 200, 200
    const pairs = [
      pair(0, 100),
      pair(0, 100),
      pair(10, 200),
      pair(10, 200),
    ];
    const result = calculateBaselineFollowup(pairs);

    expect(result.outcomeBaselineAverage).toBe(100);
    expect(result.outcomeFollowUpAverage).toBe(200);
    expect(result.outcomeFollowUpPercentChangeFromBaseline).toBe(100);
  });

  it('handles zero baseline average with absolute difference', () => {
    // predictor: 0, 10 → mean = 5
    // baseline: pred=0 → outcome=0
    // followup: pred=10 → outcome=50
    const pairs = [pair(0, 0), pair(10, 50)];
    const result = calculateBaselineFollowup(pairs);

    expect(result.outcomeBaselineAverage).toBe(0);
    expect(result.outcomeFollowUpAverage).toBe(50);
    // When baseline=0, falls back to absolute difference
    expect(result.outcomeFollowUpPercentChangeFromBaseline).toBe(50);
  });

  it('computes predictor baseline and followup averages', () => {
    // predictor: 2, 4, 6, 8 → mean = 5
    // baseline: 2, 4 → avg = 3
    // followup: 6, 8 → avg = 7
    const pairs = [pair(2, 10), pair(4, 20), pair(6, 30), pair(8, 40)];
    const result = calculateBaselineFollowup(pairs);

    expect(result.predictorBaselineAverage).toBe(3);
    expect(result.predictorFollowUpAverage).toBe(7);
  });

  it('computes baseline standard deviation', () => {
    // predictor: 0, 0, 10 → mean ≈ 3.33
    // baseline: pred 0 → outcomes: [100, 120] → sample std
    const pairs = [pair(0, 100), pair(0, 120), pair(10, 200)];
    const result = calculateBaselineFollowup(pairs);

    // baseline outcomes: [100, 120], sample std = sqrt(200) ≈ 14.14
    expect(result.outcomeBaselineStandardDeviation).toBeCloseTo(14.142, 1);
  });

  it('computes relative standard deviation', () => {
    const pairs = [pair(0, 100), pair(0, 120), pair(10, 200)];
    const result = calculateBaselineFollowup(pairs);

    // baseline mean = 110, std ≈ 14.14
    // RSD = 14.14 / 110 * 100 ≈ 12.86
    expect(result.outcomeBaselineRelativeStandardDeviation).toBeCloseTo(
      12.856,
      0,
    );
  });

  it('computes z-score', () => {
    const pairs = [pair(0, 100), pair(0, 120), pair(10, 200)];
    const result = calculateBaselineFollowup(pairs);

    // percentChange = (200 - 110)/110 * 100 = 81.8%
    // RSD ≈ 12.86
    // zScore = 81.8 / 12.86 ≈ 6.36
    expect(result.zScore).toBeGreaterThan(5);
    expect(result.zScore).toBeLessThan(8);
  });

  it('returns z-score 0 when baseline RSD is 0', () => {
    // All baseline outcomes identical → std = 0 → RSD = 0
    const pairs = [pair(0, 100), pair(0, 100), pair(10, 200)];
    const result = calculateBaselineFollowup(pairs);

    expect(result.outcomeBaselineRelativeStandardDeviation).toBe(0);
    expect(result.zScore).toBe(0);
  });

  it('handles all pairs above predictor mean (all followup)', () => {
    // All identical predictor → mean = 5, all >= mean → all followup
    const pairs = [pair(5, 10), pair(5, 20), pair(5, 30)];
    const result = calculateBaselineFollowup(pairs);

    expect(result.baselinePairs).toHaveLength(0);
    expect(result.followupPairs).toHaveLength(3);
    expect(result.outcomeBaselineAverage).toBe(0);
    expect(result.predictorBaselineAverage).toBe(0);
  });

  it('handles all pairs below predictor mean (all baseline) — impossible naturally', () => {
    // Can't actually happen since mean = average of values and some will be >= mean.
    // But with identical values and strict < they all go to followup.
    // Let's use a case with all values equal → all go to followup
    const pairs = [pair(3, 10), pair(3, 20)];
    const result = calculateBaselineFollowup(pairs);

    // mean = 3, 3 >= 3 → all followup
    expect(result.baselinePairs).toHaveLength(0);
    expect(result.followupPairs).toHaveLength(2);
  });

  it('handles negative predictor and outcome values', () => {
    const pairs = [pair(-10, -50), pair(-5, -30), pair(5, 30), pair(10, 50)];
    const result = calculateBaselineFollowup(pairs);

    // mean predictor = 0
    // baseline: -10, -5 → outcomes: -50, -30 → avg = -40
    // followup: 5, 10 → outcomes: 30, 50 → avg = 40
    expect(result.outcomeBaselineAverage).toBe(-40);
    expect(result.outcomeFollowUpAverage).toBe(40);
    // percent change = (40 - (-40)) / (-40) * 100 = -200%
    // Legacy PHP divides by baselineMean directly (not abs), so negative baseline
    // produces a negative percent change even when outcome improves.
    expect(result.outcomeFollowUpPercentChangeFromBaseline).toBe(-200);
  });

  it('rounds percent change to 1 decimal place', () => {
    // Construct values that create a non-round percent change
    const pairs = [
      pair(0, 100),
      pair(0, 103),
      pair(10, 147),
      pair(10, 150),
    ];
    const result = calculateBaselineFollowup(pairs);

    // baseline avg = 101.5, followup avg = 148.5
    // change = (148.5 - 101.5)/101.5 * 100 = 46.305... → rounds to 46.3
    const pctStr = result.outcomeFollowUpPercentChangeFromBaseline.toString();
    const decimals = pctStr.includes('.')
      ? pctStr.split('.')[1]!.length
      : 0;
    expect(decimals).toBeLessThanOrEqual(1);
  });

  it('works with large datasets', () => {
    const pairs = evenPairs(1000, [0, 100], [0, 200]);
    const result = calculateBaselineFollowup(pairs);

    expect(result.baselinePairs.length).toBeGreaterThan(0);
    expect(result.followupPairs.length).toBeGreaterThan(0);
    expect(result.outcomeFollowUpPercentChangeFromBaseline).toBeGreaterThan(0);
  });

  it('known synthetic data: exact values', () => {
    // 4 baseline pairs (predictor < 5): predictor 1,2,3,4 → outcome 10 each
    // 4 followup pairs (predictor >= 5): predictor 6,7,8,9 → outcome 20 each
    const pairs = [
      pair(1, 10), pair(2, 10), pair(3, 10), pair(4, 10),
      pair(6, 20), pair(7, 20), pair(8, 20), pair(9, 20),
    ];
    const result = calculateBaselineFollowup(pairs);

    expect(result.baselinePairs).toHaveLength(4);
    expect(result.followupPairs).toHaveLength(4);
    expect(result.outcomeBaselineAverage).toBe(10);
    expect(result.outcomeFollowUpAverage).toBe(20);
    expect(result.outcomeFollowUpPercentChangeFromBaseline).toBe(100);
    expect(result.outcomeBaselineStandardDeviation).toBe(0);
    expect(result.outcomeBaselineRelativeStandardDeviation).toBe(0);
    expect(result.predictorBaselineAverage).toBe(2.5);
    expect(result.predictorFollowUpAverage).toBe(7.5);
    expect(result.zScore).toBe(0); // RSD is 0
  });
});

// ---------------------------------------------------------------------------
// calculateOptimalValues
// ---------------------------------------------------------------------------

describe('calculateOptimalValues', () => {
  it('throws on fewer than 2 pairs', () => {
    expect(() => calculateOptimalValues([])).toThrow('Insufficient data');
    expect(() => calculateOptimalValues([pair(1, 2)])).toThrow(
      'Insufficient data',
    );
  });

  it('splits by outcome mean and computes valuePredicting high/low', () => {
    // outcome mean = (10+20+30+40)/4 = 25
    // high outcome (>25): pairs with outcome 30, 40 → predictor 3, 4 → avg = 3.5
    // low outcome (<=25): pairs with outcome 10, 20 → predictor 1, 2 → avg = 1.5
    const pairs = [pair(1, 10), pair(2, 20), pair(3, 30), pair(4, 40)];
    const result = calculateOptimalValues(pairs);

    expect(result.valuePredictingHighOutcome).toBe(3.5);
    expect(result.valuePredictingLowOutcome).toBe(1.5);
  });

  it('optimalDailyValue equals valuePredictingHighOutcome', () => {
    const pairs = [pair(1, 10), pair(2, 20), pair(3, 30), pair(4, 40)];
    const result = calculateOptimalValues(pairs);

    expect(result.optimalDailyValue).toBe(result.valuePredictingHighOutcome);
  });

  it('calculates averageOutcomeFollowingHighPredictor', () => {
    // predictor mean = 2.5
    // high predictor (>=2.5): pairs with pred 3,4 → outcomes 30, 40 → avg = 35
    // low predictor (<2.5): pairs with pred 1,2 → outcomes 10, 20 → avg = 15
    const pairs = [pair(1, 10), pair(2, 20), pair(3, 30), pair(4, 40)];
    const result = calculateOptimalValues(pairs);

    expect(result.averageOutcomeFollowingHighPredictor).toBe(35);
    expect(result.averageOutcomeFollowingLowPredictor).toBe(15);
  });

  it('calculates averageDailyHighPredictor and Low', () => {
    const pairs = [pair(1, 10), pair(2, 20), pair(3, 30), pair(4, 40)];
    const result = calculateOptimalValues(pairs);

    // predictor mean = 2.5
    // high: 3, 4 → avg = 3.5
    // low: 1, 2 → avg = 1.5
    expect(result.averageDailyHighPredictor).toBe(3.5);
    expect(result.averageDailyLowPredictor).toBe(1.5);
  });

  it('produces grouped / rounded values', () => {
    // valuePredictingHigh ≈ 487 → grouped = 500
    const pairs = [
      pair(100, 10),
      pair(200, 10),
      pair(300, 30),
      pair(875, 40),
    ];
    const result = calculateOptimalValues(pairs);

    expect(
      result.groupedValueClosestToValuePredictingHighOutcome,
    ).toBeDefined();
    expect(
      result.groupedValueClosestToValuePredictingLowOutcome,
    ).toBeDefined();
    // Both should be finite numbers
    expect(isFinite(result.groupedValueClosestToValuePredictingHighOutcome)).toBe(true);
    expect(isFinite(result.groupedValueClosestToValuePredictingLowOutcome)).toBe(true);
  });

  it('predictsHighOutcomeChange is positive for clear high-outcome group', () => {
    // outcome spread: 10 to 40 = 30
    // high group avg outcome > overall avg → positive change
    const pairs = [pair(1, 10), pair(2, 20), pair(3, 30), pair(4, 40)];
    const result = calculateOptimalValues(pairs);

    expect(result.predictsHighOutcomeChange).toBeGreaterThan(0);
  });

  it('predictsLowOutcomeChange is negative for clear low-outcome group', () => {
    const pairs = [pair(1, 10), pair(2, 20), pair(3, 30), pair(4, 40)];
    const result = calculateOptimalValues(pairs);

    expect(result.predictsLowOutcomeChange).toBeLessThan(0);
  });

  it('handles all identical outcomes gracefully', () => {
    // All outcomes = 50 → mean = 50 → no pair has outcome > 50
    // All go to low-effect group
    const pairs = [pair(1, 50), pair(2, 50), pair(3, 50), pair(4, 50)];
    const result = calculateOptimalValues(pairs);

    // When no high-effect pairs, fallback to overall predictor mean
    expect(result.valuePredictingHighOutcome).toBe(2.5);
    expect(result.valuePredictingLowOutcome).toBe(2.5);
    // Spread = 0 → predictsChange = 0
    expect(result.predictsHighOutcomeChange).toBe(0);
    expect(result.predictsLowOutcomeChange).toBe(0);
  });

  it('handles all identical predictors', () => {
    const pairs = [pair(5, 10), pair(5, 20), pair(5, 30), pair(5, 40)];
    const result = calculateOptimalValues(pairs);

    expect(result.averageDailyHighPredictor).toBe(5);
    expect(result.averageDailyLowPredictor).toBe(5);
  });

  it('handles negative values correctly', () => {
    const pairs = [pair(-10, -50), pair(-5, -30), pair(5, 30), pair(10, 50)];
    const result = calculateOptimalValues(pairs);

    // outcome mean = 0 → high outcome (>0): pred 5,10 → avg = 7.5
    // low outcome (<=0): pred -10,-5 → avg = -7.5
    expect(result.valuePredictingHighOutcome).toBe(7.5);
    expect(result.valuePredictingLowOutcome).toBe(-7.5);
  });

  it('known synthetic data: supplement dose-response', () => {
    // Simulating: 0mg → mood 3, 500mg → mood 3, 1000mg → mood 7, 1500mg → mood 8
    const pairs = [
      pair(0, 3),
      pair(0, 3),
      pair(500, 3),
      pair(500, 3),
      pair(1000, 7),
      pair(1000, 7),
      pair(1500, 8),
      pair(1500, 8),
    ];
    const result = calculateOptimalValues(pairs);

    // Outcome mean = (3+3+3+3+7+7+8+8)/8 = 5.25
    // High outcome (>5.25): pairs with outcome 7,7,8,8 → predictor 1000,1000,1500,1500 → avg = 1250
    // Low outcome (<=5.25): pairs with outcome 3,3,3,3 → predictor 0,0,500,500 → avg = 250
    expect(result.valuePredictingHighOutcome).toBe(1250);
    expect(result.valuePredictingLowOutcome).toBe(250);
    expect(result.groupedValueClosestToValuePredictingHighOutcome).toBe(1500);
    expect(result.groupedValueClosestToValuePredictingLowOutcome).toBe(250);
    expect(result.optimalDailyValue).toBe(1250);
  });

  it('works with large datasets', () => {
    const pairs = evenPairs(1000, [0, 100], [0, 200]);
    const result = calculateOptimalValues(pairs);

    expect(result.valuePredictingHighOutcome).toBeGreaterThan(50);
    expect(result.valuePredictingLowOutcome).toBeLessThan(50);
    expect(result.optimalDailyValue).toBeGreaterThan(0);
    expect(result.predictsHighOutcomeChange).toBeGreaterThan(0);
    expect(result.predictsLowOutcomeChange).toBeLessThan(0);
  });

  it('grouped values are coarser than raw values', () => {
    // raw value around 487 → grouped 500
    const pairs = [
      pair(100, 10),
      pair(200, 15),
      pair(487, 40),
      pair(490, 45),
    ];
    const result = calculateOptimalValues(pairs);

    const raw = result.valuePredictingHighOutcome;
    const grouped = result.groupedValueClosestToValuePredictingHighOutcome;
    // Grouped should be a "rounder" number
    expect(grouped % 5 === 0 || grouped % 50 === 0 || grouped % 0.5 === 0).toBe(true);
    // But close to raw
    expect(Math.abs(grouped - raw)).toBeLessThan(raw * 0.2 + 50);
  });
});

// ---------------------------------------------------------------------------
// Integration: baseline + optimal together
// ---------------------------------------------------------------------------

describe('integration: baseline + optimal analysis', () => {
  it('consistent results for clear dose-response', () => {
    // Clear positive relationship: more predictor → better outcome
    const pairs = [
      pair(0, 1), pair(0, 2),
      pair(10, 3), pair(10, 4),
      pair(20, 5), pair(20, 6),
      pair(30, 7), pair(30, 8),
    ];

    const baseline = calculateBaselineFollowup(pairs);
    const optimal = calculateOptimalValues(pairs);

    // Follow-up (high predictor) should have better outcomes
    expect(baseline.outcomeFollowUpAverage).toBeGreaterThan(
      baseline.outcomeBaselineAverage,
    );
    expect(baseline.outcomeFollowUpPercentChangeFromBaseline).toBeGreaterThan(0);

    // Optimal should recommend higher predictor values
    expect(optimal.valuePredictingHighOutcome).toBeGreaterThan(
      optimal.valuePredictingLowOutcome,
    );
    expect(optimal.predictsHighOutcomeChange).toBeGreaterThan(0);
  });

  it('inverse relationship: more predictor → worse outcome', () => {
    const pairs = [
      pair(0, 8), pair(0, 7),
      pair(10, 6), pair(10, 5),
      pair(20, 4), pair(20, 3),
      pair(30, 2), pair(30, 1),
    ];

    const baseline = calculateBaselineFollowup(pairs);
    const optimal = calculateOptimalValues(pairs);

    // Follow-up (high predictor) should have worse outcomes
    expect(baseline.outcomeFollowUpAverage).toBeLessThan(
      baseline.outcomeBaselineAverage,
    );
    expect(baseline.outcomeFollowUpPercentChangeFromBaseline).toBeLessThan(0);

    // Optimal: high outcome associated with lower predictor
    expect(optimal.valuePredictingHighOutcome).toBeLessThan(
      optimal.valuePredictingLowOutcome,
    );
  });

  it('no relationship: predictor does not affect outcome', () => {
    // All outcomes are the same regardless of predictor
    const pairs = [
      pair(0, 5), pair(10, 5), pair(20, 5), pair(30, 5),
      pair(0, 5), pair(10, 5), pair(20, 5), pair(30, 5),
    ];

    const baseline = calculateBaselineFollowup(pairs);

    expect(baseline.outcomeFollowUpPercentChangeFromBaseline).toBe(0);
    expect(baseline.zScore).toBe(0);
  });

  it('handles 2-pair minimum', () => {
    const pairs = [pair(0, 10), pair(100, 90)];

    const baseline = calculateBaselineFollowup(pairs);
    const optimal = calculateOptimalValues(pairs);

    // Should not throw, should produce results
    expect(baseline.baselinePairs.length + baseline.followupPairs.length).toBe(2);
    expect(optimal.optimalDailyValue).toBeDefined();
  });
});

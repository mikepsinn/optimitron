/**
 * Tests for population-level aggregate correlation pipeline.
 *
 * @see https://github.com/mikepsinn/curedao-api/blob/main/app/Correlations/QMAggregateCorrelation.php
 * @see https://github.com/mikepsinn/curedao-api/blob/main/app/Traits/HasMany/HasManyCorrelations.php#L57
 */
import { describe, it, expect } from 'vitest';
import { aggregateCorrelations } from '../statistics.js';
import type { UserCorrelationSummary } from '../types.js';

/** Helper to create a user correlation summary */
function makeUser(overrides: Partial<UserCorrelationSummary> & { userId: string }): UserCorrelationSummary {
  return {
    forwardPearson: 0.5,
    reversePearson: 0.3,
    predictivePearson: 0.2,
    effectSize: 10,
    statisticalSignificance: 0.8,
    numberOfPairs: 100,
    ...overrides,
  };
}

describe('aggregateCorrelations', () => {
  // ─── Empty array ───────────────────────────────────────
  it('should return sensible defaults for empty array', () => {
    const result = aggregateCorrelations([]);
    expect(result.numberOfUsers).toBe(0);
    expect(result.aggregateForwardPearson).toBe(0);
    expect(result.aggregateReversePearson).toBe(0);
    expect(result.aggregatePredictivePearson).toBe(0);
    expect(result.aggregateEffectSize).toBe(0);
    expect(result.aggregateStatisticalSignificance).toBe(0);
    expect(result.aggregateValuePredictingHighOutcome).toBeNull();
    expect(result.aggregateValuePredictingLowOutcome).toBeNull();
    expect(result.aggregateOptimalDailyValue).toBeNull();
    expect(result.aggregateEffectFollowUpPercentChangeFromBaseline).toBeNull();
    expect(result.weightedAveragePIS).toBe(0);
    expect(result.totalPairs).toBe(0);
  });

  // ─── Single user passthrough ───────────────────────────
  it('should pass through single user values', () => {
    const user = makeUser({
      userId: 'user1',
      forwardPearson: 0.7,
      reversePearson: 0.4,
      predictivePearson: 0.3,
      effectSize: 15,
      statisticalSignificance: 0.9,
      numberOfPairs: 200,
      valuePredictingHighOutcome: 50,
      valuePredictingLowOutcome: 10,
      optimalDailyValue: 30,
      effectFollowUpPercentChangeFromBaseline: 25,
    });
    const result = aggregateCorrelations([user]);

    expect(result.numberOfUsers).toBe(1);
    expect(result.aggregateForwardPearson).toBeCloseTo(0.7, 5);
    expect(result.aggregateReversePearson).toBeCloseTo(0.4, 5);
    expect(result.aggregatePredictivePearson).toBeCloseTo(0.3, 5);
    expect(result.aggregateEffectSize).toBeCloseTo(15, 5);
    expect(result.aggregateStatisticalSignificance).toBeCloseTo(0.9, 5);
    expect(result.aggregateValuePredictingHighOutcome).toBeCloseTo(50, 5);
    expect(result.aggregateValuePredictingLowOutcome).toBeCloseTo(10, 5);
    expect(result.aggregateOptimalDailyValue).toBeCloseTo(30, 5);
    expect(result.aggregateEffectFollowUpPercentChangeFromBaseline).toBeCloseTo(25, 5);
    expect(result.totalPairs).toBe(200);
  });

  // ─── Two users with similar results ────────────────────
  it('should aggregate near individual values for two similar users', () => {
    const users = [
      makeUser({ userId: 'u1', forwardPearson: 0.6, reversePearson: 0.3, predictivePearson: 0.3, effectSize: 12, statisticalSignificance: 0.85, numberOfPairs: 100 }),
      makeUser({ userId: 'u2', forwardPearson: 0.65, reversePearson: 0.32, predictivePearson: 0.33, effectSize: 13, statisticalSignificance: 0.87, numberOfPairs: 110 }),
    ];
    const result = aggregateCorrelations(users);

    expect(result.numberOfUsers).toBe(2);
    expect(result.aggregateForwardPearson).toBeCloseTo(0.625, 1);
    expect(result.aggregateReversePearson).toBeCloseTo(0.31, 1);
    expect(result.aggregateEffectSize).toBeCloseTo(12.5, 0);
    expect(result.totalPairs).toBe(210);
  });

  // ─── Five users with varied results ────────────────────
  it('should compute weighted average for five diverse users', () => {
    const users = [
      makeUser({ userId: 'u1', forwardPearson: 0.9, statisticalSignificance: 0.95, numberOfPairs: 500 }),
      makeUser({ userId: 'u2', forwardPearson: 0.3, statisticalSignificance: 0.5, numberOfPairs: 50 }),
      makeUser({ userId: 'u3', forwardPearson: 0.6, statisticalSignificance: 0.7, numberOfPairs: 200 }),
      makeUser({ userId: 'u4', forwardPearson: -0.2, statisticalSignificance: 0.3, numberOfPairs: 30 }),
      makeUser({ userId: 'u5', forwardPearson: 0.5, statisticalSignificance: 0.8, numberOfPairs: 300 }),
    ];
    const result = aggregateCorrelations(users);

    expect(result.numberOfUsers).toBe(5);
    // High significance users (u1, u5) should pull the aggregate up
    expect(result.aggregateForwardPearson).toBeGreaterThan(0.4);
    expect(result.totalPairs).toBe(1080);
  });

  // ─── High significance user should dominate ────────────
  it('should let high significance user dominate the aggregate', () => {
    const users = [
      makeUser({ userId: 'dominant', forwardPearson: 0.9, statisticalSignificance: 10.0, numberOfPairs: 1000 }),
      makeUser({ userId: 'minor1', forwardPearson: -0.5, statisticalSignificance: 0.1, numberOfPairs: 20 }),
      makeUser({ userId: 'minor2', forwardPearson: -0.3, statisticalSignificance: 0.1, numberOfPairs: 20 }),
    ];
    const result = aggregateCorrelations(users);

    // The dominant user (significance=10.0) should heavily influence the result
    // avgSignificance ≈ 3.4, so dominant's weight ≈ 10/3.4 ≈ 2.94 vs minor's ≈ 0.03
    expect(result.aggregateForwardPearson).toBeGreaterThan(0.5);
  });

  // ─── Equal significance → simple mean ──────────────────
  it('should reduce to simple mean when all significances are equal', () => {
    const users = [
      makeUser({ userId: 'u1', forwardPearson: 0.8, statisticalSignificance: 1.0, numberOfPairs: 100 }),
      makeUser({ userId: 'u2', forwardPearson: 0.4, statisticalSignificance: 1.0, numberOfPairs: 100 }),
      makeUser({ userId: 'u3', forwardPearson: 0.2, statisticalSignificance: 1.0, numberOfPairs: 100 }),
    ];
    const result = aggregateCorrelations(users);

    // When all weights are equal (weight = sig/avgSig = 1), weighted avg = simple mean
    const simpleMean = (0.8 + 0.4 + 0.2) / 3;
    expect(result.aggregateForwardPearson).toBeCloseTo(simpleMean, 10);
  });

  // ─── All zero significance → fall back to simple mean ──
  it('should fall back to simple mean when all significances are zero', () => {
    const users = [
      makeUser({ userId: 'u1', forwardPearson: 0.7, statisticalSignificance: 0, numberOfPairs: 50 }),
      makeUser({ userId: 'u2', forwardPearson: 0.3, statisticalSignificance: 0, numberOfPairs: 50 }),
    ];
    const result = aggregateCorrelations(users);

    // With zero significance, weights default to 1, so result = simple mean
    expect(result.aggregateForwardPearson).toBeCloseTo(0.5, 5);
  });

  // ─── Optional fields: all present ──────────────────────
  it('should aggregate optional fields when all users have them', () => {
    const users = [
      makeUser({ userId: 'u1', statisticalSignificance: 1.0, valuePredictingHighOutcome: 100, valuePredictingLowOutcome: 10, optimalDailyValue: 55, numberOfPairs: 100 }),
      makeUser({ userId: 'u2', statisticalSignificance: 1.0, valuePredictingHighOutcome: 80, valuePredictingLowOutcome: 20, optimalDailyValue: 50, numberOfPairs: 100 }),
    ];
    const result = aggregateCorrelations(users);

    expect(result.aggregateValuePredictingHighOutcome).toBeCloseTo(90, 5);
    expect(result.aggregateValuePredictingLowOutcome).toBeCloseTo(15, 5);
    expect(result.aggregateOptimalDailyValue).toBeCloseTo(52.5, 5);
  });

  // ─── Optional fields: partially present ────────────────
  it('should handle optional fields when only some users have them', () => {
    const users = [
      makeUser({ userId: 'u1', statisticalSignificance: 1.0, valuePredictingHighOutcome: 100, numberOfPairs: 100 }),
      makeUser({ userId: 'u2', statisticalSignificance: 1.0, numberOfPairs: 100 }),
    ];
    const result = aggregateCorrelations(users);

    // Only u1 has valuePredictingHighOutcome, so aggregate = u1's value
    expect(result.aggregateValuePredictingHighOutcome).toBeCloseTo(100, 5);
    // Neither has optimalDailyValue
    expect(result.aggregateOptimalDailyValue).toBeNull();
  });

  // ─── Optional fields: none present ─────────────────────
  it('should return null for optional fields when no users have them', () => {
    const users = [
      makeUser({ userId: 'u1', numberOfPairs: 100 }),
      makeUser({ userId: 'u2', numberOfPairs: 100 }),
    ];
    const result = aggregateCorrelations(users);

    expect(result.aggregateValuePredictingHighOutcome).toBeNull();
    expect(result.aggregateValuePredictingLowOutcome).toBeNull();
    expect(result.aggregateOptimalDailyValue).toBeNull();
    expect(result.aggregateEffectFollowUpPercentChangeFromBaseline).toBeNull();
  });

  // ─── Negative correlations aggregate correctly ─────────
  it('should handle all-negative forward correlations', () => {
    const users = [
      makeUser({ userId: 'u1', forwardPearson: -0.8, statisticalSignificance: 1.0, numberOfPairs: 100 }),
      makeUser({ userId: 'u2', forwardPearson: -0.6, statisticalSignificance: 1.0, numberOfPairs: 100 }),
    ];
    const result = aggregateCorrelations(users);

    expect(result.aggregateForwardPearson).toBeCloseTo(-0.7, 5);
    expect(result.aggregateForwardPearson).toBeLessThan(0);
  });

  // ─── Mixed positive and negative ──────────────────────
  it('should handle mixed positive and negative correlations', () => {
    const users = [
      makeUser({ userId: 'u1', forwardPearson: 0.8, statisticalSignificance: 1.0, numberOfPairs: 100 }),
      makeUser({ userId: 'u2', forwardPearson: -0.8, statisticalSignificance: 1.0, numberOfPairs: 100 }),
    ];
    const result = aggregateCorrelations(users);

    expect(result.aggregateForwardPearson).toBeCloseTo(0, 5);
  });

  // ─── Total pairs accumulates correctly ─────────────────
  it('should correctly sum total pairs across all users', () => {
    const users = [
      makeUser({ userId: 'u1', numberOfPairs: 150 }),
      makeUser({ userId: 'u2', numberOfPairs: 250 }),
      makeUser({ userId: 'u3', numberOfPairs: 100 }),
    ];
    const result = aggregateCorrelations(users);

    expect(result.totalPairs).toBe(500);
  });

  // ─── Weighted average PIS ──────────────────────────────
  it('should compute weighted average PIS as |forwardPearson| × significance', () => {
    const users = [
      makeUser({ userId: 'u1', forwardPearson: 0.8, statisticalSignificance: 1.0, numberOfPairs: 100 }),
      makeUser({ userId: 'u2', forwardPearson: 0.4, statisticalSignificance: 1.0, numberOfPairs: 100 }),
    ];
    const result = aggregateCorrelations(users);

    // PIS for u1 = |0.8| × 1.0 = 0.8, for u2 = |0.4| × 1.0 = 0.4
    // Simple mean (equal significance) = 0.6
    expect(result.weightedAveragePIS).toBeCloseTo(0.6, 5);
  });

  // ─── Effect follow-up percent change ───────────────────
  it('should aggregate effectFollowUpPercentChangeFromBaseline', () => {
    const users = [
      makeUser({ userId: 'u1', statisticalSignificance: 1.0, effectFollowUpPercentChangeFromBaseline: 20, numberOfPairs: 100 }),
      makeUser({ userId: 'u2', statisticalSignificance: 1.0, effectFollowUpPercentChangeFromBaseline: 30, numberOfPairs: 100 }),
    ];
    const result = aggregateCorrelations(users);

    expect(result.aggregateEffectFollowUpPercentChangeFromBaseline).toBeCloseTo(25, 5);
  });

  // ─── Predictive Pearson aggregation ────────────────────
  it('should aggregate predictive Pearson correctly', () => {
    const users = [
      makeUser({ userId: 'u1', predictivePearson: 0.4, statisticalSignificance: 2.0, numberOfPairs: 200 }),
      makeUser({ userId: 'u2', predictivePearson: 0.1, statisticalSignificance: 0.5, numberOfPairs: 50 }),
    ];
    const result = aggregateCorrelations(users);

    // avgSig = 1.25, weight1 = 2.0/1.25 = 1.6, weight2 = 0.5/1.25 = 0.4
    // weighted = (0.4*1.6 + 0.1*0.4) / 2 = (0.64 + 0.04) / 2 = 0.34
    expect(result.aggregatePredictivePearson).toBeCloseTo(0.34, 2);
  });

  // ─── Large number of users ─────────────────────────────
  it('should handle 100 users efficiently', () => {
    const users = Array.from({ length: 100 }, (_, i) => makeUser({
      userId: `user${i}`,
      forwardPearson: 0.5 + (i % 10) * 0.05 - 0.25,
      statisticalSignificance: 0.5 + Math.random() * 0.5,
      numberOfPairs: 50 + i,
    }));
    const result = aggregateCorrelations(users);

    expect(result.numberOfUsers).toBe(100);
    expect(result.totalPairs).toBeGreaterThan(5000);
    expect(result.aggregateForwardPearson).toBeGreaterThan(0);
    expect(result.aggregateForwardPearson).toBeLessThan(1);
  });

  // ─── Significance weighting verification ───────────────
  it('should verify that weighting formula matches legacy PHP pattern', () => {
    // Legacy PHP: weight_i = significance_i / avg(significance)
    // Then: result = mean(value_i * weight_i)
    const users = [
      makeUser({ userId: 'u1', forwardPearson: 0.9, statisticalSignificance: 0.6, numberOfPairs: 100 }),
      makeUser({ userId: 'u2', forwardPearson: 0.1, statisticalSignificance: 1.2, numberOfPairs: 100 }),
      makeUser({ userId: 'u3', forwardPearson: 0.5, statisticalSignificance: 0.9, numberOfPairs: 100 }),
    ];

    const avgSig = (0.6 + 1.2 + 0.9) / 3; // = 0.9
    const w1 = 0.6 / avgSig;
    const w2 = 1.2 / avgSig;
    const w3 = 0.9 / avgSig;
    const expectedForward = (0.9 * w1 + 0.1 * w2 + 0.5 * w3) / 3;

    const result = aggregateCorrelations(users);
    expect(result.aggregateForwardPearson).toBeCloseTo(expectedForward, 10);
  });
});

import { describe, expect, it } from 'vitest';

import {
  deriveSupportConstrainedTargets,
  estimateDiminishingReturns,
  estimateMinimumEffectiveDose,
  estimateSaturationRange,
} from '../response-curve.js';

function range(start: number, endInclusive: number): number[] {
  const values: number[] = [];
  for (let value = start; value <= endInclusive; value++) values.push(value);
  return values;
}

describe('estimateDiminishingReturns', () => {
  it('detects diminishing returns for saturating response curves', () => {
    const x = range(1, 300);
    const y = x.map((value) => 100 * (1 - Math.exp(-value / 45)));

    const result = estimateDiminishingReturns(x, y, {
      minSamples: 120,
      targetBinCount: 12,
      minBinSize: 20,
      minSlopePointsPerSegment: 2,
      maxPostToPreSlopeRatio: 0.5,
    });

    expect(result.detected).toBe(true);
    expect(result.kneePredictorValue).not.toBeNull();
    expect(result.firstSegmentSlope).not.toBeNull();
    expect(result.secondSegmentSlope).not.toBeNull();
    expect(result.slopeRatio).not.toBeNull();
    expect(result.firstSegmentSlope!).toBeGreaterThan(result.secondSegmentSlope!);
    expect(result.slopeRatio!).toBeLessThan(0.5);
    expect(result.bins.length).toBeGreaterThanOrEqual(6);
  });

  it('does not detect diminishing returns for linear relationships', () => {
    const x = range(1, 300);
    const y = x.map((value) => value * 3);

    const result = estimateDiminishingReturns(x, y, {
      minSamples: 120,
      targetBinCount: 10,
      minBinSize: 25,
      minSlopePointsPerSegment: 2,
      maxPostToPreSlopeRatio: 0.5,
    });

    expect(result.detected).toBe(false);
    expect(result.reason).toBeTruthy();
    expect(result.slopeRatio).not.toBeNull();
    expect(result.slopeRatio!).toBeGreaterThan(0.8);
  });

  it('returns insufficient-samples result when support is too low', () => {
    const x = range(1, 40);
    const y = x.map((value) => Math.log(value + 1));

    const result = estimateDiminishingReturns(x, y, {
      minSamples: 80,
      targetBinCount: 8,
      minBinSize: 10,
    });

    expect(result.detected).toBe(false);
    expect(result.reason).toBe('insufficient_samples');
    expect(result.support.sampleCount).toBe(40);
  });
});

describe('estimateMinimumEffectiveDose', () => {
  it('identifies a minimum effective dose for threshold-like effects', () => {
    const x = range(1, 400);
    const y = x.map((value, index) => {
      const base = value < 160 ? 50 : 58;
      return base + Math.sin(index * 0.13) * 0.4;
    });

    const result = estimateMinimumEffectiveDose(x, y, {
      minSamples: 120,
      targetBinCount: 12,
      minBinSize: 25,
      minConsecutiveBins: 2,
      minRelativeGainPercent: 4,
      minZScore: 1.25,
    });

    expect(result.detected).toBe(true);
    expect(result.minimumEffectiveDose).not.toBeNull();
    expect(result.minimumEffectiveDoseRange).not.toBeNull();
    expect(result.expectedGainAtDose).toBeGreaterThan(0);
    expect(result.expectedRelativeGainPercentAtDose).toBeGreaterThan(4);
    expect(result.zScoreAtDose).toBeGreaterThanOrEqual(1.25);
    // Should land near the synthetic threshold region.
    expect(result.minimumEffectiveDose!).toBeGreaterThan(110);
    expect(result.minimumEffectiveDose!).toBeLessThan(240);
  });

  it('returns no MED for flat/no-effect response', () => {
    const x = range(1, 360);
    const y = x.map((_, index) => 42 + Math.sin(index * 0.07) * 0.2);

    const result = estimateMinimumEffectiveDose(x, y, {
      minSamples: 120,
      targetBinCount: 12,
      minBinSize: 20,
      minConsecutiveBins: 2,
      minRelativeGainPercent: 3,
      minZScore: 1.5,
    });

    expect(result.detected).toBe(false);
    expect(result.reason).toBe('no_consistent_effective_dose_detected');
    expect(result.minimumEffectiveDose).toBeNull();
  });

  it('requires consecutive bins instead of accepting isolated spikes', () => {
    const x = range(1, 360);
    const y = x.map((value) => {
      if (value >= 140 && value < 170) return 54; // single localized bump
      return 50;
    });

    const result = estimateMinimumEffectiveDose(x, y, {
      minSamples: 120,
      targetBinCount: 12,
      minBinSize: 20,
      minConsecutiveBins: 3,
      minRelativeGainPercent: 3,
      minZScore: 0.8,
    });

    expect(result.detected).toBe(false);
    expect(result.reason).toBe('no_consistent_effective_dose_detected');
  });

  it('returns insufficient-samples when not enough observations are available', () => {
    const x = range(1, 40);
    const y = x.map((value) => value);

    const result = estimateMinimumEffectiveDose(x, y, {
      minSamples: 100,
      targetBinCount: 8,
      minBinSize: 10,
    });

    expect(result.detected).toBe(false);
    expect(result.reason).toBe('insufficient_samples');
    expect(result.support.sampleCount).toBe(40);
  });
});

describe('estimateSaturationRange', () => {
  it('detects plateau zones for saturating response curves', () => {
    const x = range(1, 360);
    const y = x.map((value) => 80 * (1 - Math.exp(-value / 55)));

    const result = estimateSaturationRange(x, y, {
      minSamples: 120,
      targetBinCount: 12,
      minBinSize: 20,
      minConsecutiveSlopes: 2,
      maxMarginalGainFraction: 0.2,
    });

    expect(result.detected).toBe(true);
    expect(result.plateauStartPredictorValue).not.toBeNull();
    expect(result.plateauRange).not.toBeNull();
    expect(result.flatSlopeThreshold).not.toBeNull();
    expect(result.referenceSlope).not.toBeNull();
  });

  it('does not force a plateau detection on linear relationships', () => {
    const x = range(1, 360);
    const y = x.map((value) => value * 2.5);

    const result = estimateSaturationRange(x, y, {
      minSamples: 120,
      targetBinCount: 12,
      minBinSize: 20,
      minConsecutiveSlopes: 2,
      maxMarginalGainFraction: 0.1,
      minAbsoluteSlope: 0.05,
    });

    expect(result.detected).toBe(false);
    expect(result.reason).toBeTruthy();
  });
});

describe('deriveSupportConstrainedTargets', () => {
  it('returns support-constrained and robust targets with deltas from raw model optimum', () => {
    const x = range(1, 360);
    const y = x.map((value, index) => {
      const centered = value - 190;
      const smoothPeak = 80 - (centered * centered) / 1100;
      return smoothPeak + Math.sin(index * 0.11) * 0.6;
    });

    const result = deriveSupportConstrainedTargets(x, y, {
      minSamples: 120,
      targetBinCount: 12,
      minBinSize: 20,
      objective: 'maximize_outcome',
      modelOptimalValue: 430, // deliberately extrapolative
      robustLowerQuantile: 0.1,
      robustUpperQuantile: 0.9,
    });

    expect(result.detected).toBe(true);
    expect(result.reason).toBeNull();
    expect(result.supportConstrainedOptimalValue).not.toBeNull();
    expect(result.supportConstrainedRange).not.toBeNull();
    expect(result.robustOptimalValue).not.toBeNull();
    expect(result.rawModelOptimalValue).toBe(430);
    expect(result.rawWithinObservedRange).toBe(false);
    expect(result.rawWithinSupportRange).toBe(false);
    expect(result.deltas.rawToSupportAbsolute).not.toBeNull();
    expect(result.deltas.rawToRobustAbsolute).not.toBeNull();
  });

  it('supports minimization objectives', () => {
    const x = range(1, 360);
    const y = x.map((value, index) => {
      const centered = value - 120;
      const valley = (centered * centered) / 900 + 10;
      return valley + Math.sin(index * 0.07) * 0.2;
    });

    const result = deriveSupportConstrainedTargets(x, y, {
      minSamples: 120,
      targetBinCount: 10,
      minBinSize: 20,
      objective: 'minimize_outcome',
    });

    expect(result.detected).toBe(true);
    expect(result.supportConstrainedOptimalValue).not.toBeNull();
    expect(result.objective).toBe('minimize_outcome');
    expect(result.supportConstrainedOptimalValue!).toBeGreaterThan(60);
    expect(result.supportConstrainedOptimalValue!).toBeLessThan(190);
  });

  it('returns insufficient support when samples are too low', () => {
    const x = range(1, 30);
    const y = x.map((value) => value);

    const result = deriveSupportConstrainedTargets(x, y, {
      minSamples: 100,
      targetBinCount: 8,
      minBinSize: 10,
    });

    expect(result.detected).toBe(false);
    expect(result.reason).toBe('insufficient_samples');
  });
});

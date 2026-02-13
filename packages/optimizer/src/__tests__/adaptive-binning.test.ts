import { describe, expect, it } from 'vitest';

import { buildAdaptiveNumericBins } from '../adaptive-binning.js';

describe('buildAdaptiveNumericBins', () => {
  it('returns empty array for no finite values', () => {
    expect(buildAdaptiveNumericBins([])).toEqual([]);
    expect(buildAdaptiveNumericBins([NaN, Infinity, -Infinity])).toEqual([]);
  });

  it('returns one bin for constant data', () => {
    const bins = buildAdaptiveNumericBins([5, 5, 5, 5]);
    expect(bins).toHaveLength(1);
    expect(bins[0]?.lowerBound).toBe(5);
    expect(bins[0]?.upperBound).toBe(5);
    expect(bins[0]?.count).toBe(4);
  });

  it('covers all points with contiguous bins', () => {
    const values = Array.from({ length: 100 }, (_, i) => i + 1);
    const bins = buildAdaptiveNumericBins(values, {
      targetBinCount: 5,
      minBinSize: 10,
    });

    const total = bins.reduce((sum, bin) => sum + bin.count, 0);
    expect(total).toBe(values.length);
    expect(bins.length).toBeGreaterThan(1);

    for (let i = 1; i < bins.length; i++) {
      expect(bins[i - 1]?.upperBound).toBeCloseTo(bins[i]?.lowerBound ?? NaN, 10);
    }
  });

  it('enforces minimum sample size by merging undersized bins', () => {
    const values = [
      ...Array.from({ length: 40 }, (_, i) => i + 1),
      ...Array.from({ length: 5 }, (_, i) => 100 + i),
    ];

    const bins = buildAdaptiveNumericBins(values, {
      targetBinCount: 8,
      minBinSize: 15,
      roundTo: 1,
    });

    expect(bins.length).toBeGreaterThanOrEqual(1);
    for (const bin of bins) {
      expect(bin.count).toBeGreaterThanOrEqual(15);
    }
  });

  it('supports anchor-aware detail in dense low ranges', () => {
    const values: number[] = [];
    for (let i = 0; i < 260; i++) {
      values.push(8 + (i % 12));
    }
    for (let i = 0; i < 180; i++) {
      values.push(20 + (i % 35));
    }

    const bins = buildAdaptiveNumericBins(values, {
      targetBinCount: 10,
      minBinSize: 30,
      anchors: [20],
      roundTo: 1,
    });

    const hasTwentyBoundary = bins.some(bin => bin.lowerBound === 20 || bin.upperBound === 20);
    const binsBelowTwenty = bins.filter(bin => bin.upperBound <= 20).length;

    expect(hasTwentyBoundary).toBe(true);
    expect(binsBelowTwenty).toBeGreaterThanOrEqual(2);
  });

  it('applies edge rounding when roundTo is configured', () => {
    const values = Array.from({ length: 120 }, (_, i) => 10 + i * 0.37);
    const bins = buildAdaptiveNumericBins(values, {
      targetBinCount: 6,
      minBinSize: 15,
      roundTo: 0.5,
    });

    const interiorEdges = bins.slice(1).map(bin => bin.lowerBound);
    for (const edge of interiorEdges) {
      const scaled = edge / 0.5;
      expect(Math.abs(scaled - Math.round(scaled))).toBeLessThan(1e-8);
    }
  });
});

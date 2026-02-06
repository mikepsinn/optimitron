import { describe, it, expect } from 'vitest';
import { bootstrapConfidenceIntervals } from '../bootstrap-ci.js';
import type { PairwiseComparison } from '../types.js';

// ─── Test helpers ────────────────────────────────────────────────────

function makeComparison(
  itemAId: string,
  itemBId: string,
  allocationA: number,
  participantId: string = 'p1',
): PairwiseComparison {
  return {
    id: `${participantId}-${itemAId}-${itemBId}`,
    participantId,
    itemAId,
    itemBId,
    allocationA,
    timestamp: Date.now(),
  };
}

function generateConsensusData(
  items: string[],
  allocationPattern: Record<string, number>, // item → relative strength
  participantCount: number,
  comparisonsPerParticipant: number,
  seed: number,
): PairwiseComparison[] {
  const comps: PairwiseComparison[] = [];
  let s = seed;
  const rng = () => {
    s = (s * 1664525 + 1013904223) | 0;
    return (s >>> 0) / 0x100000000;
  };

  for (let p = 0; p < participantCount; p++) {
    for (let c = 0; c < comparisonsPerParticipant; c++) {
      const i = Math.floor(rng() * items.length);
      let j = Math.floor(rng() * (items.length - 1));
      if (j >= i) j++;
      const a = items[i]!;
      const b = items[j]!;
      const strengthA = allocationPattern[a] ?? 50;
      const strengthB = allocationPattern[b] ?? 50;
      // Allocation proportional to relative strengths + noise
      const noise = (rng() - 0.5) * 20;
      const raw = (strengthA / (strengthA + strengthB)) * 100 + noise;
      const allocation = Math.max(0, Math.min(100, raw));
      comps.push(makeComparison(a, b, allocation, `p${p}`));
    }
  }
  return comps;
}

// ─── Tests ───────────────────────────────────────────────────────────

describe('bootstrapConfidenceIntervals', () => {
  it('returns empty results for empty input', () => {
    const result = bootstrapConfidenceIntervals([]);
    expect(result.weights).toHaveLength(0);
    expect(result.distributions).toEqual({});
    expect(result.confidenceLevel).toBe(0.95);
  });

  it('returns weights with CI for a simple 2-item case', () => {
    const comps = [
      makeComparison('A', 'B', 70, 'p1'),
      makeComparison('A', 'B', 80, 'p2'),
      makeComparison('A', 'B', 60, 'p3'),
      makeComparison('A', 'B', 75, 'p4'),
      makeComparison('A', 'B', 65, 'p5'),
    ];

    const result = bootstrapConfidenceIntervals(comps, {
      iterations: 200,
      seed: 42,
    });

    expect(result.weights).toHaveLength(2);
    expect(result.iterations).toBe(200);
    expect(result.confidenceLevel).toBe(0.95);

    // A should be preferred over B
    const weightA = result.weights.find(w => w.itemId === 'A');
    const weightB = result.weights.find(w => w.itemId === 'B');
    expect(weightA).toBeDefined();
    expect(weightB).toBeDefined();
    expect(weightA!.weight).toBeGreaterThan(weightB!.weight);
    expect(weightA!.rank).toBe(1);
    expect(weightB!.rank).toBe(2);

    // CI should exist
    expect(weightA!.ciLow).toBeDefined();
    expect(weightA!.ciHigh).toBeDefined();
    expect(weightA!.ciLow!).toBeLessThanOrEqual(weightA!.weight);
    expect(weightA!.ciHigh!).toBeGreaterThanOrEqual(weightA!.weight);

    // CI should be non-degenerate
    expect(weightA!.ciHigh! - weightA!.ciLow!).toBeGreaterThan(0);
  });

  it('produces tighter CIs with more comparisons', () => {
    // Few comparisons
    const fewComps = [
      makeComparison('A', 'B', 70, 'p1'),
      makeComparison('A', 'B', 80, 'p2'),
    ];

    // Many comparisons (same underlying preference)
    const manyComps: PairwiseComparison[] = [];
    for (let i = 0; i < 50; i++) {
      manyComps.push(makeComparison('A', 'B', 70 + (i % 20) - 10, `p${i}`));
    }

    const resultFew = bootstrapConfidenceIntervals(fewComps, {
      iterations: 500,
      seed: 42,
    });
    const resultMany = bootstrapConfidenceIntervals(manyComps, {
      iterations: 500,
      seed: 42,
    });

    const widthFew =
      resultFew.weights[0]!.ciHigh! - resultFew.weights[0]!.ciLow!;
    const widthMany =
      resultMany.weights[0]!.ciHigh! - resultMany.weights[0]!.ciLow!;

    // More data → tighter CI
    expect(widthMany).toBeLessThan(widthFew);
  });

  it('respects configurable confidence level', () => {
    const comps = generateConsensusData(
      ['A', 'B', 'C'],
      { A: 60, B: 30, C: 10 },
      20,
      5,
      123,
    );

    const ci90 = bootstrapConfidenceIntervals(comps, {
      iterations: 500,
      confidenceLevel: 0.90,
      seed: 42,
    });
    const ci99 = bootstrapConfidenceIntervals(comps, {
      iterations: 500,
      confidenceLevel: 0.99,
      seed: 42,
    });

    expect(ci90.confidenceLevel).toBe(0.90);
    expect(ci99.confidenceLevel).toBe(0.99);

    // 99% CI should be wider than 90% CI for the same data
    const width90 = ci90.weights[0]!.ciHigh! - ci90.weights[0]!.ciLow!;
    const width99 = ci99.weights[0]!.ciHigh! - ci99.weights[0]!.ciLow!;
    expect(width99).toBeGreaterThan(width90);
  });

  it('is deterministic with the same seed', () => {
    const comps = [
      makeComparison('A', 'B', 70, 'p1'),
      makeComparison('B', 'C', 60, 'p2'),
      makeComparison('A', 'C', 80, 'p3'),
    ];

    const r1 = bootstrapConfidenceIntervals(comps, { iterations: 100, seed: 42 });
    const r2 = bootstrapConfidenceIntervals(comps, { iterations: 100, seed: 42 });

    expect(r1.weights).toEqual(r2.weights);
    expect(r1.distributions).toEqual(r2.distributions);
  });

  it('provides distributions for further analysis', () => {
    const comps = [
      makeComparison('A', 'B', 70, 'p1'),
      makeComparison('A', 'B', 60, 'p2'),
      makeComparison('A', 'B', 80, 'p3'),
    ];

    const result = bootstrapConfidenceIntervals(comps, {
      iterations: 100,
      seed: 42,
    });

    // Should have distributions for both items
    expect(result.distributions['A']).toHaveLength(100);
    expect(result.distributions['B']).toHaveLength(100);

    // Distributions should be sorted ascending
    const distA = result.distributions['A']!;
    for (let i = 1; i < distA.length; i++) {
      expect(distA[i]!).toBeGreaterThanOrEqual(distA[i - 1]!);
    }
  });

  it('handles multi-item scenarios correctly', () => {
    const comps = generateConsensusData(
      ['Health', 'Education', 'Defense', 'Infrastructure'],
      { Health: 40, Education: 30, Defense: 20, Infrastructure: 10 },
      50,
      10,
      777,
    );

    const result = bootstrapConfidenceIntervals(comps, {
      iterations: 300,
      seed: 42,
    });

    expect(result.weights).toHaveLength(4);

    // All weights should sum to ~1
    const totalWeight = result.weights.reduce((s, w) => s + w.weight, 0);
    expect(totalWeight).toBeCloseTo(1, 5);

    // Ranks should be 1-4
    const ranks = result.weights.map(w => w.rank).sort();
    expect(ranks).toEqual([1, 2, 3, 4]);

    // Every item should have CI
    for (const w of result.weights) {
      expect(w.ciLow).toBeDefined();
      expect(w.ciHigh).toBeDefined();
      expect(w.ciLow!).toBeLessThanOrEqual(w.weight);
      expect(w.ciHigh!).toBeGreaterThanOrEqual(w.weight);
    }
  });

  it('CI bounds are within [0, 1]', () => {
    const comps = [
      makeComparison('A', 'B', 95, 'p1'),
      makeComparison('A', 'B', 99, 'p2'),
      makeComparison('A', 'B', 90, 'p3'),
    ];

    const result = bootstrapConfidenceIntervals(comps, {
      iterations: 200,
      seed: 42,
    });

    for (const w of result.weights) {
      expect(w.ciLow!).toBeGreaterThanOrEqual(0);
      expect(w.ciHigh!).toBeLessThanOrEqual(1);
    }
  });
});

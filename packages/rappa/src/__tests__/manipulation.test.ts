import { describe, it, expect } from 'vitest';
import { analyzeManipulation } from '../manipulation.js';
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

function generateDataset(
  items: string[],
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
      const allocation = rng() * 100;
      comps.push(makeComparison(a, b, allocation, `p${p}`));
    }
  }
  return comps;
}

// ─── Tests ───────────────────────────────────────────────────────────

describe('analyzeManipulation', () => {
  it('returns fully manipulable score for empty input', () => {
    const result = analyzeManipulation([]);
    expect(result.vulnerabilityScore).toBe(1);
    expect(result.baselineWeights).toHaveLength(0);
    expect(result.itemVulnerabilities).toHaveLength(0);
  });

  it('detects vulnerability in small datasets', () => {
    // Just 3 comparisons from 3 people → very vulnerable
    const comps = [
      makeComparison('A', 'B', 60, 'p1'),
      makeComparison('B', 'C', 55, 'p2'),
      makeComparison('A', 'C', 65, 'p3'),
    ];

    const result = analyzeManipulation(comps, { seed: 42 });

    expect(result.existingComparisonCount).toBe(3);
    expect(result.existingParticipantCount).toBe(3);

    // Should have vulnerabilities for all 3 items
    expect(result.itemVulnerabilities).toHaveLength(3);

    // Small dataset → should be fairly vulnerable
    expect(result.vulnerabilityScore).toBeGreaterThan(0);

    // All items should have some shift potential
    for (const v of result.itemVulnerabilities) {
      expect(v.maxWeightShift).toBeGreaterThan(0);
      expect(['boost', 'suppress']).toContain(v.worstCaseDirection);
    }
  });

  it('shows reduced vulnerability with more data', () => {
    const items = ['A', 'B', 'C', 'D'];
    const smallData = generateDataset(items, 5, 4, 42);
    const largeData = generateDataset(items, 100, 10, 42);

    const smallResult = analyzeManipulation(smallData, {
      adversaryComparisons: 10,
      seed: 42,
    });
    const largeResult = analyzeManipulation(largeData, {
      adversaryComparisons: 10,
      seed: 42,
    });

    // More data → lower vulnerability
    expect(largeResult.vulnerabilityScore).toBeLessThan(
      smallResult.vulnerabilityScore,
    );
  });

  it('returns baseline weights without adversary influence', () => {
    const comps = [
      makeComparison('A', 'B', 70, 'p1'),
      makeComparison('A', 'B', 80, 'p2'),
      makeComparison('B', 'C', 60, 'p3'),
    ];

    const result = analyzeManipulation(comps, { seed: 42 });

    // Baseline should reflect the original comparisons
    expect(result.baselineWeights).toHaveLength(3);
    const totalWeight = result.baselineWeights.reduce(
      (s, w) => s + w.weight,
      0,
    );
    expect(totalWeight).toBeCloseTo(1, 5);

    // A should be ranked highest (strongly preferred over B)
    const weightA = result.baselineWeights.find(w => w.itemId === 'A');
    expect(weightA).toBeDefined();
    expect(weightA!.rank).toBe(1);
  });

  it('identifies the most vulnerable item', () => {
    // Create strong consensus on A vs B, but weak data on C
    const comps: PairwiseComparison[] = [];
    for (let i = 0; i < 20; i++) {
      comps.push(makeComparison('A', 'B', 60, `p${i}`));
    }
    // Only one comparison involving C
    comps.push(makeComparison('B', 'C', 50, 'p20'));

    const result = analyzeManipulation(comps, {
      adversaryComparisons: 10,
      seed: 42,
    });

    // C should be among the most vulnerable (least data supporting it)
    const vulnC = result.itemVulnerabilities.find(v => v.itemId === 'C');
    expect(vulnC).toBeDefined();
    expect(vulnC!.maxWeightShift).toBeGreaterThan(0);
  });

  it('reports boost and suppress shifts separately', () => {
    const comps = generateDataset(['A', 'B', 'C'], 10, 5, 123);

    const result = analyzeManipulation(comps, { seed: 42 });

    for (const v of result.itemVulnerabilities) {
      expect(typeof v.boostShift).toBe('number');
      expect(typeof v.suppressShift).toBe('number');
      // Max shift should equal the larger of the two
      expect(v.maxWeightShift).toBeCloseTo(
        Math.max(Math.abs(v.boostShift), Math.abs(v.suppressShift)),
        10,
      );
    }
  });

  it('is deterministic with the same seed', () => {
    const comps = generateDataset(['A', 'B', 'C'], 10, 5, 123);

    const r1 = analyzeManipulation(comps, { seed: 42 });
    const r2 = analyzeManipulation(comps, { seed: 42 });

    expect(r1.vulnerabilityScore).toBe(r2.vulnerabilityScore);
    expect(r1.itemVulnerabilities).toEqual(r2.itemVulnerabilities);
  });

  it('respects custom adversary comparison count', () => {
    const comps = generateDataset(['A', 'B', 'C'], 10, 5, 123);

    const result = analyzeManipulation(comps, {
      adversaryComparisons: 50,
      seed: 42,
    });

    expect(result.adversaryComparisonCount).toBe(50);
  });

  it('vulnerability score is bounded between 0 and 1', () => {
    const items = ['A', 'B', 'C', 'D', 'E'];
    const comps = generateDataset(items, 50, 10, 42);

    const result = analyzeManipulation(comps, { seed: 42 });

    expect(result.vulnerabilityScore).toBeGreaterThanOrEqual(0);
    expect(result.vulnerabilityScore).toBeLessThanOrEqual(1);
  });

  it('supports selecting specific strategies', () => {
    const comps = generateDataset(['A', 'B', 'C'], 10, 5, 123);

    const boostOnly = analyzeManipulation(comps, {
      strategies: ['boost'],
      seed: 42,
    });

    // When only boost is tested, suppress shifts should be 0
    for (const v of boostOnly.itemVulnerabilities) {
      expect(v.suppressShift).toBe(0);
      expect(v.boostShift).toBeGreaterThanOrEqual(0);
    }
  });
});

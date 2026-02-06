import { describe, it, expect } from 'vitest';
import { selectNextPairs, selectRandomPair } from '../pair-selection.js';
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

// ─── selectNextPairs ─────────────────────────────────────────────────

describe('selectNextPairs', () => {
  it('returns empty for fewer than 2 items', () => {
    const result = selectNextPairs([
      makeComparison('A', 'A', 50),
    ], { itemIds: ['A'] });
    expect(result.recommendations).toHaveLength(0);
    expect(result.totalPossiblePairs).toBe(0);
  });

  it('prioritises uncompared pairs', () => {
    // A-B has been compared, but A-C and B-C haven't
    const comps = [
      makeComparison('A', 'B', 60, 'p1'),
      makeComparison('A', 'B', 70, 'p2'),
      makeComparison('A', 'B', 65, 'p3'),
    ];

    const result = selectNextPairs(comps, {
      itemIds: ['A', 'B', 'C'],
      seed: 42,
    });

    expect(result.recommendations.length).toBeGreaterThanOrEqual(2);

    // Top recommendations should be uncompared pairs
    const topPairKeys = result.recommendations
      .slice(0, 2)
      .map(r => r.pairKey);
    expect(topPairKeys).toContain('A:C');
    expect(topPairKeys).toContain('B:C');

    // A:B should have lower priority
    const abRec = result.recommendations.find(r => r.pairKey === 'A:B');
    expect(abRec).toBeDefined();
    expect(abRec!.priorityScore).toBeLessThan(
      result.recommendations[0]!.priorityScore,
    );
  });

  it('tracks pair counts correctly', () => {
    const comps = [
      makeComparison('A', 'B', 60, 'p1'),
      makeComparison('A', 'B', 70, 'p2'),
      makeComparison('B', 'A', 40, 'p3'), // Same pair, reversed
      makeComparison('A', 'C', 80, 'p1'),
    ];

    const result = selectNextPairs(comps, { seed: 42 });

    expect(result.pairCounts['A:B']).toBe(3);
    expect(result.pairCounts['A:C']).toBe(1);
    expect(result.pairCounts['B:C']).toBeUndefined();
  });

  it('calculates coverage ratio', () => {
    const comps = [
      makeComparison('A', 'B', 60),
      makeComparison('A', 'C', 70),
    ];

    const result = selectNextPairs(comps, {
      itemIds: ['A', 'B', 'C'],
      seed: 42,
    });

    // 3 items → 3 possible pairs, 2 covered
    expect(result.totalPossiblePairs).toBe(3);
    expect(result.coveredPairs).toBe(2);
    expect(result.coverageRatio).toBeCloseTo(2 / 3, 5);
  });

  it('includes items from itemIds even with no comparisons', () => {
    const comps = [makeComparison('A', 'B', 60)];

    const result = selectNextPairs(comps, {
      itemIds: ['A', 'B', 'C', 'D'],
      seed: 42,
    });

    // 4 items → 6 possible pairs
    expect(result.totalPossiblePairs).toBe(6);

    // Should recommend uncompared pairs involving C and D
    const pairKeys = result.recommendations.map(r => r.pairKey);
    expect(pairKeys).toContain('C:D');
    expect(pairKeys).toContain('A:C');
    expect(pairKeys).toContain('A:D');
    expect(pairKeys).toContain('B:C');
    expect(pairKeys).toContain('B:D');
  });

  it('respects maxRecommendations', () => {
    const comps = [makeComparison('A', 'B', 60)];

    const result = selectNextPairs(comps, {
      itemIds: ['A', 'B', 'C', 'D', 'E'],
      maxRecommendations: 3,
      seed: 42,
    });

    expect(result.recommendations).toHaveLength(3);
  });

  it('uses weight variances to boost uncertain-item pairs', () => {
    // All pairs have the same comparison count (1 each)
    const comps = [
      makeComparison('A', 'B', 60),
      makeComparison('A', 'C', 70),
      makeComparison('B', 'C', 55),
    ];

    // C has very high variance (uncertain weight)
    const result = selectNextPairs(comps, {
      weightVariances: { A: 0.001, B: 0.001, C: 0.1 },
      seed: 42,
    });

    // Pairs involving C should be ranked higher
    const topPair = result.recommendations[0]!;
    expect(
      topPair.itemAId === 'C' || topPair.itemBId === 'C' ||
      topPair.pairKey.includes('C'),
    ).toBe(true);
  });

  it('is deterministic with the same seed', () => {
    const comps = [
      makeComparison('A', 'B', 60),
      makeComparison('A', 'C', 70),
    ];

    const r1 = selectNextPairs(comps, {
      itemIds: ['A', 'B', 'C', 'D'],
      seed: 42,
    });
    const r2 = selectNextPairs(comps, {
      itemIds: ['A', 'B', 'C', 'D'],
      seed: 42,
    });

    expect(r1.recommendations.map(r => r.pairKey)).toEqual(
      r2.recommendations.map(r => r.pairKey),
    );
  });

  it('handles large item sets efficiently', () => {
    // 20 items → 190 pairs
    const items = Array.from({ length: 20 }, (_, i) => `item${i}`);
    const comps: PairwiseComparison[] = [];
    for (let i = 0; i < 10; i++) {
      comps.push(makeComparison(items[i]!, items[i + 1]!, 60, `p${i}`));
    }

    const result = selectNextPairs(comps, {
      itemIds: items,
      maxRecommendations: 5,
      seed: 42,
    });

    expect(result.totalPossiblePairs).toBe(190);
    expect(result.recommendations).toHaveLength(5);
    expect(result.coverageRatio).toBeCloseTo(10 / 190, 5);

    // Top recommendations should be uncompared pairs
    for (const rec of result.recommendations) {
      expect(rec.comparisonCount).toBe(0);
    }
  });
});

// ─── selectRandomPair ────────────────────────────────────────────────

describe('selectRandomPair', () => {
  it('returns null for fewer than 2 items', () => {
    const result = selectRandomPair([], { itemIds: ['A'] });
    expect(result).toBeNull();
  });

  it('returns a valid pair recommendation', () => {
    const comps = [makeComparison('A', 'B', 60)];

    const result = selectRandomPair(comps, {
      itemIds: ['A', 'B', 'C'],
      seed: 42,
    });

    expect(result).not.toBeNull();
    expect(result!.itemAId).toBeDefined();
    expect(result!.itemBId).toBeDefined();
    expect(result!.itemAId).not.toBe(result!.itemBId);
    expect(result!.priorityScore).toBeGreaterThan(0);
  });

  it('favours high-priority pairs', () => {
    // A-B heavily compared, C-D not at all
    const comps: PairwiseComparison[] = [];
    for (let i = 0; i < 50; i++) {
      comps.push(makeComparison('A', 'B', 60, `p${i}`));
    }

    const selections = new Map<string, number>();
    for (let trial = 0; trial < 100; trial++) {
      const result = selectRandomPair(comps, {
        itemIds: ['A', 'B', 'C', 'D'],
        seed: trial,
      });
      if (result) {
        const key = result.pairKey;
        selections.set(key, (selections.get(key) ?? 0) + 1);
      }
    }

    // A:B should be selected less often than uncompared pairs
    const abCount = selections.get('A:B') ?? 0;
    const otherCounts = [...selections.entries()]
      .filter(([k]) => k !== 'A:B')
      .reduce((s, [, v]) => s + v, 0);

    expect(otherCounts).toBeGreaterThan(abCount);
  });

  it('is deterministic with the same seed', () => {
    const comps = [
      makeComparison('A', 'B', 60),
      makeComparison('A', 'C', 70),
    ];

    const r1 = selectRandomPair(comps, {
      itemIds: ['A', 'B', 'C', 'D'],
      seed: 42,
    });
    const r2 = selectRandomPair(comps, {
      itemIds: ['A', 'B', 'C', 'D'],
      seed: 42,
    });

    expect(r1).toEqual(r2);
  });
});

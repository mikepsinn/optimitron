import { describe, it, expect } from 'vitest';
import {
  findMinimumEffectiveSpending,
  type SpendingDecileCategory,
} from '../minimum-effective-spending.js';

function makeDeciles(spendings: number[], outcomes: number[]) {
  return spendings.map((avgSpending, index) => ({
    decile: index + 1,
    avgSpending,
    outcome: outcomes[index]!,
  }));
}

describe('findMinimumEffectiveSpending', () => {
  it('finds the lowest decile within tolerance of top spending outcomes', () => {
    const category: SpendingDecileCategory = {
      categoryId: 'health',
      deciles: makeDeciles(
        [100, 200, 300, 400, 500],
        [70, 75, 79.8, 80.1, 80.2],
      ),
    };

    const [result] = findMinimumEffectiveSpending([category], {
      outcomeTolerance: 0.5,
      outcomeDirection: 'higher',
    });

    expect(result!.floorDecile).toBe(3);
    expect(result!.floorSpending).toBe(300);
    expect(result!.outcomeGap).toBeCloseTo(0.4, 3);
  });

  it('supports outcomes where lower is better', () => {
    const category: SpendingDecileCategory = {
      categoryId: 'mortality',
      deciles: makeDeciles(
        [50, 100, 150, 200, 250],
        [12, 10, 8.2, 8.1, 8.0],
      ),
    };

    const [result] = findMinimumEffectiveSpending([category], {
      outcomeTolerance: 0.3,
      outcomeDirection: 'lower',
    });

    expect(result!.floorDecile).toBe(3);
    expect(result!.floorSpending).toBe(150);
    expect(result!.outcomeGap).toBeCloseTo(0.2, 3);
  });

  it('shows many countries overspend relative to the floor', () => {
    const category: SpendingDecileCategory = {
      categoryId: 'admin',
      deciles: makeDeciles(
        [120, 200, 260, 320, 380, 440, 500, 560, 620, 680],
        [70, 80, 80.1, 80.0, 79.9, 80.0, 79.8, 79.9, 80.0, 79.95],
      ),
    };

    const [result] = findMinimumEffectiveSpending([category], {
      outcomeTolerance: 0.5,
    });

    const currentSpendings = [150, 180, 210, 220, 230, 240, 250, 260, 270, 280];
    const overspendCount = currentSpendings.filter(
      (spending) => spending > result!.floorSpending,
    ).length;

    expect(overspendCount).toBeGreaterThan(currentSpendings.length / 2);
  });

  it('returns empty values when no deciles are provided', () => {
    const category: SpendingDecileCategory = {
      categoryId: 'empty',
      deciles: [],
    };

    const [result] = findMinimumEffectiveSpending([category]);

    expect(result!.floorDecile).toBeNull();
    expect(result!.floorSpending).toBe(0);
    expect(result!.topDecile).toBeNull();
  });

  it('sorts by spending and ignores non-finite deciles', () => {
    const category: SpendingDecileCategory = {
      categoryId: 'education',
      deciles: [
        { decile: 3, avgSpending: 300, outcome: 10.0 },
        { decile: 2, avgSpending: Number.NaN, outcome: 99 },
        { decile: 1, avgSpending: 100, outcome: 9.8 },
        { decile: 2, avgSpending: 200, outcome: 10.0 },
      ],
    };

    const [result] = findMinimumEffectiveSpending([category], {
      outcomeTolerance: 0.1,
      outcomeDirection: 'higher',
    });

    expect(result!.topSpending).toBe(300);
    expect(result!.floorSpending).toBe(200);
  });

  it('returns empty values when all deciles are invalid', () => {
    const category: SpendingDecileCategory = {
      categoryId: 'invalid',
      deciles: [
        { decile: 1, avgSpending: Number.NaN, outcome: 1 },
        { decile: 2, avgSpending: 200, outcome: Number.NaN },
      ],
    };

    const [result] = findMinimumEffectiveSpending([category]);

    expect(result!.floorDecile).toBeNull();
    expect(result!.topDecile).toBeNull();
  });
});

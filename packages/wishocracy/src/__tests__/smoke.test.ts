import { describe, it, expect } from 'vitest';
import {
  VERSION,
  aggregateComparisons,
  PairwiseComparisonSchema,
} from '../index.js';

describe('@optomitron/wishocracy smoke tests', () => {
  it('exports a version string', () => {
    expect(VERSION).toBe('0.1.0');
  });

  it('PairwiseComparisonSchema validates correct input', () => {
    const result = PairwiseComparisonSchema.safeParse({
      id: 'comp-1',
      participantId: 'user-1',
      itemAId: 'health',
      itemBId: 'education',
      allocationA: 60,
      timestamp: Date.now(),
    });
    expect(result.success).toBe(true);
  });

  it('PairwiseComparisonSchema rejects out-of-range allocation', () => {
    const result = PairwiseComparisonSchema.safeParse({
      id: 'comp-1',
      participantId: 'user-1',
      itemAId: 'health',
      itemBId: 'education',
      allocationA: 150,
      timestamp: Date.now(),
    });
    expect(result.success).toBe(false);
  });

  it('aggregateComparisons() returns entries for each unique pair', () => {
    const comparisons = [
      {
        id: '1', participantId: 'u1',
        itemAId: 'health', itemBId: 'education',
        allocationA: 70, timestamp: 1000,
      },
      {
        id: '2', participantId: 'u2',
        itemAId: 'health', itemBId: 'education',
        allocationA: 60, timestamp: 2000,
      },
      {
        id: '3', participantId: 'u1',
        itemAId: 'defense', itemBId: 'education',
        allocationA: 40, timestamp: 3000,
      },
    ];

    const entries = aggregateComparisons(comparisons);
    expect(entries).toHaveLength(2); // health:education and defense:education
  });

  it('aggregateComparisons() returns empty array for no input', () => {
    expect(aggregateComparisons([])).toEqual([]);
  });
});

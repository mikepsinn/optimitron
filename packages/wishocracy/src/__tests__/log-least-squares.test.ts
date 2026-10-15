import { describe, it, expect } from 'vitest';
import {
  answerAgreement,
  logLeastSquaresConfidenceIntervals,
  logLeastSquaresWeights,
} from '../log-least-squares.js';
import type { PairwiseComparison } from '../types.js';

function answer(
  itemAId: string,
  itemBId: string,
  allocationA: number,
  participantId = 'p1',
): PairwiseComparison {
  return {
    id: `${participantId}-${itemAId}-${itemBId}`,
    participantId,
    itemAId,
    itemBId,
    allocationA,
    timestamp: 0,
  };
}

describe('logLeastSquaresWeights', () => {
  it('recovers weights through a chain of answers without treating the unanswered pair as a tie', () => {
    // A:B = 2:1 and B:C = 3:1 imply A:B:C = 6:3:1. A vs C was never asked.
    const weights = logLeastSquaresWeights(
      [answer('A', 'B', 200 / 3), answer('B', 'C', 75)],
      ['A', 'B', 'C'],
    );
    expect(weights['A']).toBeCloseTo(0.6, 2);
    expect(weights['B']).toBeCloseTo(0.3, 2);
    expect(weights['C']).toBeCloseTo(0.1, 2);
  });

  it('does not let an item nobody compared change the ratio between compared items', () => {
    const weights = logLeastSquaresWeights([answer('A', 'B', 80)], ['A', 'B', 'UNSEEN']);
    expect((weights['A'] ?? 0) / (weights['B'] ?? 1)).toBeCloseTo(4, 1);
    expect(Object.values(weights).reduce((sum, w) => sum + w, 0)).toBeCloseTo(1, 10);
  });

  it('gives a pair answered by more people more say than a single contrary answer', () => {
    const weights = logLeastSquaresWeights(
      [answer('A', 'B', 75, 'p1'), answer('A', 'B', 75, 'p2'), answer('A', 'B', 75, 'p3'), answer('A', 'B', 25, 'p4')],
      ['A', 'B'],
    );
    // Geometric mean of 3, 3, 3, 1/3 is 3^(1/2).
    expect((weights['A'] ?? 0) / (weights['B'] ?? 1)).toBeCloseTo(Math.sqrt(3), 1);
  });

  it('keeps all-or-nothing answers finite', () => {
    const weights = logLeastSquaresWeights([answer('A', 'B', 100), answer('B', 'C', 0)], ['A', 'B', 'C']);
    for (const weight of Object.values(weights)) expect(Number.isFinite(weight)).toBe(true);
    expect(weights['A']).toBeGreaterThan(weights['B'] ?? 1);
    expect(weights['C']).toBeGreaterThan(weights['B'] ?? 1);
  });

  it('rejects a non-positive prior because disconnected items would have no solution', () => {
    expect(() => logLeastSquaresWeights([answer('A', 'B', 60)], ['A', 'B'], { priorStrength: 0 })).toThrow();
  });
});

describe('logLeastSquaresConfidenceIntervals', () => {
  it('collapses to the point estimate when every participant gives the same answers', () => {
    const rows = ['p1', 'p2', 'p3'].flatMap((p) => [answer('A', 'B', 70, p), answer('B', 'C', 60, p)]);
    for (const weight of logLeastSquaresConfidenceIntervals(rows, ['A', 'B', 'C'], { iterations: 50 })) {
      expect(weight.ciLow).toBeCloseTo(weight.weight, 10);
      expect(weight.ciHigh).toBeCloseTo(weight.weight, 10);
    }
  });

  it('brackets the point estimate, ranks items, and repeats exactly with the same seed', () => {
    const rows = [
      answer('A', 'B', 90, 'p1'), answer('B', 'C', 70, 'p1'),
      answer('A', 'B', 55, 'p2'), answer('A', 'C', 60, 'p2'),
      answer('A', 'B', 40, 'p3'), answer('B', 'C', 80, 'p3'),
      answer('A', 'C', 95, 'p4'),
    ];
    const first = logLeastSquaresConfidenceIntervals(rows, ['A', 'B', 'C'], { iterations: 100, seed: 7 });
    expect(first.map((w) => w.itemId)).toEqual(['A', 'B', 'C']);
    expect(first.map((w) => w.rank)).toEqual([1, 2, 3]);
    for (const weight of first) {
      expect(weight.ciLow).toBeLessThanOrEqual(weight.weight);
      expect(weight.ciHigh).toBeGreaterThanOrEqual(weight.weight);
    }
    expect(first.some((w) => (w.ciHigh ?? 0) > (w.ciLow ?? 0))).toBe(true);
    expect(logLeastSquaresConfidenceIntervals(rows, ['A', 'B', 'C'], { iterations: 100, seed: 7 })).toEqual(first);
  });
});

describe('answerAgreement', () => {
  it('counts a circular set of answers as partly contradicted and skips even splits', () => {
    const rows = [answer('A', 'B', 70), answer('B', 'C', 70), answer('C', 'A', 70), answer('A', 'C', 50)];
    const weights = logLeastSquaresWeights(rows, ['A', 'B', 'C']);
    const agreement = answerAgreement(rows, weights);
    expect(agreement.total).toBe(3);
    expect(agreement.agreed).toBeLessThan(3);
  });

  it('counts tied weights as matching neither side of an answer', () => {
    const tied = { A: 0.5, B: 0.5 };
    expect(answerAgreement([answer('A', 'B', 30)], tied)).toEqual({ agreed: 0, total: 1 });
    expect(answerAgreement([answer('A', 'B', 70)], tied)).toEqual({ agreed: 0, total: 1 });
  });
});

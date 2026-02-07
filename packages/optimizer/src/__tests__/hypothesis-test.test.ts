import { describe, expect, it } from 'vitest';
import {
  evaluateHypothesis,
  isEvidenceGradeAtLeast,
  runHypothesisTestCase,
  type HypothesisTestCase,
} from '../hypothesis-test.js';

function mean(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

describe('HypothesisTestCase helpers', () => {
  it('runs generator-backed test cases and validates expected direction', () => {
    const testCase: HypothesisTestCase<number[], { average: number }> = {
      id: 'mean-positive',
      claim: 'Average outcome is positive and exceeds the threshold.',
      data: {
        kind: 'generator',
        description: 'Generate a small positive series.',
        generate: () => [3, 4, 5, 6],
      },
      expected: {
        direction: 'positive',
        threshold: 4,
        evidenceGrade: 'C',
      },
      run: (data) => {
        const average = mean(data);
        return {
          value: average,
          direction: average > 0 ? 'positive' : 'negative',
          evidenceGrade: 'B',
          details: { average },
        };
      },
    };

    const result = runHypothesisTestCase(testCase);
    expect(result.passed).toBe(true);
    expect(result.actual.details?.average).toBe(4.5);
  });

  it('fails when evidence grade is below expectations', () => {
    const testCase: HypothesisTestCase<number[], { average: number }> = {
      id: 'grade-floor',
      claim: 'Average outcome is negative with strong evidence.',
      data: {
        kind: 'dataset',
        id: 'negative-demo',
        data: [-3, -4, -5],
      },
      expected: {
        direction: 'negative',
        threshold: 3,
        evidenceGrade: 'B',
      },
      run: (data) => {
        const average = mean(data);
        return {
          value: average,
          direction: average < 0 ? 'negative' : 'positive',
          evidenceGrade: 'D',
          details: { average },
        };
      },
    };

    const result = runHypothesisTestCase(testCase);
    expect(result.passed).toBe(false);
    expect(result.failureReasons).toContain('evidence grade');
  });

  it('treats "none" direction as a magnitude check', () => {
    const result = evaluateHypothesis(
      { direction: 'none', threshold: 0.2, evidenceGrade: 'D' },
      { value: 0.1, direction: 'positive', evidenceGrade: 'D' },
    );

    expect(result.passed).toBe(true);
  });

  it('orders evidence grades from strongest to weakest', () => {
    expect(isEvidenceGradeAtLeast('A', 'B')).toBe(true);
    expect(isEvidenceGradeAtLeast('C', 'C')).toBe(true);
    expect(isEvidenceGradeAtLeast('D', 'B')).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';

import type { TimeSeries } from '../types.js';
import {
  deriveStatisticalSignificance,
  runVariableRelationshipAnalysis,
  toNOf1VariableRelationship,
} from '../variable-relationship-runner.js';
import { runFullAnalysis } from '../pipeline.js';

function makeSeries(
  variableId: string,
  name: string,
  values: number[],
  unit: string = 'index',
): TimeSeries {
  const base = Date.UTC(2020, 0, 1);
  return {
    variableId,
    name,
    measurements: values.map((value, idx) => ({
      timestamp: base + idx * 86_400_000,
      value,
      unit,
    })),
  };
}

describe('deriveStatisticalSignificance', () => {
  it('returns a bounded value in [0, 1]', () => {
    expect(deriveStatisticalSignificance(0.01, 200)).toBeGreaterThanOrEqual(0);
    expect(deriveStatisticalSignificance(0.01, 200)).toBeLessThanOrEqual(1);
  });

  it('increases with lower p-values and more pairs', () => {
    const weak = deriveStatisticalSignificance(0.5, 10);
    const strong = deriveStatisticalSignificance(0.01, 120);
    expect(strong).toBeGreaterThan(weak);
  });
});

describe('toNOf1VariableRelationship', () => {
  it('maps a full analysis to relationship summary fields', () => {
    const predictor = makeSeries('p', 'Predictor', [1, 2, 3, 4, 5, 6, 7, 8]);
    const outcome = makeSeries('o', 'Outcome', [2, 4, 6, 8, 10, 12, 14, 16]);
    const analysis = runFullAnalysis(predictor, outcome, { analysisMode: 'individual' });
    const relationship = toNOf1VariableRelationship('unit_a', analysis);

    expect(relationship.subjectId).toBe('unit_a');
    expect(relationship.numberOfPairs).toBe(analysis.numberOfPairs);
    expect(relationship.valuePredictingHighOutcome).toBeCloseTo(
      analysis.optimalValues.valuePredictingHighOutcome,
      8,
    );
    expect(relationship.outcomeFollowUpPercentChangeFromBaseline).toBe(
      analysis.baselineFollowup.outcomeFollowUpPercentChangeFromBaseline,
    );
  });
});

describe('runVariableRelationshipAnalysis', () => {
  it('runs n-of-1 entity analyses and produces an aggregate relationship', () => {
    const result = runVariableRelationshipAnalysis({
      subjects: [
        {
          subjectId: 'unit_a',
          predictor: makeSeries('p.a', 'Predictor A', [1, 2, 3, 4, 5, 6, 7, 8]),
          outcome: makeSeries('o.a', 'Outcome A', [2, 4, 6, 8, 10, 12, 14, 16]),
        },
        {
          subjectId: 'unit_b',
          predictor: makeSeries('p.b', 'Predictor B', [1, 2, 3, 4, 5, 6, 7, 8]),
          outcome: makeSeries('o.b', 'Outcome B', [16, 14, 12, 10, 8, 6, 4, 2]),
        },
      ],
      minimumPairs: 2,
    });

    expect(result.subjectResults).toHaveLength(2);
    expect(result.skippedSubjects).toHaveLength(0);
    expect(result.aggregateVariableRelationship.numberOfSubjects).toBe(2);
    expect(result.aggregateVariableRelationship.totalPairs).toBeGreaterThan(0);
  });

  it('skips subjects with insufficient pairs', () => {
    const result = runVariableRelationshipAnalysis({
      subjects: [
        {
          subjectId: 'valid',
          predictor: makeSeries('p.valid', 'Predictor Valid', [1, 2, 3, 4]),
          outcome: makeSeries('o.valid', 'Outcome Valid', [2, 3, 4, 5]),
        },
        {
          subjectId: 'too_short',
          predictor: makeSeries('p.short', 'Predictor Short', [1]),
          outcome: makeSeries('o.short', 'Outcome Short', [2]),
        },
      ],
      onSubjectError: 'skip',
    });

    expect(result.subjectResults).toHaveLength(1);
    expect(result.skippedSubjects).toHaveLength(1);
    expect(result.skippedSubjects[0]?.subjectId).toBe('too_short');
    expect(result.aggregateVariableRelationship.numberOfSubjects).toBe(1);
  });

  it('throws when configured with onSubjectError=throw', () => {
    expect(() =>
      runVariableRelationshipAnalysis({
        subjects: [
          {
            subjectId: 'bad_unit',
            predictor: makeSeries('p.bad', 'Predictor Bad', [1]),
            outcome: makeSeries('o.bad', 'Outcome Bad', [2]),
          },
        ],
        onSubjectError: 'throw',
      }),
    ).toThrow('Insufficient aligned pairs');
  });
});




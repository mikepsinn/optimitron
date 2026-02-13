import { describe, expect, it } from 'vitest';

import type { TimeSeries } from '../types.js';
import {
  deriveStatisticalSignificance,
  runVariableRelationshipAnalysis,
  toUnitVariableRelationship,
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

describe('toUnitVariableRelationship', () => {
  it('maps a full analysis to relationship summary fields', () => {
    const predictor = makeSeries('p', 'Predictor', [1, 2, 3, 4, 5, 6, 7, 8]);
    const outcome = makeSeries('o', 'Outcome', [2, 4, 6, 8, 10, 12, 14, 16]);
    const analysis = runFullAnalysis(predictor, outcome, { analysisMode: 'individual' });
    const relationship = toUnitVariableRelationship('unit_a', analysis);

    expect(relationship.unitId).toBe('unit_a');
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
  it('runs unit-level analyses and produces an aggregate relationship', () => {
    const result = runVariableRelationshipAnalysis({
      units: [
        {
          unitId: 'unit_a',
          predictor: makeSeries('p.a', 'Predictor A', [1, 2, 3, 4, 5, 6, 7, 8]),
          outcome: makeSeries('o.a', 'Outcome A', [2, 4, 6, 8, 10, 12, 14, 16]),
        },
        {
          unitId: 'unit_b',
          predictor: makeSeries('p.b', 'Predictor B', [1, 2, 3, 4, 5, 6, 7, 8]),
          outcome: makeSeries('o.b', 'Outcome B', [16, 14, 12, 10, 8, 6, 4, 2]),
        },
      ],
      minimumPairs: 2,
    });

    expect(result.unitResults).toHaveLength(2);
    expect(result.skippedUnits).toHaveLength(0);
    expect(result.aggregateVariableRelationship.numberOfUnits).toBe(2);
    expect(result.aggregateVariableRelationship.totalPairs).toBeGreaterThan(0);
  });

  it('skips units with insufficient pairs', () => {
    const result = runVariableRelationshipAnalysis({
      units: [
        {
          unitId: 'valid',
          predictor: makeSeries('p.valid', 'Predictor Valid', [1, 2, 3, 4]),
          outcome: makeSeries('o.valid', 'Outcome Valid', [2, 3, 4, 5]),
        },
        {
          unitId: 'too_short',
          predictor: makeSeries('p.short', 'Predictor Short', [1]),
          outcome: makeSeries('o.short', 'Outcome Short', [2]),
        },
      ],
      onUnitError: 'skip',
    });

    expect(result.unitResults).toHaveLength(1);
    expect(result.skippedUnits).toHaveLength(1);
    expect(result.skippedUnits[0]?.unitId).toBe('too_short');
    expect(result.aggregateVariableRelationship.numberOfUnits).toBe(1);
  });

  it('throws when configured with onUnitError=throw', () => {
    expect(() =>
      runVariableRelationshipAnalysis({
        units: [
          {
            unitId: 'bad_unit',
            predictor: makeSeries('p.bad', 'Predictor Bad', [1]),
            outcome: makeSeries('o.bad', 'Outcome Bad', [2]),
          },
        ],
        onUnitError: 'throw',
      }),
    ).toThrow('Insufficient aligned pairs');
  });
});


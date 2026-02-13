import { describe, expect, it } from 'vitest';

import type { AggregateVariableRelationship } from '../types.js';
import {
  adjustPValues,
  buildOutcomeMegaStudies,
  rankPredictorsForOutcome,
  type OutcomeRankingCandidate,
} from '../outcome-mega-study-ranking.js';

function makeGlobalRelationship(
  overrides: Partial<AggregateVariableRelationship> = {},
): AggregateVariableRelationship {
  return {
    numberOfUnits: 20,
    aggregateForwardPearson: 0.2,
    aggregateReversePearson: 0.05,
    aggregatePredictivePearson: 0.15,
    aggregateEffectSize: 0.3,
    aggregateStatisticalSignificance: 0.7,
    aggregateValuePredictingHighOutcome: 3,
    aggregateValuePredictingLowOutcome: 1,
    aggregateOptimalDailyValue: 2,
    aggregateOutcomeFollowUpPercentChangeFromBaseline: 0.2,
    weightedAveragePIS: 0.3,
    totalPairs: 500,
    ...overrides,
  };
}

function candidate(
  predictorId: string,
  outcomeId: string,
  pValue: number,
  effect: number,
  predictive: number,
): OutcomeRankingCandidate {
  return {
    predictorId,
    outcomeId,
    pValue,
    aggregateVariableRelationship: makeGlobalRelationship({
      aggregateEffectSize: effect,
      aggregatePredictivePearson: predictive,
      aggregateForwardPearson: predictive + 0.05,
    }),
  };
}

describe('adjustPValues', () => {
  it('computes Bonferroni-adjusted p-values', () => {
    const adjusted = adjustPValues([0.01, 0.02, 0.05, 0.2], 'bonferroni');
    expect(adjusted).toEqual([0.04, 0.08, 0.2, 0.8]);
  });

  it('computes Benjamini-Hochberg adjusted p-values', () => {
    const adjusted = adjustPValues([0.01, 0.02, 0.05, 0.2], 'benjamini_hochberg');
    expect(adjusted[0]).toBeCloseTo(0.04, 10);
    expect(adjusted[1]).toBeCloseTo(0.04, 10);
    expect(adjusted[2]).toBeCloseTo(0.0666666667, 8);
    expect(adjusted[3]).toBeCloseTo(0.2, 10);
  });
});

describe('rankPredictorsForOutcome', () => {
  it('ranks predictors by score and sets significance via adjusted p-values', () => {
    const ranking = rankPredictorsForOutcome({
      outcomeId: 'outcome.x',
      multipleTestingMethod: 'benjamini_hochberg',
      alpha: 0.05,
      candidates: [
        candidate('predictor.strong', 'outcome.x', 0.001, 0.8, 0.5),
        candidate('predictor.medium', 'outcome.x', 0.03, 0.4, 0.2),
        candidate('predictor.weak', 'outcome.x', 0.2, 0.2, 0.05),
      ],
    });

    expect(ranking.rows).toHaveLength(3);
    expect(ranking.rows[0]?.predictorId).toBe('predictor.strong');
    expect(ranking.rows[0]?.significant).toBe(true);
    expect(ranking.rows[2]?.predictorId).toBe('predictor.weak');
    expect(ranking.rows[2]?.significant).toBe(false);
  });

  it('uses inferred p-values from statistical significance when missing', () => {
    const ranking = rankPredictorsForOutcome({
      outcomeId: 'outcome.x',
      candidates: [
        {
          predictorId: 'predictor.inferred',
          outcomeId: 'outcome.x',
          aggregateVariableRelationship: makeGlobalRelationship({
            aggregateStatisticalSignificance: 0.85,
          }),
        },
      ],
    });

    expect(ranking.rows[0]?.rawPValue).toBeCloseTo(0.15, 10);
  });

  it('uses deterministic predictorId tiebreak when scores are equal', () => {
    const equal = makeGlobalRelationship({
      aggregateEffectSize: 0.4,
      aggregatePredictivePearson: 0.2,
      aggregateForwardPearson: 0.25,
      aggregateStatisticalSignificance: 0.7,
    });

    const ranking = rankPredictorsForOutcome({
      outcomeId: 'outcome.tie',
      candidates: [
        { predictorId: 'predictor.z', outcomeId: 'outcome.tie', pValue: 0.05, aggregateVariableRelationship: equal },
        { predictorId: 'predictor.a', outcomeId: 'outcome.tie', pValue: 0.05, aggregateVariableRelationship: equal },
      ],
    });

    expect(ranking.rows[0]?.predictorId).toBe('predictor.a');
    expect(ranking.rows[1]?.predictorId).toBe('predictor.z');
  });
});

describe('buildOutcomeMegaStudies', () => {
  it('builds grouped rankings for each outcome', () => {
    const rankings = buildOutcomeMegaStudies({
      candidates: [
        candidate('predictor.a', 'outcome.1', 0.01, 0.5, 0.2),
        candidate('predictor.b', 'outcome.1', 0.2, 0.2, 0.1),
        candidate('predictor.c', 'outcome.2', 0.03, 0.6, 0.3),
      ],
    });

    expect(rankings).toHaveLength(2);
    expect(rankings[0]?.outcomeId).toBe('outcome.1');
    expect(rankings[1]?.outcomeId).toBe('outcome.2');
    expect(rankings[0]?.rows).toHaveLength(2);
    expect(rankings[1]?.rows).toHaveLength(1);
  });
});


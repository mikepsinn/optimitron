import { describe, expect, it } from 'vitest';
import { partialCorrelation, pearsonCorrelation } from '../statistics.js';
import { calculateBaselineFollowup, calculateOptimalValues } from '../change-from-baseline.js';
import { getEvidenceGrade } from '../predictor-impact-score.js';
import { runHypothesisTest } from '../test-helpers/hypothesis.js';
import type { AlignedPair } from '../types.js';

describe('Hypothesis-driven tests', () => {
  it('GDP confounds health spending correlation (partial correlation test)', () => {
    const gdp = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const spending = [2, 1, 4, 6, 4, 7, 9, 7, 11, 10];
    const health = [1, 4, 2, 7, 5, 8, 7, 10, 8, 12];
    const r = pearsonCorrelation(spending, health);
    const rPartial = partialCorrelation(spending, health, gdp);
    const result = runHypothesisTest({
      id: 'gdp-confound',
      hypothesis: 'Spending-health correlation weakens after controlling for GDP.',
      expectedOutcome: 'High r, low partial r.',
      testFn: () => ({
        actualOutcome: `r=${r.toFixed(2)}, partial=${rPartial.toFixed(2)}`,
        passed: r > 0.7 && Math.abs(rPartial) < 0.3,
      }),
    });
    expect(result.passed).toBe(true);
  });

  it('Minimum effective spending floor exists for health', () => {
    const pairs: AlignedPair[] = [
      { predictorValue: 1, outcomeValue: 40 },
      { predictorValue: 3, outcomeValue: 42 },
      { predictorValue: 5, outcomeValue: 43 },
      { predictorValue: 6, outcomeValue: 70 },
      { predictorValue: 8, outcomeValue: 72 },
      { predictorValue: 10, outcomeValue: 74 },
    ];
    const baseline = calculateBaselineFollowup(pairs);
    const optimal = calculateOptimalValues(pairs);
    const floor = 6;
    const result = runHypothesisTest({
      id: 'min-effective-floor',
      hypothesis: 'Outcomes improve only after a minimum spending floor.',
      expectedOutcome: 'Optimal value at/above floor with higher follow-up outcomes.',
      testFn: () => ({
        actualOutcome: `optimal=${optimal.optimalDailyValue.toFixed(1)}`,
        passed:
          optimal.optimalDailyValue >= floor &&
          baseline.outcomeFollowUpAverage > baseline.outcomeBaselineAverage,
      }),
    });
    expect(result.passed).toBe(true);
  });

  it('Policy evidence grades derive correctly from optimizer results', () => {
    const strongGrade = getEvidenceGrade(0.52);
    const weakGrade = getEvidenceGrade(0.12);
    const result = runHypothesisTest({
      id: 'evidence-grade',
      hypothesis: 'Higher PIS yields stronger evidence grades.',
      expectedOutcome: '0.52 => A, 0.12 => C.',
      testFn: () => ({
        actualOutcome: `strong=${strongGrade}, weak=${weakGrade}`,
        passed: strongGrade === 'A' && weakGrade === 'C',
      }),
    });
    expect(result.passed).toBe(true);
  });
});

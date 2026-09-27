import { describe, expect, it } from 'vitest';
import {
  policyScenarioCentralValues,
  scenarioInputs,
} from '../datasets/us-policy-scenario-inputs.js';

const find = (id: string) => scenarioInputs.find(input => input.policyId === id)!;

describe('policy scenario reference interventions', () => {
  it('keeps the canonical global lifetime scenario separate from annual domestic allocation', () => {
    const rtt = find('right-to-trial-and-fda-upgrade-act');
    const result = rtt.calculate(policyScenarioCentralValues(rtt));
    expect(result.dalys).toBeCloseTo(483_427_910_011.72784, -2);
    expect(result.costUsd).toBe(65_000_000);
    expect(result.qalys).toBeNull();
    expect(result.incomeNpvUsd).toBeNull();
    expect(rtt.comparableForAllocation).toBe(false);
    expect(rtt.overlapGroup).toBe(find('pragmatic-clinical-trial-funding-reform').overlapGroup);
  });

  it('does not count trial slots as QALYs when no effective discovery is adopted', () => {
    const trial = find('pragmatic-clinical-trial-funding-reform');
    const values = { ...policyScenarioCentralValues(trial), recovery_transport: 0 };
    const result = trial.calculate(values);
    expect(result.qalys).toBe(0);
    expect(result.trialParticipants).toBeGreaterThan(0);
    expect(result.costUsd).toBeGreaterThan(0);
  });

  it('retains one-year mortality units without inventing a remaining lifespan', () => {
    const treatment = find('shift-drug-policy-from-criminal-to-health-approach');
    const result = treatment.calculate({ ...policyScenarioCentralValues(treatment), treatment_transport: 1 });
    expect(result.deathsAverted).toBe(250);
    expect(result.qalys).toBeNull();
    expect(result.dalys).toBeNull();
    expect(treatment.horizonYears).toBe(1);
  });

  it('separates renter savings from income and aggregate social benefit', () => {
    const housing = find('housing-supply-deregulation');
    const result = housing.calculate(policyScenarioCentralValues(housing));
    expect(result.renterSavingsUsd).toBeGreaterThan(0);
    expect(result.incomeNpvUsd).toBeNull();
    expect(housing.comparableForAllocation).toBe(false);
  });

  it('does not double discount or annualize the source lifetime earnings NPV', () => {
    const prek = find('universal-pre-k-ages-3-4');
    const result = prek.calculate({ ...policyScenarioCentralValues(prek), prek_transport: 1 });
    // The same price conversion affects both sides; the benefit/cost ratio
    // must retain the source cohort ratio, independent of the reported horizon.
    expect(result.incomeNpvUsd! / result.costUsd).toBeCloseTo(70_535 / 17_759, 10);
  });

  it('rejects an incomplete draw rather than using an unreported fallback', () => {
    const trial = find('pragmatic-clinical-trial-funding-reform');
    expect(() => trial.calculate({})).toThrow('Missing or non-finite policy scenario input');
  });
});

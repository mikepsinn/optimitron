import { describe, expect, it } from 'vitest';
import { evaluateClinicalDiscoveryScenario, type ClinicalDiscoveryScenarioInput } from '../clinical-discovery-scenario.js';

const baseline: ClinicalDiscoveryScenarioInput = {
  horizonYears: 20,
  discountRate: 0.03,
  annualBurdenDalys: 100,
  avoidableFraction: 0.8,
  adoptionFraction: 0.5,
  baselineWaitYears: 10,
  baselineLagYears: 0,
  reformLagYears: 0,
  discoveryMultiplier: 2,
};

describe('finite-horizon clinical discovery scenario', () => {
  it('has zero incremental benefit when availability is unchanged', () => {
    const result = evaluateClinicalDiscoveryScenario({ ...baseline, discoveryMultiplier: 1 });
    expect(result.dalysAverted).toBe(0);
    expect(result.discountedDalysAverted).toBe(0);
    expect(result.annualDalysAverted).toEqual(Array(20).fill(0));
  });

  it.each(['annualBurdenDalys', 'avoidableFraction', 'adoptionFraction'] as const)('has no benefit when %s is zero', field => {
    const result = evaluateClinicalDiscoveryScenario({ ...baseline, [field]: 0 });
    expect(result.dalysAverted).toBe(0);
    expect(result.annualDalysAverted.every(value => value === 0)).toBe(true);
  });

  it('matches an analytic 20-year integrated hazard comparison without assuming immediate cures', () => {
    const result = evaluateClinicalDiscoveryScenario({ ...baseline, discountRate: 0 });
    // Integral_0^20 [exp(-t/10) - exp(-t/5)] dt, times 40 realizable DALYs/year.
    const expected = 40 * (10 * (1 - Math.exp(-2)) - 5 * (1 - Math.exp(-4)));
    expect(result.dalysAverted).toBeCloseTo(expected, 10);
    expect(result.discountedDalysAverted).toBe(result.dalysAverted);
    expect(result.annualDalysAverted).toHaveLength(20);
    expect(result.annualDalysAverted[0]).toBeCloseTo(40 * (10 * (1 - Math.exp(-0.1)) - 5 * (1 - Math.exp(-0.2))), 10);
    // Applying the year-end difference to the whole first year overstates flow.
    expect(result.annualDalysAverted[0]!).toBeLessThan(40 * (Math.exp(-0.1) - Math.exp(-0.2)));
  });

  it('discounts each annual flow at year-end, rather than discounting the final total once', () => {
    const result = evaluateClinicalDiscoveryScenario(baseline);
    const expected = result.annualDalysAverted.reduce((sum, value, i) => sum + value / 1.03 ** (i + 1), 0);
    expect(result.discountedDalysAverted).toBeCloseTo(expected, 10);
    expect(result.discountedDalysAverted).toBeLessThan(result.dalysAverted);
    expect(result.discountedDalysAverted).toBeGreaterThan(result.dalysAverted / 1.03 ** 20);
  });

  it('cannot avert more than the scoped, realizable burden inside the finite horizon', () => {
    const result = evaluateClinicalDiscoveryScenario({ ...baseline, discoveryMultiplier: 1_000_000 });
    expect(result.dalysAverted).toBeGreaterThan(0);
    expect(result.dalysAverted).toBeLessThan(100 * 0.8 * 0.5 * 20);
    expect(result.annualDalysAverted.every(value => value >= 0 && value <= 40)).toBe(true);
  });

  it('counts only post-lag availability, including fractional-year rollout', () => {
    const result = evaluateClinicalDiscoveryScenario({
      ...baseline, baselineLagYears: 30, reformLagYears: 2.5,
    });
    expect(result.annualDalysAverted.slice(0, 2)).toEqual([0, 0]);
    expect(result.annualDalysAverted[2]).toBeCloseTo(40 * (0.5 - (1 - Math.exp(-0.2 * 0.5)) / 0.2), 10);
    const beyondHorizon = evaluateClinicalDiscoveryScenario({ ...baseline, baselineLagYears: 30, reformLagYears: 20 });
    expect(beyondHorizon.dalysAverted).toBe(0);
  });

  it.each([
    { discoveryMultiplier: 0.5, reformLagYears: 0 },
    { discoveryMultiplier: 0, reformLagYears: 0 },
    { discoveryMultiplier: 1, reformLagYears: 5 },
  ])('retains downside from slower or later availability: %j', changes => {
    const result = evaluateClinicalDiscoveryScenario({ ...baseline, ...changes });
    expect(result.dalysAverted).toBeLessThan(0);
    expect(result.discountedDalysAverted).toBeLessThan(0);
    expect(result.annualDalysAverted.every(value => value <= 0 && value >= -40)).toBe(true);
  });

  it('evaluates joint funding and access against baseline once, not by adding standalone benefits', () => {
    const shared = { ...baseline, discountRate: 0, baselineLagYears: 8 };
    const funding = evaluateClinicalDiscoveryScenario({ ...shared, reformLagYears: 8 });
    const access = evaluateClinicalDiscoveryScenario({ ...shared, discoveryMultiplier: 1 });
    const joint = evaluateClinicalDiscoveryScenario(shared);
    const availabilityArea = (hazard: number, lag: number) => {
      const years = 20 - lag;
      return years - (1 - Math.exp(-hazard * years)) / hazard;
    };
    expect(joint.dalysAverted).toBeCloseTo(40 * (availabilityArea(0.2, 0) - availabilityArea(0.1, 8)), 10);
    expect(joint.dalysAverted).not.toBeCloseTo(funding.dalysAverted + access.dalysAverted, 6);
  });

  it('preserves small finite benefits for very long discovery waits', () => {
    const result = evaluateClinicalDiscoveryScenario({ ...baseline, baselineWaitYears: 1e16, horizonYears: 1 });
    expect(result.dalysAverted).toBeGreaterThan(0);
    expect(result.dalysAverted / 2e-15).toBeCloseTo(1, 10);
  });

  it('follows a one-year funded tranche for twenty years without funding twenty discovery cohorts', () => {
    const oneTranche = evaluateClinicalDiscoveryScenario({
      ...baseline, discountRate: 0, discoverySchedule: [{ untilYear: 1, multiplier: 2 }],
    });
    const continuous = evaluateClinicalDiscoveryScenario({ ...baseline, discountRate: 0 });
    const firstYearArea = (1 - Math.exp(-0.1)) / 0.1 - (1 - Math.exp(-0.2)) / 0.2;
    // After year one, both hazards are 0.1. The earlier discoveries leave a
    // survival gap that decays at the baseline rate rather than growing at 2x.
    const laterArea = (1 - Math.exp(-0.1)) * (Math.exp(-0.1) - Math.exp(-2)) / 0.1;
    expect(oneTranche.dalysAverted).toBeCloseTo(40 * (firstYearArea + laterArea), 10);
    expect(oneTranche.annualDalysAverted[0]).toBe(continuous.annualDalysAverted[0]);
    expect(oneTranche.annualDalysAverted[19]).toBeGreaterThan(0);
    expect(oneTranche.dalysAverted).toBeLessThan(continuous.dalysAverted);
  });

  it.each([
    [],
    [{ untilYear: 1, multiplier: 1 }],
    [{ untilYear: 1, multiplier: 1 }, { untilYear: 10, multiplier: 1 }],
  ].map(discoverySchedule => ({ discoverySchedule })))('an explicit baseline schedule overrides the constant multiplier: %j', ({ discoverySchedule }) => {
    const result = evaluateClinicalDiscoveryScenario({ ...baseline, discoveryMultiplier: 100, discoverySchedule });
    expect(result.dalysAverted).toBe(0);
    expect(result.annualDalysAverted).toEqual(Array(20).fill(0));
  });

  it('integrates schedule breakpoints shifted by a fractional availability lag', () => {
    const result = evaluateClinicalDiscoveryScenario({
      ...baseline, baselineLagYears: 0.75, reformLagYears: 0.75,
      discoverySchedule: [{ untilYear: 0.5, multiplier: 2 }],
    });
    // In calendar year one, only discovery-clock time [0,0.25] is available.
    const expected = 40 * ((1 - Math.exp(-0.1 * 0.25)) / 0.1 - (1 - Math.exp(-0.2 * 0.25)) / 0.2);
    expect(result.annualDalysAverted[0]).toBeCloseTo(expected, 10);
    expect(result.annualDalysAverted[1]).toBeGreaterThan(0);
  });

  it('evaluates one-year funding and ten-year access as one joint discovery schedule', () => {
    const funding = evaluateClinicalDiscoveryScenario({ ...baseline, discoverySchedule: [{ untilYear: 1, multiplier: 3 }] });
    const access = evaluateClinicalDiscoveryScenario({ ...baseline, discoverySchedule: [{ untilYear: 10, multiplier: 2 }] });
    const joint = evaluateClinicalDiscoveryScenario({
      ...baseline,
      discoverySchedule: [{ untilYear: 1, multiplier: 3 }, { untilYear: 10, multiplier: 2 }],
    });
    const survivalArea = (hazard: number, years: number) => (1 - Math.exp(-hazard * years)) / hazard;
    const jointSurvival = survivalArea(0.3, 1) + Math.exp(-0.3) * survivalArea(0.2, 9) + Math.exp(-2.1) * survivalArea(0.1, 10);
    expect(joint.dalysAverted).toBeCloseTo(40 * (survivalArea(0.1, 20) - jointSurvival), 10);
    expect(joint.dalysAverted).toBeLessThan(funding.dalysAverted + access.dalysAverted);
  });

  it('retains the harm from a temporary discovery pause after the rate returns to baseline', () => {
    const result = evaluateClinicalDiscoveryScenario({ ...baseline, discoverySchedule: [{ untilYear: 1, multiplier: 0 }] });
    expect(result.annualDalysAverted.every(value => value < 0)).toBe(true);
    expect(result.dalysAverted).toBeLessThan(0);
  });

  it.each([
    [{ untilYear: 0, multiplier: 2 }],
    [{ untilYear: 1, multiplier: 2 }, { untilYear: 1, multiplier: 3 }],
    [{ untilYear: 2, multiplier: 2 }, { untilYear: 1, multiplier: 3 }],
    [{ untilYear: Infinity, multiplier: 2 }],
    [{ untilYear: 1, multiplier: -1 }],
    [{ untilYear: 1, multiplier: NaN }],
  ].map(discoverySchedule => ({ discoverySchedule })))('rejects invalid discovery schedules: %j', ({ discoverySchedule }) => {
    expect(() => evaluateClinicalDiscoveryScenario({ ...baseline, discoverySchedule })).toThrow();
  });

  it.each([
    { horizonYears: 0 }, { horizonYears: 1.5 }, { horizonYears: Infinity },
    { discountRate: -0.01 }, { annualBurdenDalys: -1 }, { annualBurdenDalys: NaN },
    { avoidableFraction: 1.1 }, { adoptionFraction: -0.1 },
    { baselineWaitYears: 0 }, { baselineWaitYears: Number.MIN_VALUE },
    { baselineLagYears: -1 }, { reformLagYears: -1 }, { discoveryMultiplier: -1 },
  ])('rejects invalid scenario inputs: %j', changes => {
    expect(() => evaluateClinicalDiscoveryScenario({ ...baseline, ...changes })).toThrow();
  });
});

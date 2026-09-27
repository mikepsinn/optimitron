import { describe, expect, it } from 'vitest';
import { optimizeWithUncertainty, sampleTriangular, seededRandom, summarizeSimulation, type AllocationOption } from '../uncertain-allocation.js';

describe('allocation under uncertainty', () => {
  it('chooses one implementable allocation, without per-draw perfect information', () => {
    const result = optimizeWithUncertainty([
      { id: 'a', group: 'a', annualCostUsd: 10, benefitDrawsUsd: [100, 0] },
      { id: 'b', group: 'b', annualCostUsd: 10, benefitDrawsUsd: [0, 90] },
    ], 10, [1, 1], 1);
    expect(result.selectedOptionIds).toEqual(['a']);
    expect(result.netBenefit.mean).toBe(40);
    expect(result.netBenefit.probabilityPositive).toBe(0.5);
  });

  it('does not add overlapping interventions, and can choose their joint option', () => {
    const result = optimizeWithUncertainty([
      { id: 'funding', group: 'trials', annualCostUsd: 3, benefitDrawsUsd: [30, 30] },
      { id: 'access', group: 'trials', annualCostUsd: 3, benefitDrawsUsd: [25, 25] },
      { id: 'joint', group: 'trials', annualCostUsd: 6, benefitDrawsUsd: [40, 40] },
    ], 6, [1, 1], 1);
    expect(result.selectedOptionIds).toEqual(['joint']);
    expect(result.benefit.mean).toBe(40);
  });

  it('can leave money in the funding source instead of forcing harmful reallocations', () => {
    const result = optimizeWithUncertainty([
      { id: 'weak', group: 'a', annualCostUsd: 10, benefitDrawsUsd: [5, 5] },
    ], 20, [1, 1], 1);
    expect(result.selectedOptionIds).toEqual([]);
    expect(result.annualCostUsd).toBe(0);
  });

  it('respects the ceiling with fractional costs and distinct groups', () => {
    const result = optimizeWithUncertainty([
      { id: 'a', group: 'a', annualCostUsd: 5.1, benefitDrawsUsd: [20] },
      { id: 'b', group: 'b', annualCostUsd: 5.1, benefitDrawsUsd: [19] },
    ], 10, [0], 1);
    expect(result.annualCostUsd).toBeLessThanOrEqual(10);
    expect(result.selectedOptionIds).toEqual(['a']);
  });

  it.each([
    { ceiling: 0, cost: 0.5 },
    { ceiling: 1_000_000_000, cost: 1_000_000_000.25 },
    { ceiling: 999_999_999.75, cost: 1_000_000_000 },
  ])('never rounds an infeasible actual cost $cost into ceiling $ceiling', ({ ceiling, cost }) => {
    const result = optimizeWithUncertainty([
      { id: 'infeasible', group: 'a', annualCostUsd: cost, benefitDrawsUsd: [10_000_000_000] },
    ], ceiling, [0], 1_000_000_000);
    expect(result.selectedOptionIds).toEqual([]);
    expect(result.annualCostUsd).toBeLessThanOrEqual(ceiling);
    expect(result.unspentUsd).toBeGreaterThanOrEqual(0);
  });

  it('matches exhaustive feasible portfolios across budgets and mutually exclusive option groups', () => {
    const random = seededRandom(317);
    const financing = [0, 2, 4];
    for (let scenario = 0; scenario < 12; scenario++) {
      const options: AllocationOption[] = Array.from({ length: 9 }, (_, i) => ({
        id: `option-${i}`,
        group: `group-${Math.floor(i / 3)}`,
        annualCostUsd: 2 * (1 + Math.floor(random() * 5)),
        benefitDrawsUsd: Array.from({ length: 3 }, () => Math.floor(random() * 80) - 20),
      }));
      for (const ceiling of [0, 2, 6, 10, 16, 30]) {
        let exhaustiveValue = 0;
        // Independent oracle: enumerate all portfolios, then reject infeasible
        // group combinations and budgets. This does not reproduce the DP.
        for (let mask = 1; mask < 2 ** options.length; mask++) {
          const portfolio = options.filter((_, i) => (mask & (1 << i)) !== 0);
          if (new Set(portfolio.map(option => option.group)).size !== portfolio.length) continue;
          const cost = portfolio.reduce((sum, option) => sum + option.annualCostUsd, 0);
          if (cost > ceiling) continue;
          const netDraws = financing.map((loss, draw) =>
            portfolio.reduce((sum, option) => sum + option.benefitDrawsUsd[draw]!, 0) - cost * loss);
          const expected = netDraws.reduce((sum, value) => sum + value, 0) / netDraws.length;
          exhaustiveValue = Math.max(exhaustiveValue, expected);
        }
        const result = optimizeWithUncertainty(options, ceiling, financing, 2);
        expect(result.netBenefit.mean).toBeCloseTo(exhaustiveValue, 10);
        expect(result.annualCostUsd).toBeLessThanOrEqual(ceiling);
        const selected = options.filter(option => result.selectedOptionIds.includes(option.id));
        expect(new Set(selected.map(option => option.group)).size).toBe(selected.length);
      }
    }
  });

  it('propagates correlated benefit and financing draws without adding marginal quantiles', () => {
    const result = optimizeWithUncertainty([
      { id: 'a', group: 'a', annualCostUsd: 10, benefitDrawsUsd: [20, 100] },
    ], 10, [0, 8], 1);
    expect(result.netBenefit.p05).toBe(20);
    expect(result.netBenefit.p95).toBe(20);
  });

  it('rejects malformed or mismatched inputs instead of silently producing estimates', () => {
    expect(() => optimizeWithUncertainty([{ id: 'x', group: 'x', annualCostUsd: 1, benefitDrawsUsd: [NaN] }], 1, [0], 1)).toThrow();
    expect(() => sampleTriangular({ low: 2, mode: 1, high: 3 }, seededRandom(1))).toThrow();
  });

  it('is reproducible and recovers the analytic mean of a triangular prior', () => {
    const simulate = () => {
      const random = seededRandom(912);
      return Array.from({ length: 10000 }, () => sampleTriangular({ low: -3, mode: 0, high: 6 }, random));
    };
    const a = simulate();
    expect(a).toEqual(simulate());
    expect(summarizeSimulation(a).mean).toBeCloseTo(1, 1);
    expect(Math.min(...a)).toBeGreaterThanOrEqual(-3);
    expect(Math.max(...a)).toBeLessThanOrEqual(6);
  });
});

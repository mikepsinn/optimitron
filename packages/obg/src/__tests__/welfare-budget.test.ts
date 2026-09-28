import { describe, expect, it } from 'vitest';
import { optimizeWelfareBudget } from '../welfare-budget.js';
import type { WelfareBudgetCategory, WelfareBudgetResponse } from '../welfare-budget.js';
import type { DiminishingReturnsModel } from '../diminishing-returns.js';

function model(beta: number, type: 'log' | 'saturation' = 'log', gamma = 10): DiminishingReturnsModel {
  return { type, alpha: 0, beta, gamma, r2: 1, n: 100 };
}

function response(income: number, health = 0, type: 'log' | 'saturation' = 'log'): WelfareBudgetResponse {
  return { incomeGrowthPpYear: model(income, type), medianHealthyLifeYears: model(health, type) };
}

function category(id: string, income: number, health = 0): WelfareBudgetCategory {
  return { id, currentSpendingUsd: 50, minSpendingUsd: 0.001, maxSpendingUsd: 100, response: response(income, health) };
}

describe('full-budget two-metric welfare optimization', () => {
  it('finds the analytical log optimum and conserves the sum of allocations', () => {
    const result = optimizeWelfareBudget({ totalBudgetUsd: 100, categories: [category('a', 1), category('b', 3)] });
    expect(result.allocations.map(row => row.spendingUsd)).toEqual([expect.closeTo(25, 8), expect.closeTo(75, 8)]);
    expect(result.allocations.reduce((sum, row) => sum + row.spendingUsd, 0)).toBeCloseTo(100, 10);
    expect(result.expectedEffect.incomeGrowthPpYearChange).toBeCloseTo(Math.log(0.5) + 3 * Math.log(1.5), 10);
    expect(result.expectedEffect.medianHealthyLifeYearsChange).toBe(0);
    expect(result.shadowPrice).toBeCloseTo(0.5 / 25, 10);
  });

  it('solves saturation curves instead of proportionally scaling their target spending', () => {
    const categories = [category('a', 1), category('b', 4)].map(row => ({
      ...row, minSpendingUsd: 0, response: response(row.id === 'a' ? 1 : 4, 0, 'saturation'),
    }));
    const result = optimizeWelfareBudget({ totalBudgetUsd: 100, categories });
    // 10/(a+10)^2 = 40/(b+10)^2, a+b=100 -> a=30, b=70.
    expect(result.allocations[0]!.spendingUsd).toBeCloseTo(30, 8);
    expect(result.allocations[1]!.spendingUsd).toBeCloseTo(70, 8);
  });

  it('respects bounds and unchanged fixed lines without inventing their response curves', () => {
    const result = optimizeWelfareBudget({ totalBudgetUsd: 100, categories: [
      { ...category('a', 10), currentSpendingUsd: 30, maxSpendingUsd: 20 },
      { ...category('b', 1), currentSpendingUsd: 40, minSpendingUsd: 5 },
      { id: 'fixed', currentSpendingUsd: 30, minSpendingUsd: 30, maxSpendingUsd: 30 },
    ] });
    expect(result.allocations.map(row => row.spendingUsd)).toEqual([expect.closeTo(20, 8), expect.closeTo(50, 8), 30]);
    expect(result.allocatedBudgetUsd).toBe(100);
  });

  it('uses explicit welfare weights and retains endpoint units', () => {
    const categories = [category('income', 1), category('health', 0, 1)];
    const equal = optimizeWelfareBudget({ totalBudgetUsd: 100, categories });
    const weighted = optimizeWelfareBudget({ totalBudgetUsd: 100, categories, welfareConfig: { alpha: 0.8 } });
    expect(equal.allocations[0]!.spendingUsd).toBeCloseTo(50, 8);
    expect(weighted.allocations[0]!.spendingUsd).toBeCloseTo(80, 8);
    expect(weighted.allocations[1]!.spendingUsd).toBeCloseTo(20, 8);
    expect(weighted.expectedEffect.incomeGrowthPpYearChange).toBeCloseTo(Math.log(1.6), 10);
    expect(weighted.expectedEffect.medianHealthyLifeYearsChange).toBeCloseTo(Math.log(0.4), 10);
    expect(weighted.expectedEffect.welfareChange).toBeCloseTo(0.8 * Math.log(1.6) + 0.2 * Math.log(0.4), 10);
  });

  it('honors a binding minimum even when its marginal welfare is lower', () => {
    const result = optimizeWelfareBudget({ totalBudgetUsd: 100, categories: [
      { ...category('a', 1), minSpendingUsd: 40 }, category('b', 9),
    ] });
    expect(result.allocations[0]!.spendingUsd).toBeCloseTo(40, 10);
    expect(result.allocations[1]!.spendingUsd).toBeCloseTo(60, 10);
  });

  it('optimizes expected welfare across paired draws and evaluates that same allocation', () => {
    const result = optimizeWelfareBudget({
      totalBudgetUsd: 100,
      welfareConfig: { alpha: 1 },
      categories: [
        { ...category('a', 100), currentSpendingUsd: 80 },
        { ...category('b', 1), currentSpendingUsd: 20 },
      ],
      curveDraws: [
        { a: response(9), b: response(1) },
        { a: response(1), b: response(9) },
      ],
    });
    // Mean coefficients are equal. Optimizing separately in each draw would
    // instead pick 90/10 then 10/90, which is not one implementable budget.
    expect(result.allocations.map(row => row.spendingUsd)).toEqual([expect.closeTo(50, 8), expect.closeTo(50, 8)]);
    const effects = [9 * Math.log(50 / 80) + Math.log(50 / 20), Math.log(50 / 80) + 9 * Math.log(50 / 20)];
    expect(result.expectedEffect.welfareChange).toBeCloseTo((effects[0]! + effects[1]!) / 2, 10);
    expect(result.uncertainty!.welfareChange.probabilityPositive).toBe(0.5);
    expect(result.uncertainty!.welfareChange.p05).toBeCloseTo(effects[0]! * 0.95 + effects[1]! * 0.05, 10);
  });

  it('supports differing saturation shapes in the draws and beats every coarse feasible allocation', () => {
    const categories = [category('a', 0), category('b', 0)].map(row => ({ ...row, minSpendingUsd: 0 }));
    const draws = [
      { a: response(2, 1, 'saturation'), b: response(1, 4, 'saturation') },
      { a: { incomeGrowthPpYear: model(9, 'saturation', 50), medianHealthyLifeYears: model(1, 'saturation', 5) }, b: response(2, 1, 'saturation') },
    ];
    const result = optimizeWelfareBudget({ totalBudgetUsd: 100, categories, curveDraws: draws });
    const score = (a: number): number => draws.reduce((sum, draw) => sum +
      0.5 * (draw.a.incomeGrowthPpYear.beta * a / (a + draw.a.incomeGrowthPpYear.gamma!) +
      draw.a.medianHealthyLifeYears.beta * a / (a + draw.a.medianHealthyLifeYears.gamma!) +
      draw.b.incomeGrowthPpYear.beta * (100 - a) / (110 - a) +
      draw.b.medianHealthyLifeYears.beta * (100 - a) / (110 - a)), 0) / draws.length;
    const selected = score(result.allocations[0]!.spendingUsd);
    for (let a = 0; a <= 100; a += 1) expect(selected + 1e-10).toBeGreaterThanOrEqual(score(a));
  });

  it('keeps neutral categories unchanged when all allocations have the same welfare', () => {
    const categories = [category('a', 0), category('b', 0)];
    const result = optimizeWelfareBudget({ totalBudgetUsd: 100, categories });
    expect(result.allocations.map(row => row.spendingUsd)).toEqual([50, 50]);
    expect(result.expectedEffect.welfareChange).toBe(0);
  });

  it('allocates residual funds to flat categories after productive curves hit their cap', () => {
    const result = optimizeWelfareBudget({ totalBudgetUsd: 100, categories: [
      { ...category('productive', 1), maxSpendingUsd: 60 }, category('flat', 0),
    ] });
    expect(result.allocations.map(row => row.spendingUsd)).toEqual([60, 40]);
  });

  it('can allocate a federal-sized budget without losing or creating dollars', () => {
    const result = optimizeWelfareBudget({ totalBudgetUsd: 6.872e12, categories: [
      { ...category('a', 1), currentSpendingUsd: 3.436e12, minSpendingUsd: 1e9, maxSpendingUsd: 6.872e12 },
      { ...category('b', 3), currentSpendingUsd: 3.436e12, minSpendingUsd: 1e9, maxSpendingUsd: 6.872e12 },
    ] });
    expect(result.allocatedBudgetUsd).toBe(6.872e12);
    expect(result.allocations[0]!.spendingUsd / 6.872e12).toBeCloseTo(0.25, 12);
  });

  it.each([
    { reason: 'incomplete baseline', budget: 101, categories: [category('a', 1), category('b', 1)] },
    { reason: 'infeasible bounds', budget: 100, categories: [{ ...category('a', 1), maxSpendingUsd: 40 }, { ...category('b', 1), maxSpendingUsd: 40 }] },
    { reason: 'missing response', budget: 100, categories: [{ ...category('a', 1), response: undefined }, category('b', 1)] },
    { reason: 'nonconcave curve', budget: 100, categories: [category('a', -1), category('b', 1)] },
    { reason: 'invalid log domain', budget: 100, categories: [{ ...category('a', 1), minSpendingUsd: 0 }, category('b', 1)] },
    { reason: 'duplicate category', budget: 100, categories: [category('a', 1), category('a', 1)] },
  ])('rejects $reason rather than producing an optimum', ({ budget, categories }) => {
    expect(() => optimizeWelfareBudget({ totalBudgetUsd: budget, categories })).toThrow();
  });

  it('rejects incomplete paired draws and negative-slope bootstrap curves', () => {
    const input = { totalBudgetUsd: 100, categories: [category('a', 1), category('b', 1)] };
    expect(() => optimizeWelfareBudget({ ...input, curveDraws: [{ a: response(1) }] })).toThrow(/Missing/);
    expect(() => optimizeWelfareBudget({ ...input, curveDraws: [{ a: response(-1), b: response(1) }] })).toThrow(/nonnegative beta/);
  });
});

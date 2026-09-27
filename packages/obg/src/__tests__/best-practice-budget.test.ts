import { describe, expect, it } from 'vitest';
import { calculateBestPracticeBudget, chooseSupportedOutcomeQuantile } from '../best-practice-budget.js';
import type { BestPracticeBudgetInput } from '../best-practice-budget.js';

const input: BestPracticeBudgetInput = {
  population: 1000, outcomeQuantile: 0.5,
  categories: [
    { id: 'health', name: 'Health', outcomeMetrics: ['hale'], selectionCost: 'totalHealthPerCapita' },
    { id: 'other', name: 'Other', outcomeMetrics: ['hale', 'income'] },
  ],
  countries: [
    { id: 'A', name: 'A', costs: { health: 2, other: 80 }, totalHealthPerCapita: 200, outcomes: { hale: 80, income: 50 } },
    { id: 'B', name: 'B', costs: { health: 40, other: 70 }, totalHealthPerCapita: 50, outcomes: { hale: 80, income: 80 } },
    { id: 'C', name: 'C', costs: { health: 1, other: 0 }, totalHealthPerCapita: 1, outcomes: { hale: 40, income: 100 } },
  ],
};

describe('best-practice budget', () => {
  it('selects on total healthcare costs and requires every outcome target', () => {
    const result = calculateBestPracticeBudget(input);
    expect(result.lines.map(r => r.peer?.id)).toEqual(['B', 'B']);
    expect(result.totalPerCapita).toBe(110);
    expect(result.annualBudget).toBe(110000);
    // Reporting public costs does not change the ranking that accounts for private bills.
    expect(result.lines[0]!.perCapitaRange).toEqual([2, 40]);
  });
  it('scales every line and the total linearly without changing reference systems', () => {
    const first = calculateBestPracticeBudget(input);
    const second = calculateBestPracticeBudget({ ...input, population: 2000 });
    expect(second.annualBudget).toBe(first.annualBudget! * 2);
    expect(second.lines.map(r => r.annualBudget)).toEqual(first.lines.map(r => r.annualBudget! * 2));
    expect(second.totalPerCapita).toBe(first.totalPerCapita);
  });
  it('does not turn missing spending or infeasible joint targets into a zero budget', () => {
    const missing = calculateBestPracticeBudget({ ...input, countries: input.countries.map(c => ({ ...c, costs: { health: null, other: 0 } })) });
    expect(missing.complete).toBe(false);
    expect(missing.totalPerCapita).toBeNull();
    expect(missing.lines[0]!.annualBudget).toBeNull();
    const infeasible = calculateBestPracticeBudget({ ...input, outcomeQuantile: 1 });
    expect(infeasible.lines[1]!.peer).toBeNull();
    expect(infeasible.annualBudget).toBeNull();
  });
  it('retains genuine zero spending and resolves equal-cost ties deterministically', () => {
    const countries = [input.countries[1]!, { ...input.countries[1]!, id: 'Z' }].map(c => ({ ...c, costs: { zero: 0 } }));
    const result = calculateBestPracticeBudget({ ...input, countries, categories: [{ id: 'zero', name: 'Zero', outcomeMetrics: ['hale'] }] });
    expect(result.complete).toBe(true);
    expect(result.annualBudget).toBe(0);
    expect(result.lines[0]!.peer?.id).toBe('B');
  });
  it('rejects duplicate countries/categories and invalid user populations', () => {
    for (const population of [0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
      expect(() => calculateBestPracticeBudget({ ...input, population })).toThrow('Population');
    }
    expect(() => calculateBestPracticeBudget({ ...input, countries: [...input.countries, input.countries[0]!] })).toThrow('one observation');
    expect(() => calculateBestPracticeBudget({ ...input, categories: [...input.categories, input.categories[0]!] })).toThrow('unique');
  });
  it('never silently weakens an outcome target when no country qualifies', () => {
    const result = calculateBestPracticeBudget({ ...input, outcomeQuantile: 0.95 });
    expect(result.outcomeQuantile).toBe(0.95);
    expect(result.complete).toBe(false);
    expect(chooseSupportedOutcomeQuantile(input.countries)).toBe(0.8);
  });
});

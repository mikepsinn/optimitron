import { describe, expect, it } from 'vitest';
import { BEST_PRACTICE_BUDGET_DATA as data } from '@optimitron/data/datasets/best-practice-budget';
import { HEALTHCARE_COFOG_DATA as healthBudgets } from '@optimitron/data/datasets/healthcare-cofog';
import { getBestPracticeBudget, renderBestPracticeBudgetMarkdown } from './best-practice-budget';

describe('published population budget', () => {
  it('reconciles all public functions before selecting systems', () => {
    for (const country of data.countries) {
      expect(Object.keys(country.costs).sort()).toEqual(data.categories.map(c => c.id).sort());
      for (const year of country.observations) {
        const sum = Object.values(year.costs).reduce((a, b) => a + b, 0);
        expect(Math.abs(sum - year.totalPerCapita)).toBeLessThan(Math.max(5, year.totalPerCapita * 0.001));
      }
      expect(country.observations.map(y => y.year)).toEqual(data.period);
    }
  });
  it('delivers a complete supported default and preserves unavailable stricter budgets', () => {
    const report = getBestPracticeBudget(1_000_000);
    const scenario = report.scenarios.find(s => s.outcomeQuantile === report.defaultQuantile)!;
    expect(scenario.complete).toBe(true);
    expect(scenario.lines).toHaveLength(10);
    expect(scenario.lines.find(l => l.id === 'GF02')!.eligibleCountryCount).toBeGreaterThanOrEqual(3);
    expect(scenario.annualBudget).toBeCloseTo(scenario.lines.reduce((sum, l) => sum + l.annualBudget!, 0), 3);
    const text = renderBestPracticeBudgetMarkdown(report);
    for (const line of scenario.lines) expect(text).toContain(line.peer!.name);
    expect(text).toContain('not sampling confidence intervals');
    expect(text).toContain('median individual healthspan');
  });
  it('selects healthcare on total cost, retaining a separately sourced public allocation', () => {
    const scenario = getBestPracticeBudget().scenarios[0]!;
    const health = scenario.lines.find(l => l.id === 'GF07')!;
    expect(health.selectionCost).toBe('totalHealthPerCapita');
    const source = data.healthcareCountries.find(c => c.id === health.peer!.id)!;
    const budget = healthBudgets.countries.find(c => c.countryId === health.peer!.id)!;
    expect(health.peer!.publicCostPerCapita).toBe(budget.publicPerCapita);
    expect(health.peer!.selectionCostPerCapita).toBe(source.totalPerCapita);
    // Substituting current-care finance would lose R&D and overlap social-care accounts.
    expect(health.peer!.publicCostPerCapita).not.toBe(source.publicPerCapita);
  });
  it('reconciles every target and service breakdown without adding child or private spending twice', () => {
    const report = getBestPracticeBudget(2_000_000);
    for (const scenario of report.scenarios) {
      expect(scenario.complete).toBe(true);
      expect(scenario.totalPerCapita).toBeCloseTo(scenario.lines.reduce((sum, line) => sum + line.peer!.publicCostPerCapita, 0), 8);
      expect(scenario.annualBudget).toBeCloseTo(scenario.totalPerCapita! * 2_000_000, 3);
      for (const line of scenario.lines) {
        const reported = line.breakdown.reduce((sum, child) => sum + (child.perCapita ?? 0), 0);
        expect(reported + line.breakdownRemainder!).toBeCloseTo(line.peer!.publicCostPerCapita, 8);
      }
      const selectedHealth = report.healthcare.scenarios.find(h => h.maxHealthyYearGap === scenario.maxHealthyYearGap)!;
      expect(scenario.lines.find(l => l.id === 'GF07')!.peer!.id).toBe(selectedHealth.selected!.id);
    }
    const japan = report.scenarios.find(s => s.maxHealthyYearGap === 1)!.lines.find(l => l.id === 'GF07')!;
    expect(japan.breakdown.find(child => child.id === 'GF0705')!.perCapita).toBeGreaterThan(0);
    const korea = report.scenarios.find(s => s.maxHealthyYearGap === 1.5)!.lines.find(l => l.id === 'GF07')!;
    expect(korea.breakdown.every(child => child.perCapita === null)).toBe(true);
    expect(korea.breakdownRemainder).toBe(korea.peer!.publicCostPerCapita);
  });
});

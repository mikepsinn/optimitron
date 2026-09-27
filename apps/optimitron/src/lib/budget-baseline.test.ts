import { describe, expect, it } from 'vitest';
import {
  applyBudgetReallocation,
  FEDERAL_BUDGET_BASELINE,
  MILITARY_FUNDING_SCENARIOS,
} from '../../scripts/analysis/budget-baseline';

describe('incremental federal budget ledger', () => {
  it('retains the unexplained residual as protected spending, not available funding', () => {
    const baseline = FEDERAL_BUDGET_BASELINE;
    expect(baseline.lines).toHaveLength(24);
    expect(baseline.lines.reduce((sum, line) => sum + line.annualOutlaysUsd, 0)).toBe(baseline.totalOutlaysUsd);
    expect(baseline.lines.find(line => line.sourceType === 'reconciliation')).toMatchObject({
      annualOutlaysUsd: 165_000_000_000,
      protected: true,
    });
    expect(MILITARY_FUNDING_SCENARIOS.map(scenario => scenario.maximumReallocationUsd)).toEqual([
      0, 8_860_000_000, 44_300_000_000, 88_600_000_000,
    ]);
  });

  it('aggregates two health increments once and preserves all unrelated spending', () => {
    const result = applyBudgetReallocation(MILITARY_FUNDING_SCENARIOS[1]!, [
      { budgetAccount: 'health_research', annualCostUsd: 2_000_000_000.01 },
      { budgetAccount: 'public_health', annualCostUsd: 500_000_000.02 },
    ]);
    expect(result.lines.filter(line => line.id === 'health_discretionary')).toHaveLength(1);
    expect(result.lines.find(line => line.id === 'health_discretionary')?.annualOutlaysUsd).toBe(96_500_000_000.03);
    expect(result.lines.find(line => line.id === 'military')?.annualOutlaysUsd).toBe(883_499_999_999.97);
    expect(result.unusedReallocationCapacityUsd).toBe(6_359_999_999.97);
    expect(result.lines.reduce((sum, line) => sum + Math.round(line.annualOutlaysUsd * 100), 0)).toBe(result.totalOutlaysUsd * 100);
    for (const line of result.lines.filter(line => !['health_discretionary', 'military'].includes(line.id))) {
      expect(line.annualOutlaysUsd).toBe(line.baselineOutlaysUsd);
    }
    expect(FEDERAL_BUDGET_BASELINE.lines.find(line => line.id === 'military')?.annualOutlaysUsd).toBe(886_000_000_000);
  });

  it('keeps the full baseline when no program is selected', () => {
    const result = applyBudgetReallocation(MILITARY_FUNDING_SCENARIOS[3]!, []);
    expect(result.reallocatedUsd).toBe(0);
    expect(result.lines.every(line => line.annualOutlaysUsd === line.baselineOutlaysUsd)).toBe(true);
  });

  it('rejects unfunded costs and negative costs that would raid a protected line', () => {
    expect(() => applyBudgetReallocation(MILITARY_FUNDING_SCENARIOS[0]!, [
      { budgetAccount: 'education', annualCostUsd: 1 },
    ])).toThrow('ceiling');
    expect(() => applyBudgetReallocation(MILITARY_FUNDING_SCENARIOS[1]!, [
      { budgetAccount: 'housing', annualCostUsd: 8_860_000_000.01 },
    ])).toThrow('ceiling');
    for (const annualCostUsd of [-1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => applyBudgetReallocation(MILITARY_FUNDING_SCENARIOS[1]!, [
        { budgetAccount: 'justice', annualCostUsd },
      ])).toThrow('nonnegative finite');
    }
  });
});

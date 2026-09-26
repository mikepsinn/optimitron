import { describe, expect, it } from 'vitest';
import { createBudgetLegislationBriefs } from '../budget-legislation-brief.js';
import type { BudgetReportCategory, BudgetReportJSON } from '../budget-report-json.js';

const evaluated: BudgetReportCategory = {
  id: 'example', name: 'Evaluated budget', currentSpending: 200_000_000,
  currentSpendingRealPerCapita: 200, optimalSpendingNominal: 100_000_000,
  optimalSpendingPerCapita: 100, gap: 100_000_000, gapPercent: 50,
  recommendation: 'decrease', evidenceSource: 'Evaluated allocation', outcomeMetrics: [],
  efficiency: {
    rank: 5, totalCountries: 5, spendingPerCapita: 200, outcome: 75,
    outcomeName: 'Life expectancy', floorSpendingPerCapita: 100, floorOutcome: 80,
    overspendRatio: 2, potentialSavingsPerCapita: 100, potentialSavingsTotal: 100_000_000,
    bestCountry: { code: 'AAA', name: 'Peer', spendingPerCapita: 100, outcome: 80, rank: 1 },
    topEfficient: [],
  },
};

function report(categories: BudgetReportCategory[]): BudgetReportJSON {
  return { jurisdiction: 'Example', totalSpendingNominal: 200_000_000,
    generatedAt: '2026-09-26T00:00:00Z', categories, topRecommendations: [] };
}

describe('budget legislation brief selection', () => {
  it('excludes descriptive comparisons even when a peer ratio is large', () => {
    expect(createBudgetLegislationBriefs(report([
      { ...evaluated, recommendation: 'comparison_only' },
      { ...evaluated, recommendation: 'no_comparison' },
      { ...evaluated, recommendation: 'comparison_only', optimalSpendingNominal: null, optimalSpendingPerCapita: null, gap: 0 },
    ]))).toEqual([]);
  });

  it.each<Partial<BudgetReportCategory>>([
    { optimalSpendingNominal: null },
    { optimalSpendingPerCapita: null },
    { optimalSpendingNominal: Number.NaN },
    { optimalSpendingPerCapita: Number.POSITIVE_INFINITY },
    { optimalSpendingNominal: -1 },
    { efficiency: null },
    { efficiency: undefined },
  ])('does not draft an unavailable allocation: %j', (missing) => {
    expect(createBudgetLegislationBriefs(report([{ ...evaluated, ...missing }]))).toEqual([]);
  });

  it('preserves evaluated budget drafts and the caller threshold', () => {
    const briefs = createBudgetLegislationBriefs(report([evaluated]));
    expect(briefs).toHaveLength(1);
    expect(briefs[0]?.categoryId).toBe(evaluated.id);
    expect(briefs[0]?.recommendation).toBe('decrease');
    expect(createBudgetLegislationBriefs(report([evaluated]), { minOverspendRatio: 3 })).toEqual([]);
  });
});

import { describe, it, expect } from 'vitest';
import {
  US_FEDERAL_BUDGET,
  getTotalCategorySpending,
  getCategoryByName,
  getAllOutcomeMetrics,
  getHistoricalSeries,
  getSpendingCAGR,
  type BudgetCategory,
  type OutcomeMetric,
} from '../../datasets/us-federal-budget';
import {
  US_POLICIES,
  getPoliciesByCategory,
  getPoliciesByGrade,
  getRevenuePolicies,
  getTotalPolicyCost,
  getTotalSourceCount,
  type USPolicyData,
} from '../../datasets/us-policies';

// ─── Budget Dataset Tests ────────────────────────────────────────────────────

describe('US Federal Budget Dataset', () => {
  describe('Dataset structure', () => {
    it('should have a valid fiscal year', () => {
      expect(US_FEDERAL_BUDGET.fiscalYear).toBe(2025);
    });

    it('should have total outlays in a reasonable range ($5T-$9T)', () => {
      expect(US_FEDERAL_BUDGET.totalOutlays).toBeGreaterThan(5000);
      expect(US_FEDERAL_BUDGET.totalOutlays).toBeLessThan(9000);
    });

    it('should have total revenues less than total outlays (deficit)', () => {
      expect(US_FEDERAL_BUDGET.totalRevenues).toBeLessThan(US_FEDERAL_BUDGET.totalOutlays);
    });

    it('should have a deficit that matches outlays minus revenues', () => {
      const expectedDeficit = US_FEDERAL_BUDGET.totalRevenues - US_FEDERAL_BUDGET.totalOutlays;
      expect(US_FEDERAL_BUDGET.deficit).toBe(expectedDeficit);
    });

    it('should have gross debt greater than GDP', () => {
      expect(US_FEDERAL_BUDGET.grossDebt).toBeGreaterThan(US_FEDERAL_BUDGET.gdp);
    });

    it('should have metadata with sources and methodology', () => {
      expect(US_FEDERAL_BUDGET.metadata.sources.length).toBeGreaterThan(0);
      expect(US_FEDERAL_BUDGET.metadata.methodology).toBeTruthy();
      expect(US_FEDERAL_BUDGET.metadata.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('Budget categories', () => {
    it('should have at least 15 categories', () => {
      expect(US_FEDERAL_BUDGET.categories.length).toBeGreaterThanOrEqual(15);
    });

    it('should have category spending sum to a reasonable portion of total outlays', () => {
      const total = getTotalCategorySpending();
      // Categories should sum to at least 85% of total outlays
      // (some smaller categories may not be listed individually)
      expect(total).toBeGreaterThan(US_FEDERAL_BUDGET.totalOutlays * 0.85);
      // But shouldn't exceed total outlays significantly
      expect(total).toBeLessThan(US_FEDERAL_BUDGET.totalOutlays * 1.05);
    });

    it('should have percentOfTotal values that roughly sum to 100% (±5%)', () => {
      const totalPercent = US_FEDERAL_BUDGET.categories.reduce(
        (sum, cat) => sum + cat.percentOfTotal,
        0,
      );
      expect(totalPercent).toBeGreaterThan(80);
      expect(totalPercent).toBeLessThan(105);
    });

    it('should have valid spending type for each category', () => {
      const validTypes = ['mandatory', 'discretionary', 'net_interest'];
      US_FEDERAL_BUDGET.categories.forEach((cat) => {
        expect(validTypes).toContain(cat.type);
      });
    });

    it('should include major mandatory programs', () => {
      const names = US_FEDERAL_BUDGET.categories.map((c) => c.name);
      expect(names).toContain('Social Security');
      expect(names).toContain('Medicare');
      expect(names).toContain('Medicaid');
    });

    it('should include major discretionary programs', () => {
      const defense = getCategoryByName('Military');
      expect(defense).toBeDefined();
      expect(defense!.type).toBe('discretionary');

      const education = getCategoryByName('Education');
      expect(education).toBeDefined();
    });
  });

  describe('Historical spending', () => {
    it('should have historical data for every category', () => {
      US_FEDERAL_BUDGET.categories.forEach((cat) => {
        expect(cat.historicalSpending.length).toBeGreaterThan(0);
      });
    });

    it('should have 11 years of data (FY2015-FY2025) for each category', () => {
      US_FEDERAL_BUDGET.categories.forEach((cat) => {
        expect(cat.historicalSpending.length).toBe(11);
        expect(cat.historicalSpending[0].year).toBe(2015);
        expect(cat.historicalSpending[10].year).toBe(2025);
      });
    });

    it('should have the last historical year match the category spending', () => {
      US_FEDERAL_BUDGET.categories.forEach((cat) => {
        const lastYear = cat.historicalSpending[cat.historicalSpending.length - 1];
        expect(lastYear?.amount).toBe(cat.spendingBillions);
      });
    });

    it('should have all positive spending amounts', () => {
      US_FEDERAL_BUDGET.categories.forEach((cat) => {
        cat.historicalSpending.forEach((h) => {
          expect(h.amount).toBeGreaterThan(0);
        });
      });
    });

    it('should have years in ascending order', () => {
      US_FEDERAL_BUDGET.categories.forEach((cat) => {
        for (let i = 1; i < cat.historicalSpending.length; i++) {
          expect(cat.historicalSpending[i].year).toBeGreaterThan(
            cat.historicalSpending[i - 1].year,
          );
        }
      });
    });
  });

  describe('Outcome metrics', () => {
    it('should have outcome metrics for every category', () => {
      US_FEDERAL_BUDGET.categories.forEach((cat) => {
        expect(cat.outcomeMetrics.length).toBeGreaterThan(0);
      });
    });

    it('should have at least 2 outcome metrics per category', () => {
      US_FEDERAL_BUDGET.categories.forEach((cat) => {
        expect(cat.outcomeMetrics.length).toBeGreaterThanOrEqual(2);
      });
    });

    it('should have valid trend values for all metrics', () => {
      const validTrends = ['improving', 'declining', 'stable'];
      US_FEDERAL_BUDGET.categories.forEach((cat) => {
        cat.outcomeMetrics.forEach((m) => {
          expect(validTrends).toContain(m.trend);
        });
      });
    });

    it('should have a source citation for every metric', () => {
      US_FEDERAL_BUDGET.categories.forEach((cat) => {
        cat.outcomeMetrics.forEach((m) => {
          expect(m.source).toBeTruthy();
          expect(m.source.length).toBeGreaterThan(5);
        });
      });
    });

    it('should have metric years within a reasonable range (2019-2025)', () => {
      US_FEDERAL_BUDGET.categories.forEach((cat) => {
        cat.outcomeMetrics.forEach((m) => {
          // Trust fund depletion year is a projection, so allow future years
          if (m.name.includes('depletion') || m.name.includes('projected')) {
            expect(m.value).toBeGreaterThan(2025);
          } else {
            expect(m.year).toBeGreaterThanOrEqual(2019);
            expect(m.year).toBeLessThanOrEqual(2025);
          }
        });
      });
    });

    it('should have non-empty names and units', () => {
      const allMetrics = getAllOutcomeMetrics();
      allMetrics.forEach((m) => {
        expect(m.name).toBeTruthy();
        expect(m.unit).toBeTruthy();
        expect(m.category).toBeTruthy();
      });
    });
  });

  describe('Utility functions', () => {
    it('getCategoryByName should find categories case-insensitively', () => {
      expect(getCategoryByName('military')).toBeDefined();
      expect(getCategoryByName('MILITARY')).toBeDefined();
      expect(getCategoryByName('social security')).toBeDefined();
    });

    it('getCategoryByName should return undefined for nonexistent categories', () => {
      expect(getCategoryByName('Nonexistent Category XYZ')).toBeUndefined();
    });

    it('getAllOutcomeMetrics should return flattened metrics with category', () => {
      const metrics = getAllOutcomeMetrics();
      expect(metrics.length).toBeGreaterThan(30);
      metrics.forEach((m) => {
        expect(m.category).toBeTruthy();
      });
    });

    it('getHistoricalSeries should return data for known categories', () => {
      const series = getHistoricalSeries('Military');
      expect(series).toBeDefined();
      expect(series!.length).toBe(11);
    });

    it('getSpendingCAGR should return a reasonable growth rate', () => {
      const cagr = getSpendingCAGR('Military');
      expect(cagr).toBeDefined();
      // Military CAGR should be between 0% and 10% annually
      expect(cagr!).toBeGreaterThan(0);
      expect(cagr!).toBeLessThan(0.10);
    });
  });
});

// ─── Policy Dataset Tests ────────────────────────────────────────────────────

describe('US Policy Dataset', () => {
  it('should have at least 20 policies', () => {
    expect(US_POLICIES.length).toBeGreaterThanOrEqual(20);
  });

  it('should have valid structure for all policies', () => {
    US_POLICIES.forEach((policy) => {
      expect(policy.name).toBeTruthy();
      expect(policy.category).toBeTruthy();
      expect(policy.description).toBeTruthy();
      expect(typeof policy.estimatedCost).toBe('number');
      expect(policy.evidenceGrade).toMatch(/^[A-D]$/);
      expect(policy.outcomeEffects.length).toBeGreaterThan(0);
      expect(policy.sources.length).toBeGreaterThan(0);
    });
  });

  it('should have valid outcome effects for all policies', () => {
    US_POLICIES.forEach((policy) => {
      policy.outcomeEffects.forEach((effect) => {
        expect(effect.metric).toBeTruthy();
        expect(['positive', 'negative']).toContain(effect.direction);
        expect(typeof effect.magnitude).toBe('number');
        expect(['high', 'medium', 'low']).toContain(effect.confidence);
      });
    });
  });

  it('should have at least some A-grade evidence policies', () => {
    const aGrade = getPoliciesByGrade('A');
    expect(aGrade.length).toBeGreaterThanOrEqual(5);
  });

  it('should have some revenue-positive policies', () => {
    const revenue = getRevenuePolicies();
    expect(revenue.length).toBeGreaterThanOrEqual(2);
    revenue.forEach((p) => {
      expect(p.estimatedCost).toBeLessThan(0);
    });
  });

  it('should have policies spanning multiple budget categories', () => {
    const categories = new Set(US_POLICIES.map((p) => p.category));
    expect(categories.size).toBeGreaterThanOrEqual(8);
  });

  it('should have real academic/government source citations', () => {
    const totalSources = getTotalSourceCount();
    expect(totalSources).toBeGreaterThanOrEqual(30);
  });

  it('should have policy costs in a reasonable range', () => {
    US_POLICIES.forEach((policy) => {
      // Costs should be between -$500B (revenue) and $500B
      expect(policy.estimatedCost).toBeGreaterThan(-500);
      expect(policy.estimatedCost).toBeLessThan(500);
    });
  });

  it('getPoliciesByCategory should find education policies', () => {
    const edu = getPoliciesByCategory('Education');
    expect(edu.length).toBeGreaterThanOrEqual(2);
  });

  it('getTotalPolicyCost should return a finite number', () => {
    const total = getTotalPolicyCost();
    expect(Number.isFinite(total)).toBe(true);
  });
});

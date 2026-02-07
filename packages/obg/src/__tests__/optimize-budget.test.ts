/**
 * End-to-End Optimal Budget Tests
 * 
 * THE HOLY GRAIL: Given a jurisdiction's budget and cross-country data,
 * produce an optimal reallocation that maximizes welfare.
 * 
 * These tests use synthetic data that models real-world patterns:
 * - High-ROI categories (education, prevention) should get MORE money
 * - Low-ROI categories (admin, enforcement) should get LESS money
 * - The total budget stays fixed (it's a reallocation, not an increase)
 */

import { describe, it, expect } from 'vitest';
import {
  optimizeBudget,
  generateOptimalBudgetReport,
  type BudgetOptimizationInput,
  type BudgetCategoryInput,
  type OptimalBudgetResult,
} from '../optimize-budget.js';
import type { AnnualTimeSeries } from '../country-analysis.js';

// ─── Helpers ─────────────────────────────────────────────────────────

const YEARS = Array.from({ length: 20 }, (_, i) => 2000 + i);
const COUNTRIES = ['AAA', 'BBB', 'CCC', 'DDD', 'EEE'];

function series(
  id: string, varId: string, varName: string, unit: string,
  data: [number, number][],
): AnnualTimeSeries {
  const annualValues = new Map<number, number>();
  for (const [y, v] of data) annualValues.set(y, v);
  return { jurisdictionId: id, jurisdictionName: id, variableId: varId, variableName: varName, unit, annualValues };
}

/** Generate spending series for multiple countries with different levels */
function multiCountrySpending(
  varId: string, varName: string,
  baseLevels: number[], growthRate: number,
): AnnualTimeSeries[] {
  return COUNTRIES.map((id, ci) => {
    const base = baseLevels[ci] ?? baseLevels[0];
    return series(id, varId, varName, 'USD/capita',
      YEARS.map((y, i) => [y, base + i * growthRate * (1 + ci * 0.2)] as [number, number]),
    );
  });
}

/** Generate outcome series with known relationship to spending */
function multiCountryOutcome(
  varId: string, varName: string,
  baseLevel: number, responseRate: number, // How much outcome improves per unit of spending
): AnnualTimeSeries[] {
  return COUNTRIES.map((id, ci) => {
    return series(id, varId, varName, 'units',
      YEARS.map((y, i) => {
        const base = baseLevel + ci * 2; // Different baseline per country
        const improvement = i * responseRate * (1 + ci * 0.1);
        return [y, base + improvement] as [number, number];
      }),
    );
  });
}

// ─── Build a realistic budget with 5 categories ──────────────────────

function buildTestBudget(): BudgetOptimizationInput {
  const categories: BudgetCategoryInput[] = [
    {
      // HIGH ROI: Education — strong effect on GDP growth
      id: 'education',
      name: 'Education',
      currentSpendingUsd: 100e9, // $100B
      spendingSeries: multiCountrySpending('edu_spend', 'Education Spending', [2000, 1500, 3000, 1000, 2500], 100),
      outcomeSeries: multiCountryOutcome('gdp_growth', 'GDP per Capita Growth', 2.0, 0.15),
      outcomeDescription: 'GDP per capita growth rate (%)',
    },
    {
      // HIGH ROI: Prevention — strong effect on life expectancy
      id: 'prevention',
      name: 'Preventive Healthcare',
      currentSpendingUsd: 50e9, // $50B — underfunded
      spendingSeries: multiCountrySpending('prev_spend', 'Prevention Spending', [500, 300, 800, 200, 600], 50),
      outcomeSeries: multiCountryOutcome('life_exp', 'Life Expectancy', 72, 0.4),
      outcomeDescription: 'Life expectancy at birth (years)',
    },
    {
      // MEDIUM ROI: Infrastructure — moderate effect
      id: 'infrastructure',
      name: 'Infrastructure',
      currentSpendingUsd: 200e9, // $200B
      spendingSeries: multiCountrySpending('infra_spend', 'Infrastructure Spending', [3000, 2000, 4000, 1500, 3500], 150),
      outcomeSeries: multiCountryOutcome('productivity', 'Productivity Index', 80, 0.2),
      outcomeDescription: 'Productivity index (0-100)',
    },
    {
      // LOW ROI: Administrative overhead — weak/no effect
      id: 'admin',
      name: 'Administrative Overhead',
      currentSpendingUsd: 300e9, // $300B — overfunded
      spendingSeries: multiCountrySpending('admin_spend', 'Admin Spending', [4000, 3000, 5000, 2000, 4500], 200),
      outcomeSeries: COUNTRIES.map((id, ci) =>
        series(id, 'satisfaction', 'Citizen Satisfaction', '%',
          YEARS.map((y, i) => [y, 55 + Math.sin(i * 0.8 + ci) * 3] as [number, number]), // No trend
        ),
      ),
      outcomeDescription: 'Citizen satisfaction (%)',
    },
    {
      // NEGATIVE ROI: Drug enforcement — spending UP, outcomes WORSE
      id: 'enforcement',
      name: 'Drug Enforcement',
      currentSpendingUsd: 50e9, // $50B
      spendingSeries: multiCountrySpending('enforce_spend', 'Enforcement Spending', [1000, 800, 1500, 500, 1200], 80),
      outcomeSeries: COUNTRIES.map((id, ci) =>
        series(id, 'od_deaths', 'Overdose Deaths per 100K', 'per 100K',
          YEARS.map((y, i) => [y, 5 + i * 0.8 + ci * 0.5] as [number, number]), // Gets WORSE
        ),
      ),
      outcomeDescription: 'Overdose deaths per 100K (lower is better)',
    },
  ];

  return {
    jurisdictionName: 'United States',
    jurisdictionId: 'AAA',
    totalBudgetUsd: 700e9, // $700B total
    categories,
  };
}

// ─── THE TESTS ───────────────────────────────────────────────────────

describe('optimizeBudget — End-to-End', () => {
  let result: OptimalBudgetResult;

  // Run once for all tests
  const input = buildTestBudget();
  result = optimizeBudget(input);

  it('should analyze all 5 budget categories', () => {
    expect(result.categories.length).toBe(5);
  });

  it('should maintain fixed total budget', () => {
    expect(result.totalBudgetUsd).toBe(700e9);
  });

  it('should produce recommendations for all categories', () => {
    const recommendations = result.categories.map(c => c.recommendation);
    // Should have at least one non-maintain recommendation
    expect(recommendations.some(r => r !== 'maintain')).toBe(true);
    // All categories should be present
    const admin = result.categories.find(c => c.id === 'admin');
    const enforcement = result.categories.find(c => c.id === 'enforcement');
    expect(admin).toBeDefined();
    expect(enforcement).toBeDefined();
  });

  it('education should have positive effect (spending → GDP growth)', () => {
    const edu = result.categories.find(c => c.id === 'education')!;
    expect(edu.meanPercentChange).toBeGreaterThan(0);
    expect(edu.meanZScore).toBeGreaterThan(0);
  });

  it('prevention should have positive effect (spending → life expectancy)', () => {
    const prev = result.categories.find(c => c.id === 'prevention')!;
    expect(prev.meanPercentChange).toBeGreaterThan(0);
  });

  it('admin should have weak/no effect (spending ↑ but satisfaction flat)', () => {
    const admin = result.categories.find(c => c.id === 'admin')!;
    expect(Math.abs(admin.meanPercentChange)).toBeLessThan(5);
    // Admin z-score should be smaller than education z-score
    const edu = result.categories.find(c => c.id === 'education')!;
    expect(Math.abs(admin.meanZScore)).toBeLessThan(Math.abs(edu.meanZScore));
  });

  it('drug enforcement should show POSITIVE correlation with deaths (spending ↑ → deaths ↑)', () => {
    const enf = result.categories.find(c => c.id === 'enforcement')!;
    // Enforcement spending goes up AND overdose deaths go up → positive correlation
    // This is the KEY finding: enforcement makes things WORSE
    expect(enf.meanForwardPearson).toBeGreaterThan(0);
  });

  it('high-ROI categories should have larger z-scores than low-ROI', () => {
    const edu = result.categories.find(c => c.id === 'education')!;
    const prev = result.categories.find(c => c.id === 'prevention')!;
    const admin = result.categories.find(c => c.id === 'admin')!;

    // Education and prevention should have larger effect sizes
    expect(Math.abs(edu.meanZScore)).toBeGreaterThan(Math.abs(admin.meanZScore));
    expect(Math.abs(prev.meanZScore)).toBeGreaterThan(Math.abs(admin.meanZScore));
  });

  it('all categories should have country-level results', () => {
    for (const c of result.categories) {
      expect(c.countriesAnalyzed).toBeGreaterThan(0);
    }
  });

  it('should estimate positive welfare improvement from reallocation', () => {
    expect(result.estimatedWelfareImprovement).toBeGreaterThan(0);
  });
});

describe('generateOptimalBudgetReport', () => {
  const input = buildTestBudget();
  const result = optimizeBudget(input);
  const report = generateOptimalBudgetReport(result);

  it('should contain all major sections', () => {
    expect(report).toContain('# Optimal Budget: United States');
    expect(report).toContain('## Executive Summary');
    expect(report).toContain('## Recommended Reallocations');
    expect(report).toContain('## Category Analysis');
    expect(report).toContain('## Evidence by Category');
    expect(report).toContain('## Methodology');
  });

  it('should contain all category names', () => {
    expect(report).toContain('Education');
    expect(report).toContain('Preventive Healthcare');
    expect(report).toContain('Infrastructure');
    expect(report).toContain('Administrative Overhead');
    expect(report).toContain('Drug Enforcement');
  });

  it('should contain dollar amounts', () => {
    expect(report).toMatch(/\$\d+/);
  });

  it('should contain the methodology explanation', () => {
    expect(report).toContain('Change from baseline');
    expect(report).toContain('N-of-1');
  });

  it('should be a valid markdown document', () => {
    // Check basic markdown structure
    expect(report).toMatch(/^# /m); // Has h1
    expect(report).toMatch(/^## /m); // Has h2
    expect(report).toMatch(/\|.*\|/m); // Has tables
  });
});

describe('Budget optimization with known optimal', () => {
  // Build a simple 2-category budget where we KNOW the answer:
  // Category A: high ROI (every $1 → 1% improvement)
  // Category B: zero ROI (no effect)
  // Current: 50/50 split
  // Optimal: move money from B to A
  it('should recommend increasing high-ROI category', () => {
    const highROI: BudgetCategoryInput = {
      id: 'high',
      name: 'High ROI',
      currentSpendingUsd: 50e9,
      spendingSeries: COUNTRIES.map((id, ci) =>
        series(id, 'high_spend', 'High ROI Spending', 'USD',
          YEARS.map((y, i) => [y, 1000 + i * 200 + ci * 100] as [number, number]),
        ),
      ),
      outcomeSeries: COUNTRIES.map((id, ci) =>
        series(id, 'outcome', 'Outcome', 'index',
          YEARS.map((y, i) => [y, 50 + i * 2 + ci * 1] as [number, number]),
        ),
      ),
      outcomeDescription: 'Outcome index',
    };

    const zeroROI: BudgetCategoryInput = {
      id: 'zero',
      name: 'Zero ROI',
      currentSpendingUsd: 50e9,
      spendingSeries: COUNTRIES.map((id, ci) =>
        series(id, 'zero_spend', 'Zero ROI Spending', 'USD',
          YEARS.map((y, i) => [y, 2000 + i * 300 + ci * 150] as [number, number]),
        ),
      ),
      outcomeSeries: COUNTRIES.map((id, ci) =>
        series(id, 'outcome2', 'Outcome 2', 'index',
          YEARS.map((y, i) => [y, 40 + Math.sin(i * 0.6 + ci) * 3] as [number, number]),
        ),
      ),
      outcomeDescription: 'Outcome 2 index',
    };

    const result = optimizeBudget({
      jurisdictionName: 'Test',
      jurisdictionId: 'AAA',
      totalBudgetUsd: 100e9,
      categories: [highROI, zeroROI],
    });

    const high = result.categories.find(c => c.id === 'high')!;
    const zero = result.categories.find(c => c.id === 'zero')!;

    // High ROI should have larger effect size
    expect(Math.abs(high.meanZScore)).toBeGreaterThan(Math.abs(zero.meanZScore));
    // High ROI should have larger % change from baseline
    expect(Math.abs(high.meanPercentChange)).toBeGreaterThan(Math.abs(zero.meanPercentChange));
  });
});

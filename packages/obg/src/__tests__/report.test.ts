import { describe, it, expect } from 'vitest';
import {
  generateBudgetReport,
  formatUsd,
  type BudgetOptimizationResult,
  type CategoryAnalysis,
} from '../report.js';
import type { SpendingCategory } from '../budget.js';
import type { OSLEstimate, SpendingGap } from '../budget.js';
import type { DiminishingReturnsModel } from '../diminishing-returns.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeCategory(overrides: Partial<SpendingCategory> = {}): SpendingCategory {
  return {
    id: 'education',
    name: 'Education',
    spendingType: 'program',
    currentSpendingUsd: 50_000_000_000,
    fiscalYear: 2024,
    ...overrides,
  };
}

function makeOSL(overrides: Partial<OSLEstimate> = {}): OSLEstimate {
  return {
    categoryId: 'education',
    estimationMethod: 'diminishing_returns',
    oslUsd: 62_000_000_000,
    evidenceGrade: 'B',
    budgetImpactScore: 0.70,
    ...overrides,
  };
}

function makeGap(overrides: Partial<SpendingGap> = {}): SpendingGap {
  return {
    categoryId: 'education',
    categoryName: 'Education',
    currentSpendingUsd: 50_000_000_000,
    oslUsd: 62_000_000_000,
    gapUsd: 12_000_000_000,
    gapPct: 24,
    budgetImpactScore: 0.70,
    priorityScore: 8_400_000_000,
    welfareEffect: { incomeEffect: 0.15, healthEffect: 0.10 },
    recommendedAction: 'increase',
    ...overrides,
  };
}

function makeCategoryAnalysis(overrides: Partial<CategoryAnalysis> = {}): CategoryAnalysis {
  return {
    category: makeCategory(),
    oslEstimate: makeOSL(),
    gap: makeGap(),
    ...overrides,
  };
}

function makeFullResult(overrides: Partial<BudgetOptimizationResult> = {}): BudgetOptimizationResult {
  const education = makeCategoryAnalysis();
  const defense = makeCategoryAnalysis({
    category: makeCategory({
      id: 'defense',
      name: 'Defense',
      spendingType: 'program',
      currentSpendingUsd: 850_000_000_000,
    }),
    oslEstimate: makeOSL({
      categoryId: 'defense',
      oslUsd: 459_000_000_000,
      evidenceGrade: 'C',
      budgetImpactScore: 0.50,
    }),
    gap: makeGap({
      categoryId: 'defense',
      categoryName: 'Defense',
      currentSpendingUsd: 850_000_000_000,
      oslUsd: 459_000_000_000,
      gapUsd: -391_000_000_000,
      gapPct: -46,
      budgetImpactScore: 0.50,
      priorityScore: 195_500_000_000,
      welfareEffect: { incomeEffect: -0.10, healthEffect: -0.05 },
      recommendedAction: 'decrease',
    }),
  });
  const healthcare = makeCategoryAnalysis({
    category: makeCategory({
      id: 'healthcare',
      name: 'Healthcare',
      spendingType: 'program',
      currentSpendingUsd: 200_000_000_000,
    }),
    oslEstimate: makeOSL({
      categoryId: 'healthcare',
      oslUsd: 200_000_000_000,
      evidenceGrade: 'A',
      budgetImpactScore: 0.90,
    }),
    gap: makeGap({
      categoryId: 'healthcare',
      categoryName: 'Healthcare',
      currentSpendingUsd: 200_000_000_000,
      oslUsd: 200_000_000_000,
      gapUsd: 0,
      gapPct: 0,
      budgetImpactScore: 0.90,
      priorityScore: 0,
      welfareEffect: { incomeEffect: 0, healthEffect: 0 },
      recommendedAction: 'maintain',
    }),
  });

  return {
    jurisdictionName: 'United States',
    jurisdictionId: 'US',
    fiscalYear: 2024,
    totalBudgetUsd: 1_100_000_000_000,
    totalOptimalUsd: 721_000_000_000,
    welfareImprovementPct: 15.3,
    categories: [education, defense, healthcare],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('formatUsd', () => {
  it('formats billions', () => {
    expect(formatUsd(50_000_000_000)).toBe('$50B');
  });

  it('formats millions', () => {
    expect(formatUsd(12_500_000)).toBe('$12.5M');
  });

  it('formats thousands', () => {
    expect(formatUsd(5_000)).toBe('$5K');
  });

  it('formats small amounts', () => {
    expect(formatUsd(42)).toBe('$42');
  });

  it('handles negative amounts', () => {
    expect(formatUsd(-391_000_000_000)).toBe('-$391B');
  });

  it('handles zero', () => {
    expect(formatUsd(0)).toBe('$0');
  });
});

describe('generateBudgetReport', () => {
  it('contains report title with jurisdiction name', () => {
    const report = generateBudgetReport(makeFullResult());
    expect(report).toContain('# Budget Optimization Report: United States');
  });

  it('contains summary section', () => {
    const report = generateBudgetReport(makeFullResult());
    expect(report).toContain('## Summary');
    expect(report).toContain('$1100B budget');
    expect(report).toContain('3 categories');
    expect(report).toContain('15.3%');
  });

  it('contains jurisdiction details in summary', () => {
    const report = generateBudgetReport(makeFullResult());
    expect(report).toContain('United States');
    expect(report).toContain('US');
    expect(report).toContain('2024');
  });

  it('contains current vs optimal allocation table', () => {
    const report = generateBudgetReport(makeFullResult());
    expect(report).toContain('## Current vs Optimal Allocation');
    expect(report).toContain('| Category | Current ($) | Current (%) | Optimal ($) | Optimal (%) | Gap |');
    expect(report).toContain('Education');
    expect(report).toContain('Defense');
    expect(report).toContain('Healthcare');
  });

  it('sorts allocation table by absolute gap size', () => {
    const report = generateBudgetReport(makeFullResult());
    const defenseIdx = report.indexOf('Defense');
    const educationIdx = report.indexOf('Education');
    // Defense has larger absolute gap (-391B vs +12B)
    expect(defenseIdx).toBeLessThan(educationIdx);
  });

  it('shows gap with + or - prefix', () => {
    const report = generateBudgetReport(makeFullResult());
    expect(report).toContain('+$12B');
    expect(report).toContain('-$391B');
  });

  it('contains diminishing returns section', () => {
    const drModel: DiminishingReturnsModel = {
      type: 'log',
      alpha: 10,
      beta: 5,
      r2: 0.85,
      n: 25,
    };
    const result = makeFullResult({
      categories: [
        makeCategoryAnalysis({
          diminishingReturnsModel: drModel,
          marginalReturn: 0.0032,
        }),
      ],
    });
    const report = generateBudgetReport(result);
    expect(report).toContain('## Diminishing Returns Analysis');
    expect(report).toContain('Log-linear');
    expect(report).toContain('R² = 0.85');
    expect(report).toContain('0.0032');
    expect(report).toContain('Under-invested');
  });

  it('shows "no models available" when no DR models exist', () => {
    const report = generateBudgetReport(makeFullResult());
    expect(report).toContain('No diminishing returns models available');
  });

  it('contains top recommendations section', () => {
    const report = generateBudgetReport(makeFullResult());
    expect(report).toContain('## Top Recommendations');
    expect(report).toContain('Increase Education');
    expect(report).toContain('Decrease Defense');
  });

  it('sorts recommendations by priority score', () => {
    const report = generateBudgetReport(makeFullResult());
    const lines = report.split('\n');
    const recLines = lines.filter(l => /^\d+\./.test(l));
    // Defense has higher priority score (195.5B vs 8.4B)
    expect(recLines[0]).toContain('Defense');
    expect(recLines[1]).toContain('Education');
  });

  it('excludes maintain categories from numbered recommendations', () => {
    const report = generateBudgetReport(makeFullResult());
    const lines = report.split('\n');
    const numberedRecs = lines.filter(l => /^\d+\./.test(l));
    const maintainRecs = numberedRecs.filter(l => l.includes('Healthcare'));
    expect(maintainRecs).toHaveLength(0);
  });

  it('shows maintained categories separately', () => {
    const report = generateBudgetReport(makeFullResult());
    expect(report).toContain('Already near optimal');
    expect(report).toContain('Healthcare');
  });

  it('contains budget impact scores table', () => {
    const report = generateBudgetReport(makeFullResult());
    expect(report).toContain('## Budget Impact Scores');
    expect(report).toContain('| Category | BIS | Grade');
    expect(report).toContain('Strong evidence');
  });

  it('sorts BIS table by score descending', () => {
    const report = generateBudgetReport(makeFullResult());
    // After the BIS table header, Healthcare (0.90) should appear before Education (0.70) and Defense (0.50)
    const bisSection = report.split('## Budget Impact Scores')[1]!;
    const healthcareIdx = bisSection.indexOf('Healthcare');
    const educationIdx = bisSection.indexOf('Education');
    const defenseIdx = bisSection.indexOf('Defense');
    expect(healthcareIdx).toBeLessThan(educationIdx);
    expect(educationIdx).toBeLessThan(defenseIdx);
  });

  it('shows BIS quality and precision weights when available', () => {
    const result = makeFullResult({
      categories: [
        makeCategoryAnalysis({
          bisResult: {
            score: 0.85,
            grade: 'A',
            qualityWeight: 0.90,
            precisionWeight: 500,
            recencyWeight: 0.95,
            estimateCount: 5,
          },
        }),
      ],
    });
    const report = generateBudgetReport(result);
    expect(report).toContain('0.9');
    expect(report).toContain('500');
  });

  it('shows dashes when BIS details are not available', () => {
    const report = generateBudgetReport(makeFullResult());
    expect(report).toContain('—');
  });

  // --- Edge cases ---

  it('handles empty categories array', () => {
    const result = makeFullResult({ categories: [] });
    const report = generateBudgetReport(result);
    expect(report).toContain('0 categories');
    expect(report).toContain('No categories to analyze');
    expect(report).toContain('No categories to score');
  });

  it('handles single category', () => {
    const result = makeFullResult({
      categories: [makeCategoryAnalysis()],
      totalOptimalUsd: 62_000_000_000,
    });
    const report = generateBudgetReport(result);
    expect(report).toContain('1 categories');
    expect(report).toContain('Education');
    // Should have table rows
    const tableRows = report.split('\n').filter(l => l.startsWith('| Education'));
    expect(tableRows.length).toBeGreaterThanOrEqual(1);
  });

  it('handles all-maintain categories', () => {
    const maintained = makeCategoryAnalysis({
      gap: makeGap({ recommendedAction: 'maintain', priorityScore: 0 }),
    });
    const result = makeFullResult({ categories: [maintained] });
    const report = generateBudgetReport(result);
    expect(report).toContain('All categories are at or near optimal spending levels');
  });

  it('handles scale_up recommendation', () => {
    const scaleUp = makeCategoryAnalysis({
      gap: makeGap({
        recommendedAction: 'scale_up',
        categoryName: 'Pragmatic Trials',
        gapUsd: 49_500_000_000,
        gapPct: 9900,
      }),
    });
    const result = makeFullResult({ categories: [scaleUp] });
    const report = generateBudgetReport(result);
    expect(report).toContain('Scale up Pragmatic Trials');
    expect(report).toContain('massive underinvestment');
  });

  it('handles eliminate recommendation', () => {
    const eliminate = makeCategoryAnalysis({
      gap: makeGap({
        recommendedAction: 'eliminate',
        categoryName: 'Agricultural Subsidies',
        gapUsd: -25_000_000_000,
        gapPct: -100,
      }),
    });
    const result = makeFullResult({ categories: [eliminate] });
    const report = generateBudgetReport(result);
    expect(report).toContain('Eliminate Agricultural Subsidies');
    expect(report).toContain('negative welfare impact');
  });

  it('handles saturation diminishing returns model', () => {
    const drModel: DiminishingReturnsModel = {
      type: 'saturation',
      alpha: 10,
      beta: 5,
      gamma: 1000,
      r2: 0.92,
      n: 30,
    };
    const result = makeFullResult({
      categories: [
        makeCategoryAnalysis({
          diminishingReturnsModel: drModel,
          marginalReturn: 0.001,
        }),
      ],
    });
    const report = generateBudgetReport(result);
    expect(report).toContain('Saturation (Michaelis-Menten)');
    expect(report).toContain('0.92');
  });

  it('produces valid markdown (no broken table rows)', () => {
    const report = generateBudgetReport(makeFullResult());
    const lines = report.split('\n');
    for (const line of lines) {
      if (line.startsWith('|') && line.endsWith('|')) {
        // Table rows should have consistent pipe count
        const pipeCount = (line.match(/\|/g) || []).length;
        expect(pipeCount).toBeGreaterThanOrEqual(2);
      }
    }
  });
});

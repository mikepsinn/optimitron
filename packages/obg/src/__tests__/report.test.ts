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
    welfareEvidenceScore: 0.70,
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
    welfareEvidenceScore: 0.70,
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
      id: 'military',
      name: 'Military',
      spendingType: 'program',
      currentSpendingUsd: 850_000_000_000,
    }),
    oslEstimate: makeOSL({
      categoryId: 'military',
      oslUsd: 459_000_000_000,
      evidenceGrade: 'C',
      welfareEvidenceScore: 0.50,
    }),
    gap: makeGap({
      categoryId: 'military',
      categoryName: 'Military',
      currentSpendingUsd: 850_000_000_000,
      oslUsd: 459_000_000_000,
      gapUsd: -391_000_000_000,
      gapPct: -46,
      welfareEvidenceScore: 0.50,
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
      welfareEvidenceScore: 0.90,
    }),
    gap: makeGap({
      categoryId: 'healthcare',
      categoryName: 'Healthcare',
      currentSpendingUsd: 200_000_000_000,
      oslUsd: 200_000_000_000,
      gapUsd: 0,
      gapPct: 0,
      welfareEvidenceScore: 0.90,
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
    expect(report).toContain('| Category | Current ($) | Current (%) | Optimal ($) | Optimal (%) | Gap ($) | Gap (%) | Action | Evidence |');
    expect(report).toContain('Education');
    expect(report).toContain('Military');
    expect(report).toContain('Healthcare');
  });

  it('sorts allocation table by absolute gap size', () => {
    const report = generateBudgetReport(makeFullResult());
    const defenseIdx = report.indexOf('Military');
    const educationIdx = report.indexOf('Education');
    // Military has larger absolute gap (-391B vs +12B)
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
    expect(report).toContain('Decrease Military');
    expect(report).toContain('Priority: 100/100');
    expect(report).toContain('Evidence: C (Possible welfare benefit)');
  });

  it('sorts recommendations by priority score', () => {
    const report = generateBudgetReport(makeFullResult());
    const lines = report.split('\n');
    const recLines = lines.filter(l => /^\d+\./.test(l));
    // Military has higher priority score (195.5B vs 8.4B)
    expect(recLines[0]).toContain('Military');
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

  it('contains welfare evidence scores table', () => {
    const report = generateBudgetReport(makeFullResult());
    expect(report).toContain('## Welfare Evidence Scores');
    expect(report).toContain('| Category | WES | Grade');
    expect(report).toContain('Strong evidence of welfare benefit');
  });

  it('contains efficient frontier reallocation table', () => {
    const report = generateBudgetReport(makeFullResult());
    expect(report).toContain('## Efficient Frontier (Reallocation Priority)');
    expect(report).toContain('| Rank | Category | Reallocation Move | Priority | Gap ($) | WES | Evidence |');
    expect(report).toContain('| 1 | Military | Decrease');
  });

  it('sorts WES table by score descending', () => {
    const report = generateBudgetReport(makeFullResult());
    // After the WES table header, Healthcare (0.90) should appear before Education (0.70) and Military (0.50)
    const wesSection = report.split('## Welfare Evidence Scores')[1]!;
    const healthcareIdx = wesSection.indexOf('Healthcare');
    const educationIdx = wesSection.indexOf('Education');
    const defenseIdx = wesSection.indexOf('Military');
    expect(healthcareIdx).toBeLessThan(educationIdx);
    expect(educationIdx).toBeLessThan(defenseIdx);
  });

  it('shows WES quality and precision weights when available', () => {
    const result = makeFullResult({
      categories: [
        makeCategoryAnalysis({
          wesResult: {
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

  it('shows dashes when WES details are not available', () => {
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
    expect(report).toContain('Current allocation is already near the efficient frontier');
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

  it('handles major_decrease recommendation', () => {
    const majorDecrease = makeCategoryAnalysis({
      gap: makeGap({
        recommendedAction: 'major_decrease',
        categoryName: 'Agricultural Subsidies',
        gapUsd: -25_000_000_000,
        gapPct: -75,
      }),
    });
    const result = makeFullResult({ categories: [majorDecrease] });
    const report = generateBudgetReport(result);
    expect(report).toContain('Major decrease in Agricultural Subsidies');
    expect(report).toContain('significant overinvestment');
    // Should never say "Eliminate"
    expect(report).not.toContain('Eliminate');
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

  it('constrained mode shows reallocation within current budget', () => {
    const result = makeFullResult();
    const report = generateBudgetReport(result, { constrainToCurrentBudget: true });

    expect(report).toContain('Constrained Reallocation');
    expect(report).toContain('Constrained Optimal');
    expect(report).toContain('Reallocation within');
    expect(report).toContain('held fixed');
  });

  it('marks non-discretionary categories and excludes from recommendations', () => {
    const nonDisc = makeCategoryAnalysis({
      category: makeCategory({
        id: 'interest',
        name: 'Net Interest',
        discretionary: false,
        currentSpendingUsd: 881_000_000_000,
      }),
      gap: makeGap({
        categoryId: 'interest',
        categoryName: 'Net Interest',
        gapUsd: -200_000_000_000,
        gapPct: -22,
        recommendedAction: 'decrease',
        priorityScore: 100_000_000_000,
      }),
    });
    const education = makeCategoryAnalysis();
    const result = makeFullResult({ categories: [nonDisc, education] });
    const report = generateBudgetReport(result);

    // Should appear in allocation table with annotation
    expect(report).toContain('*(non-discretionary)*');
    // Should NOT appear in numbered recommendations
    const lines = report.split('\n');
    const numberedRecs = lines.filter(l => /^\d+\./.test(l));
    const interestRecs = numberedRecs.filter(l => l.includes('Net Interest'));
    expect(interestRecs).toHaveLength(0);
    // Should NOT appear in efficient frontier table (between header and next section)
    const afterFrontier = report.split('## Efficient Frontier')[1] ?? '';
    const frontierSection = afterFrontier.split('##')[0] ?? '';
    expect(frontierSection).not.toContain('Net Interest');
  });

  it('produces valid markdown (no broken table rows)', () => {
    const report = generateBudgetReport(makeFullResult());
    const lines = report.split('\n');
    for (const line of lines) {
      if (line.startsWith('|') && line.endsWith('|')) {
        // Table rows should have consistent pipe count
        const pipeCount = (line.match(/\|/g) || []).length;
        expect(pipeCount).toBeGreaterThanOrEqual(4);
      }
    }
  });
});

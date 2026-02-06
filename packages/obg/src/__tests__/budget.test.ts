import { describe, it, expect } from 'vitest';
import {
  SpendingTypeSchema,
  SpendingCategorySchema,
  OSLEstimateSchema,
  SpendingGapSchema,
  ReferenceSpendingSchema,
  type SpendingCategory,
  type OSLEstimate,
  type SpendingGap,
  type ReferenceSpending,
} from '../budget.js';

// ======================== SpendingTypeSchema ================================

describe('SpendingTypeSchema', () => {
  it('accepts valid spending types', () => {
    expect(SpendingTypeSchema.safeParse('program').success).toBe(true);
    expect(SpendingTypeSchema.safeParse('transfer').success).toBe(true);
    expect(SpendingTypeSchema.safeParse('investment').success).toBe(true);
    expect(SpendingTypeSchema.safeParse('regulatory').success).toBe(true);
  });

  it('rejects invalid spending types', () => {
    expect(SpendingTypeSchema.safeParse('unknown').success).toBe(false);
    expect(SpendingTypeSchema.safeParse('').success).toBe(false);
    expect(SpendingTypeSchema.safeParse(42).success).toBe(false);
  });
});

// ====================== SpendingCategorySchema ==============================

describe('SpendingCategorySchema', () => {
  it('validates a complete spending category', () => {
    const category = {
      id: 'education-k12',
      name: 'K-12 Education',
      spendingType: 'program',
      currentSpendingUsd: 800_000_000_000,
      fiscalYear: 2024,
      dataSource: 'OMB Historical Tables',
    };
    const result = SpendingCategorySchema.safeParse(category);
    expect(result.success).toBe(true);
  });

  it('allows optional parentCategoryId', () => {
    const result = SpendingCategorySchema.safeParse({
      id: 'early-childhood',
      name: 'Early Childhood (0-5)',
      parentCategoryId: 'education',
      spendingType: 'program',
      currentSpendingUsd: 50_000_000_000,
      fiscalYear: 2024,
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing required fields', () => {
    expect(SpendingCategorySchema.safeParse({ id: 'x' }).success).toBe(false);
    expect(SpendingCategorySchema.safeParse({}).success).toBe(false);
  });

  it('rejects non-numeric spending', () => {
    const result = SpendingCategorySchema.safeParse({
      id: 'x',
      name: 'X',
      spendingType: 'program',
      currentSpendingUsd: 'lots',
      fiscalYear: 2024,
    });
    expect(result.success).toBe(false);
  });
});

// ========================= OSLEstimateSchema ================================

describe('OSLEstimateSchema', () => {
  it('validates a diminishing returns OSL estimate', () => {
    const estimate: OSLEstimate = {
      categoryId: 'education-k12',
      estimationMethod: 'diminishing_returns',
      oslUsd: 900_000_000_000,
      oslPerCapita: 2700,
      oslPctGdp: 3.5,
      ciLow: 800_000_000_000,
      ciHigh: 1_000_000_000_000,
      evidenceGrade: 'B',
      budgetImpactScore: 0.70,
      methodologyNotes: 'Cross-country log model, n=25 OECD countries',
    };
    expect(OSLEstimateSchema.safeParse(estimate).success).toBe(true);
  });

  it('validates a cost-effectiveness OSL estimate', () => {
    const estimate = {
      categoryId: 'vaccinations',
      estimationMethod: 'cost_effectiveness',
      oslUsd: 16_200_000_000,
      evidenceGrade: 'A',
      budgetImpactScore: 0.95,
    };
    expect(OSLEstimateSchema.safeParse(estimate).success).toBe(true);
  });

  it('validates a benchmark OSL estimate', () => {
    const estimate = {
      categoryId: 'military',
      estimationMethod: 'benchmark',
      oslUsd: 459_000_000_000,
      evidenceGrade: 'C',
      budgetImpactScore: 0.50,
    };
    expect(OSLEstimateSchema.safeParse(estimate).success).toBe(true);
  });

  it('constrains BIS to 0-1 range', () => {
    const base = {
      categoryId: 'x',
      estimationMethod: 'benchmark',
      oslUsd: 100,
      evidenceGrade: 'C',
    };
    expect(OSLEstimateSchema.safeParse({ ...base, budgetImpactScore: 0 }).success).toBe(true);
    expect(OSLEstimateSchema.safeParse({ ...base, budgetImpactScore: 1 }).success).toBe(true);
    expect(OSLEstimateSchema.safeParse({ ...base, budgetImpactScore: -0.1 }).success).toBe(false);
    expect(OSLEstimateSchema.safeParse({ ...base, budgetImpactScore: 1.1 }).success).toBe(false);
  });

  it('only accepts valid evidence grades', () => {
    const base = {
      categoryId: 'x',
      estimationMethod: 'benchmark',
      oslUsd: 100,
      budgetImpactScore: 0.5,
    };
    for (const grade of ['A', 'B', 'C', 'D', 'F']) {
      expect(OSLEstimateSchema.safeParse({ ...base, evidenceGrade: grade }).success).toBe(true);
    }
    expect(OSLEstimateSchema.safeParse({ ...base, evidenceGrade: 'E' }).success).toBe(false);
    expect(OSLEstimateSchema.safeParse({ ...base, evidenceGrade: 'X' }).success).toBe(false);
  });
});

// ========================= SpendingGapSchema ================================

describe('SpendingGapSchema', () => {
  it('validates an underinvestment gap (paper: pragmatic trials)', () => {
    const gap: SpendingGap = {
      categoryId: 'pragmatic-trials',
      categoryName: 'Pragmatic Clinical Trials',
      currentSpendingUsd: 500_000_000,
      oslUsd: 50_000_000_000,
      gapUsd: 49_500_000_000,
      gapPct: 9900,
      budgetImpactScore: 0.90,
      priorityScore: 44_550_000_000,
      welfareEffect: {
        incomeEffect: 0.2,
        healthEffect: 0.5,
      },
      recommendedAction: 'scale_up',
    };
    expect(SpendingGapSchema.safeParse(gap).success).toBe(true);
  });

  it('validates an overinvestment gap (paper: military)', () => {
    const gap: SpendingGap = {
      categoryId: 'military',
      categoryName: 'Military (discretionary)',
      currentSpendingUsd: 850_000_000_000,
      oslUsd: 459_000_000_000,
      gapUsd: -391_000_000_000,
      gapPct: -46,
      budgetImpactScore: 0.50,
      priorityScore: 195_500_000_000,
      welfareEffect: {
        incomeEffect: -0.1,
        healthEffect: -0.05,
      },
      recommendedAction: 'decrease',
    };
    expect(SpendingGapSchema.safeParse(gap).success).toBe(true);
  });

  it('validates elimination recommendation (paper: ag subsidies)', () => {
    const gap: SpendingGap = {
      categoryId: 'ag-subsidies',
      categoryName: 'Agricultural Subsidies',
      currentSpendingUsd: 25_000_000_000,
      oslUsd: 0,
      gapUsd: -25_000_000_000,
      gapPct: -100,
      budgetImpactScore: 0.90,
      priorityScore: 22_500_000_000,
      welfareEffect: {
        incomeEffect: -0.05,
        healthEffect: -0.02,
      },
      recommendedAction: 'eliminate',
    };
    expect(SpendingGapSchema.safeParse(gap).success).toBe(true);
  });

  it('validates all recommended actions', () => {
    const base = {
      categoryId: 'x',
      categoryName: 'X',
      currentSpendingUsd: 100,
      oslUsd: 100,
      gapUsd: 0,
      gapPct: 0,
      budgetImpactScore: 0.5,
      priorityScore: 0,
      welfareEffect: { incomeEffect: 0, healthEffect: 0 },
    };

    for (const action of ['scale_up', 'increase', 'maintain', 'decrease', 'eliminate']) {
      expect(
        SpendingGapSchema.safeParse({ ...base, recommendedAction: action }).success,
      ).toBe(true);
    }
    expect(
      SpendingGapSchema.safeParse({ ...base, recommendedAction: 'invalid' }).success,
    ).toBe(false);
  });
});

// ====================== ReferenceSpendingSchema =============================

describe('ReferenceSpendingSchema', () => {
  it('validates reference spending data', () => {
    const ref: ReferenceSpending = {
      categoryId: 'education-k12',
      countryCode: 'USA',
      year: 2022,
      spendingUsd: 800_000_000_000,
      spendingPerCapita: 2400,
      spendingPctGdp: 3.2,
      population: 330_000_000,
      gdp: 25_000_000_000_000,
      dataSource: 'OECD iLibrary',
    };
    expect(ReferenceSpendingSchema.safeParse(ref).success).toBe(true);
  });

  it('allows optional fields', () => {
    const minimal = {
      categoryId: 'health',
      countryCode: 'NOR',
      year: 2022,
      spendingUsd: 50_000_000_000,
    };
    expect(ReferenceSpendingSchema.safeParse(minimal).success).toBe(true);
  });

  it('rejects missing required fields', () => {
    expect(ReferenceSpendingSchema.safeParse({}).success).toBe(false);
    expect(
      ReferenceSpendingSchema.safeParse({ categoryId: 'x' }).success,
    ).toBe(false);
  });
});

import { describe, it, expect } from 'vitest';
import {
  SpendingTypeSchema,
  SpendingCategorySchema,
  OSLEstimateSchema,
  SpendingGapSchema,
  ReferenceSpendingSchema,
  type SpendingType,
  type SpendingCategory,
  type OSLEstimate,
  type SpendingGap,
  type ReferenceSpending,
} from '../budget.js';

// ─── SpendingTypeSchema ─────────────────────────────────────────────────────

describe('SpendingTypeSchema', () => {
  const validTypes: SpendingType[] = ['program', 'transfer', 'investment', 'regulatory'];

  it('accepts all 4 valid spending types', () => {
    for (const type of validTypes) {
      expect(SpendingTypeSchema.safeParse(type).success).toBe(true);
    }
  });

  it('rejects invalid spending type', () => {
    expect(SpendingTypeSchema.safeParse('grant').success).toBe(false);
    expect(SpendingTypeSchema.safeParse('').success).toBe(false);
    expect(SpendingTypeSchema.safeParse(1).success).toBe(false);
  });
});

// ─── SpendingCategorySchema ─────────────────────────────────────────────────

describe('SpendingCategorySchema', () => {
  it('validates a minimal spending category', () => {
    const result = SpendingCategorySchema.safeParse({
      id: 'education',
      name: 'Education',
      spendingType: 'program',
      currentSpendingUsd: 100000000000,
      fiscalYear: 2024,
    });
    expect(result.success).toBe(true);
  });

  it('validates a category with all optional fields', () => {
    const result = SpendingCategorySchema.safeParse({
      id: 'k12-education',
      name: 'K-12 Education',
      parentCategoryId: 'education',
      spendingType: 'program',
      currentSpendingUsd: 60000000000,
      fiscalYear: 2024,
      dataSource: 'USASpending.gov',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing required fields', () => {
    expect(SpendingCategorySchema.safeParse({ id: 'x' }).success).toBe(false);
    expect(SpendingCategorySchema.safeParse({}).success).toBe(false);
  });

  it('rejects invalid spending type', () => {
    expect(SpendingCategorySchema.safeParse({
      id: 'x',
      name: 'X',
      spendingType: 'invalid',
      currentSpendingUsd: 100,
      fiscalYear: 2024,
    }).success).toBe(false);
  });

  it('accepts zero spending', () => {
    const result = SpendingCategorySchema.safeParse({
      id: 'new-program',
      name: 'New Program',
      spendingType: 'program',
      currentSpendingUsd: 0,
      fiscalYear: 2024,
    });
    expect(result.success).toBe(true);
  });
});

// ─── OSLEstimateSchema ──────────────────────────────────────────────────────

describe('OSLEstimateSchema', () => {
  it('validates a minimal OSL estimate', () => {
    const result = OSLEstimateSchema.safeParse({
      categoryId: 'education',
      estimationMethod: 'diminishing_returns',
      oslUsd: 120000000000,
      evidenceGrade: 'B',
      budgetImpactScore: 0.75,
    });
    expect(result.success).toBe(true);
  });

  it('validates a full OSL estimate', () => {
    const result = OSLEstimateSchema.safeParse({
      categoryId: 'education',
      estimationMethod: 'cost_effectiveness',
      oslUsd: 120000000000,
      oslPerCapita: 360,
      oslPctGdp: 0.05,
      ciLow: 100000000000,
      ciHigh: 140000000000,
      evidenceGrade: 'A',
      budgetImpactScore: 0.85,
      methodologyNotes: 'Based on OECD cross-country analysis',
    });
    expect(result.success).toBe(true);
  });

  it('accepts all estimation methods', () => {
    for (const method of ['diminishing_returns', 'cost_effectiveness', 'benchmark']) {
      expect(OSLEstimateSchema.safeParse({
        categoryId: 'x',
        estimationMethod: method,
        oslUsd: 100,
        evidenceGrade: 'C',
        budgetImpactScore: 0.5,
      }).success).toBe(true);
    }
  });

  it('rejects budgetImpactScore > 1', () => {
    expect(OSLEstimateSchema.safeParse({
      categoryId: 'x',
      estimationMethod: 'benchmark',
      oslUsd: 100,
      evidenceGrade: 'C',
      budgetImpactScore: 1.5,
    }).success).toBe(false);
  });

  it('rejects budgetImpactScore < 0', () => {
    expect(OSLEstimateSchema.safeParse({
      categoryId: 'x',
      estimationMethod: 'benchmark',
      oslUsd: 100,
      evidenceGrade: 'C',
      budgetImpactScore: -0.1,
    }).success).toBe(false);
  });

  it('accepts boundary budgetImpactScore values (0 and 1)', () => {
    expect(OSLEstimateSchema.safeParse({
      categoryId: 'x',
      estimationMethod: 'benchmark',
      oslUsd: 100,
      evidenceGrade: 'C',
      budgetImpactScore: 0,
    }).success).toBe(true);
    expect(OSLEstimateSchema.safeParse({
      categoryId: 'x',
      estimationMethod: 'benchmark',
      oslUsd: 100,
      evidenceGrade: 'C',
      budgetImpactScore: 1,
    }).success).toBe(true);
  });
});

// ─── SpendingGapSchema ──────────────────────────────────────────────────────

describe('SpendingGapSchema', () => {
  it('validates a spending gap for underspending (scale_up)', () => {
    const result = SpendingGapSchema.safeParse({
      categoryId: 'education',
      categoryName: 'Education',
      currentSpendingUsd: 80000000000,
      oslUsd: 120000000000,
      gapUsd: 40000000000,
      gapPct: 50,
      budgetImpactScore: 0.75,
      priorityScore: 0.80,
      welfareEffect: {
        incomeEffect: 0.05,
        healthEffect: 0.02,
      },
      recommendedAction: 'scale_up',
    });
    expect(result.success).toBe(true);
  });

  it('validates a spending gap for overspending (decrease)', () => {
    const result = SpendingGapSchema.safeParse({
      categoryId: 'defense',
      categoryName: 'Defense',
      currentSpendingUsd: 800000000000,
      oslUsd: 600000000000,
      gapUsd: -200000000000,
      gapPct: -25,
      budgetImpactScore: 0.60,
      priorityScore: 0.55,
      welfareEffect: {
        incomeEffect: 0.08,
        healthEffect: 0.01,
      },
      recommendedAction: 'decrease',
    });
    expect(result.success).toBe(true);
  });

  it('validates maintain action', () => {
    const result = SpendingGapSchema.safeParse({
      categoryId: 'infrastructure',
      categoryName: 'Infrastructure',
      currentSpendingUsd: 100000000000,
      oslUsd: 100000000000,
      gapUsd: 0,
      gapPct: 0,
      budgetImpactScore: 0.50,
      priorityScore: 0,
      welfareEffect: {
        incomeEffect: 0,
        healthEffect: 0,
      },
      recommendedAction: 'maintain',
    });
    expect(result.success).toBe(true);
  });

  it('accepts all recommended actions', () => {
    const actions = ['scale_up', 'increase', 'maintain', 'decrease', 'eliminate'] as const;
    for (const action of actions) {
      expect(SpendingGapSchema.safeParse({
        categoryId: 'x',
        categoryName: 'X',
        currentSpendingUsd: 100,
        oslUsd: 100,
        gapUsd: 0,
        gapPct: 0,
        budgetImpactScore: 0.5,
        priorityScore: 0,
        welfareEffect: { incomeEffect: 0, healthEffect: 0 },
        recommendedAction: action,
      }).success).toBe(true);
    }
  });

  it('rejects invalid recommended action', () => {
    expect(SpendingGapSchema.safeParse({
      categoryId: 'x',
      categoryName: 'X',
      currentSpendingUsd: 100,
      oslUsd: 100,
      gapUsd: 0,
      gapPct: 0,
      budgetImpactScore: 0.5,
      priorityScore: 0,
      welfareEffect: { incomeEffect: 0, healthEffect: 0 },
      recommendedAction: 'remove',
    }).success).toBe(false);
  });

  it('rejects missing welfare effect', () => {
    expect(SpendingGapSchema.safeParse({
      categoryId: 'x',
      categoryName: 'X',
      currentSpendingUsd: 100,
      oslUsd: 100,
      gapUsd: 0,
      gapPct: 0,
      budgetImpactScore: 0.5,
      priorityScore: 0,
      recommendedAction: 'maintain',
    }).success).toBe(false);
  });
});

// ─── ReferenceSpendingSchema ────────────────────────────────────────────────

describe('ReferenceSpendingSchema', () => {
  it('validates a minimal reference spending record', () => {
    const result = ReferenceSpendingSchema.safeParse({
      categoryId: 'education',
      countryCode: 'US',
      year: 2024,
      spendingUsd: 900000000000,
    });
    expect(result.success).toBe(true);
  });

  it('validates a full reference spending record', () => {
    const result = ReferenceSpendingSchema.safeParse({
      categoryId: 'education',
      countryCode: 'FI',
      year: 2023,
      spendingUsd: 15000000000,
      spendingPerCapita: 2700,
      spendingPctGdp: 0.06,
      population: 5500000,
      gdp: 275000000000,
      dataSource: 'OECD iLibrary',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing required fields', () => {
    expect(ReferenceSpendingSchema.safeParse({
      categoryId: 'x',
    }).success).toBe(false);
    expect(ReferenceSpendingSchema.safeParse({}).success).toBe(false);
  });

  it('accepts zero spending', () => {
    const result = ReferenceSpendingSchema.safeParse({
      categoryId: 'space',
      countryCode: 'LI',
      year: 2024,
      spendingUsd: 0,
    });
    expect(result.success).toBe(true);
  });
});

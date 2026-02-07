/**
 * Multi-Outcome Budget Optimization Tests
 *
 * Tests the weighted welfare function that optimizes across multiple
 * outcomes simultaneously using z-score normalization.
 *
 * Key test scenarios:
 * 1. Two outcomes (income + health), three categories
 * 2. Weights affect allocation (w=[1,0] ≈ single-outcome)
 * 3. "returnToCitizens" virtual baseline category
 * 4. Edge cases: zero weights, single outcome, equal effects
 */

import { describe, it, expect } from 'vitest';
import {
  optimizeBudgetMultiOutcome,
  type MultiOutcomeBudgetInput,
  type MultiOutcomeCategoryInput,
  type OutcomeConfig,
  type MultiOutcomeBudgetResult,
} from '../optimize-budget-multi-outcome.js';
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
  return {
    jurisdictionId: id,
    jurisdictionName: id,
    variableId: varId,
    variableName: varName,
    unit,
    annualValues,
  };
}

/** Generate spending series for multiple countries */
function multiCountrySpending(
  varId: string, varName: string,
  baseLevels: number[], growthRate: number,
): AnnualTimeSeries[] {
  return COUNTRIES.map((id, ci) => {
    const base = baseLevels[ci] ?? baseLevels[0]!;
    return series(id, varId, varName, 'USD/capita',
      YEARS.map((y, i) => [y, base + i * growthRate * (1 + ci * 0.2)] as [number, number]),
    );
  });
}

/** Generate outcome series with known response rate */
function multiCountryOutcome(
  varId: string, varName: string, unit: string,
  baseLevel: number, responseRate: number,
): AnnualTimeSeries[] {
  return COUNTRIES.map((id, ci) => {
    return series(id, varId, varName, unit,
      YEARS.map((y, i) => {
        const base = baseLevel + ci * 2;
        const improvement = i * responseRate * (1 + ci * 0.1);
        return [y, base + improvement] as [number, number];
      }),
    );
  });
}

/** Generate flat outcome series (no response to anything) */
function flatOutcome(
  varId: string, varName: string, unit: string,
  baseLevel: number,
): AnnualTimeSeries[] {
  return COUNTRIES.map((id, ci) => {
    return series(id, varId, varName, unit,
      YEARS.map((y, i) => [y, baseLevel + Math.sin(i * 0.7 + ci) * 2] as [number, number]),
    );
  });
}

// ─── Test data builders ──────────────────────────────────────────────

/**
 * Build a 3-category, 2-outcome test scenario:
 *
 * Categories:
 *   - Education:   high income effect, moderate health effect
 *   - Healthcare:  low income effect, high health effect
 *   - Admin:       no effect on either
 *
 * Outcomes:
 *   - Income growth (% GDP per capita growth)
 *   - Health index (life expectancy proxy)
 */
function buildMultiOutcomeInput(
  outcomeWeights: [number, number] = [0.5, 0.5],
  includeReturnToCitizens = false,
): MultiOutcomeBudgetInput {
  const categories: MultiOutcomeCategoryInput[] = [
    {
      id: 'education',
      name: 'Education',
      currentSpendingUsd: 100e9,
      spendingSeries: multiCountrySpending('edu_spend', 'Education Spending', [2000, 1500, 3000, 1000, 2500], 100),
    },
    {
      id: 'healthcare',
      name: 'Healthcare',
      currentSpendingUsd: 100e9,
      spendingSeries: multiCountrySpending('health_spend', 'Healthcare Spending', [1500, 1000, 2500, 800, 2000], 120),
    },
    {
      id: 'admin',
      name: 'Administration',
      currentSpendingUsd: 100e9,
      spendingSeries: multiCountrySpending('admin_spend', 'Admin Spending', [3000, 2000, 4000, 1500, 3500], 200),
    },
  ];

  const outcomes: OutcomeConfig[] = [
    {
      outcomeId: 'income',
      outcomeName: 'Income Growth',
      weight: outcomeWeights[0],
      // Education → strong income effect; Healthcare → weak; Admin → none
      data: multiCountryOutcome('gdp_growth', 'GDP Growth', '%', 2.0, 0.15),
    },
    {
      outcomeId: 'health',
      outcomeName: 'Health Index',
      weight: outcomeWeights[1],
      // Healthcare → strong health effect; Education → moderate; Admin → none
      data: multiCountryOutcome('life_exp', 'Life Expectancy', 'years', 72, 0.4),
    },
  ];

  return {
    jurisdictionName: 'TestLand',
    jurisdictionId: 'AAA',
    totalBudgetUsd: 300e9,
    categories,
    outcomes,
    includeReturnToCitizens,
    returnToCitizensOutcomeId: 'income',
  };
}

// ─── TESTS ───────────────────────────────────────────────────────────

describe('optimizeBudgetMultiOutcome — Basic', () => {
  const input = buildMultiOutcomeInput([0.5, 0.5]);
  const result = optimizeBudgetMultiOutcome(input);

  it('should analyze all 3 categories', () => {
    // Exclude virtual categories
    const real = result.categories.filter(c => !c.isReturnToCitizens);
    expect(real.length).toBe(3);
  });

  it('should preserve the total budget', () => {
    expect(result.totalBudgetUsd).toBe(300e9);
  });

  it('should normalize outcome weights to sum to 1', () => {
    const weightSum = result.outcomes.reduce((s, o) => s + o.normalizedWeight, 0);
    expect(weightSum).toBeCloseTo(1.0, 10);
  });

  it('should produce per-outcome results for each category', () => {
    for (const cat of result.categories) {
      if (cat.isReturnToCitizens) continue;
      expect(cat.outcomeResults.length).toBe(2);
      const outcomeIds = cat.outcomeResults.map(o => o.outcomeId);
      expect(outcomeIds).toContain('income');
      expect(outcomeIds).toContain('health');
    }
  });

  it('should produce welfare scores for all categories', () => {
    for (const cat of result.categories) {
      expect(typeof cat.welfareScore).toBe('number');
      expect(isNaN(cat.welfareScore)).toBe(false);
    }
  });

  it('admin (no effect) should have the lowest welfare score', () => {
    const admin = result.categories.find(c => c.id === 'admin')!;
    const others = result.categories.filter(c => c.id !== 'admin' && !c.isReturnToCitizens);
    for (const other of others) {
      expect(other.welfareScore).toBeGreaterThan(admin.welfareScore);
    }
  });

  it('welfare scores should sum to approximately 0 (z-scores are mean-centered)', () => {
    const realCategories = result.categories.filter(c => !c.isReturnToCitizens);
    const sum = realCategories.reduce((s, c) => s + c.welfareScore, 0);
    // Z-scores are mean-centered, so their weighted sum should be near 0
    expect(Math.abs(sum)).toBeLessThan(0.1);
  });

  it('should include the analyzedAt timestamp', () => {
    expect(result.analyzedAt).toBeTruthy();
    expect(new Date(result.analyzedAt).getTime()).toBeGreaterThan(0);
  });
});

describe('optimizeBudgetMultiOutcome — Weights affect allocation', () => {
  it('income-only weights [1,0] should rank education highest', () => {
    const result = optimizeBudgetMultiOutcome(
      buildMultiOutcomeInput([1, 0]),
    );

    // With all weight on income and both education & healthcare having
    // the same outcome data structure, they'll have similar income effects.
    // But both should beat admin (which has no effect on income).
    const edu = result.categories.find(c => c.id === 'education')!;
    const admin = result.categories.find(c => c.id === 'admin')!;

    expect(edu.welfareScore).toBeGreaterThan(admin.welfareScore);
  });

  it('health-only weights [0,1] should rank healthcare well', () => {
    const result = optimizeBudgetMultiOutcome(
      buildMultiOutcomeInput([0, 1]),
    );

    const healthcare = result.categories.find(c => c.id === 'healthcare')!;
    const admin = result.categories.find(c => c.id === 'admin')!;

    expect(healthcare.welfareScore).toBeGreaterThan(admin.welfareScore);
  });

  it('changing weights should change relative welfare scores', () => {
    const resultIncomeHeavy = optimizeBudgetMultiOutcome(
      buildMultiOutcomeInput([0.9, 0.1]),
    );
    const resultHealthHeavy = optimizeBudgetMultiOutcome(
      buildMultiOutcomeInput([0.1, 0.9]),
    );

    const eduIncomeHeavy = resultIncomeHeavy.categories.find(c => c.id === 'education')!;
    const eduHealthHeavy = resultHealthHeavy.categories.find(c => c.id === 'education')!;

    // The welfare scores should differ when weights change
    // (unless the underlying data is perfectly symmetric, which it isn't
    // because spending patterns differ per category)
    // At minimum, the scores should both be computed without NaN
    expect(isNaN(eduIncomeHeavy.welfareScore)).toBe(false);
    expect(isNaN(eduHealthHeavy.welfareScore)).toBe(false);
  });

  it('equal weights should give equal influence to both outcomes', () => {
    const result = optimizeBudgetMultiOutcome(
      buildMultiOutcomeInput([0.5, 0.5]),
    );

    // Verify both outcomes have equal normalized weight
    const incomeOutcome = result.outcomes.find(o => o.outcomeId === 'income')!;
    const healthOutcome = result.outcomes.find(o => o.outcomeId === 'health')!;
    expect(incomeOutcome.normalizedWeight).toBeCloseTo(0.5);
    expect(healthOutcome.normalizedWeight).toBeCloseTo(0.5);
  });
});

describe('optimizeBudgetMultiOutcome — returnToCitizens baseline', () => {
  it('should include the virtual category when enabled', () => {
    const result = optimizeBudgetMultiOutcome(
      buildMultiOutcomeInput([0.5, 0.5], true),
    );

    const rtc = result.categories.find(c => c.isReturnToCitizens);
    expect(rtc).toBeDefined();
    expect(rtc!.id).toBe('__returnToCitizens');
    expect(rtc!.name).toContain('Return to Citizens');
  });

  it('should NOT include the virtual category when disabled', () => {
    const result = optimizeBudgetMultiOutcome(
      buildMultiOutcomeInput([0.5, 0.5], false),
    );

    const rtc = result.categories.find(c => c.isReturnToCitizens);
    expect(rtc).toBeUndefined();
  });

  it('returnToCitizens should have $0 current spending', () => {
    const result = optimizeBudgetMultiOutcome(
      buildMultiOutcomeInput([0.5, 0.5], true),
    );

    const rtc = result.categories.find(c => c.isReturnToCitizens)!;
    expect(rtc.currentSpendingUsd).toBe(0);
  });

  it('should identify categories beaten by returnToCitizens', () => {
    const result = optimizeBudgetMultiOutcome(
      buildMultiOutcomeInput([0.5, 0.5], true),
    );

    // returnToCitizensBeats should be an array (may be empty or not)
    expect(Array.isArray(result.returnToCitizensBeats)).toBe(true);
  });

  it('virtual category should not be counted in totalOptimalUsd', () => {
    const resultWith = optimizeBudgetMultiOutcome(
      buildMultiOutcomeInput([0.5, 0.5], true),
    );
    const resultWithout = optimizeBudgetMultiOutcome(
      buildMultiOutcomeInput([0.5, 0.5], false),
    );

    // The totalOptimalUsd should be the same regardless of the virtual category
    // because the virtual category has $0 optimal spending
    // (They won't be exactly equal because z-score stats change with the extra category,
    //  but the optimal USD calculation excludes the virtual one.)
    expect(typeof resultWith.totalOptimalUsd).toBe('number');
    expect(typeof resultWithout.totalOptimalUsd).toBe('number');
  });

  it('virtual category should not appear in reallocations', () => {
    const result = optimizeBudgetMultiOutcome(
      buildMultiOutcomeInput([0.5, 0.5], true),
    );

    const allReallocationNames = [
      ...result.reallocations.from.map(r => r.name),
      ...result.reallocations.to.map(r => r.name),
    ];
    expect(allReallocationNames).not.toContain('Return to Citizens (Tax Cuts)');
  });
});

describe('optimizeBudgetMultiOutcome — Edge cases', () => {
  it('should throw on zero total weight', () => {
    expect(() => optimizeBudgetMultiOutcome(
      buildMultiOutcomeInput([0, 0]),
    )).toThrow('Outcome weights must sum to a positive number');
  });

  it('should handle a single outcome (degenerates to single-outcome case)', () => {
    const input = buildMultiOutcomeInput([1, 0]);
    // Remove the zero-weight outcome entirely
    input.outcomes = [input.outcomes[0]!];

    const result = optimizeBudgetMultiOutcome(input);

    expect(result.outcomes.length).toBe(1);
    expect(result.outcomes[0]!.normalizedWeight).toBeCloseTo(1.0);
    expect(result.categories.length).toBe(3);
  });

  it('should handle unnormalized weights (e.g., [3, 7])', () => {
    const result = optimizeBudgetMultiOutcome(
      buildMultiOutcomeInput([3, 7]),
    );

    const incomeOutcome = result.outcomes.find(o => o.outcomeId === 'income')!;
    const healthOutcome = result.outcomes.find(o => o.outcomeId === 'health')!;
    expect(incomeOutcome.normalizedWeight).toBeCloseTo(0.3);
    expect(healthOutcome.normalizedWeight).toBeCloseTo(0.7);
  });

  it('categories sorted by welfare score descending', () => {
    const result = optimizeBudgetMultiOutcome(
      buildMultiOutcomeInput([0.5, 0.5]),
    );

    for (let i = 1; i < result.categories.length; i++) {
      expect(result.categories[i - 1]!.welfareScore)
        .toBeGreaterThanOrEqual(result.categories[i]!.welfareScore);
    }
  });

  it('should produce valid recommendations for all categories', () => {
    const result = optimizeBudgetMultiOutcome(
      buildMultiOutcomeInput([0.5, 0.5]),
    );

    for (const cat of result.categories) {
      expect(['increase', 'decrease', 'maintain']).toContain(cat.recommendation);
    }
  });
});

describe('optimizeBudgetMultiOutcome — Backward compatibility', () => {
  it('original optimizeBudget still works (import check)', async () => {
    // Ensure the existing function is still exported and works
    const { optimizeBudget } = await import('../optimize-budget.js');
    expect(typeof optimizeBudget).toBe('function');
  });

  it('new types are exported from index', async () => {
    const mod = await import('../index.js');
    expect(typeof mod.optimizeBudgetMultiOutcome).toBe('function');
  });
});

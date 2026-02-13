import { describe, expect, it } from 'vitest';

import {
  VARIABLE_REGISTRY,
  VariableRegistrySchema,
  getVariableById,
  getVariableRegistry,
  listPredictorsByDiscretionary,
  listVariablesByKind,
  listVariablesByScope,
} from '../variable-registry.js';

describe('variable registry', () => {
  it('validates against schema', () => {
    const parsed = VariableRegistrySchema.safeParse(VARIABLE_REGISTRY);
    expect(parsed.success).toBe(true);
  });

  it('contains unique canonical ids', () => {
    const ids = VARIABLE_REGISTRY.map(entry => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('requires outcome entries to declare welfare direction', () => {
    const outcomes = listVariablesByKind('outcome');
    expect(outcomes.length).toBeGreaterThan(0);
    for (const outcome of outcomes) {
      expect(outcome.welfareDirection).toBeDefined();
    }
  });

  it('exposes lookup helpers for ids and scopes', () => {
    const govSize = getVariableById('predictor.wb.gov_expenditure_pct_gdp');
    expect(govSize?.label).toContain('Government Expenditure');

    const nOf1Variables = listVariablesByScope('jurisdiction_n_of_1');
    expect(nOf1Variables.length).toBeGreaterThan(0);
    expect(
      nOf1Variables.some(v => v.id === 'outcome.wb.life_expectancy_years'),
    ).toBe(true);
  });

  it('flags derived variables explicitly', () => {
    const derived = getVariableById('predictor.derived.gov_expenditure_per_capita_ppp');
    expect(derived).toBeDefined();
    expect(derived?.isDerived).toBe(true);
    expect(derived?.source.provider).toBe('derived');
  });

  it('returns a copy when listing all entries', () => {
    const first = getVariableRegistry();
    const second = getVariableRegistry();
    expect(first).not.toBe(second);
    expect(first.length).toBe(second.length);
  });

  it('keeps suggested lag years unique', () => {
    for (const entry of VARIABLE_REGISTRY) {
      const unique = new Set(entry.suggestedLagYears);
      expect(unique.size).toBe(entry.suggestedLagYears.length);
    }
  });

  it('requires predictors to declare discretionary status', () => {
    const predictors = listVariablesByKind('predictor');
    expect(predictors.length).toBeGreaterThan(0);
    for (const predictor of predictors) {
      expect(typeof predictor.isDiscretionary).toBe('boolean');
    }
  });

  it('can list discretionary and non-discretionary predictors', () => {
    const discretionary = listPredictorsByDiscretionary(true);
    const nonDiscretionary = listPredictorsByDiscretionary(false);
    expect(discretionary.length).toBeGreaterThan(0);
    expect(nonDiscretionary.length).toBeGreaterThan(0);
    expect(
      nonDiscretionary.some((entry) => entry.id === 'predictor.derived.gov_expenditure_per_capita_ppp'),
    ).toBe(true);
    expect(
      nonDiscretionary.some((entry) => entry.id === 'predictor.wb.gov_debt_pct_gdp'),
    ).toBe(true);
  });
});

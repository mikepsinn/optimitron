import { describe, expect, it } from 'vitest';

import {
  VARIABLE_REGISTRY,
  VariableRegistrySchema,
  getVariableById,
  getVariableRegistry,
  listPredictorsByDiscretionary,
  listVariablesByKind,
  listVariablesByScope,
} from '../variable-registry';

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

  it('maps after-tax median income to the best-available median-income fetcher', () => {
    const income = getVariableById('outcome.derived.after_tax_median_income_ppp');
    expect(income).toBeDefined();
    expect(income?.source.fetcher).toBe('fetchAfterTaxMedianIncomePpp');
    expect(income?.source.provider).toBe('curated_dataset');
    expect(income?.description).toContain('Best-available');
    expect(income?.caveats.some((caveat) => caveat.includes('Eurostat'))).toBe(
      true,
    );
    expect(income?.caveats.some((caveat) => caveat.includes('OECD'))).toBe(
      true,
    );
    expect(income?.caveats.some((caveat) => caveat.includes('PIP'))).toBe(
      true,
    );
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

  it('defines temporal profiles for predictors used in panel analysis', () => {
    const predictors = listVariablesByKind('predictor');
    expect(predictors.length).toBeGreaterThan(0);

    for (const predictor of predictors) {
      expect(predictor.temporalProfile).toBeDefined();
      expect(predictor.temporalProfile?.onsetDelayYears.length).toBeGreaterThan(0);
      expect(predictor.temporalProfile?.durationYears.length).toBeGreaterThan(0);
      expect(typeof predictor.temporalProfile?.preferredFillingType).toBe('string');
    }
  });

  it('parses entries with sparseOutcomeProfile', () => {
    const battleDeaths = getVariableById('outcome.wb.battle_related_deaths');
    expect(battleDeaths?.sparseOutcomeProfile).toBeDefined();
    expect(battleDeaths?.sparseOutcomeProfile?.isRareEvent).toBe(true);
    expect(battleDeaths?.sparseOutcomeProfile?.minimumEventCountPerBin).toBe(5);
  });

  it('parses entries without sparseOutcomeProfile', () => {
    const lifeExpectancy = getVariableById('outcome.wb.life_expectancy_years');
    expect(lifeExpectancy).toBeDefined();
    expect(lifeExpectancy?.sparseOutcomeProfile).toBeUndefined();
  });

  it('validates new outcome entries have correct kind and welfareDirection', () => {
    const newOutcomeIds = [
      'outcome.who.ncd_mortality_rate',
      'outcome.wb.maternal_mortality_per_100k',
      'outcome.derived.battle_related_deaths_per_100k',
      'outcome.wb.under_five_mortality_per_1000',
    ];
    for (const id of newOutcomeIds) {
      const entry = getVariableById(id);
      expect(entry).toBeDefined();
      expect(entry?.kind).toBe('outcome');
      expect(entry?.welfareDirection).toBeDefined();
      expect(['higher_better', 'lower_better', 'neutral', 'unknown']).toContain(entry?.welfareDirection);
    }
  });

  it('can list discretionary and non-discretionary predictors', () => {
    const discretionary = listPredictorsByDiscretionary(true);
    const nonDiscretionary = listPredictorsByDiscretionary(false);
    expect(discretionary.length).toBeGreaterThan(0);
    expect(nonDiscretionary.length).toBeGreaterThan(0);
    expect(
      discretionary.some((entry) => entry.id === 'predictor.derived.gov_expenditure_per_capita_ppp'),
    ).toBe(true);
    expect(
      discretionary.some((entry) => entry.id === 'predictor.derived.military_expenditure_per_capita_ppp'),
    ).toBe(true);
    expect(
      discretionary.some((entry) => entry.id === 'predictor.derived.gov_non_military_expenditure_per_capita_ppp'),
    ).toBe(true);
    expect(
      discretionary.some((entry) => entry.id === 'predictor.derived.education_share_of_gov_expenditure_pct'),
    ).toBe(true);
    expect(
      nonDiscretionary.some((entry) => entry.id === 'predictor.wb.tax_revenue_pct_gdp'),
    ).toBe(true);
    expect(
      nonDiscretionary.some((entry) => entry.id === 'predictor.wb.gov_debt_pct_gdp'),
    ).toBe(true);
  });
});

import { describe, expect, it } from 'vitest';
import {
  buildCountryPanelIncomeLookup,
  refreshCountryPanelIncome,
  resolveCountryPanelIncome,
} from '../../datasets/country-panel-income';
import { getCountryPanelByCountry } from '../../datasets/country-panel';
import type { MedianIncomeSeriesRecord } from '../../datasets/median-income-types';
import { GENERATED_MEDIAN_INCOME_SERIES } from '../../generated/median-income-series';
import { COUNTRY_PANEL_DATA } from '../../generated/country-panel';

const observed: MedianIncomeSeriesRecord = {
  jurisdictionIso3: 'USA',
  jurisdictionName: 'United States',
  year: 2018,
  value: 37444.09814185905,
  unit: 'Real PPP-adjusted US dollars per equivalised household',
  concept: 'after_tax_median_disposable_income',
  priceBasis: 'real',
  purchasingPower: 'ppp',
  source: 'OECD IDD',
  derivation: 'derived',
  isAfterTax: true,
  taxScope: 'after_direct_taxes_and_cash_transfers',
  methodology: 'METH2012',
  definition: 'D_CUR',
  sourceUrl: 'https://data-explorer.oecd.org',
};

describe('country panel income boundary', () => {
  it('keeps the measured equivalised income and provenance without a household ratio', () => {
    const lookup = buildCountryPanelIncomeLookup([observed]);
    const fields = resolveCountryPanelIncome({
      jurisdictionIso3: 'USA',
      year: 2018,
      afterTaxMedianIncome: lookup.get('USA:2018'),
    });
    expect(fields.afterTaxMedianIncome).toEqual(observed);
    expect(fields.afterTaxMedianIncomePerCapitaPpp).toBeNull();
    expect(lookup.has('USA:2019')).toBe(false);
  });

  it.each<Partial<MedianIncomeSeriesRecord>>([
    { source: 'World Bank PIP + IMF Gov Exp (derived)', taxScope: 'derived_from_gov_spending' },
    { source: 'World Bank PIP', taxScope: 'unknown' },
    { priceBasis: 'nominal' },
    { purchasingPower: 'national_currency' },
    { unit: 'PPP-adjusted dollars per year' },
    { methodology: 'METH2011' },
    { isInterpolated: true },
    { welfareType: 'consumption' },
    { value: Number.NaN },
  ])('does not turn an incompatible later observation into income change: %j', (patch) => {
    const lookup = buildCountryPanelIncomeLookup([
      observed,
      { ...observed, year: 2019, ...patch },
    ]);
    expect([...lookup.keys()]).toEqual(['USA:2018']);
  });

  it('keeps Eurostat equivalence and methodology visible instead of relabeling it OECD', () => {
    const eurostat: MedianIncomeSeriesRecord = {
      ...observed,
      jurisdictionIso3: 'FRA',
      jurisdictionName: 'France',
      source: 'Eurostat EU-SILC',
      unit: 'Real PPP-adjusted US dollars per equivalised person',
      methodology: 'EU-SILC',
      definition: 'Median equivalised disposable income (MED_E).',
      sourceUrl: 'https://ec.europa.eu/eurostat',
    };
    const lookup = buildCountryPanelIncomeLookup([eurostat]);
    expect(lookup.get('FRA:2018')).toEqual(eurostat);
  });

  it('rejects a carried-forward observation or the wrong jurisdiction', () => {
    expect(resolveCountryPanelIncome({
      jurisdictionIso3: 'USA', year: 2019, afterTaxMedianIncome: observed,
    }).afterTaxMedianIncome).toBeNull();
    expect(resolveCountryPanelIncome({
      jurisdictionIso3: 'CAN', year: 2018, afterTaxMedianIncome: observed,
    }).afterTaxMedianIncome).toBeNull();
  });

  it('preserves the bundled US real-income gap rather than splicing nominal and inferred income', () => {
    const lookup = buildCountryPanelIncomeLookup(GENERATED_MEDIAN_INCOME_SERIES);
    expect(lookup.get('USA:2018')?.value).toBeCloseTo(observed.value);
    expect(lookup.has('USA:2023')).toBe(false);
    expect(lookup.has('USA:2024')).toBe(false);
  });

  it('refreshes only income fields without carrying a valid observation into a missing year', () => {
    const input = [2018, 2019].map(year => ({
      jurisdictionIso3: 'USA', year, haleYears: 63.9, population: 123,
      afterTaxMedianIncomePerCapitaPpp: 16000,
      afterTaxMedianIncomeSource: 'World Bank PIP + IMF Gov Exp (derived)',
      afterTaxMedianIncomeIsAfterTax: true,
    }));
    const before = structuredClone(input);
    const refreshed = refreshCountryPanelIncome(input, [observed]);
    expect(refreshed[0]?.afterTaxMedianIncome).toEqual(observed);
    expect(refreshed[1]?.afterTaxMedianIncome).toBeNull();
    for (const row of refreshed) {
      expect(row.haleYears).toBe(63.9);
      expect(row.population).toBe(123);
      expect(row.afterTaxMedianIncomePerCapitaPpp).toBeNull();
    }
    expect(input).toEqual(before);
    expect(refreshCountryPanelIncome(refreshed, [observed])).toEqual(refreshed);
  });

  it('publishes strict observations while keeping incompatible income in its original research dataset', () => {
    const before = COUNTRY_PANEL_DATA.find(row => row.jurisdictionIso3 === 'USA' && row.year === 2023)!;
    const after = COUNTRY_PANEL_DATA.find(row => row.jurisdictionIso3 === 'USA' && row.year === 2024)!;
    expect(GENERATED_MEDIAN_INCOME_SERIES.some(record =>
      record.jurisdictionIso3 === 'USA' && record.year === 2024
      && record.taxScope === 'derived_from_gov_spending',
    )).toBe(true);

    const publicRows = getCountryPanelByCountry('USA');
    expect(publicRows.find(row => row.year === 2018)?.afterTaxMedianIncome?.value)
      .toBeCloseTo(observed.value);
    for (const raw of [before, after]) {
      const row = publicRows.find(candidate => candidate.year === raw.year)!;
      expect(row.afterTaxMedianIncome).toBeNull();
      expect(row.afterTaxMedianIncomePerCapitaPpp).toBeNull();
      expect(row.afterTaxMedianIncomeSource).toBeNull();
      expect(row.afterTaxMedianIncomeIsAfterTax).toBe(false);
      expect(row.gdpPerCapitaPpp).toBe(raw.gdpPerCapitaPpp);
      expect(row.totalGovSpendingPctGdp).toBe(raw.totalGovSpendingPctGdp);
      expect(row.medianIncomePerCapitaPpp).toBe(raw.medianIncomePerCapitaPpp);
    }
  });
});

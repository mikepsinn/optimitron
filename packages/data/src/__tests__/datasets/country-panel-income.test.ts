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

const eurostat: MedianIncomeSeriesRecord = {
  ...observed,
  source: 'Eurostat EU-SILC',
  unit: 'Real PPP-adjusted US dollars per equivalised person',
  methodology: 'EU-SILC',
  definition: 'Median equivalised disposable income (MED_E).',
  sourceUrl: 'https://ec.europa.eu/eurostat',
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

  it('uses the longest observed definition without source switches or gap filling', () => {
    const records = [
      ...[2017, 2018, 2020].map(year => ({ ...eurostat, year, value: 20000 })),
      ...[2018, 2019, 2019, 2019].map(year => ({ ...observed, year, value: 40000 })),
    ];
    for (const input of [records, [...records].reverse()]) {
      const lookup = buildCountryPanelIncomeLookup(input);
      expect([...lookup.values()].map(record => record.year).sort()).toEqual([2017, 2018, 2020]);
      expect(lookup.get('USA:2018')?.value).toBe(20000);
      expect(lookup.has('USA:2019')).toBe(false);
      expect([...lookup.values()].every(record => record.source === 'Eurostat EU-SILC')).toBe(true);
    }
  });

  it('prefers OECD only when comparable observed coverage ties', () => {
    const records = [eurostat, { ...observed, year: 2019 }];
    for (const input of [records, [...records].reverse()]) {
      const lookup = buildCountryPanelIncomeLookup(input);
      expect([...lookup.keys()]).toEqual(['USA:2019']);
      expect(lookup.get('USA:2019')?.source).toBe('OECD IDD');
    }
  });

  it('does not splice changed definitions or PPP bases within the same source', () => {
    const lookup = buildCountryPanelIncomeLookup([
      { ...eurostat, year: 2017 },
      { ...eurostat, year: 2018 },
      { ...eurostat, year: 2019, definition: 'Changed equivalence definition' },
      { ...eurostat, year: 2020, pppBasisNote: 'Changed purchasing-power base' },
    ]);
    expect([...lookup.keys()]).toEqual(['USA:2017', 'USA:2018']);
  });

  it('publishes one income definition for every bundled country', () => {
    const definitions = new Map<string, Set<string>>();
    for (const row of COUNTRY_PANEL_DATA) {
      const record = row.afterTaxMedianIncome;
      if (!record) continue;
      const countryDefinitions = definitions.get(row.jurisdictionIso3) ?? new Set<string>();
      countryDefinitions.add(JSON.stringify([
        record.source, record.unit, record.methodology, record.definition,
        record.priceIndexNote, record.pppBasisNote,
      ]));
      definitions.set(row.jurisdictionIso3, countryDefinitions);
    }
    expect(definitions.size).toBeGreaterThan(0);
    expect([...definitions].filter(([, sources]) => sources.size > 1)).toEqual([]);
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
      expect(row.afterTaxMedianIncomePerCapitaPpp).toBe(16000);
    }
    expect(input).toEqual(before);
    expect(refreshCountryPanelIncome(refreshed, [observed])).toEqual(refreshed);
  });

  it('publishes strict observations without changing legacy estimates or other indicators', () => {
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
      expect(row.afterTaxMedianIncomePerCapitaPpp).toBe(raw.afterTaxMedianIncomePerCapitaPpp);
      expect(row.afterTaxMedianIncomeSource).toBe(raw.afterTaxMedianIncomeSource);
      expect(row.afterTaxMedianIncomeIsAfterTax).toBe(raw.afterTaxMedianIncomeIsAfterTax);
      expect(row.gdpPerCapitaPpp).toBe(raw.gdpPerCapitaPpp);
      expect(row.totalGovSpendingPctGdp).toBe(raw.totalGovSpendingPctGdp);
      expect(row.medianIncomePerCapitaPpp).toBe(raw.medianIncomePerCapitaPpp);
    }
  });
});

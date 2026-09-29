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
  value: 42000,
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
  priceReferenceYear: 2021,
  pppReferenceYear: 2021,
  equivalenceScale: 'square_root',
  priceIndexSource: 'OECD IDD',
  pppSource: 'OECD IDD',
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
  it('keeps comparable measured income and provenance without a household ratio', () => {
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
    { definition: 'D_OLD' },
    { priceReferenceYear: undefined },
    { priceReferenceYear: 2015 },
    { pppReferenceYear: undefined },
    { pppReferenceYear: 2015 },
    { equivalenceScale: undefined },
    { equivalenceScale: 'modified_oecd' },
    { priceIndexSource: undefined },
    { priceIndexSource: 'OECD IDD CPI' },
    { pppSource: undefined },
    { pppSource: 'OECD IDD private-consumption PPP' },
    { isAfterTax: false },
    { isInterpolated: true },
    { welfareType: 'consumption' },
    { value: Number.NaN },
    { value: 0 },
  ])('rejects an incompatible later observation instead of fabricating income change: %j', (patch) => {
    const lookup = buildCountryPanelIncomeLookup([
      observed,
      { ...observed, year: 2019, ...patch },
    ]);
    expect([...lookup.keys()]).toEqual(['USA:2018']);
  });

  it('does not choose a longer Eurostat series or use it to fill OECD gaps', () => {
    const records = [
      ...[2017, 2018, 2019, 2020].map(year => ({ ...eurostat, year, value: 20000 })),
      observed,
      { ...observed, year: 2020, value: 44000 },
      { ...eurostat, jurisdictionIso3: 'FRA', jurisdictionName: 'France' },
    ];
    for (const input of [records, [...records].reverse()]) {
      const lookup = buildCountryPanelIncomeLookup(input);
      expect([...lookup.entries()].sort(([left], [right]) => left.localeCompare(right))).toEqual([
        ['USA:2018', observed], ['USA:2020', { ...observed, year: 2020, value: 44000 }],
      ]);
    }
  });

  it('rejects a carried-forward observation or the wrong jurisdiction', () => {
    expect(resolveCountryPanelIncome({
      jurisdictionIso3: 'USA', year: 2019, afterTaxMedianIncome: observed,
    }).afterTaxMedianIncome).toBeNull();
    expect(resolveCountryPanelIncome({
      jurisdictionIso3: 'CAN', year: 2018, afterTaxMedianIncome: observed,
    }).afterTaxMedianIncome).toBeNull();
  });

  it('publishes one comparable income family across all bundled countries', () => {
    const records = COUNTRY_PANEL_DATA.flatMap(row => row.afterTaxMedianIncome ? [row.afterTaxMedianIncome] : []);
    expect(records.length).toBeGreaterThan(400);
    expect(new Set(records.map(record => record.jurisdictionIso3)).size).toBeGreaterThanOrEqual(20);
    const definitions = new Set(records.map(record => JSON.stringify([
      record.source, record.unit, record.methodology, record.definition,
      record.priceReferenceYear, record.pppReferenceYear, record.equivalenceScale,
      record.priceIndexSource, record.pppSource,
    ])));
    expect([...definitions]).toEqual([JSON.stringify([
      'OECD IDD', observed.unit, 'METH2012', 'D_CUR',
      2021, 2021, 'square_root', observed.priceIndexSource, observed.pppSource,
    ])]);
    for (const country of ['USA', 'CHE']) {
      expect(records.find(record => record.jurisdictionIso3 === country && record.year === 2021)?.value)
        .toBeGreaterThan(0);
    }
  });

  it('refreshes only income fields without carrying an observation into a missing year', () => {
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

  it('publishes refreshed observations without changing legacy estimates or other indicators', () => {
    const lookup = buildCountryPanelIncomeLookup(GENERATED_MEDIAN_INCOME_SERIES);
    const publicRows = getCountryPanelByCountry('USA');
    expect(publicRows.find(row => row.year === 2021)?.afterTaxMedianIncome?.value).toBeGreaterThan(0);
    for (const raw of COUNTRY_PANEL_DATA.filter(row => row.jurisdictionIso3 === 'USA')) {
      const row = publicRows.find(candidate => candidate.year === raw.year)!;
      expect(row.afterTaxMedianIncome).toEqual(lookup.get(`USA:${raw.year}`) ?? null);
      expect(row.afterTaxMedianIncomePerCapitaPpp).toBe(raw.afterTaxMedianIncomePerCapitaPpp);
      expect(row.afterTaxMedianIncomeSource).toBe(raw.afterTaxMedianIncomeSource);
      expect(row.afterTaxMedianIncomeIsAfterTax).toBe(raw.afterTaxMedianIncomeIsAfterTax);
      expect(row.gdpPerCapitaPpp).toBe(raw.gdpPerCapitaPpp);
      expect(row.totalGovSpendingPctGdp).toBe(raw.totalGovSpendingPctGdp);
      expect(row.medianIncomePerCapitaPpp).toBe(raw.medianIncomePerCapitaPpp);
    }
  });
});

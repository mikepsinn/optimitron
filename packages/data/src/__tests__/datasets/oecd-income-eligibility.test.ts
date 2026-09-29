import { describe, expect, it } from 'vitest';
import { buildMedianIncomeLookup, OECD_BUDGET_PANEL } from '../../datasets/oecd-budget-panel';
import type { MedianIncomeSeriesRecord } from '../../datasets/median-income-types';
import { MEDIAN_INCOME_SERIES } from '../../datasets/median-income-series';

const observed: MedianIncomeSeriesRecord = {
  jurisdictionIso3: 'USA', jurisdictionName: 'United States', year: 2018, value: 42000,
  unit: 'Real PPP-adjusted US dollars per equivalised household',
  concept: 'after_tax_median_disposable_income', priceBasis: 'real', purchasingPower: 'ppp',
  source: 'OECD IDD', derivation: 'derived',
  isAfterTax: true, taxScope: 'after_direct_taxes_and_cash_transfers',
  methodology: 'METH2012', definition: 'D_CUR', sourceUrl: 'https://data-explorer.oecd.org',
  priceReferenceYear: 2021, pppReferenceYear: 2021, equivalenceScale: 'square_root',
  priceIndexSource: 'OECD IDD', pppSource: 'OECD IDD',
};

describe('income eligibility for national spending comparisons', () => {
  it('keeps comparable survey income without filling missing years or countries', () => {
    const lookup = buildMedianIncomeLookup([observed]);
    expect(lookup.get('USA:2018')).toBe(42000);
    expect(lookup.has('USA:2022')).toBe(false);
    expect(lookup.has('SGP:2018')).toBe(false);
  });

  it.each<Partial<MedianIncomeSeriesRecord>>([
    { source: 'World Bank PIP + IMF Gov Exp (derived)', taxScope: 'derived_from_gov_spending' },
    { source: 'World Bank PIP', concept: 'median_income', taxScope: 'unknown' },
    { source: 'Eurostat EU-SILC', unit: 'Real PPP-adjusted US dollars per equivalised person', methodology: 'EU-SILC' },
    { priceBasis: 'nominal' }, { purchasingPower: 'national_currency' },
    { isAfterTax: false }, { isInterpolated: true }, { welfareType: 'consumption' },
    { priceReferenceYear: undefined }, { pppReferenceYear: 2015 }, { equivalenceScale: undefined },
    { equivalenceScale: 'modified_oecd' },
    { priceIndexSource: undefined }, { pppSource: undefined },
    { unit: 'PPP-adjusted dollars per year' }, { methodology: 'METH2011' },
    { definition: 'D_OLD' }, { value: Number.NaN }, { value: 0 },
  ])('does not admit an incompatible replacement: %j', (incompatible) => {
    const lookup = buildMedianIncomeLookup([
      observed,
      { ...observed, ...incompatible, year: 2022, value: incompatible.value ?? 100000 },
    ]);
    expect([...lookup.entries()]).toEqual([['USA:2018', 42000]]);
  });

  it('retains broad bundled coverage on one common source and conversion basis', () => {
    const records = OECD_BUDGET_PANEL.flatMap(row => row.afterTaxMedianIncome ? [row.afterTaxMedianIncome] : []);
    expect(records.length).toBeGreaterThan(300);
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
      const panel = OECD_BUDGET_PANEL.find(row => row.jurisdictionIso3 === country && row.year === 2021)!;
      const source = MEDIAN_INCOME_SERIES.find(record => record.jurisdictionIso3 === country
        && record.year === 2021 && record.source === 'OECD IDD'
        && record.priceBasis === 'real' && record.purchasingPower === 'ppp'
        && record.priceReferenceYear === 2021 && record.pppReferenceYear === 2021)!;
      expect(source).toBeDefined();
      expect(panel.afterTaxMedianIncome).toEqual(source);
      expect(panel.afterTaxMedianIncomePpp).toBe(source.value);
      expect(panel.afterTaxMedianIncomePpp).toBeGreaterThan(0);
    }
  });

  it('keeps Singapore missing rather than filling its income from a different source family', () => {
    expect(OECD_BUDGET_PANEL.filter(row => row.jurisdictionIso3 === 'SGP').every(row => row.afterTaxMedianIncomePpp === null)).toBe(true);
    expect(OECD_BUDGET_PANEL.filter(row => row.jurisdictionIso3 === 'SGP').every(row => row.afterTaxMedianIncome === null)).toBe(true);
  });
});

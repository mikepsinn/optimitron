import { describe, expect, it } from 'vitest';
import { buildMedianIncomeLookup, OECD_BUDGET_PANEL } from '../../datasets/oecd-budget-panel';
import type { MedianIncomeSeriesRecord } from '../../datasets/median-income-types';
import { MEDIAN_INCOME_SERIES } from '../../datasets/median-income-series';

const observed: MedianIncomeSeriesRecord = {
  jurisdictionIso3: 'USA', jurisdictionName: 'United States', year: 2018, value: 37444,
  unit: 'Real PPP-adjusted US dollars per equivalised household',
  concept: 'after_tax_median_disposable_income', priceBasis: 'real', purchasingPower: 'ppp',
  source: 'OECD IDD', derivation: 'derived', // Survey income converted with CPI and PPP.
  isAfterTax: true, taxScope: 'after_direct_taxes_and_cash_transfers',
  methodology: 'METH2012', definition: 'D_CUR', sourceUrl: 'https://data-explorer.oecd.org',
};

const eurostat: MedianIncomeSeriesRecord = {
  ...observed,
  jurisdictionIso3: 'ESP', jurisdictionName: 'Spain',
  source: 'Eurostat EU-SILC',
  unit: 'Real PPP-adjusted US dollars per equivalised person',
  methodology: 'EU-SILC',
  definition: 'Median equivalised disposable income (MED_E).',
  sourceUrl: 'https://ec.europa.eu/eurostat/databrowser/view/ilc_di03/default/table?lang=en',
};

describe('income eligibility for national spending comparisons', () => {
  it('keeps observed survey income without filling later years or missing countries', () => {
    const lookup = buildMedianIncomeLookup([observed]);
    expect(lookup.get('USA:2018')).toBe(37444);
    expect(lookup.has('USA:2022')).toBe(false);
    expect(lookup.has('SGP:2018')).toBe(false);
  });

  it('retains valid Eurostat observations without a household conversion', () => {
    const lookup = buildMedianIncomeLookup([observed, eurostat]);
    expect(lookup.get('USA:2018')).toBe(observed.value);
    expect(lookup.get('ESP:2018')).toBe(eurostat.value);
  });

  it('selects one country definition by observed coverage instead of splicing sources', () => {
    const records = [
      ...[2017, 2018, 2020].map(year => ({ ...eurostat, year, value: 20000 })),
      ...[2018, 2019, 2019, 2019].map(year => ({
        ...observed, jurisdictionIso3: 'ESP', jurisdictionName: 'Spain', year,
      })),
      { ...eurostat, year: 2021, pppBasisNote: 'Changed PPP conversion basis' },
    ];
    for (const input of [records, [...records].reverse()]) {
      const lookup = buildMedianIncomeLookup(input);
      expect([...lookup.entries()].sort()).toEqual([
        ['ESP:2017', 20000], ['ESP:2018', 20000], ['ESP:2020', 20000],
      ]);
    }
  });

  it.each<Partial<MedianIncomeSeriesRecord>>([
    { source: 'World Bank PIP + IMF Gov Exp (derived)', taxScope: 'derived_from_gov_spending' },
    { source: 'World Bank PIP', concept: 'median_income', taxScope: 'unknown' },
    { source: 'Eurostat EU-SILC', unit: 'Real PPP-adjusted US dollars per equivalised person' },
    { priceBasis: 'nominal' }, { purchasingPower: 'national_currency' },
    { isAfterTax: false }, { isInterpolated: true }, { welfareType: 'consumption' },
    { unit: 'PPP-adjusted dollars per year' }, { methodology: 'METH2011' },
    { definition: 'D_OLD' }, { value: Number.NaN }, { value: 0 },
  ])('does not admit an incompatible replacement: %j', (incompatible) => {
    const lookup = buildMedianIncomeLookup([
      observed,
      { ...observed, ...incompatible, year: 2022, value: incompatible.value ?? 100000 },
    ]);
    expect([...lookup.entries()]).toEqual([['USA:2018', 37444]]);
  });

  it('restores bundled Eurostat coverage with the original source and conversion metadata', () => {
    const eligibleRows = OECD_BUDGET_PANEL.filter(row => row.afterTaxMedianIncome !== null);
    expect(eligibleRows).toHaveLength(345);
    expect(eligibleRows.filter(row => row.afterTaxMedianIncome?.source === 'Eurostat EU-SILC'))
      .toHaveLength(340);
    expect(new Set(eligibleRows.map(row => row.jurisdictionIso3)).size).toBe(23);

    const spain = OECD_BUDGET_PANEL.find(row => row.jurisdictionIso3 === 'ESP' && row.year === 2022)!;
    const source = MEDIAN_INCOME_SERIES.find(record => record.jurisdictionIso3 === 'ESP'
      && record.year === 2022 && record.source === 'Eurostat EU-SILC'
      && record.priceBasis === 'real' && record.purchasingPower === 'ppp')!;
    expect(spain.afterTaxMedianIncome).toEqual(source);
    expect(spain.afterTaxMedianIncomePpp).toBe(source.value);
    expect(spain.afterTaxMedianIncome?.methodology).toBe('EU-SILC');
    expect(spain.afterTaxMedianIncome?.priceIndexNote).toContain('HICP');
    expect(spain.afterTaxMedianIncome?.pppBasisNote).toContain('World Bank');

    for (const country of new Set(eligibleRows.map(row => row.jurisdictionIso3))) {
      const definitions = new Set(eligibleRows.filter(row => row.jurisdictionIso3 === country)
        .map(row => {
          const record = row.afterTaxMedianIncome!;
          return JSON.stringify([
            record.source, record.unit, record.methodology, record.definition,
            record.priceIndexNote, record.pppBasisNote,
          ]);
        }));
      expect(definitions.size).toBe(1);
    }
  });

  it('preserves missing bundled US and Singapore observations as null', () => {
    expect(OECD_BUDGET_PANEL.find(r => r.jurisdictionIso3 === 'USA' && r.year === 2018)?.afterTaxMedianIncomePpp).toBeGreaterThan(0);
    expect(OECD_BUDGET_PANEL.find(r => r.jurisdictionIso3 === 'USA' && r.year === 2022)?.afterTaxMedianIncomePpp).toBeNull();
    expect(OECD_BUDGET_PANEL.filter(r => r.jurisdictionIso3 === 'SGP').every(r => r.afterTaxMedianIncomePpp === null)).toBe(true);
    expect(OECD_BUDGET_PANEL.filter(r => r.jurisdictionIso3 === 'SGP').every(r => r.afterTaxMedianIncome === null)).toBe(true);
  });
});

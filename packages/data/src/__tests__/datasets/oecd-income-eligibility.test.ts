import { describe, expect, it } from 'vitest';
import { buildMedianIncomeLookup, OECD_BUDGET_PANEL } from '../../datasets/oecd-budget-panel';
import type { MedianIncomeSeriesRecord } from '../../datasets/median-income-types';

const observed: MedianIncomeSeriesRecord = {
  jurisdictionIso3: 'USA', jurisdictionName: 'United States', year: 2018, value: 37444,
  unit: 'Real PPP-adjusted US dollars per equivalised household',
  concept: 'after_tax_median_disposable_income', priceBasis: 'real', purchasingPower: 'ppp',
  source: 'OECD IDD', derivation: 'derived', // Survey income converted with CPI and PPP.
  isAfterTax: true, taxScope: 'after_direct_taxes_and_cash_transfers',
  methodology: 'METH2012', definition: 'D_CUR', sourceUrl: 'https://data-explorer.oecd.org',
};

describe('income eligibility for national spending comparisons', () => {
  it('keeps observed survey income without filling later years or missing countries', () => {
    const lookup = buildMedianIncomeLookup([observed]);
    expect(lookup.get('USA:2018')).toBe(37444);
    expect(lookup.has('USA:2022')).toBe(false);
    expect(lookup.has('SGP:2018')).toBe(false);
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

  it('preserves missing bundled US and Singapore observations as null', () => {
    expect(OECD_BUDGET_PANEL.find(r => r.jurisdictionIso3 === 'USA' && r.year === 2018)?.afterTaxMedianIncomePpp).toBeGreaterThan(0);
    expect(OECD_BUDGET_PANEL.find(r => r.jurisdictionIso3 === 'USA' && r.year === 2022)?.afterTaxMedianIncomePpp).toBeNull();
    expect(OECD_BUDGET_PANEL.filter(r => r.jurisdictionIso3 === 'SGP').every(r => r.afterTaxMedianIncomePpp === null)).toBe(true);
  });
});

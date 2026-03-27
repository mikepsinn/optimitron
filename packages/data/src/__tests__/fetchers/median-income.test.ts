import { describe, expect, it, vi } from 'vitest';

import {
  fetchAfterTaxMedianIncomePpp,
  fetchStrictAfterTaxMedianIncomePpp,
} from '../../fetchers/median-income';
import * as medianIncomeDataset from '../../datasets/median-income-series';

describe('Median Income Fetchers', () => {
  it('fetchAfterTaxMedianIncomePpp converts best-available records to DataPoint rows', async () => {
    const fetchPreferredMedianIncomeSeries = vi
      .spyOn(medianIncomeDataset, 'fetchPreferredMedianIncomeSeries')
      .mockResolvedValue([
        {
          jurisdictionIso3: 'AUS',
          jurisdictionName: 'Australia',
          year: 2021,
          value: 100,
          unit: 'Real PPP-adjusted US dollars per equivalised household',
          concept: 'after_tax_median_disposable_income',
          priceBasis: 'real',
          purchasingPower: 'ppp',
          source: 'OECD IDD',
          derivation: 'derived',
          isAfterTax: true,
          taxScope: 'after_direct_taxes_and_cash_transfers',
          sourceUrl: 'https://data-explorer.oecd.org',
        },
      ]);

    const points = await fetchAfterTaxMedianIncomePpp({
      jurisdictions: ['AUS'],
      period: { startYear: 2021, endYear: 2021 },
    });

    expect(fetchPreferredMedianIncomeSeries).toHaveBeenCalledWith({
      jurisdictions: ['AUS'],
      period: { startYear: 2021, endYear: 2021 },
      priceBasis: 'real',
      purchasingPower: 'ppp',
    });
    expect(points).toEqual([
      {
        jurisdictionIso3: 'AUS',
        year: 2021,
        value: 100,
        unit: 'PPP intl-$',
        source: 'OECD IDD real PPP median disposable income',
        sourceUrl: 'https://data-explorer.oecd.org',
      },
    ]);
  });

  it('fetchStrictAfterTaxMedianIncomePpp requests strict OECD-backed records only', async () => {
    const fetchStrictAfterTaxMedianIncomeSeries = vi
      .spyOn(medianIncomeDataset, 'fetchStrictAfterTaxMedianIncomeSeries')
      .mockResolvedValue([
        {
          jurisdictionIso3: 'CAN',
          jurisdictionName: 'Canada',
          year: 2020,
          value: 90,
          unit: 'Real PPP-adjusted US dollars per equivalised household',
          concept: 'after_tax_median_disposable_income',
          priceBasis: 'real',
          purchasingPower: 'ppp',
          source: 'OECD IDD',
          derivation: 'derived',
          isAfterTax: true,
          taxScope: 'after_direct_taxes_and_cash_transfers',
          sourceUrl: 'https://data-explorer.oecd.org',
        },
      ]);

    const points = await fetchStrictAfterTaxMedianIncomePpp({
      jurisdictions: ['CAN'],
      period: { startYear: 2020, endYear: 2020 },
    });

    expect(fetchStrictAfterTaxMedianIncomeSeries).toHaveBeenCalledWith({
      jurisdictions: ['CAN'],
      period: { startYear: 2020, endYear: 2020 },
      priceBasis: 'real',
      purchasingPower: 'ppp',
      strictAfterTaxOnly: true,
    });
    expect(points[0]?.source).toContain('OECD IDD');
  });
});

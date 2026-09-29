import { describe, expect, it, vi } from 'vitest';

import {
  chooseBestMedianIncomeRecord,
  fetchPreferredMedianIncomeSeries,
  fetchStrictAfterTaxMedianIncomeSeries,
  filterMedianIncomeSeries,
  getBestAvailableMedianIncomeSeriesFromRecords,
  isStrictAfterTaxMedianIncomeRecord,
  rankMedianIncomeRecord,
} from '../../datasets/median-income-series';
import type { MedianIncomeSeriesRecord } from '../../datasets/median-income-types';
import { OECD_IDD_SELECTORS } from '../../fetchers/oecd-income-distribution';

const sampleRecords: MedianIncomeSeriesRecord[] = [
  {
    jurisdictionIso3: 'AUS',
    jurisdictionName: 'Australia',
    year: 2021,
    value: 100,
    unit: 'PPP-adjusted dollars per year',
    concept: 'median_income',
    priceBasis: 'real',
    purchasingPower: 'ppp',
    source: 'World Bank PIP',
    derivation: 'direct',
    isAfterTax: false,
    taxScope: 'unknown',
    consumptionTaxTreatment: 'unknown',
    inKindTransferTreatment: 'unknown',
    isInterpolated: true,
    sourceUrl: 'https://pip.worldbank.org',
  },
  {
    jurisdictionIso3: 'AUS',
    jurisdictionName: 'Australia',
    year: 2021,
    value: 95,
    unit: 'Real PPP-adjusted US dollars per equivalised household',
    concept: 'after_tax_median_disposable_income',
    priceBasis: 'real',
    purchasingPower: 'ppp',
    source: 'OECD IDD',
    derivation: 'derived',
    isAfterTax: true,
    taxScope: 'after_direct_taxes_and_cash_transfers',
    consumptionTaxTreatment: 'excluded',
    inKindTransferTreatment: 'excluded',
    isInterpolated: false,
    sourceUrl: 'https://data-explorer.oecd.org',
  },
  {
    jurisdictionIso3: 'USA',
    jurisdictionName: 'United States',
    year: 2020,
    value: 80,
    unit: 'PPP-adjusted dollars per year',
    concept: 'median_income',
    priceBasis: 'real',
    purchasingPower: 'ppp',
    source: 'World Bank PIP',
    derivation: 'direct',
    isAfterTax: false,
    taxScope: 'unknown',
    consumptionTaxTreatment: 'unknown',
    inKindTransferTreatment: 'unknown',
    isInterpolated: false,
    sourceUrl: 'https://pip.worldbank.org',
  },
];

describe('Median Income Dataset Helpers', () => {
  it('fetches reference-year prices outside the requested income period', async () => {
    const records = await fetchStrictAfterTaxMedianIncomeSeries({
      jurisdictions: ['TST'], source: 'OECD IDD',
      period: { startYear: 2024, endYear: 2024 },
      priceBasis: 'real', purchasingPower: 'ppp',
    }, {
      fetchOecdIddPoints: async (selector = {}, options = {}) => {
        const values = selector.measure === 'INC_DISP' ? [[2024, 200]]
          : selector.measure === 'CPI' ? [[2021, 100], [2024, 125]] : [[2021, 2]];
        return values.filter(([year]) => !options.period
          || (year! >= options.period.startYear && year! <= options.period.endYear))
          .map(([year, value]) => ({
            jurisdictionIso3: 'TST', jurisdictionName: 'Test', year: year!, value: value!,
            measure: selector.measure!, statisticalOperation: selector.statisticalOperation!,
            unitMeasure: selector.unitMeasure!, age: '_T', methodology: 'METH2012',
            definition: 'D_CUR', povertyLine: '_Z', source: 'OECD IDD', sourceUrl: 'https://data-explorer.oecd.org',
          }));
      },
    });
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ year: 2024, value: 80, priceReferenceYear: 2021 });
  });
  it('filterMedianIncomeSeries filters by jurisdiction and period', () => {
    const filtered = filterMedianIncomeSeries(sampleRecords, {
      jurisdictions: ['AUS'],
      period: { startYear: 2021, endYear: 2021 },
    });

    expect(filtered).toHaveLength(2);
    expect(filtered.every((record) => record.jurisdictionIso3 === 'AUS')).toBe(
      true,
    );
  });

  it('filterMedianIncomeSeries can require strict after-tax non-interpolated records', () => {
    const filtered = filterMedianIncomeSeries(sampleRecords, {
      strictAfterTaxOnly: true,
      excludeInterpolated: true,
    });

    expect(filtered).toEqual([sampleRecords[1]]);
  });

  it('isStrictAfterTaxMedianIncomeRecord recognizes direct-tax disposable-income records', () => {
    expect(isStrictAfterTaxMedianIncomeRecord(sampleRecords[1]!)).toBe(true);
    expect(isStrictAfterTaxMedianIncomeRecord(sampleRecords[0]!)).toBe(false);
  });

  it('rankMedianIncomeRecord prefers strict after-tax real PPP records', () => {
    expect(rankMedianIncomeRecord(sampleRecords[1]!)).toBeGreaterThan(
      rankMedianIncomeRecord(sampleRecords[0]!),
    );
  });

  it('chooseBestMedianIncomeRecord prefers strict after-tax real PPP data', () => {
    const best = chooseBestMedianIncomeRecord(
      sampleRecords.filter((record) => record.jurisdictionIso3 === 'AUS'),
    );

    expect(best?.source).toBe('OECD IDD');
    expect(best?.isAfterTax).toBe(true);
  });

  it('getBestAvailableMedianIncomeSeriesFromRecords keeps one preferred record per year', () => {
    const best = getBestAvailableMedianIncomeSeriesFromRecords(sampleRecords);

    expect(best).toHaveLength(2);
    expect(best.find((record) => record.jurisdictionIso3 === 'AUS')?.source).toBe(
      'OECD IDD',
    );
  });

  it('fetchPreferredMedianIncomeSeries merges live OECD strict data with bundled fallback data', async () => {
    const mockFetchOecdIddPoints = vi
      .fn()
      .mockImplementation(async (selector) => {
        if (selector.measure === OECD_IDD_SELECTORS.MEDIAN_DISPOSABLE_INCOME_TOTAL.measure) {
          return [
            {
              jurisdictionIso3: 'AUS',
              jurisdictionName: 'Australia',
              year: 2021,
              value: 200,
              measure: 'INC_DISP',
              statisticalOperation: 'MEDIAN',
              unitMeasure: 'XDC_HH_EQ',
              age: '_T',
              methodology: 'METH2012',
              definition: 'D_CUR',
              povertyLine: '_Z',
              source: 'OECD IDD',
              sourceUrl: 'https://data-explorer.oecd.org',
            },
          ];
        }

        if (selector.measure === OECD_IDD_SELECTORS.CPI_TOTAL.measure) {
          return [
            {
              jurisdictionIso3: 'AUS',
              jurisdictionName: 'Australia',
              year: 2021,
              value: 100,
              measure: 'CPI',
              statisticalOperation: '_Z',
              unitMeasure: 'IX',
              age: '_T',
              methodology: 'METH2012',
              definition: 'D_CUR',
              povertyLine: '_Z',
              source: 'OECD IDD',
              sourceUrl: 'https://data-explorer.oecd.org',
            },
          ];
        }

        return [
          {
            jurisdictionIso3: 'AUS',
            jurisdictionName: 'Australia',
            year: 2021,
            value: 2,
            measure: 'PPP_PRC',
            statisticalOperation: '_Z',
            unitMeasure: 'XDC_USD',
            age: '_T',
            methodology: 'METH2012',
            definition: 'D_CUR',
            povertyLine: '_Z',
            source: 'OECD IDD',
            sourceUrl: 'https://data-explorer.oecd.org',
          },
        ];
      });
    const mockFetchEurostatMedianDisposableIncomeSeries = vi
      .fn()
      .mockResolvedValue([]);

    const preferred = await fetchPreferredMedianIncomeSeries(
      {
        jurisdictions: ['AUS', 'USA'],
        period: { startYear: 2021, endYear: 2021 },
      },
      {
        fetchOecdIddPoints: mockFetchOecdIddPoints,
        fetchEurostatMedianDisposableIncomeSeries:
          mockFetchEurostatMedianDisposableIncomeSeries,
      },
    );

    expect(preferred).toHaveLength(2);
    expect(preferred.find((record) => record.jurisdictionIso3 === 'AUS')).toEqual(
      expect.objectContaining({
        source: 'OECD IDD',
        concept: 'after_tax_median_disposable_income',
        taxScope: 'after_direct_taxes_and_cash_transfers',
      }),
    );
    // USA falls back to bundled data (which now includes OECD IDD records)
    const usRecord = preferred.find((record) => record.jurisdictionIso3 === 'USA');
    expect(usRecord).toBeDefined();
    expect(usRecord!.jurisdictionIso3).toBe('USA');
    expect(mockFetchEurostatMedianDisposableIncomeSeries).toHaveBeenCalledWith({
      jurisdictions: ['AUS', 'USA'],
      period: { startYear: 2021, endYear: 2021 },
    });
  });
});

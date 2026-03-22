import { describe, expect, it } from 'vitest';

import {
  buildOECDIDDLegacyUrl,
  deriveOecdRealMedianDisposableIncome,
  extractOecdIddPoints,
  OECD_IDD_SELECTORS,
  selectPreferredOecdIddPoints,
  type OecdIddResponse,
} from '../../fetchers/oecd-income-distribution.js';

const mockOecdResponse: OecdIddResponse = {
  structure: {
    dimensions: {
      series: [
        { id: 'REF_AREA', values: [{ id: 'AUS', name: 'Australia' }] },
        { id: 'FREQ', values: [{ id: 'A', name: 'Annual' }] },
        {
          id: 'MEASURE',
          values: [
            { id: 'INC_DISP', name: 'Disposable income' },
            { id: 'CPI', name: 'Consumer Price Index' },
            { id: 'PPP_PRC', name: 'Purchasing Power Parities' },
          ],
        },
        {
          id: 'STATISTICAL_OPERATION',
          values: [
            { id: 'MEDIAN', name: 'Median' },
            { id: '_Z', name: 'Not applicable' },
          ],
        },
        {
          id: 'UNIT_MEASURE',
          values: [
            { id: 'XDC_HH_EQ', name: 'National currency per equivalised household' },
            { id: 'IX', name: 'Index' },
            { id: 'XDC_USD', name: 'National currency per US dollar' },
          ],
        },
        { id: 'AGE', values: [{ id: '_T', name: 'Total' }] },
        {
          id: 'METHODOLOGY',
          values: [
            { id: 'METH2012', name: 'Income definition since 2012' },
            { id: 'METH2011', name: 'Income definition until 2011' },
          ],
        },
        {
          id: 'DEFINITION',
          values: [
            { id: 'D_CUR', name: 'Current definition' },
            { id: 'D_PREV', name: 'Previous definition' },
          ],
        },
        { id: 'POVERTY_LINE', values: [{ id: '_Z', name: 'Not applicable' }] },
      ],
      observation: [
        {
          id: 'TIME_PERIOD',
          values: [
            { id: '2020', name: '2020' },
            { id: '2021', name: '2021' },
          ],
        },
      ],
    },
  },
  dataSets: [
    {
      series: {
        '0:0:0:0:0:0:0:0:0': {
          observations: {
            '0': [200],
            '1': [220],
          },
        },
        '0:0:0:0:0:0:1:1:0': {
          observations: {
            '0': [180],
            '1': [200],
          },
        },
        '0:0:1:1:1:0:0:0:0': {
          observations: {
            '0': [100],
            '1': [110],
          },
        },
        '0:0:2:1:2:0:0:0:0': {
          observations: {
            '0': [2],
            '1': [2],
          },
        },
      },
    },
  ],
};

describe('OECD Income Distribution Fetcher', () => {
  it('extractOecdIddPoints parses direct median disposable income series', () => {
    const points = extractOecdIddPoints(
      mockOecdResponse,
      OECD_IDD_SELECTORS.MEDIAN_DISPOSABLE_INCOME_TOTAL,
    );

    expect(points).toHaveLength(4);
    expect(points[0]).toEqual(
      expect.objectContaining({
        jurisdictionIso3: 'AUS',
        year: 2020,
        measure: 'INC_DISP',
        value: 200,
      }),
    );
  });

  it('selectPreferredOecdIddPoints prefers METH2012 and D_CUR', () => {
    const points = extractOecdIddPoints(
      mockOecdResponse,
      OECD_IDD_SELECTORS.MEDIAN_DISPOSABLE_INCOME_TOTAL,
    );

    const selected = selectPreferredOecdIddPoints(points);

    expect(selected).toHaveLength(2);
    expect(selected[0]?.value).toBe(200);
    expect(selected[1]?.value).toBe(220);
    expect(selected[0]?.methodology).toBe('METH2012');
    expect(selected[0]?.definition).toBe('D_CUR');
  });

  it('deriveOecdRealMedianDisposableIncome joins CPI and PPP series', () => {
    const median = extractOecdIddPoints(
      mockOecdResponse,
      OECD_IDD_SELECTORS.MEDIAN_DISPOSABLE_INCOME_TOTAL,
    );
    const cpi = extractOecdIddPoints(
      mockOecdResponse,
      OECD_IDD_SELECTORS.CPI_TOTAL,
    );
    const ppp = extractOecdIddPoints(
      mockOecdResponse,
      OECD_IDD_SELECTORS.PPP_PRIVATE_CONSUMPTION_TOTAL,
    );

    const derived = deriveOecdRealMedianDisposableIncome(median, cpi, ppp);

    expect(derived).toHaveLength(2);
    expect(derived[0]).toEqual(
      expect.objectContaining({
        jurisdictionIso3: 'AUS',
        year: 2020,
        nominalMedianLocalCurrency: 200,
        cpi: 100,
        pppPrivateConsumption: 2,
        realMedianLocalCurrency: 200,
        nominalMedianPppUsd: 100,
        realMedianPppUsd: 100,
      }),
    );
    expect(derived[1]?.realMedianLocalCurrency).toBeCloseTo(200);
    expect(derived[1]?.realMedianPppUsd).toBeCloseTo(100);
  });

  it('buildOECDIDDLegacyUrl includes the selector values in order', () => {
    const url = buildOECDIDDLegacyUrl(
      {
        refArea: ['AUS', 'CAN'],
        ...OECD_IDD_SELECTORS.MEDIAN_DISPOSABLE_INCOME_TOTAL,
        methodology: 'METH2012',
        definition: 'D_CUR',
      },
      { period: { startYear: 2020, endYear: 2021 } },
    );

    expect(url).toContain(
      '/AUS+CAN.A.INC_DISP.MEDIAN.XDC_HH_EQ._T.METH2012.D_CUR._Z/all',
    );
    expect(url).toContain('startTime=2020');
    expect(url).toContain('endTime=2021');
  });
});

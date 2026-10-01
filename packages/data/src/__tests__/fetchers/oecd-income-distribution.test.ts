import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

import {
  buildOECDIDDUrl,
  deriveOecdRealMedianDisposableIncome,
  extractOecdIddPoints,
  OECD_IDD_SELECTORS,
  selectPreferredOecdIddPoints,
  type OecdIddResponse,
} from '../../fetchers/oecd-income-distribution';

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

function incomeInputs() {
  return {
    median: extractOecdIddPoints(mockOecdResponse, OECD_IDD_SELECTORS.MEDIAN_DISPOSABLE_INCOME_TOTAL),
    cpi: extractOecdIddPoints(mockOecdResponse, OECD_IDD_SELECTORS.CPI_TOTAL),
    ppp: extractOecdIddPoints(mockOecdResponse, OECD_IDD_SELECTORS.PPP_PRIVATE_CONSUMPTION_TOTAL),
  };
}

describe('OECD Income Distribution Fetcher', () => {
  it('uses SDMX empty-dimension wildcards and the lossless response layout', () => {
    const url = buildOECDIDDUrl({ measure: 'CPI' });
    expect(new URL(url).pathname.endsWith('/.A.CPI......')).toBe(true);
    expect(new URL(url).searchParams.get('dimensionAtObservation')).toBe('AllDimensions');
  });
  it('decodes every AllDimensions observation using its dataset structure and unsorted time values', () => {
    const response: OecdIddResponse = JSON.parse(readFileSync(
      new URL('./fixtures/oecd-income-all-dimensions.json', import.meta.url), 'utf8',
    ));
    const data = response.data!;
    const dimensions = data.structures![0]!.dimensions!.observation!;
    const time = dimensions.find(dimension => dimension.id === 'TIME_PERIOD')!;
    const timeIndex = dimensions.indexOf(time);
    time.values!.reverse();
    const dataset = data.dataSets![0]!;
    dataset.observations = Object.fromEntries(Object.entries(dataset.observations!).map(([key, value]) => {
      const indices = key.split(':');
      indices[timeIndex] = String(time.values!.length - 1 - Number(indices[timeIndex]));
      return [indices.join(':'), value];
    }));
    // A response may contain multiple structures; this dataset selects index 1.
    data.structures!.unshift({ dimensions: { observation: [] } });
    dataset.structure = 1;

    const points = extractOecdIddPoints(response, OECD_IDD_SELECTORS.MEDIAN_DISPOSABLE_INCOME_TOTAL);
    expect(points.map(point => [point.jurisdictionIso3, point.year, point.value])).toEqual([
      ['CHE', 2021, 53624.15687],
      ['CHE', 2022, 53758.40625],
      ['USA', 2021, 46600],
    ]);
    expect(points.every(point => point.methodology === 'METH2012' && point.definition === 'D_CUR')).toBe(true);
  });

  it('extractOecdIddPoints parses direct median disposable income series', () => {
    const points = extractOecdIddPoints(
      mockOecdResponse,
      OECD_IDD_SELECTORS.MEDIAN_DISPOSABLE_INCOME_TOTAL,
    );

    expect(points).toHaveLength(2);
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

  it('derives income at the fixed 2021 price and PPP reference', () => {
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
        realMedianLocalCurrency: 220,
        nominalMedianPppUsd: 100,
        realMedianPppUsd: 110,
        priceReferenceYear: 2021,
        referenceCpi: 110,
        referencePpp: 2,
        priceIndexSource: 'OECD IDD',
        pppSource: 'OECD IDD',
        nominalPppSource: 'OECD IDD',
      }),
    );
    expect(derived[1]?.realMedianLocalCurrency).toBeCloseTo(220);
    expect(derived[1]?.realMedianPppUsd).toBeCloseTo(110);
  });

  it('cancels arbitrary CPI rebasing in real income', () => {
    const { median, cpi, ppp } = incomeInputs();
    const original = deriveOecdRealMedianDisposableIncome(median, cpi, ppp);
    const rebased = deriveOecdRealMedianDisposableIncome(median, cpi.map(point => ({ ...point, value: point.value * 2.5 })), ppp);
    expect(rebased.map(point => point.realMedianPppUsd)).toEqual(original.map(point => point.realMedianPppUsd));
  });

  it('uses the fixed PPP base for real income and same-year PPP for nominal income', () => {
    const { median, cpi, ppp } = incomeInputs();
    const changed = deriveOecdRealMedianDisposableIncome(median, cpi,
      ppp.map(point => point.year === 2020 ? { ...point, value: 4 } : point));
    expect(changed[0]?.realMedianPppUsd).toBe(110);
    expect(changed[0]?.nominalMedianPppUsd).toBe(50);
    const withoutCpi = deriveOecdRealMedianDisposableIncome(median, [], ppp);
    expect(withoutCpi.map(point => point.nominalMedianPppUsd)).toEqual([100, 110]);
    expect(withoutCpi.every(point => point.realMedianPppUsd === null)).toBe(true);
  });

  it.each(['cpi', 'ppp'] as const)('does not substitute a nearby year when reference %s is missing', (missing) => {
    const { median, cpi, ppp } = incomeInputs();
    const withoutReference = (points: typeof cpi) => points.map(point => point.year === 2021 ? { ...point, year: 2022 } : point);
    const derived = deriveOecdRealMedianDisposableIncome(median.filter(point => point.year === 2020),
      missing === 'cpi' ? withoutReference(cpi) : cpi,
      missing === 'ppp' ? withoutReference(ppp) : ppp);
    expect(derived[0]?.realMedianPppUsd).toBeNull();
    expect(derived[0]?.nominalMedianPppUsd).toBe(100);
  });

  it('uses a complete fallback CPI pair and reports the actual conversion sources', () => {
    const { median, cpi, ppp } = incomeInputs();
    const fallbackCpiPoints = [2020, 2021].map((year, index) => ({
      jurisdictionIso3: 'AUS', year, value: index === 0 ? 90 : 120,
      source: 'World Bank WDI (FP.CPI.TOTL)',
    }));
    const fallbackPpp = [{
      jurisdictionIso3: 'AUS', year: 2021, value: 1.5,
      source: 'World Bank WDI (PA.NUS.PRVT.PP)',
    }];
    const derived = deriveOecdRealMedianDisposableIncome(median.filter(point => point.year === 2020),
      cpi.filter(point => point.year === 2020), ppp.filter(point => point.year === 2020),
      fallbackPpp, { fallbackCpiPoints });
    expect(derived[0]?.realMedianPppUsd).toBeCloseTo((200 * 120 / 90) / 1.5);
    expect(derived[0]).toMatchObject({
      cpi: 90, referenceCpi: 120, referencePpp: 1.5,
      nominalMedianPppUsd: 100,
      priceIndexSource: 'World Bank WDI (FP.CPI.TOTL)',
      pppSource: 'World Bank WDI (PA.NUS.PRVT.PP)',
      nominalPppSource: 'OECD IDD',
    });
    const incomplete = deriveOecdRealMedianDisposableIncome(median.filter(point => point.year === 2020),
      cpi.filter(point => point.year === 2020), ppp, undefined,
      { fallbackCpiPoints: fallbackCpiPoints.filter(point => point.year === 2021) });
    expect(incomplete[0]?.realMedianPppUsd).toBeNull();
  });

  it('buildOECDIDDUrl includes the selector values in order', () => {
    const url = buildOECDIDDUrl(
      {
        refArea: ['AUS', 'CAN'],
        frequency: 'A',
        measure: 'INC_DISP',
        statisticalOperation: 'MEDIAN',
        unitMeasure: 'XDC_HH_EQ',
        age: '_T',
        methodology: 'METH2012',
        definition: 'D_CUR',
        povertyLine: '_Z',
      },
      { period: { startYear: 2020, endYear: 2021 } },
    );

    expect(url).toContain(
      '/AUS+CAN.A.INC_DISP.MEDIAN.XDC_HH_EQ._T.METH2012.D_CUR._Z',
    );
    expect(url).toContain('startPeriod=2020');
    expect(url).toContain('endPeriod=2021');
  });
});

import { describe, expect, it } from 'vitest';

import {
  deriveEurostatRealMedianDisposableIncome,
  extractEurostatHicpPoints,
  extractEurostatMedianIncomeLocalCurrencyPoints,
  type EurostatJsonStatResponse,
} from '../../fetchers/eurostat-income';
import type { DataPoint } from '../../types';

const incomeJson: EurostatJsonStatResponse = {
  id: ['freq', 'age', 'sex', 'statinfo', 'unit', 'geo', 'time'],
  size: [1, 1, 1, 1, 1, 1, 2],
  dimension: {
    freq: { category: { index: { A: 0 } } },
    age: { category: { index: { TOTAL: 0 } } },
    sex: { category: { index: { T: 0 } } },
    statinfo: { category: { index: { MED_EI: 0 } } },
    unit: { category: { index: { NAC: 0 } } },
    geo: {
      category: {
        index: { DE: 0 },
        label: { DE: 'Germany' },
      },
    },
    time: { category: { index: { '2020': 0, '2021': 1 } } },
  },
  value: {
    '0': 21000,
    '1': 22000,
  },
  status: {
    '1': 'b',
  },
};

const hicpJson: EurostatJsonStatResponse = {
  id: ['freq', 'unit', 'coicop', 'geo', 'time'],
  size: [1, 1, 1, 1, 2],
  dimension: {
    freq: { category: { index: { A: 0 } } },
    unit: { category: { index: { INX_A_AVG: 0 } } },
    coicop: { category: { index: { CP00: 0 } } },
    geo: { category: { index: { DE: 0 } } },
    time: { category: { index: { '2020': 0, '2021': 1 } } },
  },
  value: {
    '0': 100,
    '1': 110,
  },
};

const pppPoints: DataPoint[] = [
  {
    jurisdictionIso3: 'DEU',
    year: 2020,
    value: 0.75,
    source: 'World Bank WDI (PA.NUS.PRVT.PP)',
  },
  {
    jurisdictionIso3: 'DEU',
    year: 2021,
    value: 0.8,
    source: 'World Bank WDI (PA.NUS.PRVT.PP)',
  },
];

describe('Eurostat Income Fetcher', () => {
  it('extractEurostatMedianIncomeLocalCurrencyPoints parses NAC observations', () => {
    const points = extractEurostatMedianIncomeLocalCurrencyPoints(incomeJson);

    expect(points).toEqual([
      {
        jurisdictionIso3: 'DEU',
        jurisdictionName: 'Germany',
        year: 2020,
        nominalMedianLocalCurrency: 21000,
        estimateType: undefined,
        sourceUrl:
          'https://ec.europa.eu/eurostat/databrowser/view/ilc_di03/default/table?lang=en',
      },
      {
        jurisdictionIso3: 'DEU',
        jurisdictionName: 'Germany',
        year: 2021,
        nominalMedianLocalCurrency: 22000,
        estimateType: 'b',
        sourceUrl:
          'https://ec.europa.eu/eurostat/databrowser/view/ilc_di03/default/table?lang=en',
      },
    ]);
  });

  it('derives income at the fixed 2021 HICP and PPP reference', () => {
    const medianPoints = extractEurostatMedianIncomeLocalCurrencyPoints(incomeJson);
    const hicpPoints = extractEurostatHicpPoints(hicpJson);

    const derived = deriveEurostatRealMedianDisposableIncome(
      medianPoints,
      hicpPoints,
      pppPoints,
    );

    expect(derived).toHaveLength(2);
    expect(derived[0]).toEqual(
      expect.objectContaining({
        jurisdictionIso3: 'DEU',
        year: 2020,
        nominalMedianLocalCurrency: 21000,
        hicpAnnualAverage: 100,
        pppPrivateConsumption: 0.75,
        realMedianLocalCurrency: 23100,
        nominalMedianPppUsd: 28000,
        realMedianPppUsd: 28875,
        priceReferenceYear: 2021,
        referenceCpi: 110,
        referencePpp: 0.8,
        priceIndexSource: 'Eurostat HICP',
        pppSource: 'World Bank WDI (PA.NUS.PRVT.PP)',
      }),
    );
    expect(derived[1]?.realMedianLocalCurrency).toBeCloseTo(22000);
    expect(derived[1]?.realMedianPppUsd).toBeCloseTo(27500);
  });

  it('cancels HICP rebasing and ignores non-reference PPP changes for real income', () => {
    const median = extractEurostatMedianIncomeLocalCurrencyPoints(incomeJson);
    const hicp = extractEurostatHicpPoints(hicpJson);
    const derived = deriveEurostatRealMedianDisposableIncome(median,
      hicp.map(point => ({ ...point, hicpAnnualAverage: point.hicpAnnualAverage * 3 })),
      pppPoints.map(point => point.year === 2020 ? { ...point, value: 1.5 } : point));
    expect(derived.map(point => point.realMedianPppUsd)).toEqual([28875, 27500]);
    expect(derived[0]?.nominalMedianPppUsd).toBe(14000);
  });

  it.each(['hicp', 'ppp'] as const)('does not use a nearby year when reference %s is missing', (missing) => {
    const median = extractEurostatMedianIncomeLocalCurrencyPoints(incomeJson).filter(point => point.year === 2020);
    const hicp = extractEurostatHicpPoints(hicpJson);
    const derived = deriveEurostatRealMedianDisposableIncome(median,
      missing === 'hicp' ? hicp.map(point => point.year === 2021 ? { ...point, year: 2022 } : point) : hicp,
      missing === 'ppp' ? pppPoints.map(point => point.year === 2021 ? { ...point, year: 2022 } : point) : pppPoints);
    expect(derived[0]?.realMedianPppUsd).toBeNull();
    expect(derived[0]?.nominalMedianPppUsd).toBe(28000);
  });

  it('preserves nominal income and same-year PPP when HICP is unavailable', () => {
    const derived = deriveEurostatRealMedianDisposableIncome(
      extractEurostatMedianIncomeLocalCurrencyPoints(incomeJson), [], pppPoints,
    );
    expect(derived.map(point => point.nominalMedianLocalCurrency)).toEqual([21000, 22000]);
    expect(derived.map(point => point.nominalMedianPppUsd)).toEqual([28000, 27500]);
    expect(derived.every(point => point.realMedianPppUsd === null)).toBe(true);
  });

  it.each([
    ['BGR', 2026],
    ['HRV', 2023],
    ['LTU', 2015],
    ['CYP', 2009],
    ['MLT', 2007],
    ['SVN', 2007],
    ['SVK', 2009],
  ] as const)('withholds legacy-currency conversions for %s before its audited NAC break in %i', (jurisdictionIso3, firstEuroYear) => {
    const years = [firstEuroYear - 1, firstEuroYear];
    const derived = deriveEurostatRealMedianDisposableIncome(
      years.map(year => ({
        jurisdictionIso3,
        jurisdictionName: jurisdictionIso3,
        year,
        nominalMedianLocalCurrency: 70000,
        sourceUrl: 'https://ec.europa.eu/eurostat/databrowser/view/ilc_di03/default/table',
      })),
      [...years, 2021].map(year => ({ jurisdictionIso3, year, hicpAnnualAverage: 100 })),
      [...years, 2021].map(year => ({ jurisdictionIso3, year, value: 0.5, source: 'World Bank WDI (PA.NUS.PRVT.PP)' })),
    );

    // Positive CPI and PPP inputs are deliberately present: missing inputs must
    // not hide an erroneous legacy-currency / euro-PPP calculation.
    expect(derived[0]).toMatchObject({
      nominalMedianLocalCurrency: 70000,
      hicpAnnualAverage: 100,
      pppPrivateConsumption: 0.5,
      pppCurrencyCompatible: false,
      nominalMedianPppUsd: null,
      realMedianLocalCurrency: null,
      realMedianPppUsd: null,
    });
    expect(derived[0]?.pppCurrencyCompatibilityNote).toContain(`before ${firstEuroYear}`);
    expect(derived[0]?.pppCurrencyCompatibilityNote).toContain('Nominal NAC is retained');
    expect(derived[1]).toMatchObject({
      nominalMedianLocalCurrency: 70000,
      pppCurrencyCompatible: true,
      pppCurrencyCompatibilityNote: undefined,
      nominalMedianPppUsd: 140000,
      realMedianLocalCurrency: 70000,
      realMedianPppUsd: 140000,
    });
  });

  it.each([
    ['LVA', 2010],
    ['EST', 2009],
    ['DEU', 1995],
    ['CZE', 2020],
  ] as const)('preserves compatible back-converted or native NAC history for %s in %i', (jurisdictionIso3, year) => {
    const [derived] = deriveEurostatRealMedianDisposableIncome(
      [{
        jurisdictionIso3,
        jurisdictionName: jurisdictionIso3,
        year,
        nominalMedianLocalCurrency: 10000,
        sourceUrl: 'https://ec.europa.eu/eurostat/databrowser/view/ilc_di03/default/table',
      }],
      [year, 2021].map(observationYear => ({ jurisdictionIso3, year: observationYear, hicpAnnualAverage: 100 })),
      [year, 2021].map(observationYear => ({ jurisdictionIso3, year: observationYear, value: 0.5, source: 'World Bank WDI (PA.NUS.PRVT.PP)' })),
    );
    expect(derived).toMatchObject({
      nominalMedianLocalCurrency: 10000,
      pppCurrencyCompatible: true,
      nominalMedianPppUsd: 20000,
      realMedianLocalCurrency: 10000,
      realMedianPppUsd: 20000,
    });
  });
});

import { describe, expect, it } from 'vitest';

import {
  deriveEurostatRealMedianDisposableIncome,
  extractEurostatHicpPoints,
  extractEurostatMedianIncomeLocalCurrencyPoints,
  type EurostatJsonStatResponse,
} from '../../fetchers/eurostat-income';
import type { DataPoint } from '../../types';

const incomeJson: EurostatJsonStatResponse = {
  id: ['freq', 'age', 'sex', 'indic_il', 'unit', 'geo', 'time'],
  size: [1, 1, 1, 1, 1, 1, 2],
  dimension: {
    freq: { category: { index: { A: 0 } } },
    age: { category: { index: { TOTAL: 0 } } },
    sex: { category: { index: { T: 0 } } },
    indic_il: { category: { index: { MED_E: 0 } } },
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

  it('deriveEurostatRealMedianDisposableIncome joins HICP and PPP conversion factors', () => {
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
        realMedianLocalCurrency: 21000,
        nominalMedianPppUsd: 28000,
        realMedianPppUsd: 28000,
      }),
    );
    expect(derived[1]?.realMedianLocalCurrency).toBeCloseTo(20000);
    expect(derived[1]?.realMedianPppUsd).toBeCloseTo(25000);
  });
});

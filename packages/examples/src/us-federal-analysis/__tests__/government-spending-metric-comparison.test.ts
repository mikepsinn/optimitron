import { describe, it, expect } from 'vitest';

import type { DataPoint } from '@optimitron/data';

import {
  computeDerivedGovSpendingPerCapitaPpp,
  parseFredGraphCsv,
  summarizeCoverage,
} from '../generate-government-spending-metric-comparison.js';

describe('government spending metric comparison helpers', () => {
  it('summarizes coverage across jurisdictions and years', () => {
    const points: DataPoint[] = [
      { jurisdictionIso3: 'USA', year: 2020, value: 20, source: 'x' },
      { jurisdictionIso3: 'USA', year: 2021, value: 21, source: 'x' },
      { jurisdictionIso3: 'CAN', year: 2020, value: 19, source: 'x' },
      { jurisdictionIso3: 'CAN', year: 2021, value: 20, source: 'x' },
      { jurisdictionIso3: 'MEX', year: 2021, value: 18, source: 'x' },
    ];

    const summary = summarizeCoverage(points);
    expect(summary.observations).toBe(5);
    expect(summary.jurisdictions).toBe(3);
    expect(summary.yearMin).toBe(2020);
    expect(summary.yearMax).toBe(2021);
    expect(summary.medianYearsPerJurisdiction).toBe(2);
  });

  it('derives per-capita PPP spending from pct-of-GDP and GDP-per-capita', () => {
    const spendingPct: DataPoint[] = [
      { jurisdictionIso3: 'USA', year: 2023, value: 25, source: 'spend' },
      { jurisdictionIso3: 'CAN', year: 2023, value: 20, source: 'spend' },
      { jurisdictionIso3: 'MEX', year: 2023, value: 18, source: 'spend' },
    ];
    const gdpPerCapita: DataPoint[] = [
      { jurisdictionIso3: 'USA', year: 2023, value: 80000, source: 'gdp' },
      { jurisdictionIso3: 'CAN', year: 2023, value: 60000, source: 'gdp' },
    ];

    const derived = computeDerivedGovSpendingPerCapitaPpp(spendingPct, gdpPerCapita);
    expect(derived).toHaveLength(2);
    const usa = derived.find(point => point.jurisdictionIso3 === 'USA');
    const can = derived.find(point => point.jurisdictionIso3 === 'CAN');
    expect(usa?.value).toBe(20000);
    expect(can?.value).toBe(12000);
  });

  it('parses FRED graph CSV and rejects non-CSV payloads', () => {
    const csv = [
      'observation_date,TEST',
      '2023-01-01,10.5',
      '2024-01-01,11.2',
      '2025-01-01,.',
    ].join('\n');
    const parsed = parseFredGraphCsv(csv);
    expect(parsed).toHaveLength(2);
    expect(parsed[0]).toEqual({ date: '2023-01-01', value: 10.5 });
    expect(parsed[1]).toEqual({ date: '2024-01-01', value: 11.2 });

    const html = '<!DOCTYPE html><html><body>blocked</body></html>';
    expect(parseFredGraphCsv(html)).toEqual([]);
  });
});


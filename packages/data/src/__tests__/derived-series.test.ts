import { describe, expect, it } from 'vitest';

import {
  buildDerivedDifferencePerCapitaPpp,
  buildDerivedPercentGdpPerCapitaPpp,
  buildDerivedRatePer100k,
  buildDerivedShareOfVariablePercent,
  buildDerivedYoYPercent,
} from '../derived-series';
import type { DataPoint } from '../types';

function point(
  jurisdictionIso3: string,
  year: number,
  value: number,
  overrides: Partial<DataPoint> = {},
): DataPoint {
  return {
    jurisdictionIso3,
    year,
    value,
    source: 'test',
    ...overrides,
  };
}

describe('derived-series helpers', () => {
  it('buildDerivedPercentGdpPerCapitaPpp converts percent of GDP into per-capita PPP values', () => {
    const raw = new Map<string, DataPoint[]>([
      ['predictor.wb.gov_expenditure_pct_gdp', [
        point('USA', 2024, 20, { sourceUrl: 'https://percent.example' }),
      ]],
      ['outcome.wb.gdp_per_capita_ppp', [
        point('USA', 2024, 50_000, { lastUpdated: '2026-04-12T00:00:00.000Z' }),
      ]],
    ]);

    const rows = buildDerivedPercentGdpPerCapitaPpp(
      raw,
      'predictor.wb.gov_expenditure_pct_gdp',
      'derived',
    );

    expect(rows).toEqual([{
      jurisdictionIso3: 'USA',
      year: 2024,
      value: 10_000,
      unit: 'international $/person',
      source: 'derived',
      sourceUrl: 'https://percent.example',
      lastUpdated: '2026-04-12T00:00:00.000Z',
    }]);
  });

  it('buildDerivedShareOfVariablePercent computes aligned percentage shares and skips invalid denominators', () => {
    const raw = new Map<string, DataPoint[]>([
      ['numerator', [
        point('USA', 2024, 200, { sourceUrl: 'https://numerator.example' }),
        point('CAN', 2024, 10),
      ]],
      ['denominator', [
        point('USA', 2024, 800, { lastUpdated: '2026-04-12T01:00:00.000Z' }),
        point('CAN', 2024, 0),
      ]],
    ]);

    const rows = buildDerivedShareOfVariablePercent(
      raw,
      'numerator',
      'denominator',
      'share-derived',
      { unit: '% of government expenditure' },
    );

    expect(rows).toEqual([{
      jurisdictionIso3: 'USA',
      year: 2024,
      value: 25,
      unit: '% of government expenditure',
      source: 'share-derived',
      sourceUrl: 'https://numerator.example',
      lastUpdated: '2026-04-12T01:00:00.000Z',
    }]);
  });

  it('buildDerivedDifferencePerCapitaPpp keeps only nonnegative aligned differences', () => {
    const raw = new Map<string, DataPoint[]>([
      ['gross', [
        point('USA', 2024, 120),
        point('CAN', 2024, 30),
      ]],
      ['offset', [
        point('USA', 2024, 20),
        point('CAN', 2024, 50),
      ]],
    ]);

    const rows = buildDerivedDifferencePerCapitaPpp(
      raw,
      'gross',
      'offset',
      'difference-derived',
    );

    expect(rows).toEqual([{
      jurisdictionIso3: 'USA',
      year: 2024,
      value: 100,
      unit: 'international $/person',
      source: 'difference-derived',
      sourceUrl: undefined,
      lastUpdated: undefined,
    }]);
  });

  it('buildDerivedYoYPercent only compares contiguous annual observations', () => {
    const rows = buildDerivedYoYPercent([
      point('USA', 2022, 100, { sourceUrl: 'https://2022.example' }),
      point('USA', 2023, 110),
      point('USA', 2025, 200),
      point('CAN', 2023, 0),
      point('CAN', 2024, 50),
    ], 'yoy-derived');

    expect(rows).toEqual([{
      jurisdictionIso3: 'USA',
      year: 2023,
      value: 10,
      unit: '% YoY',
      source: 'yoy-derived',
      sourceUrl: 'https://2022.example',
      lastUpdated: undefined,
    }]);
  });

  it('buildDerivedRatePer100k normalizes counts by aligned population data', () => {
    const rows = buildDerivedRatePer100k(
      [
        point('USA', 2024, 331, { sourceUrl: 'https://count.example' }),
        point('CAN', 2024, 50),
      ],
      [
        point('USA', 2024, 331_000_000, { lastUpdated: '2026-04-12T02:00:00.000Z' }),
      ],
      'rate-derived',
      { unit: 'deaths per 100,000 people' },
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      jurisdictionIso3: 'USA',
      year: 2024,
      unit: 'deaths per 100,000 people',
      source: 'rate-derived',
      sourceUrl: 'https://count.example',
      lastUpdated: '2026-04-12T02:00:00.000Z',
    });
    expect(rows[0]?.value).toBeCloseTo(0.1, 10);
  });
});

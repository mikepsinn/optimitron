import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildPIPUrl,
  fetchMedianIncomes,
  fetchPIPIncomeSeries,
  parsePIPRecords,
  pickLatestPIPCountryData,
  type PIPResponse,
} from '../../fetchers/world-bank-pip';

const mockResponses: PIPResponse[] = [
  {
    country_code: 'USA',
    country_name: 'United States',
    reporting_year: 2020,
    survey_acronym: 'US20',
    survey_coverage: 'national',
    survey_year: 2020,
    median: 50,
    mean: 70,
    gini: 0.4,
    cpi: 101,
    ppp: 1,
    reporting_pop: 100,
    is_interpolated: false,
    distribution_type: 'micro',
    estimation_type: 'survey',
    estimate_type: 'actual',
    survey_comparability: 'comparable',
    comparable_spell: '2019-2020',
    welfare_type: 'income',
  },
  {
    country_code: 'USA',
    country_name: 'United States',
    reporting_year: 2021,
    survey_acronym: 'US21',
    survey_coverage: 'national',
    survey_year: 2021,
    median: 55,
    mean: 75,
    gini: 0.41,
    cpi: 102,
    ppp: 1,
    reporting_pop: 110,
    is_interpolated: true,
    distribution_type: 'micro',
    estimation_type: 'survey',
    estimate_type: 'interpolated',
    survey_comparability: 'comparable',
    comparable_spell: '2020-2021',
    welfare_type: 'income',
  },
  {
    country_code: 'GBR',
    country_name: 'United Kingdom',
    reporting_year: 2021,
    survey_acronym: 'UK21',
    survey_coverage: 'national',
    survey_year: 2021,
    median: 40,
    mean: 55,
    gini: 0.35,
    cpi: 103,
    ppp: 0.7,
    reporting_pop: 90,
    is_interpolated: false,
    distribution_type: 'micro',
    estimation_type: 'survey',
    estimate_type: 'actual',
    survey_comparability: 'comparable',
    comparable_spell: '2021',
    welfare_type: 'income',
  },
  {
    country_code: 'DEU',
    country_name: 'Germany',
    reporting_year: 2021,
    survey_acronym: 'DE21',
    survey_coverage: 'national',
    survey_year: 2021,
    median: null,
    mean: 60,
    gini: 0.3,
    cpi: 104,
    ppp: 0.8,
    reporting_pop: 95,
    is_interpolated: false,
    distribution_type: 'micro',
    estimation_type: 'survey',
    estimate_type: 'actual',
    survey_comparability: 'comparable',
    comparable_spell: '2021',
    welfare_type: 'income',
  },
];

describe('World Bank PIP Fetcher', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('buildPIPUrl uses comma-separated countries and year=all for ranges', () => {
    const url = buildPIPUrl({
      jurisdictions: ['USA', 'GBR'],
      period: { startYear: 2020, endYear: 2021 },
      welfareType: 'income',
    });

    expect(url).toContain('country=USA,GBR');
    expect(url).toContain('year=all');
    expect(url).toContain('welfare_type=income');
  });

  it('parsePIPRecords filters null medians, period bounds, and preserves survey metadata', () => {
    const records = parsePIPRecords(mockResponses, {
      period: { startYear: 2021, endYear: 2021 },
    });

    expect(records).toHaveLength(2);
    expect(records[0]).toEqual(
      expect.objectContaining({
        countryCode: 'GBR',
        year: 2021,
        medianAnnual: 14600,
        isInterpolated: false,
        surveyYear: 2021,
        estimateType: 'actual',
      }),
    );
    expect(records.every((record) => record.year === 2021)).toBe(true);
  });

  it('pickLatestPIPCountryData keeps only the latest year per country', () => {
    const parsed = parsePIPRecords(mockResponses);
    const latest = pickLatestPIPCountryData(parsed);

    expect(latest).toHaveLength(2);
    expect(latest.find((record) => record.countryCode === 'USA')?.year).toBe(
      2021,
    );
  });

  it('fetchPIPIncomeSeries returns parsed data on success', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponses),
    });

    const result = await fetchPIPIncomeSeries({
      jurisdictions: ['USA', 'GBR'],
      period: { startYear: 2021, endYear: 2021 },
    });

    expect(result).toHaveLength(2);
    const callUrl = (globalThis.fetch as ReturnType<typeof vi.fn>).mock
      .calls[0]?.[0] as string;
    expect(callUrl).toContain('country=USA,GBR');
    expect(callUrl).toContain('year=2021');
  });

  it('fetchPIPIncomeSeries returns empty array on HTTP error', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(fetchPIPIncomeSeries()).resolves.toEqual([]);
  });

  it('fetchMedianIncomes reuses the broader series fetcher for a single year', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponses),
    });

    const result = await fetchMedianIncomes(['USA', 'GBR'], 2021);
    expect(result).toHaveLength(2);
    expect(result.find((record) => record.countryCode === 'USA')?.year).toBe(
      2021,
    );
  });
});

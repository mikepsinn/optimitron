/**
 * IMF DataMapper API
 *
 * Provides Fiscal Monitor and World Economic Outlook data for all countries.
 * Free, no API key required.
 *
 * Key indicators:
 *   G_X_G01_GDP_PT  — General government total expenditure (% of GDP)
 *                     Includes ALL levels (central + state + local + social security)
 *   G_XLC_G01_GDP_PT — General government total revenue (% of GDP)
 *
 * @see https://www.imf.org/external/datamapper
 */

import type { DataPoint, FetchOptions } from '../types';

const IMF_DATAMAPPER_BASE = 'https://www.imf.org/external/datamapper/api/v1';

export const IMF_INDICATORS = {
  /** General government total expenditure (% of GDP) — all levels */
  GOV_EXPENDITURE_PCT_GDP: 'G_X_G01_GDP_PT',
  /** General government total revenue (% of GDP) */
  GOV_REVENUE_PCT_GDP: 'G_XLC_G01_GDP_PT',
} as const;

interface IMFDataMapperResponse {
  values?: Record<string, Record<string, Record<string, number>>>;
  api?: { version: string };
}

function parseIMFResponse(
  json: IMFDataMapperResponse,
  indicator: string,
  period?: FetchOptions['period'],
): DataPoint[] {
  const indicatorData = json.values?.[indicator];
  if (!indicatorData) return [];

  const points: DataPoint[] = [];
  for (const [iso3, yearValues] of Object.entries(indicatorData)) {
    // Skip aggregate groups (OECD, EU, etc. — they have 3+ letter codes but aren't countries)
    if (iso3.length !== 3) continue;

    for (const [yearStr, value] of Object.entries(yearValues)) {
      const year = Number(yearStr);
      if (!Number.isFinite(year) || !Number.isFinite(value)) continue;
      if (period && (year < period.startYear || year > period.endYear)) continue;

      points.push({
        jurisdictionIso3: iso3,
        year,
        value,
        unit: '% of GDP',
        source: `IMF Fiscal Monitor (${indicator})`,
        sourceUrl: `https://www.imf.org/external/datamapper/${indicator}`,
      });
    }
  }

  return points.sort((a, b) => {
    if (a.jurisdictionIso3 !== b.jurisdictionIso3) {
      return a.jurisdictionIso3.localeCompare(b.jurisdictionIso3);
    }
    return a.year - b.year;
  });
}

/**
 * Fetch an IMF DataMapper indicator for all countries.
 */
export async function fetchIMFIndicator(
  indicator: string,
  options: FetchOptions = {},
): Promise<DataPoint[]> {
  const url = `${IMF_DATAMAPPER_BASE}/${indicator}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`IMF DataMapper API ${response.status}: ${response.statusText}`);
      return [];
    }

    const json = (await response.json()) as IMFDataMapperResponse;
    return parseIMFResponse(json, indicator, options.period);
  } catch (error) {
    console.error(`IMF DataMapper fetch error (${indicator}):`, error);
    return [];
  }
}

/**
 * Fetch general government total expenditure (% of GDP) for all countries.
 * Includes central + state + local + social security funds.
 */
export async function fetchIMFGovExpenditurePctGDP(
  options: FetchOptions = {},
): Promise<DataPoint[]> {
  return fetchIMFIndicator(IMF_INDICATORS.GOV_EXPENDITURE_PCT_GDP, options);
}

/**
 * Fetch general government total revenue (% of GDP) for all countries.
 */
export async function fetchIMFGovRevenuePctGDP(
  options: FetchOptions = {},
): Promise<DataPoint[]> {
  return fetchIMFIndicator(IMF_INDICATORS.GOV_REVENUE_PCT_GDP, options);
}

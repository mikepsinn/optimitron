/**
 * World Bank Indicators API Fetcher
 *
 * Fetches any indicator by country and year range with pagination support.
 * Free, no API key required.
 *
 * API docs: https://datahelpdesk.worldbank.org/knowledgebase/articles/889392
 */

import type { DataPoint, FetchOptions } from '../types.js';

const WB_API_BASE = 'https://api.worldbank.org/v2';

/** Maximum results per page (World Bank caps at 1000) */
const MAX_PER_PAGE = 1000;

/**
 * Commonly used World Bank indicator codes.
 */
export const WB_INDICATOR_CODES = {
  LIFE_EXPECTANCY: 'SP.DYN.LE00.IN',
  GDP_PER_CAPITA_PPP: 'NY.GDP.PCAP.PP.CD',
  HEALTH_EXPENDITURE_PCT_GDP: 'SH.XPD.CHEX.GD.ZS',
  HEALTH_EXPENDITURE_PER_CAPITA: 'SH.XPD.CHEX.PP.CD',
  EDUCATION_EXPENDITURE_PCT_GDP: 'SE.XPD.TOTL.GD.ZS',
  INFANT_MORTALITY: 'SP.DYN.IMRT.IN',
  MATERNAL_MORTALITY: 'SH.STA.MMRT',
  GINI_INDEX: 'SI.POV.GINI',
  UNEMPLOYMENT: 'SL.UEM.TOTL.ZS',
  POPULATION: 'SP.POP.TOTL',
  GDP_GROWTH: 'NY.GDP.MKTP.KD.ZG',
  INFLATION: 'FP.CPI.TOTL.ZG',
} as const;

/** Shape of a single record in the World Bank JSON response */
export interface WBRecord {
  indicator: { id: string; value: string };
  country: { id: string; value: string };
  countryiso3code: string;
  date: string;
  value: number | null;
  unit: string;
  obs_status: string;
  decimal: number;
}

/** Metadata header returned as the first element of the response array */
export interface WBMeta {
  page: number;
  pages: number;
  per_page: number | string;
  total: number;
}

/**
 * Fetch a single page of World Bank indicator data.
 *
 * @returns `[meta, records]` tuple, or `null` on error.
 */
export async function fetchWorldBankPage(
  indicator: string,
  countries: string,
  startYear: number,
  endYear: number,
  page: number,
  perPage: number,
): Promise<[WBMeta, WBRecord[]] | null> {
  const url =
    `${WB_API_BASE}/country/${countries}/indicator/${indicator}` +
    `?format=json&date=${startYear}:${endYear}` +
    `&per_page=${perPage}&page=${page}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`World Bank API ${response.status}: ${response.statusText}`);
      return null;
    }

    const json = (await response.json()) as [WBMeta, WBRecord[] | null] | [{ message: unknown[] }];

    // Error responses look like [{ message: [...] }]
    if (!Array.isArray(json) || json.length < 2) return null;

    const meta = json[0] as WBMeta;
    const data = json[1] as WBRecord[] | null;
    if (!data) return null;

    return [meta, data];
  } catch (error) {
    console.error(`World Bank fetch error (${indicator}):`, error);
    return null;
  }
}

/**
 * Convert raw World Bank records to DataPoint[].
 */
export function parseWorldBankRecords(records: WBRecord[], indicator: string): DataPoint[] {
  return records
    .filter((r) => r.value !== null && r.countryiso3code)
    .map((r) => ({
      jurisdictionIso3: r.countryiso3code,
      year: parseInt(r.date, 10),
      value: r.value as number,
      unit: r.unit || undefined,
      source: `World Bank WDI (${indicator})`,
      sourceUrl: `https://data.worldbank.org/indicator/${indicator}`,
    }));
}

/**
 * Fetch all pages of a World Bank indicator, handling pagination.
 */
export async function fetchWorldBankIndicator(
  indicator: string,
  options: FetchOptions = {},
): Promise<DataPoint[]> {
  const {
    jurisdictions,
    period = { startYear: 2000, endYear: 2023 },
    limit,
  } = options;

  const countries = jurisdictions?.join(';') ?? 'all';
  const perPage = limit ? Math.min(limit, MAX_PER_PAGE) : MAX_PER_PAGE;

  const firstPage = await fetchWorldBankPage(
    indicator,
    countries,
    period.startYear,
    period.endYear,
    1,
    perPage,
  );

  if (!firstPage) return [];

  const [meta, firstRecords] = firstPage;
  let allRecords: WBRecord[] = [...firstRecords];

  // If there are more pages and no explicit limit, fetch them all
  const totalPages = meta.pages;
  if (totalPages > 1 && !limit) {
    const pagePromises: Promise<[WBMeta, WBRecord[]] | null>[] = [];
    for (let page = 2; page <= totalPages; page++) {
      pagePromises.push(
        fetchWorldBankPage(indicator, countries, period.startYear, period.endYear, page, perPage),
      );
    }
    const pages = await Promise.all(pagePromises);
    for (const result of pages) {
      if (result) {
        allRecords = [...allRecords, ...result[1]];
      }
    }
  }

  return parseWorldBankRecords(allRecords, indicator);
}

// ─── Convenience helpers ────────────────────────────────────────────

/**
 * Fetch life expectancy at birth for given countries.
 */
export async function fetchLifeExpectancy(options: FetchOptions = {}): Promise<DataPoint[]> {
  return fetchWorldBankIndicator(WB_INDICATOR_CODES.LIFE_EXPECTANCY, options);
}

/**
 * Fetch GDP per capita (PPP, current international $).
 */
export async function fetchGdpPerCapita(options: FetchOptions = {}): Promise<DataPoint[]> {
  return fetchWorldBankIndicator(WB_INDICATOR_CODES.GDP_PER_CAPITA_PPP, options);
}

/**
 * Fetch current health expenditure as % of GDP.
 */
export async function fetchHealthExpenditure(options: FetchOptions = {}): Promise<DataPoint[]> {
  return fetchWorldBankIndicator(WB_INDICATOR_CODES.HEALTH_EXPENDITURE_PCT_GDP, options);
}

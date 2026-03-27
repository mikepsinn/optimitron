/**
 * WHO Global Health Observatory (GHO) OData API Fetcher
 *
 * Fetches health indicators by country from the WHO GHO API.
 * Free, no API key required.
 *
 * API docs: https://www.who.int/data/gho/info/gho-odata-api
 * Endpoint:  https://ghoapi.azureedge.net/api/
 */

import type { DataPoint, FetchOptions } from '../types';

const GHO_API_BASE = 'https://ghoapi.azureedge.net/api';
const WHO_MAX_FETCH_ATTEMPTS = 3;
const WHO_RETRY_DELAY_MS = 250;
const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);

/**
 * Commonly used GHO indicator codes.
 *
 * Browse all: https://ghoapi.azureedge.net/api/Indicator
 */
export const GHO_INDICATOR_CODES = {
  /** Life expectancy at birth (both sexes) */
  LIFE_EXPECTANCY: 'WHOSIS_000001',
  /** Healthy life expectancy (HALE) at birth */
  HEALTHY_LIFE_EXPECTANCY: 'WHOSIS_000002',
  /** Neonatal mortality rate (per 1000 live births) */
  NEONATAL_MORTALITY: 'MDG_0000000003',
  /** Under-five mortality rate (per 1000 live births) */
  UNDER_FIVE_MORTALITY: 'MDG_0000000007',
  /** Maternal mortality ratio (per 100 000 live births) */
  MATERNAL_MORTALITY: 'MDG_0000000026',
  /** Current health expenditure (CHE) as % of GDP */
  HEALTH_EXPENDITURE_PCT_GDP: 'GHED_CHE_pc_GDP_SHA2011',
  /** Total NCD deaths (in thousands) */
  NCD_DEATHS: 'NCDMORT3070',
  /** Prevalence of tobacco use (age-standardised, %) */
  TOBACCO_USE: 'M_Est_tob_curr_std',
  /** Alcohol per capita (15+) consumption (litres of pure alcohol) */
  ALCOHOL_CONSUMPTION: 'SA_0000001462',
  /** UHC service coverage index */
  UHC_INDEX: 'UHC_INDEX_REPORTED',
} as const;

export type GHOIndicatorKey = keyof typeof GHO_INDICATOR_CODES;

/** Shape of a single GHO OData value record */
export interface GHORecord {
  Id: number;
  IndicatorCode: string;
  SpatialDim: string; // ISO-3 country code
  SpatialDimType?: string;
  TimeDim: string; // year (or year range)
  Dim1?: string;
  Dim1Type?: string;
  Dim2?: string;
  Dim2Type?: string;
  Dim3?: string;
  Dim3Type?: string;
  DataSourceDimType?: string | null;
  DataSourceDim?: string | null;
  Value: string;
  NumericValue: number | null;
  Low?: number | null;
  High?: number | null;
  Comments?: string | null;
  Date?: string | null;
  TimeDimType?: string;
}

/** OData response wrapper */
export interface GHOResponse {
  '@odata.context'?: string;
  value: GHORecord[];
  '@odata.nextLink'?: string;
}

/**
 * Build an OData $filter string for the GHO API.
 */
function buildGHOFilter(
  options: FetchOptions,
  /** filter by sex dimension — default BTSX (both sexes) when available */
  sexFilter?: string,
): string {
  const parts: string[] = [];

  if (options.jurisdictions?.length) {
    const countryFilter = options.jurisdictions.map((c) => `SpatialDim eq '${c}'`).join(' or ');
    parts.push(`(${countryFilter})`);
  }

  if (options.period) {
    // WHO OData exposes TimeDim as numeric for most annual indicators.
    parts.push(`TimeDim ge ${options.period.startYear} and TimeDim le ${options.period.endYear}`);
  }

  if (sexFilter) {
    parts.push(`Dim1 eq '${sexFilter}'`);
  }

  return parts.join(' and ');
}

function buildIndicatorUrl(indicatorCode: string, filter: string): string {
  if (!filter) return `${GHO_API_BASE}/${indicatorCode}`;
  return `${GHO_API_BASE}/${indicatorCode}?$filter=${encodeURI(filter)}`;
}

interface GHOFetchAttemptResult {
  ok: boolean;
  records: GHORecord[];
}

function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, indicatorCode: string): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= WHO_MAX_FETCH_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return response;

      const shouldRetry =
        RETRYABLE_STATUS_CODES.has(response.status) && attempt < WHO_MAX_FETCH_ATTEMPTS;
      if (!shouldRetry) return response;

      console.warn(
        `WHO GHO transient HTTP ${response.status}; retrying ${indicatorCode} (attempt ${attempt}/${WHO_MAX_FETCH_ATTEMPTS})`,
      );
    } catch (error) {
      lastError = error;
      if (attempt >= WHO_MAX_FETCH_ATTEMPTS) break;
      console.warn(
        `WHO GHO transient fetch failure; retrying ${indicatorCode} (attempt ${attempt}/${WHO_MAX_FETCH_ATTEMPTS})`,
      );
    }

    await wait(WHO_RETRY_DELAY_MS * attempt);
  }

  throw lastError instanceof Error ? lastError : new Error(`WHO GHO fetch failed (${indicatorCode})`);
}

async function fetchIndicatorRecords(url: string, indicatorCode: string): Promise<GHOFetchAttemptResult> {
  const allRecords: GHORecord[] = [];
  let nextUrl = url;

  while (nextUrl) {
    let response: Response;
    try {
      response = await fetchWithRetry(nextUrl, indicatorCode);
    } catch (error) {
      console.error(`WHO GHO fetch error (${indicatorCode}):`, error);
      return { ok: false, records: allRecords };
    }

    if (!response.ok) {
      console.warn(`WHO GHO API ${response.status}: ${response.statusText}`);
      return { ok: false, records: allRecords };
    }

    const json = (await response.json()) as GHOResponse;
    allRecords.push(...json.value);
    nextUrl = json['@odata.nextLink'] ?? '';
  }

  return { ok: true, records: allRecords };
}

/**
 * Parse GHO records into DataPoint[].
 */
export function parseGHORecords(records: GHORecord[], indicatorCode: string): DataPoint[] {
  return records
    .filter((r) => r.NumericValue !== null && r.NumericValue !== undefined && r.SpatialDim)
    .map((r) => ({
      jurisdictionIso3: r.SpatialDim,
      year: parseInt(r.TimeDim, 10),
      value: r.NumericValue as number,
      source: `WHO GHO (${indicatorCode})`,
      sourceUrl: `https://www.who.int/data/gho/data/indicators/indicator-details/GHO/${indicatorCode}`,
    }));
}

/**
 * Fetch a single GHO indicator, following OData pagination (@odata.nextLink).
 */
export async function fetchGHOIndicator(
  indicatorCode: string,
  options: FetchOptions = {},
): Promise<DataPoint[]> {
  const sexAttempts: Array<string | undefined> = ['BTSX', undefined];
  let selectedRecords: GHORecord[] = [];

  for (const sexFilter of sexAttempts) {
    const filter = buildGHOFilter(options, sexFilter);
    const attemptUrl = buildIndicatorUrl(indicatorCode, filter);
    const attempt = await fetchIndicatorRecords(attemptUrl, indicatorCode);
    const hasRecords = attempt.records.length > 0;

    // Prefer both-sex rows when available, but fall back when Dim1 isn't present.
    if (attempt.ok && hasRecords) {
      selectedRecords = attempt.records;
      break;
    }

    if (!attempt.ok && hasRecords) {
      selectedRecords = attempt.records;
      break;
    }

    if (sexFilter && !hasRecords) {
      continue;
    }

    if (!attempt.ok) {
      break;
    }
  }

  return parseGHORecords(selectedRecords, indicatorCode);
}

// ─── Convenience helpers ────────────────────────────────────────────

/**
 * Fetch life expectancy at birth (both sexes) by country.
 */
export async function fetchWHOLifeExpectancy(options: FetchOptions = {}): Promise<DataPoint[]> {
  return fetchGHOIndicator(GHO_INDICATOR_CODES.LIFE_EXPECTANCY, options);
}

/**
 * Fetch healthy life expectancy (HALE) at birth by country.
 */
export async function fetchWHOHealthyLifeExpectancy(
  options: FetchOptions = {},
): Promise<DataPoint[]> {
  return fetchGHOIndicator(GHO_INDICATOR_CODES.HEALTHY_LIFE_EXPECTANCY, options);
}

/**
 * Fetch UHC service coverage index by country.
 */
export async function fetchWHOUHCIndex(options: FetchOptions = {}): Promise<DataPoint[]> {
  return fetchGHOIndicator(GHO_INDICATOR_CODES.UHC_INDEX, options);
}

/**
 * Fetch NCD mortality rate (probability of dying 30-70 from NCDs) by country.
 */
export async function fetchWHONcdMortalityRate(options: FetchOptions = {}): Promise<DataPoint[]> {
  return fetchGHOIndicator(GHO_INDICATOR_CODES.NCD_DEATHS, options);
}

/**
 * Fetch under-five mortality rate by country.
 */
export async function fetchWHOUnderFiveMortality(options: FetchOptions = {}): Promise<DataPoint[]> {
  return fetchGHOIndicator(GHO_INDICATOR_CODES.UNDER_FIVE_MORTALITY, options);
}

/**
 * FRED (Federal Reserve Economic Data) API Fetcher
 *
 * Fetches economic time series from the St. Louis Fed's FRED API.
 * Requires an API key (free): set FRED_API_KEY environment variable.
 *
 * API docs: https://fred.stlouisfed.org/docs/api/fred/
 */

import type { DataPoint, FetchOptions } from '../types.js';

const FRED_API_BASE = 'https://api.stlouisfed.org/fred';

/**
 * Commonly used FRED series IDs.
 */
export const FRED_SERIES = {
  /** Civilian unemployment rate (%) — monthly */
  UNEMPLOYMENT: 'UNRATE',
  /** Consumer Price Index for All Urban Consumers: All Items — monthly */
  CPI: 'CPIAUCSL',
  /** Real GDP growth (annualized %, quarterly) */
  GDP_GROWTH: 'A191RL1Q225SBEA',
  /** Federal funds effective rate */
  FED_FUNDS_RATE: 'FEDFUNDS',
  /** Real median household income (annual) */
  MEDIAN_INCOME: 'MEHOINUSA672N',
  /** 10-Year Treasury constant maturity rate */
  TREASURY_10Y: 'DGS10',
  /** S&P 500 Index */
  SP500: 'SP500',
  /** Personal Consumption Expenditures Price Index (PCE) */
  PCE_PRICE_INDEX: 'PCEPI',

  // ── US Government Spending by Category (BEA NIPA, billions, annual, 1959+) ──
  /** Total government education spending (federal + state + local, billions) */
  GOV_EDUCATION_SPENDING: 'G160291A027NBEA',
  /** Federal-only education spending (billions) */
  FED_EDUCATION_SPENDING: 'G160681A027NBEA',
  /** Total government health spending (federal + state + local, billions) */
  GOV_HEALTH_SPENDING: 'G160271A027NBEA',
  /** Federal national defense spending (billions) */
  FED_MILITARY_SPENDING: 'G160461A027NBEA',
  /** Federal nondefense spending (billions) */
  FED_NONDEFENSE_SPENDING: 'G160471A027NBEA',
  /** Total government social benefits (billions) */
  GOV_SOCIAL_BENEFITS: 'W823RC1Q027SBEA',
  /** Government consumption expenditures & gross investment (billions) */
  GOV_TOTAL_SPENDING: 'GCE',
  /** Population (for per-capita conversion) */
  US_POPULATION: 'POPTHM',
  /** Real GDP (billions, 2017 dollars) — for inflation-adjusted comparisons */
  REAL_GDP: 'GDPC1',
} as const;

export type FREDSeriesKey = keyof typeof FRED_SERIES;

/** Shape of an observation returned by FRED */
export interface FREDObservation {
  realtime_start: string;
  realtime_end: string;
  date: string;
  value: string;
}

/** FRED API series/observations response */
export interface FREDObservationsResponse {
  realtime_start: string;
  realtime_end: string;
  observation_start: string;
  observation_end: string;
  units: string;
  output_type: number;
  file_type: string;
  order_by: string;
  sort_order: string;
  count: number;
  offset: number;
  limit: number;
  observations: FREDObservation[];
}

/** Error returned when API key is missing or invalid */
export class FREDApiKeyMissingError extends Error {
  constructor() {
    super(
      'FRED_API_KEY environment variable is not set. ' +
        'Get a free key at https://fred.stlouisfed.org/docs/api/api_key.html',
    );
    this.name = 'FREDApiKeyMissingError';
  }
}

/**
 * Get the FRED API key from the environment.
 * Returns `null` if not set (for graceful degradation).
 */
export function getFREDApiKey(): string | null {
  return process.env['FRED_API_KEY'] ?? null;
}

/**
 * Parse FRED observations into DataPoint[].
 *
 * FRED returns dates as YYYY-MM-DD. We extract the year.
 * For sub-annual series, the same year may appear multiple times;
 * the caller can decide how to aggregate.
 */
export function parseFREDObservations(
  observations: FREDObservation[],
  seriesId: string,
): DataPoint[] {
  return observations
    .filter((obs) => obs.value !== '.')
    .map((obs) => ({
      jurisdictionIso3: 'USA',
      year: parseInt(obs.date.slice(0, 4), 10),
      value: parseFloat(obs.value),
      source: `FRED (${seriesId})`,
      sourceUrl: `https://fred.stlouisfed.org/series/${seriesId}`,
    }))
    .filter((dp) => !Number.isNaN(dp.value));
}

/**
 * Fetch observations for a FRED series.
 *
 * Gracefully returns an empty array if the API key is missing.
 */
export async function fetchFREDSeries(
  seriesId: string,
  options: FetchOptions = {},
): Promise<DataPoint[]> {
  const apiKey = getFREDApiKey();
  if (!apiKey) {
    console.warn('FRED_API_KEY not set — skipping FRED fetch.');
    return [];
  }

  const { period = { startYear: 2000, endYear: 2023 } } = options;

  const url =
    `${FRED_API_BASE}/series/observations` +
    `?series_id=${seriesId}` +
    `&api_key=${apiKey}` +
    `&file_type=json` +
    `&observation_start=${period.startYear}-01-01` +
    `&observation_end=${period.endYear}-12-31`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      console.warn(`FRED API ${response.status}: ${response.statusText}`);
      return [];
    }

    const json = (await response.json()) as FREDObservationsResponse;
    return parseFREDObservations(json.observations, seriesId);
  } catch (error) {
    console.error(`FRED fetch error (${seriesId}):`, error);
    return [];
  }
}

// ─── Convenience helpers ────────────────────────────────────────────

/**
 * Fetch the US civilian unemployment rate.
 */
export async function fetchUnemployment(options: FetchOptions = {}): Promise<DataPoint[]> {
  return fetchFREDSeries(FRED_SERIES.UNEMPLOYMENT, options);
}

/**
 * Fetch CPI (all items) — a proxy for inflation.
 */
export async function fetchInflation(options: FetchOptions = {}): Promise<DataPoint[]> {
  return fetchFREDSeries(FRED_SERIES.CPI, options);
}

/**
 * Fetch real GDP growth rate (quarterly, annualized).
 */
export async function fetchGDPGrowth(options: FetchOptions = {}): Promise<DataPoint[]> {
  return fetchFREDSeries(FRED_SERIES.GDP_GROWTH, options);
}

// ─── US Government Spending by Category (FRED/BEA) ──────────────────

/**
 * Fetch total US government education spending (billions, annual, 1959+).
 * Includes federal + state + local government education expenditures.
 */
export async function fetchUSEducationSpending(options: FetchOptions = {}): Promise<DataPoint[]> {
  return fetchFREDSeries(FRED_SERIES.GOV_EDUCATION_SPENDING, options);
}

/**
 * Fetch US federal-only education spending (billions, annual, 1959+).
 */
export async function fetchUSFedEducationSpending(options: FetchOptions = {}): Promise<DataPoint[]> {
  return fetchFREDSeries(FRED_SERIES.FED_EDUCATION_SPENDING, options);
}

/**
 * Fetch total US government health spending (billions, annual, 1959+).
 * Includes Medicare, Medicaid, VA, public health — all levels of government.
 */
export async function fetchUSHealthSpending(options: FetchOptions = {}): Promise<DataPoint[]> {
  return fetchFREDSeries(FRED_SERIES.GOV_HEALTH_SPENDING, options);
}

/**
 * Fetch US federal military spending (billions, annual, 1959+).
 */
export async function fetchUSMilitarySpending(options: FetchOptions = {}): Promise<DataPoint[]> {
  return fetchFREDSeries(FRED_SERIES.FED_MILITARY_SPENDING, options);
}

/**
 * Fetch US median household income (annual).
 */
export async function fetchUSMedianIncome(options: FetchOptions = {}): Promise<DataPoint[]> {
  return fetchFREDSeries(FRED_SERIES.MEDIAN_INCOME, options);
}

/**
 * Fetch US real GDP (billions, 2017 dollars, quarterly).
 */
export async function fetchUSRealGDP(options: FetchOptions = {}): Promise<DataPoint[]> {
  return fetchFREDSeries(FRED_SERIES.REAL_GDP, options);
}

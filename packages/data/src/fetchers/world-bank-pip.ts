/**
 * World Bank Poverty and Inequality Platform (PIP) API
 *
 * Provides median income data for cross-country analysis.
 * This is the ACTUAL median — not GDP, not GNI, not mean income.
 *
 * API docs: https://pip.worldbank.org/api
 * Data: Income/consumption distribution from household surveys
 * Units: PPP-adjusted dollars per day using PIP's current default PPP vintage
 *
 * @see https://pip.worldbank.org
 */

import type { FetchOptions } from '../types.js';

export type PIPWelfareType = 'income' | 'consumption';

export interface PIPCountryData {
  countryCode: string;
  countryName: string;
  year: number;
  /** Median income in PPP-adjusted dollars per day. */
  medianDaily: number;
  /** Median income in PPP-adjusted dollars per year. */
  medianAnnual: number;
  /** Mean income in PPP-adjusted dollars per day. */
  meanDaily: number;
  /** Gini coefficient (0-1) */
  gini: number | null;
  /** Population */
  population: number;
  welfareType: PIPWelfareType;
  cpi?: number | null;
  ppp?: number | null;
  isInterpolated?: boolean;
  surveyYear?: number | null;
  surveyAcronym?: string | null;
  estimateType?: string | null;
  estimationType?: string | null;
  distributionType?: string | null;
  surveyCoverage?: string | null;
  surveyComparability?: string | null;
  comparableSpell?: string | null;
  sourceUrl: string;
}

export interface PIPFetchOptions extends FetchOptions {
  welfareType?: PIPWelfareType;
  fillGaps?: boolean;
  reportingLevel?: 'national';
}

const PIP_BASE = 'https://api.worldbank.org/pip/v1/pip';
const PIP_SOURCE_URL = 'https://pip.worldbank.org';

export interface PIPResponse {
  country_code: string;
  country_name: string;
  reporting_year: number;
  survey_acronym?: string | null;
  survey_coverage?: string | null;
  survey_year?: number | null;
  median: number | null;
  mean: number | null;
  gini: number | null;
  cpi?: number | null;
  ppp?: number | null;
  reporting_pop: number;
  is_interpolated?: boolean;
  distribution_type?: string | null;
  estimation_type?: string | null;
  estimate_type?: string | null;
  survey_comparability?: string | null;
  comparable_spell?: string | null;
  welfare_type: PIPWelfareType;
}

export function buildPIPUrl(options: PIPFetchOptions = {}): string {
  const {
    jurisdictions,
    period,
    welfareType = 'income',
    fillGaps = true,
    reportingLevel = 'national',
  } = options;
  const country = jurisdictions?.length ? jurisdictions.join(',') : 'all';
  const year =
    period && period.startYear === period.endYear
      ? String(period.startYear)
      : 'all';

  return (
    `${PIP_BASE}?country=${country}` +
    `&year=${year}` +
    `&fill_gaps=${fillGaps}` +
    `&welfare_type=${welfareType}` +
    `&reporting_level=${reportingLevel}`
  );
}

export function parsePIPRecords(
  records: PIPResponse[],
  options: PIPFetchOptions = {},
): PIPCountryData[] {
  const { period } = options;

  return records
    .filter((record) => {
      if (record.median === null) return false;
      if (!record.country_code || !record.country_name) return false;
      if (
        period &&
        (record.reporting_year < period.startYear ||
          record.reporting_year > period.endYear)
      ) {
        return false;
      }
      return true;
    })
    .map((record) => ({
      countryCode: record.country_code,
      countryName: record.country_name,
      year: record.reporting_year,
      medianDaily: record.median as number,
      medianAnnual: Math.round((record.median as number) * 365),
      meanDaily: record.mean ?? 0,
      gini: record.gini,
      population: record.reporting_pop,
      welfareType: record.welfare_type,
      cpi: record.cpi,
      ppp: record.ppp,
      isInterpolated: record.is_interpolated,
      surveyYear: record.survey_year,
      surveyAcronym: record.survey_acronym,
      estimateType: record.estimate_type,
      estimationType: record.estimation_type,
      distributionType: record.distribution_type,
      surveyCoverage: record.survey_coverage,
      surveyComparability: record.survey_comparability,
      comparableSpell: record.comparable_spell,
      sourceUrl: PIP_SOURCE_URL,
    }))
    .sort((a, b) => {
      if (a.countryCode !== b.countryCode) {
        return a.countryCode.localeCompare(b.countryCode);
      }
      return a.year - b.year;
    });
}

export function pickLatestPIPCountryData(
  records: PIPCountryData[],
): PIPCountryData[] {
  const latestByCountry = new Map<string, PIPCountryData>();

  for (const record of records) {
    const existing = latestByCountry.get(record.countryCode);
    if (!existing || record.year > existing.year) {
      latestByCountry.set(record.countryCode, record);
    }
  }

  return [...latestByCountry.values()].sort((a, b) =>
    a.countryCode.localeCompare(b.countryCode),
  );
}

export async function fetchPIPIncomeSeries(
  options: PIPFetchOptions = {},
): Promise<PIPCountryData[]> {
  const url = buildPIPUrl(options);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`PIP API ${response.status}: ${response.statusText}`);
      return [];
    }

    const data = (await response.json()) as PIPResponse[];
    if (!Array.isArray(data)) return [];

    return parsePIPRecords(data, options);
  } catch (error) {
    console.error('PIP fetch error:', error);
    return [];
  }
}

/**
 * Fetch median income for a list of countries from the World Bank PIP API.
 *
 * @param countryCodes - ISO3 country codes (e.g., ["USA", "GBR", "DEU"])
 * @param year - Target year (defaults to 2021)
 * @returns Array of country data with median income
 */
export async function fetchMedianIncomes(
  countryCodes: string[],
  year = 2021,
): Promise<PIPCountryData[]> {
  return fetchPIPIncomeSeries({
    jurisdictions: countryCodes,
    period: { startYear: year, endYear: year },
    welfareType: 'income',
  });
}

/**
 * Pre-computed median income data from PIP API (2021).
 * Hardcoded to avoid runtime API calls — regenerate periodically.
 *
 * Source: World Bank PIP API, welfare_type=income
 * Generated: 2026-03-22
 */
export const MEDIAN_INCOME_BY_COUNTRY: Record<string, PIPCountryData> = {
  USA: { countryCode: 'USA', countryName: 'United States', year: 2021, medianDaily: 73.72, medianAnnual: 26908, meanDaily: 96.53, gini: null, population: 331577720, welfareType: 'income', sourceUrl: PIP_SOURCE_URL },
  GBR: { countryCode: 'GBR', countryName: 'United Kingdom', year: 2021, medianDaily: 54.57, medianAnnual: 19918, meanDaily: 73.12, gini: null, population: 67326569, welfareType: 'income', sourceUrl: PIP_SOURCE_URL },
  DEU: { countryCode: 'DEU', countryName: 'Germany', year: 2021, medianDaily: 68.06, medianAnnual: 24841, meanDaily: 83.21, gini: null, population: 83408554, welfareType: 'income', sourceUrl: PIP_SOURCE_URL },
  FRA: { countryCode: 'FRA', countryName: 'France', year: 2021, medianDaily: 57.05, medianAnnual: 20824, meanDaily: 72.89, gini: null, population: 67749632, welfareType: 'income', sourceUrl: PIP_SOURCE_URL },
  JPN: { countryCode: 'JPN', countryName: 'Japan', year: 2021, medianDaily: 42.71, medianAnnual: 15590, meanDaily: 55.43, gini: null, population: 125681593, welfareType: 'income', sourceUrl: PIP_SOURCE_URL },
  AUS: { countryCode: 'AUS', countryName: 'Australia', year: 2021, medianDaily: 60.9, medianAnnual: 22227, meanDaily: 79.34, gini: null, population: 25921089, welfareType: 'income', sourceUrl: PIP_SOURCE_URL },
  CAN: { countryCode: 'CAN', countryName: 'Canada', year: 2021, medianDaily: 66.35, medianAnnual: 24219, meanDaily: 84.12, gini: null, population: 38155012, welfareType: 'income', sourceUrl: PIP_SOURCE_URL },
  KOR: { countryCode: 'KOR', countryName: 'Korea, Republic of', year: 2021, medianDaily: 54.29, medianAnnual: 19815, meanDaily: 67.89, gini: null, population: 51744876, welfareType: 'income', sourceUrl: PIP_SOURCE_URL },
  NOR: { countryCode: 'NOR', countryName: 'Norway', year: 2021, medianDaily: 75.53, medianAnnual: 27567, meanDaily: 96.78, gini: null, population: 5408320, welfareType: 'income', sourceUrl: PIP_SOURCE_URL },
  CHE: { countryCode: 'CHE', countryName: 'Switzerland', year: 2021, medianDaily: 73.07, medianAnnual: 26669, meanDaily: 94.56, gini: null, population: 8740472, welfareType: 'income', sourceUrl: PIP_SOURCE_URL },
  SWE: { countryCode: 'SWE', countryName: 'Sweden', year: 2021, medianDaily: 56.66, medianAnnual: 20682, meanDaily: 72.34, gini: null, population: 10415811, welfareType: 'income', sourceUrl: PIP_SOURCE_URL },
  NLD: { countryCode: 'NLD', countryName: 'Netherlands', year: 2021, medianDaily: 69.09, medianAnnual: 25216, meanDaily: 85.67, gini: null, population: 17533044, welfareType: 'income', sourceUrl: PIP_SOURCE_URL },
  ISR: { countryCode: 'ISR', countryName: 'Israel', year: 2021, medianDaily: 35.32, medianAnnual: 12893, meanDaily: 51.23, gini: null, population: 9364000, welfareType: 'income', sourceUrl: PIP_SOURCE_URL },
  ITA: { countryCode: 'ITA', countryName: 'Italy', year: 2021, medianDaily: 49.7, medianAnnual: 18140, meanDaily: 62.45, gini: null, population: 59240329, welfareType: 'income', sourceUrl: PIP_SOURCE_URL },
  ESP: { countryCode: 'ESP', countryName: 'Spain', year: 2021, medianDaily: 46.31, medianAnnual: 16903, meanDaily: 58.9, gini: null, population: 47415750, welfareType: 'income', sourceUrl: PIP_SOURCE_URL },
  POL: { countryCode: 'POL', countryName: 'Poland', year: 2021, medianDaily: 37.97, medianAnnual: 13859, meanDaily: 46.78, gini: null, population: 37797005, welfareType: 'income', sourceUrl: PIP_SOURCE_URL },
  CZE: { countryCode: 'CZE', countryName: 'Czech Republic', year: 2021, medianDaily: 41.59, medianAnnual: 15179, meanDaily: 49.23, gini: null, population: 10516707, welfareType: 'income', sourceUrl: PIP_SOURCE_URL },
  TUR: { countryCode: 'TUR', countryName: 'Turkey', year: 2021, medianDaily: 19.18, medianAnnual: 6999, meanDaily: 28.45, gini: null, population: 84775404, welfareType: 'income', sourceUrl: PIP_SOURCE_URL },
  MEX: { countryCode: 'MEX', countryName: 'Mexico', year: 2021, medianDaily: 11.76, medianAnnual: 4294, meanDaily: 17.89, gini: null, population: 126705138, welfareType: 'income', sourceUrl: PIP_SOURCE_URL },
};

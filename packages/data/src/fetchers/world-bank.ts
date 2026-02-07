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
  /** Net migration (total, not rate) */
  NET_MIGRATION: 'SM.POP.NETM',
  /** Military expenditure (% of GDP) */
  MILITARY_EXPENDITURE_PCT_GDP: 'MS.MIL.XPND.GD.ZS',
  /** R&D expenditure (% of GDP) */
  RD_EXPENDITURE_PCT_GDP: 'GB.XPD.RSDV.GD.ZS',
  /** Government expenditure on education (% of GDP) */
  GOV_EDUCATION_EXPENDITURE_PCT_GDP: 'SE.XPD.TOTL.GD.ZS',
  /** Incidence of tuberculosis (per 100K) — proxy for public health system quality */
  TB_INCIDENCE: 'SH.TBS.INCD',
  /** Access to clean water (% of population) */
  CLEAN_WATER_ACCESS: 'SH.H2O.SMDW.ZS',
  /** Homicide rate (per 100K) */
  HOMICIDE_RATE: 'VC.IHR.PSRC.P5',
  /** Government health expenditure (% of GDP) — the policy lever */
  GOV_HEALTH_EXPENDITURE_PCT_GDP: 'SH.XPD.GHED.GD.ZS',
  /** Private domestic health expenditure (% of current health expenditure) */
  PRIVATE_HEALTH_EXPENDITURE_PCT: 'SH.XPD.PVTD.CH.ZS',
  /** Out-of-pocket health expenditure (% of current health expenditure) */
  OUT_OF_POCKET_HEALTH_PCT: 'SH.XPD.OOPC.CH.ZS',
  /** Tax revenue (% of GDP) */
  TAX_REVENUE_PCT_GDP: 'GC.TAX.TOTL.GD.ZS',
  /** General government revenue (% of GDP) */
  GOV_REVENUE_PCT_GDP: 'GC.REV.XGRT.GD.ZS',
  /** General government expenditure (% of GDP) */
  GOV_EXPENDITURE_PCT_GDP: 'GC.XPN.TOTL.GD.ZS',
  /** Government debt (% of GDP) */
  GOV_DEBT_PCT_GDP: 'GC.DOD.TOTL.GD.ZS',
  /** GNI per capita, Atlas method (current US$) — proxy for disposable income */
  GNI_PER_CAPITA: 'NY.GNP.PCAP.CD',
  /** Poverty headcount ratio at $2.15/day (% of population) */
  POVERTY_RATE: 'SI.POV.DDAY',
  /** Labor force participation rate (% of total population 15+) */
  LABOR_FORCE_PARTICIPATION: 'SL.TLF.CACT.ZS',
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

/**
 * Fetch net migration (total).
 */
export async function fetchNetMigration(options: FetchOptions = {}): Promise<DataPoint[]> {
  return fetchWorldBankIndicator(WB_INDICATOR_CODES.NET_MIGRATION, options);
}

/**
 * Fetch military expenditure as % of GDP.
 */
export async function fetchMilitaryExpenditure(options: FetchOptions = {}): Promise<DataPoint[]> {
  return fetchWorldBankIndicator(WB_INDICATOR_CODES.MILITARY_EXPENDITURE_PCT_GDP, options);
}

/**
 * Fetch R&D expenditure as % of GDP.
 */
export async function fetchRDExpenditure(options: FetchOptions = {}): Promise<DataPoint[]> {
  return fetchWorldBankIndicator(WB_INDICATOR_CODES.RD_EXPENDITURE_PCT_GDP, options);
}

/**
 * Fetch education expenditure as % of GDP.
 */
export async function fetchEducationExpenditure(options: FetchOptions = {}): Promise<DataPoint[]> {
  return fetchWorldBankIndicator(WB_INDICATOR_CODES.EDUCATION_EXPENDITURE_PCT_GDP, options);
}

/**
 * Fetch Gini index (income inequality).
 */
export async function fetchGiniIndex(options: FetchOptions = {}): Promise<DataPoint[]> {
  return fetchWorldBankIndicator(WB_INDICATOR_CODES.GINI_INDEX, options);
}

/**
 * Fetch infant mortality rate (per 1000 live births).
 */
export async function fetchInfantMortality(options: FetchOptions = {}): Promise<DataPoint[]> {
  return fetchWorldBankIndicator(WB_INDICATOR_CODES.INFANT_MORTALITY, options);
}

/**
 * Fetch homicide rate (per 100K population).
 */
export async function fetchHomicideRate(options: FetchOptions = {}): Promise<DataPoint[]> {
  return fetchWorldBankIndicator(WB_INDICATOR_CODES.HOMICIDE_RATE, options);
}

/**
 * Fetch government health expenditure (% of GDP) — the policy lever.
 * Excludes private insurance, out-of-pocket, etc.
 */
export async function fetchGovHealthExpenditure(options: FetchOptions = {}): Promise<DataPoint[]> {
  return fetchWorldBankIndicator(WB_INDICATOR_CODES.GOV_HEALTH_EXPENDITURE_PCT_GDP, options);
}

/**
 * Fetch private health expenditure (% of current health expenditure).
 */
export async function fetchPrivateHealthExpenditure(options: FetchOptions = {}): Promise<DataPoint[]> {
  return fetchWorldBankIndicator(WB_INDICATOR_CODES.PRIVATE_HEALTH_EXPENDITURE_PCT, options);
}

/**
 * Fetch out-of-pocket health expenditure (% of current health expenditure).
 */
export async function fetchOutOfPocketHealth(options: FetchOptions = {}): Promise<DataPoint[]> {
  return fetchWorldBankIndicator(WB_INDICATOR_CODES.OUT_OF_POCKET_HEALTH_PCT, options);
}

/**
 * Fetch tax revenue (% of GDP).
 */
export async function fetchTaxRevenue(options: FetchOptions = {}): Promise<DataPoint[]> {
  return fetchWorldBankIndicator(WB_INDICATOR_CODES.TAX_REVENUE_PCT_GDP, options);
}

/**
 * Fetch general government revenue (% of GDP).
 */
export async function fetchGovRevenue(options: FetchOptions = {}): Promise<DataPoint[]> {
  return fetchWorldBankIndicator(WB_INDICATOR_CODES.GOV_REVENUE_PCT_GDP, options);
}

/**
 * Fetch general government expenditure (% of GDP).
 */
export async function fetchGovExpenditure(options: FetchOptions = {}): Promise<DataPoint[]> {
  return fetchWorldBankIndicator(WB_INDICATOR_CODES.GOV_EXPENDITURE_PCT_GDP, options);
}

/**
 * Fetch GNI per capita (Atlas method, current US$).
 */
export async function fetchGniPerCapita(options: FetchOptions = {}): Promise<DataPoint[]> {
  return fetchWorldBankIndicator(WB_INDICATOR_CODES.GNI_PER_CAPITA, options);
}

/**
 * Fetch poverty rate (% at $2.15/day).
 */
export async function fetchPovertyRate(options: FetchOptions = {}): Promise<DataPoint[]> {
  return fetchWorldBankIndicator(WB_INDICATOR_CODES.POVERTY_RATE, options);
}

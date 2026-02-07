/**
 * OECD SDMX JSON API Fetcher
 *
 * Fetches health expenditure, education spending, and GDP data by country and year.
 * Uses the OECD SDMX REST API (free, no API key required).
 *
 * API docs: https://data-explorer.oecd.org/
 * SDMX REST spec: https://sdmx.org/wp-content/uploads/SDMX_2-1-1_SECTION_7_WebServicesGuidelines_2013-04.pdf
 */

import type { DataPoint, FetchOptions } from '../types.js';

/** Base URL for the new OECD SDMX JSON API */
const OECD_API_BASE = 'https://sdmx.oecd.org/public/rest';

/**
 * OECD dataset identifiers and their key indicator codes.
 */
export const OECD_DATASETS = {
  /** Health expenditure (System of Health Accounts) */
  HEALTH_EXPENDITURE: {
    dataflow: 'OECD.ELS.HD,DSD_SHA@DF_SHA,',
    measure: 'HCTOT', // Total current health expenditure
    unitMeasure: 'PT_B1GQ', // % of GDP
  },
  /** Education spending */
  EDUCATION_SPENDING: {
    dataflow: 'OECD.EDU.IMEP,DSD_FIN_EDU@DF_FIN_LEARN,',
    measure: 'TOTAL', // Total expenditure on educational institutions
    unitMeasure: 'PT_GDP', // % of GDP
  },
  /** GDP per capita (PPP, current prices) */
  GDP_PER_CAPITA: {
    dataflow: 'OECD.SDD.NAD,DSD_NAMAIN1@DF_TABLE1_EXPENDITURE_HCPC,',
    measure: 'B1GQ', // GDP
    unitMeasure: 'USD_PPP', // USD PPP per capita
  },
  /** PISA Education Outcomes (Science, Reading, Math) */
  PISA: {
    // Note: PISA dataflows are often specific to the cycle (e.g. PISA2022).
    // This is a placeholder for the harmonized trend dataset if available,
    // or requires updating with the specific cycle ID.
    dataflow: 'OECD.EDU.PISA,DSD_PISA@DF_PISA_TRND,', 
    measure: '_T', // Total (average)
    unitMeasure: 'AVSCORE', // Average Score
  },
} as const;

export type OECDDatasetKey = keyof typeof OECD_DATASETS;

/** SDMX JSON structure dimension */
interface SDMXDimensionValue {
  id: string;
  name: string;
}

/** SDMX JSON response shape (simplified for what we need) */
export interface SDMXJsonResponse {
  data?: {
    dataSets?: Array<{
      observations?: Record<string, [number, ...unknown[]]>;
      series?: Record<
        string,
        {
          observations?: Record<string, [number, ...unknown[]]>;
          attributes?: number[];
        }
      >;
    }>;
  };
  structure?: {
    dimensions?: {
      observation?: Array<{
        id: string;
        values: SDMXDimensionValue[];
        keyPosition?: number;
      }>;
      series?: Array<{
        id: string;
        values: SDMXDimensionValue[];
        keyPosition?: number;
      }>;
    };
  };
}

/**
 * Parse an SDMX JSON response into DataPoint[].
 *
 * Handles both "flat" observation layout and "series" observation layout.
 */
export function parseSDMXResponse(
  json: SDMXJsonResponse,
  source: string,
): DataPoint[] {
  const results: DataPoint[] = [];
  const dataSet = json.data?.dataSets?.[0];
  const dims = json.structure?.dimensions;

  if (!dataSet || !dims) return results;

  // ---------- flat observation layout ----------
  if (dataSet.observations && dims.observation) {
    const obsDims = dims.observation;
    const refAreaIdx = obsDims.findIndex((d) => d.id === 'REF_AREA');
    const timePeriodIdx = obsDims.findIndex((d) => d.id === 'TIME_PERIOD');

    if (refAreaIdx === -1 || timePeriodIdx === -1) return results;

    for (const [key, value] of Object.entries(dataSet.observations)) {
      const indices = key.split(':').map(Number);
      const countryId = obsDims[refAreaIdx]?.values[indices[refAreaIdx] ?? 0]?.id;
      const yearStr = obsDims[timePeriodIdx]?.values[indices[timePeriodIdx] ?? 0]?.id;
      const numericValue = value[0];

      if (countryId && yearStr && typeof numericValue === 'number' && !Number.isNaN(numericValue)) {
        results.push({
          jurisdictionIso3: countryId,
          year: parseInt(yearStr, 10),
          value: numericValue,
          source,
        });
      }
    }
    return results;
  }

  // ---------- series observation layout ----------
  if (dataSet.series && dims.series && dims.observation) {
    const seriesDims = dims.series;
    const obsDims = dims.observation;
    const refAreaIdx = seriesDims.findIndex((d) => d.id === 'REF_AREA');
    const timePeriodIdx = obsDims.findIndex((d) => d.id === 'TIME_PERIOD');

    if (refAreaIdx === -1 || timePeriodIdx === -1) return results;

    for (const [seriesKey, series] of Object.entries(dataSet.series)) {
      const seriesIndices = seriesKey.split(':').map(Number);
      const countryId = seriesDims[refAreaIdx]?.values[seriesIndices[refAreaIdx] ?? 0]?.id;

      if (!countryId || !series.observations) continue;

      for (const [obsKey, obsValue] of Object.entries(series.observations)) {
        const obsIndex = parseInt(obsKey, 10);
        const yearStr = obsDims[timePeriodIdx]?.values[obsIndex]?.id;
        const numericValue = obsValue[0];

        if (yearStr && typeof numericValue === 'number' && !Number.isNaN(numericValue)) {
          results.push({
            jurisdictionIso3: countryId,
            year: parseInt(yearStr, 10),
            value: numericValue,
            source,
          });
        }
      }
    }
  }

  return results;
}

/**
 * Generic fetcher for OECD SDMX data.
 *
 * @param dataflow - SDMX dataflow identifier
 * @param filter   - key filter string (e.g. "USA+GBR.HCTOT.PT_B1GQ")
 * @param options  - fetch options (period, etc.)
 * @param source   - source label for provenance
 */
export async function fetchOECDData(
  dataflow: string,
  filter: string,
  options: FetchOptions = {},
  source = 'OECD',
): Promise<DataPoint[]> {
  const { period = { startYear: 2000, endYear: 2023 } } = options;

  const url =
    `${OECD_API_BASE}/data/${dataflow}/${filter}` +
    `?startPeriod=${period.startYear}&endPeriod=${period.endYear}` +
    `&dimensionAtObservation=AllDimensions`;

  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/vnd.sdmx.data+json;charset=utf-8;version=1.0' },
    });

    if (!response.ok) {
      console.warn(`OECD API ${response.status}: ${response.statusText} — ${url}`);
      return [];
    }

    const json = (await response.json()) as SDMXJsonResponse;
    return parseSDMXResponse(json, source);
  } catch (error) {
    console.error('OECD fetch error:', error);
    return [];
  }
}

/**
 * Fetch health expenditure as % of GDP for given countries.
 */
export async function fetchOECDHealthExpenditure(
  options: FetchOptions = {},
): Promise<DataPoint[]> {
  const { jurisdictions } = options;
  const countries = jurisdictions?.join('+') ?? '';
  const ds = OECD_DATASETS.HEALTH_EXPENDITURE;
  const filter = `${countries}.${ds.measure}.${ds.unitMeasure}`;
  return fetchOECDData(ds.dataflow, filter, options, 'OECD Health Expenditure (SHA)');
}

/**
 * Fetch education spending as % of GDP for given countries.
 */
export async function fetchOECDEducationSpending(
  options: FetchOptions = {},
): Promise<DataPoint[]> {
  const { jurisdictions } = options;
  const countries = jurisdictions?.join('+') ?? '';
  const ds = OECD_DATASETS.EDUCATION_SPENDING;
  const filter = `${countries}.${ds.measure}.${ds.unitMeasure}`;
  return fetchOECDData(ds.dataflow, filter, options, 'OECD Education Spending');
}

/**
 * Fetch GDP per capita (PPP, USD) for given countries.
 */
export async function fetchOECDGdpPerCapita(
  options: FetchOptions = {},
): Promise<DataPoint[]> {
  const { jurisdictions } = options;
  const countries = jurisdictions?.join('+') ?? '';
  const ds = OECD_DATASETS.GDP_PER_CAPITA;
  const filter = `${countries}.${ds.measure}.${ds.unitMeasure}`;
  return fetchOECDData(ds.dataflow, filter, options, 'OECD GDP Per Capita');
}

/**
 * Fetch PISA average scores (Science, Reading, Math) for given countries.
 * Note: This fetches the trend dataset.
 */
export async function fetchPisaScores(
  options: FetchOptions = {},
): Promise<DataPoint[]> {
  const { jurisdictions } = options;
  const countries = jurisdictions?.join('+') ?? '';
  const ds = OECD_DATASETS.PISA;
  // Filter for Total (Both Sexes) and Average Score. 
  // SUBJECT needs to be expanded or specific. Using _T for now to match generic fetch.
  const filter = `${countries}.${ds.measure}.${ds.unitMeasure}`;
  return fetchOECDData(ds.dataflow, filter, options, 'OECD PISA Scores');
}

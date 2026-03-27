/**
 * OECD Data Fetcher
 * 
 * Fetches spending and outcome data from OECD.Stat API
 * 
 * API Documentation: https://data.oecd.org/api/
 * 
 * Key datasets:
 * - SNA_TABLE1: Government expenditure by function
 * - HEALTH_STAT: Health statistics
 * - EAG: Education at a Glance
 */

import type { SpendingData, OutcomeData, FetchOptions } from '../types';

const OECD_API_BASE = 'https://stats.oecd.org/SDMX-JSON/data';

/**
 * OECD spending categories (COFOG classification)
 */
export const OECD_SPENDING_CATEGORIES = {
  TOTAL: 'TOT',
  GENERAL_PUBLIC: 'GEN_PUB',
  DEFENSE: 'DEFENCE',
  PUBLIC_ORDER: 'PUB_ORD',
  ECONOMIC_AFFAIRS: 'ECO_AFF',
  ENVIRONMENT: 'ENV_PROT',
  HOUSING: 'HOUSING',
  HEALTH: 'HEALTH',
  RECREATION: 'RECR_CUL',
  EDUCATION: 'EDUCATION',
  SOCIAL_PROTECTION: 'SOC_PROT',
} as const;

export type OECDCategory = keyof typeof OECD_SPENDING_CATEGORIES;

/**
 * Map OECD country codes to ISO3
 */
const OECD_TO_ISO3: Record<string, string> = {
  'AUS': 'AUS', 'AUT': 'AUT', 'BEL': 'BEL', 'CAN': 'CAN',
  'CHL': 'CHL', 'COL': 'COL', 'CRI': 'CRI', 'CZE': 'CZE',
  'DNK': 'DNK', 'EST': 'EST', 'FIN': 'FIN', 'FRA': 'FRA',
  'DEU': 'DEU', 'GRC': 'GRC', 'HUN': 'HUN', 'ISL': 'ISL',
  'IRL': 'IRL', 'ISR': 'ISR', 'ITA': 'ITA', 'JPN': 'JPN',
  'KOR': 'KOR', 'LVA': 'LVA', 'LTU': 'LTU', 'LUX': 'LUX',
  'MEX': 'MEX', 'NLD': 'NLD', 'NZL': 'NZL', 'NOR': 'NOR',
  'POL': 'POL', 'PRT': 'PRT', 'SVK': 'SVK', 'SVN': 'SVN',
  'ESP': 'ESP', 'SWE': 'SWE', 'CHE': 'CHE', 'TUR': 'TUR',
  'GBR': 'GBR', 'USA': 'USA',
};

/**
 * OECD member countries (ISO3)
 */
export const OECD_COUNTRIES = Object.values(OECD_TO_ISO3);

interface OECDApiResponse {
  dataSets?: Array<{
    observations?: Record<string, [number, ...unknown[]]>;
  }>;
  structure?: {
    dimensions?: {
      observation?: Array<{
        values?: Array<{ id: string; name: string }>;
      }>;
    };
  };
}

/**
 * Fetch government spending by function from OECD
 * 
 * Uses SNA_TABLE11 (Government expenditure by function - COFOG)
 */
export async function fetchOECDSpending(
  options: FetchOptions & {
    categories?: OECDCategory[];
  } = {}
): Promise<SpendingData[]> {
  const {
    jurisdictions = OECD_COUNTRIES,
    period = { startYear: 2015, endYear: 2023 },
    categories = Object.keys(OECD_SPENDING_CATEGORIES) as OECDCategory[],
  } = options;
  
  // Filter to only OECD member countries
  const oecdJurisdictions = jurisdictions.filter(j => OECD_COUNTRIES.includes(j));
  
  if (oecdJurisdictions.length === 0) {
    return [];
  }
  
  const countryCodes = oecdJurisdictions.join('+');
  const categoryCodes = categories.map(c => OECD_SPENDING_CATEGORIES[c]).join('+');
  const years = `${period.startYear}-${period.endYear}`;
  
  // Dataset: SNA_TABLE11 (Government expenditure by function)
  // Dimensions: LOCATION.TRANSACT.SECTOR.MEASURE.TIME
  const url = `${OECD_API_BASE}/SNA_TABLE11/${countryCodes}.${categoryCodes}.S13.PCTGDP/all?startTime=${period.startYear}&endTime=${period.endYear}`;
  
  try {
    const response = await fetch(url, {
      headers: { 'Accept': 'application/vnd.sdmx.data+json;version=1.0' },
    });
    
    if (!response.ok) {
      console.warn(`OECD API returned ${response.status}: ${response.statusText}`);
      return [];
    }
    
    const data = await response.json() as OECDApiResponse;
    return parseOECDSpendingResponse(data, categories);
  } catch (error) {
    console.error('Error fetching OECD spending data:', error);
    return [];
  }
}

/**
 * Parse OECD SDMX-JSON response into SpendingData
 */
function parseOECDSpendingResponse(
  data: OECDApiResponse,
  _categories: OECDCategory[]
): SpendingData[] {
  const results: SpendingData[] = [];
  
  if (!data.dataSets?.[0]?.observations || !data.structure?.dimensions?.observation) {
    return results;
  }
  
  const observations = data.dataSets[0].observations;
  const dimensions = data.structure.dimensions.observation;
  
  // Get dimension values (typically: country, category, year)
  const countryDim = dimensions[0]?.values ?? [];
  const categoryDim = dimensions[1]?.values ?? [];
  const yearDim = dimensions[dimensions.length - 1]?.values ?? [];
  
  for (const [key, value] of Object.entries(observations)) {
    const indices = key.split(':').map(Number);
    const countryIndex = indices[0] ?? 0;
    const categoryIndex = indices[1] ?? 0;
    const yearIndex = indices[indices.length - 1] ?? 0;
    
    const country = countryDim[countryIndex]?.id;
    const category = categoryDim[categoryIndex]?.name ?? categoryDim[categoryIndex]?.id;
    const year = parseInt(yearDim[yearIndex]?.id ?? '0', 10);
    const percentGdp = value[0];
    
    if (country && category && year && typeof percentGdp === 'number') {
      results.push({
        jurisdictionIso3: OECD_TO_ISO3[country] ?? country,
        year,
        category,
        amountUsd: 0, // Would need GDP data to calculate
        percentGdp,
        source: 'OECD.Stat SNA_TABLE11',
      });
    }
  }
  
  return results;
}

/**
 * Fetch health expenditure data from OECD
 */
export async function fetchOECDHealthExpenditure(
  options: FetchOptions = {}
): Promise<SpendingData[]> {
  const {
    jurisdictions = OECD_COUNTRIES,
    period = { startYear: 2015, endYear: 2023 },
  } = options;
  
  const oecdJurisdictions = jurisdictions.filter(j => OECD_COUNTRIES.includes(j));
  
  if (oecdJurisdictions.length === 0) {
    return [];
  }
  
  const countryCodes = oecdJurisdictions.join('+');
  
  // Dataset: SHA (System of Health Accounts)
  const url = `${OECD_API_BASE}/SHA/all.HCTOT.HFTOT.HPTOT.PC_GDP/all?startTime=${period.startYear}&endTime=${period.endYear}&dimensionAtObservation=allDimensions`;
  
  try {
    const response = await fetch(url, {
      headers: { 'Accept': 'application/vnd.sdmx.data+json;version=1.0' },
    });
    
    if (!response.ok) {
      console.warn(`OECD Health API returned ${response.status}`);
      return [];
    }
    
    const data = await response.json() as OECDApiResponse;
    // Parse similar to spending response
    return parseOECDHealthResponse(data);
  } catch (error) {
    // Re-throw NOT_IMPLEMENTED errors so callers know the function is a stub
    if (error instanceof Error && error.message.includes('not yet implemented')) {
      throw error;
    }
    console.error('Error fetching OECD health expenditure:', error);
    return [];
  }
}

function parseOECDHealthResponse(_data: OECDApiResponse): SpendingData[] {
  // OECD SDMX JSON format requires dimension-key mapping to parse observations.
  // This is non-trivial and needs dedicated work. For now, throw so callers
  // know it's not silently returning empty.
  throw new Error(
    'OECD health expenditure parsing not yet implemented. ' +
    'Use @optimitron/data datasets (US_FEDERAL_BUDGET, HEALTH_SYSTEM_COMPARISON) for pre-curated data.',
  );
}

/**
 * Get available OECD datasets
 */
export function getOECDDatasets(): Array<{ id: string; name: string; description: string }> {
  return [
    { id: 'SNA_TABLE11', name: 'Government expenditure by function', description: 'COFOG classification spending data' },
    { id: 'SHA', name: 'System of Health Accounts', description: 'Health expenditure and financing' },
    { id: 'EAG', name: 'Education at a Glance', description: 'Education spending and outcomes' },
    { id: 'HEALTH_STAT', name: 'Health Statistics', description: 'Life expectancy, mortality, morbidity' },
    { id: 'PENSIONS', name: 'Pensions', description: 'Pension spending and coverage' },
    { id: 'SOCX', name: 'Social Expenditure', description: 'Social protection spending' },
  ];
}

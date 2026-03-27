/**
 * World Bank Data Fetcher
 * 
 * Fetches development indicators from World Bank Open Data API
 * 
 * API Documentation: https://datahelpdesk.worldbank.org/knowledgebase/articles/889392
 * 
 * Key indicators:
 * - NY.GDP.PCAP.PP.CD: GDP per capita (PPP)
 * - SP.DYN.LE00.IN: Life expectancy at birth
 * - SE.XPD.TOTL.GD.ZS: Education spending (% GDP)
 * - SH.XPD.CHEX.GD.ZS: Health expenditure (% GDP)
 */

import type { DataPoint, HealthData, EconomicData, FetchOptions } from '../types';

const WB_API_BASE = 'https://api.worldbank.org/v2';

/**
 * Common World Bank indicators
 */
export const WB_INDICATORS = {
  // Economic
  GDP_PER_CAPITA_PPP: 'NY.GDP.PCAP.PP.CD',
  GDP_GROWTH: 'NY.GDP.MKTP.KD.ZG',
  GNI_PER_CAPITA: 'NY.GNP.PCAP.CD',
  GINI_INDEX: 'SI.POV.GINI',
  UNEMPLOYMENT: 'SL.UEM.TOTL.ZS',
  INFLATION: 'FP.CPI.TOTL.ZG',
  
  // Health
  LIFE_EXPECTANCY: 'SP.DYN.LE00.IN',
  INFANT_MORTALITY: 'SP.DYN.IMRT.IN',
  MATERNAL_MORTALITY: 'SH.STA.MMRT',
  HEALTH_EXPENDITURE_PCT_GDP: 'SH.XPD.CHEX.GD.ZS',
  HEALTH_EXPENDITURE_PER_CAPITA: 'SH.XPD.CHEX.PP.CD',
  
  // Education
  EDUCATION_EXPENDITURE_PCT_GDP: 'SE.XPD.TOTL.GD.ZS',
  LITERACY_RATE: 'SE.ADT.LITR.ZS',
  SCHOOL_ENROLLMENT_PRIMARY: 'SE.PRM.ENRR',
  SCHOOL_ENROLLMENT_SECONDARY: 'SE.SEC.ENRR',
  
  // Demographics
  POPULATION: 'SP.POP.TOTL',
  URBAN_POPULATION_PCT: 'SP.URB.TOTL.IN.ZS',
  
  // Governance
  MILITARY_EXPENDITURE_PCT_GDP: 'MS.MIL.XPND.GD.ZS',
} as const;

export type WBIndicator = keyof typeof WB_INDICATORS;

interface WBApiResponse {
  page: number;
  pages: number;
  per_page: number;
  total: number;
  data?: Array<{
    indicator: { id: string; value: string };
    country: { id: string; value: string };
    countryiso3code: string;
    date: string;
    value: number | null;
    unit: string;
    obs_status: string;
    decimal: number;
  }>;
}

/**
 * Fetch indicator data from World Bank
 */
export async function fetchWorldBankIndicator(
  indicator: string,
  options: FetchOptions = {}
): Promise<DataPoint[]> {
  const {
    jurisdictions,
    period = { startYear: 2015, endYear: 2023 },
    limit = 1000,
  } = options;
  
  const countries = jurisdictions?.join(';') ?? 'all';
  const url = `${WB_API_BASE}/country/${countries}/indicator/${indicator}?format=json&date=${period.startYear}:${period.endYear}&per_page=${limit}`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn(`World Bank API returned ${response.status}`);
      return [];
    }
    
    const [_meta, data] = await response.json() as [WBApiResponse, WBApiResponse['data']];
    
    if (!data) return [];
    
    return data
      .filter(d => d.value !== null)
      .map(d => ({
        jurisdictionIso3: d.countryiso3code,
        year: parseInt(d.date, 10),
        value: d.value!,
        unit: d.unit || undefined,
        source: `World Bank WDI (${d.indicator.id})`,
        sourceUrl: `https://data.worldbank.org/indicator/${d.indicator.id}`,
      }));
  } catch (error) {
    console.error(`Error fetching World Bank indicator ${indicator}:`, error);
    return [];
  }
}

/**
 * Fetch multiple indicators at once
 */
export async function fetchWorldBankIndicators(
  indicators: string[],
  options: FetchOptions = {}
): Promise<Map<string, DataPoint[]>> {
  const results = new Map<string, DataPoint[]>();
  
  // Fetch in parallel
  const promises = indicators.map(async indicator => {
    const data = await fetchWorldBankIndicator(indicator, options);
    return { indicator, data };
  });
  
  const fetched = await Promise.all(promises);
  
  for (const { indicator, data } of fetched) {
    results.set(indicator, data);
  }
  
  return results;
}

/**
 * Fetch health-related data from World Bank
 */
export async function fetchWorldBankHealthData(
  options: FetchOptions = {}
): Promise<HealthData[]> {
  const indicators = [
    WB_INDICATORS.LIFE_EXPECTANCY,
    WB_INDICATORS.INFANT_MORTALITY,
    WB_INDICATORS.MATERNAL_MORTALITY,
  ];
  
  const results = await fetchWorldBankIndicators(indicators, options);
  
  // Merge indicators by jurisdiction and year
  const merged = new Map<string, HealthData>();
  
  for (const [indicator, dataPoints] of results) {
    for (const dp of dataPoints) {
      const key = `${dp.jurisdictionIso3}-${dp.year}`;
      
      if (!merged.has(key)) {
        merged.set(key, {
          jurisdictionIso3: dp.jurisdictionIso3,
          year: dp.year,
          source: 'World Bank WDI',
        });
      }
      
      const record = merged.get(key)!;
      
      if (indicator === WB_INDICATORS.LIFE_EXPECTANCY) {
        record.lifeExpectancy = dp.value;
      } else if (indicator === WB_INDICATORS.INFANT_MORTALITY) {
        record.infantMortality = dp.value;
      } else if (indicator === WB_INDICATORS.MATERNAL_MORTALITY) {
        record.maternalMortality = dp.value;
      }
    }
  }
  
  return Array.from(merged.values());
}

/**
 * Fetch economic data from World Bank
 */
export async function fetchWorldBankEconomicData(
  options: FetchOptions = {}
): Promise<EconomicData[]> {
  const indicators = [
    WB_INDICATORS.GDP_PER_CAPITA_PPP,
    WB_INDICATORS.GINI_INDEX,
    WB_INDICATORS.UNEMPLOYMENT,
  ];
  
  const results = await fetchWorldBankIndicators(indicators, options);
  
  // Merge indicators by jurisdiction and year
  const merged = new Map<string, EconomicData>();
  
  for (const [indicator, dataPoints] of results) {
    for (const dp of dataPoints) {
      const key = `${dp.jurisdictionIso3}-${dp.year}`;
      
      if (!merged.has(key)) {
        merged.set(key, {
          jurisdictionIso3: dp.jurisdictionIso3,
          year: dp.year,
          source: 'World Bank WDI',
        });
      }
      
      const record = merged.get(key)!;
      
      if (indicator === WB_INDICATORS.GDP_PER_CAPITA_PPP) {
        record.gdpPerCapita = dp.value;
      } else if (indicator === WB_INDICATORS.GINI_INDEX) {
        record.giniIndex = dp.value;
      } else if (indicator === WB_INDICATORS.UNEMPLOYMENT) {
        record.unemploymentRate = dp.value;
      }
    }
  }
  
  return Array.from(merged.values());
}

/**
 * Get list of all countries from World Bank
 */
export async function fetchWorldBankCountries(): Promise<Array<{
  iso3: string;
  iso2: string;
  name: string;
  region: string;
  incomeLevel: string;
}>> {
  const url = `${WB_API_BASE}/country?format=json&per_page=300`;
  
  try {
    const response = await fetch(url);
    const [_meta, data] = await response.json() as [unknown, Array<{ id: string; iso2Code: string; name: string; region: { id: string; value: string }; incomeLevel: { value: string } }>];
    
    return data
      .filter((c: any) => c.region.id !== 'NA') // Exclude aggregates
      .map((c: any) => ({
        iso3: c.id,
        iso2: c.iso2Code,
        name: c.name,
        region: c.region.value,
        incomeLevel: c.incomeLevel.value,
      }));
  } catch (error) {
    console.error('Error fetching World Bank countries:', error);
    return [];
  }
}

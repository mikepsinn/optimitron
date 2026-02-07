/**
 * Fetch real multi-country, multi-year time series data from public APIs.
 * 
 * This is the bridge between raw API data and the optimizer's TimeSeries format.
 * Fetches spending and outcome data for 50+ countries across 20+ years,
 * enabling proper cross-country diminishing returns analysis.
 * 
 * @see https://obg.warondisease.org — Optimal Budget Generator
 * @see https://dfda-spec.warondisease.org — dFDA Specification
 */

import type { DataPoint } from '../types.js';
import type { TimeSeries, Measurement } from '@optomitron/optimizer';
import { fetchLifeExpectancy, fetchGdpPerCapita, fetchHealthExpenditure } from '../fetchers/world-bank.js';
import { fetchWHOLifeExpectancy, fetchWHOHealthyLifeExpectancy, fetchWHOUHCIndex } from '../fetchers/who.js';
import { fetchFREDSeries } from '../fetchers/fred.js';

// ─── Types ───────────────────────────────────────────────────────────

export interface CountryTimeSeries {
  iso3: string;
  variables: Map<string, TimeSeries>;
}

export interface FetchedDataset {
  countries: Map<string, CountryTimeSeries>;
  metadata: {
    fetchedAt: string;
    sources: string[];
    countriesCount: number;
    yearRange: [number, number];
    variablesCount: number;
  };
}

// ─── Top 50 countries by data availability ───────────────────────────

export const TOP_COUNTRIES = [
  'USA', 'GBR', 'CAN', 'AUS', 'DEU', 'FRA', 'JPN', 'KOR', 'SGP', 'NZL',
  'NOR', 'SWE', 'DNK', 'FIN', 'NLD', 'BEL', 'AUT', 'CHE', 'IRL', 'ISR',
  'ITA', 'ESP', 'PRT', 'GRC', 'CZE', 'POL', 'HUN', 'SVK', 'SVN', 'EST',
  'LTU', 'LVA', 'CHL', 'MEX', 'COL', 'BRA', 'ARG', 'ZAF', 'TUR', 'IND',
  'CHN', 'IDN', 'THA', 'MYS', 'PHL', 'VNM', 'RUS', 'UKR', 'EGY', 'NGA',
];

// ─── Helpers ─────────────────────────────────────────────────────────

/** Convert DataPoint[] to a Map of ISO3 → TimeSeries */
function dataPointsToTimeSeries(
  points: DataPoint[],
  variableId: string,
  variableName: string,
): Map<string, TimeSeries> {
  const byCountry = new Map<string, Measurement[]>();

  for (const p of points) {
    if (!byCountry.has(p.jurisdictionIso3)) {
      byCountry.set(p.jurisdictionIso3, []);
    }
    byCountry.get(p.jurisdictionIso3)!.push({
      timestamp: new Date(`${p.year}-07-01`).getTime(), // mid-year
      value: p.value,
      unit: p.unit,
      source: p.source,
    });
  }

  const result = new Map<string, TimeSeries>();
  for (const [iso3, measurements] of byCountry) {
    // Sort by time
    measurements.sort((a, b) => (a.timestamp as number) - (b.timestamp as number));
    result.set(iso3, {
      variableId: `${iso3}:${variableId}`,
      name: `${iso3} — ${variableName}`,
      measurements,
    });
  }
  return result;
}

/** Merge variable data into country map */
function mergeIntoCountries(
  countries: Map<string, CountryTimeSeries>,
  variableData: Map<string, TimeSeries>,
  variableId: string,
): void {
  for (const [iso3, series] of variableData) {
    if (!countries.has(iso3)) {
      countries.set(iso3, { iso3, variables: new Map() });
    }
    countries.get(iso3)!.variables.set(variableId, series);
  }
}

// ─── Main Fetch Pipeline ─────────────────────────────────────────────

/**
 * Fetch all available country data from public APIs.
 * 
 * Returns time series data for 50 countries across multiple variables:
 * - Life expectancy (World Bank)
 * - Healthy life expectancy (WHO)
 * - GDP per capita (World Bank) 
 * - Health expenditure % GDP (World Bank)
 * - UHC service coverage (WHO)
 * 
 * @param startYear - First year to fetch (default: 2000)
 * @param endYear - Last year to fetch (default: 2023)
 */
export async function fetchAllCountryData(
  startYear: number = 2000,
  endYear: number = 2023,
): Promise<FetchedDataset> {
  const countries = new Map<string, CountryTimeSeries>();
  const sources: string[] = [];
  let minYear = endYear;
  let maxYear = startYear;

  const options = {
    jurisdictions: TOP_COUNTRIES,
    period: { startYear, endYear },
  };

  console.log(`Fetching data for ${TOP_COUNTRIES.length} countries (${startYear}-${endYear})...`);

  // 1. Life expectancy (World Bank)
  try {
    console.log('  📊 World Bank: Life expectancy...');
    const leData = await fetchLifeExpectancy(options);
    const leSeries = dataPointsToTimeSeries(leData, 'life_expectancy', 'Life Expectancy');
    mergeIntoCountries(countries, leSeries, 'life_expectancy');
    sources.push('World Bank WDI (SP.DYN.LE00.IN)');
    console.log(`     ✅ ${leData.length} data points`);
    for (const p of leData) {
      if (p.year < minYear) minYear = p.year;
      if (p.year > maxYear) maxYear = p.year;
    }
  } catch (e) {
    console.log(`     ⚠️ Failed: ${e}`);
  }

  // 2. GDP per capita (World Bank)
  try {
    console.log('  📊 World Bank: GDP per capita...');
    const gdpData = await fetchGdpPerCapita(options);
    const gdpSeries = dataPointsToTimeSeries(gdpData, 'gdp_per_capita', 'GDP per Capita (USD PPP)');
    mergeIntoCountries(countries, gdpSeries, 'gdp_per_capita');
    sources.push('World Bank WDI (NY.GDP.PCAP.PP.CD)');
    console.log(`     ✅ ${gdpData.length} data points`);
  } catch (e) {
    console.log(`     ⚠️ Failed: ${e}`);
  }

  // 3. Health expenditure % GDP (World Bank)
  try {
    console.log('  📊 World Bank: Health expenditure...');
    const heData = await fetchHealthExpenditure(options);
    const heSeries = dataPointsToTimeSeries(heData, 'health_expenditure_pct_gdp', 'Health Expenditure (% GDP)');
    mergeIntoCountries(countries, heSeries, 'health_expenditure_pct_gdp');
    sources.push('World Bank WDI (SH.XPD.CHEX.GD.ZS)');
    console.log(`     ✅ ${heData.length} data points`);
  } catch (e) {
    console.log(`     ⚠️ Failed: ${e}`);
  }

  // 4. Healthy life expectancy (WHO)
  try {
    console.log('  📊 WHO: Healthy life expectancy...');
    const haleData = await fetchWHOHealthyLifeExpectancy(options);
    const haleSeries = dataPointsToTimeSeries(haleData, 'healthy_life_expectancy', 'Healthy Life Expectancy');
    mergeIntoCountries(countries, haleSeries, 'healthy_life_expectancy');
    sources.push('WHO GHO (WHOSIS_000002)');
    console.log(`     ✅ ${haleData.length} data points`);
  } catch (e) {
    console.log(`     ⚠️ Failed: ${e}`);
  }

  // 5. UHC Service Coverage (WHO)
  try {
    console.log('  📊 WHO: UHC service coverage...');
    const uhcData = await fetchWHOUHCIndex(options);
    const uhcSeries = dataPointsToTimeSeries(uhcData, 'uhc_coverage', 'UHC Service Coverage Index');
    mergeIntoCountries(countries, uhcSeries, 'uhc_coverage');
    sources.push('WHO GHO (UHC_INDEX_REPORTED)');
    console.log(`     ✅ ${uhcData.length} data points`);
  } catch (e) {
    console.log(`     ⚠️ Failed: ${e}`);
  }

  // Count unique variables
  const allVars = new Set<string>();
  for (const [, country] of countries) {
    for (const [varId] of country.variables) {
      allVars.add(varId);
    }
  }

  console.log(`\n📋 Summary: ${countries.size} countries, ${allVars.size} variables, years ${minYear}-${maxYear}`);

  return {
    countries,
    metadata: {
      fetchedAt: new Date().toISOString(),
      sources,
      countriesCount: countries.size,
      yearRange: [minYear, maxYear],
      variablesCount: allVars.size,
    },
  };
}

/**
 * Convert fetched data to a flat JSON-serializable format for caching.
 */
export function datasetToJSON(dataset: FetchedDataset): object {
  const countriesArr: object[] = [];
  for (const [iso3, country] of dataset.countries) {
    const variables: Record<string, object[]> = {};
    for (const [varId, series] of country.variables) {
      variables[varId] = series.measurements.map(m => ({
        year: new Date(m.timestamp as number).getFullYear(),
        value: m.value,
        unit: m.unit,
        source: m.source,
      }));
    }
    countriesArr.push({ iso3, variables });
  }
  return {
    ...dataset.metadata,
    countries: countriesArr,
  };
}

/**
 * Load cached dataset from JSON.
 */
export function datasetFromJSON(json: any): FetchedDataset {
  const countries = new Map<string, CountryTimeSeries>();
  for (const c of json.countries) {
    const vars = new Map<string, TimeSeries>();
    for (const [varId, points] of Object.entries(c.variables) as [string, any[]][]) {
      vars.set(varId, {
        variableId: `${c.iso3}:${varId}`,
        name: `${c.iso3} — ${varId}`,
        measurements: points.map((p: any) => ({
          timestamp: new Date(`${p.year}-07-01`).getTime(),
          value: p.value,
          unit: p.unit,
          source: p.source,
        })),
      });
    }
    countries.set(c.iso3, { iso3: c.iso3, variables: vars });
  }
  return {
    countries,
    metadata: {
      fetchedAt: json.fetchedAt,
      sources: json.sources,
      countriesCount: json.countriesCount,
      yearRange: json.yearRange,
      variablesCount: json.variablesCount,
    },
  };
}

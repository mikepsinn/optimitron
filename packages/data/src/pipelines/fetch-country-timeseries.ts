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

import type { DataPoint } from '../types';
import type { TimeSeries, Measurement } from '@optimitron/optimizer';
import {
  fetchLifeExpectancy, fetchGdpPerCapita, fetchHealthExpenditure,
  fetchGovHealthExpenditure, fetchPrivateHealthExpenditure, fetchOutOfPocketHealth,
  fetchTaxRevenue, fetchGovExpenditure, fetchMilitaryExpenditure,
  fetchRDExpenditure, fetchEducationExpenditure, fetchGiniIndex,
  fetchInfantMortality, fetchHomicideRate, fetchGniPerCapita,
  fetchGovDebt, fetchGovRevenue, fetchLaborForceParticipation,
  fetchCO2Emissions,
} from '../fetchers/world-bank';
import { fetchWHOLifeExpectancy, fetchWHOHealthyLifeExpectancy, fetchWHOUHCIndex } from '../fetchers/who';
import { fetchFREDSeries } from '../fetchers/fred';

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

/** JSON shape produced by datasetToJSON — used to type the parse boundary. */
export interface RawDatasetJSON {
  fetchedAt: string;
  sources: string[];
  countriesCount: number;
  yearRange: [number, number];
  variablesCount: number;
  countries: Array<{
    iso3: string;
    variables: Record<string, Array<{ year: number; value: number; unit?: string; source?: string }>>;
  }>;
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

  // 6. Government health expenditure (% GDP) — the policy lever
  try {
    console.log('  📊 World Bank: Government health expenditure...');
    const govHealthData = await fetchGovHealthExpenditure(options);
    mergeIntoCountries(countries, dataPointsToTimeSeries(govHealthData, 'gov_health_expenditure_pct_gdp', 'Government Health Expenditure (% GDP)'), 'gov_health_expenditure_pct_gdp');
    sources.push('World Bank WDI (SH.XPD.GHED.GD.ZS)');
    console.log(`     ✅ ${govHealthData.length} data points`);
  } catch (e) { console.log(`     ⚠️ Failed: ${e}`); }

  // 7. Private health expenditure (% of total health)
  try {
    console.log('  📊 World Bank: Private health expenditure...');
    const privHealthData = await fetchPrivateHealthExpenditure(options);
    mergeIntoCountries(countries, dataPointsToTimeSeries(privHealthData, 'private_health_expenditure_pct', 'Private Health Expenditure (% of Total)'), 'private_health_expenditure_pct');
    sources.push('World Bank WDI (SH.XPD.PVTD.CH.ZS)');
    console.log(`     ✅ ${privHealthData.length} data points`);
  } catch (e) { console.log(`     ⚠️ Failed: ${e}`); }

  // 8. Out-of-pocket (% of total health)
  try {
    console.log('  📊 World Bank: Out-of-pocket health...');
    const oopData = await fetchOutOfPocketHealth(options);
    mergeIntoCountries(countries, dataPointsToTimeSeries(oopData, 'out_of_pocket_health_pct', 'Out-of-Pocket Health (% of Total)'), 'out_of_pocket_health_pct');
    sources.push('World Bank WDI (SH.XPD.OOPC.CH.ZS)');
    console.log(`     ✅ ${oopData.length} data points`);
  } catch (e) { console.log(`     ⚠️ Failed: ${e}`); }

  // 9. Tax revenue (% GDP)
  try {
    console.log('  📊 World Bank: Tax revenue...');
    const taxData = await fetchTaxRevenue(options);
    mergeIntoCountries(countries, dataPointsToTimeSeries(taxData, 'tax_revenue_pct_gdp', 'Tax Revenue (% GDP)'), 'tax_revenue_pct_gdp');
    sources.push('World Bank WDI (GC.TAX.TOTL.GD.ZS)');
    console.log(`     ✅ ${taxData.length} data points`);
  } catch (e) { console.log(`     ⚠️ Failed: ${e}`); }

  // 10. Government expenditure (% GDP)
  try {
    console.log('  📊 World Bank: Government expenditure...');
    const govExpData = await fetchGovExpenditure(options);
    mergeIntoCountries(countries, dataPointsToTimeSeries(govExpData, 'gov_expenditure_pct_gdp', 'Government Expenditure (% GDP)'), 'gov_expenditure_pct_gdp');
    sources.push('World Bank WDI (GC.XPN.TOTL.GD.ZS)');
    console.log(`     ✅ ${govExpData.length} data points`);
  } catch (e) { console.log(`     ⚠️ Failed: ${e}`); }

  // 11. Military expenditure (% GDP)
  try {
    console.log('  📊 World Bank: Military expenditure...');
    const milData = await fetchMilitaryExpenditure(options);
    mergeIntoCountries(countries, dataPointsToTimeSeries(milData, 'military_expenditure_pct_gdp', 'Military Expenditure (% GDP)'), 'military_expenditure_pct_gdp');
    sources.push('World Bank WDI (MS.MIL.XPND.GD.ZS)');
    console.log(`     ✅ ${milData.length} data points`);
  } catch (e) { console.log(`     ⚠️ Failed: ${e}`); }

  // 12. R&D expenditure (% GDP)
  try {
    console.log('  📊 World Bank: R&D expenditure...');
    const rdData = await fetchRDExpenditure(options);
    mergeIntoCountries(countries, dataPointsToTimeSeries(rdData, 'rd_expenditure_pct_gdp', 'R&D Expenditure (% GDP)'), 'rd_expenditure_pct_gdp');
    sources.push('World Bank WDI (GB.XPD.RSDV.GD.ZS)');
    console.log(`     ✅ ${rdData.length} data points`);
  } catch (e) { console.log(`     ⚠️ Failed: ${e}`); }

  // 13. Education expenditure (% GDP)
  try {
    console.log('  📊 World Bank: Education expenditure...');
    const eduData = await fetchEducationExpenditure(options);
    mergeIntoCountries(countries, dataPointsToTimeSeries(eduData, 'education_expenditure_pct_gdp', 'Education Expenditure (% GDP)'), 'education_expenditure_pct_gdp');
    sources.push('World Bank WDI (SE.XPD.TOTL.GD.ZS)');
    console.log(`     ✅ ${eduData.length} data points`);
  } catch (e) { console.log(`     ⚠️ Failed: ${e}`); }

  // 14. Gini index (income inequality)
  try {
    console.log('  📊 World Bank: Gini index...');
    const giniData = await fetchGiniIndex(options);
    mergeIntoCountries(countries, dataPointsToTimeSeries(giniData, 'gini_index', 'Gini Index (Income Inequality)'), 'gini_index');
    sources.push('World Bank WDI (SI.POV.GINI)');
    console.log(`     ✅ ${giniData.length} data points`);
  } catch (e) { console.log(`     ⚠️ Failed: ${e}`); }

  // 15. Infant mortality
  try {
    console.log('  📊 World Bank: Infant mortality...');
    const imData = await fetchInfantMortality(options);
    mergeIntoCountries(countries, dataPointsToTimeSeries(imData, 'infant_mortality', 'Infant Mortality (per 1000 births)'), 'infant_mortality');
    sources.push('World Bank WDI (SP.DYN.IMRT.IN)');
    console.log(`     ✅ ${imData.length} data points`);
  } catch (e) { console.log(`     ⚠️ Failed: ${e}`); }

  // 16. GNI per capita
  try {
    console.log('  📊 World Bank: GNI per capita...');
    const gniData = await fetchGniPerCapita(options);
    mergeIntoCountries(countries, dataPointsToTimeSeries(gniData, 'gni_per_capita', 'GNI per Capita (USD)'), 'gni_per_capita');
    sources.push('World Bank WDI (NY.GNP.PCAP.CD)');
    console.log(`     ✅ ${gniData.length} data points`);
  } catch (e) { console.log(`     ⚠️ Failed: ${e}`); }

  // 17. Homicide rate
  try {
    console.log('  📊 World Bank: Homicide rate...');
    const homData = await fetchHomicideRate(options);
    mergeIntoCountries(countries, dataPointsToTimeSeries(homData, 'homicide_rate', 'Homicide Rate (per 100K)'), 'homicide_rate');
    sources.push('World Bank WDI (VC.IHR.PSRC.P5)');
    console.log(`     ✅ ${homData.length} data points`);
  } catch (e) { console.log(`     ⚠️ Failed: ${e}`); }

  // 18. Government debt (% GDP) — accumulated deferred taxation
  try {
    console.log('  📊 World Bank: Government debt...');
    const debtData = await fetchGovDebt(options);
    mergeIntoCountries(countries, dataPointsToTimeSeries(debtData, 'gov_debt_pct_gdp', 'Government Debt (% GDP)'), 'gov_debt_pct_gdp');
    sources.push('World Bank WDI (GC.DOD.TOTL.GD.ZS)');
    console.log(`     ✅ ${debtData.length} data points`);
  } catch (e) { console.log(`     ⚠️ Failed: ${e}`); }

  // 19. Government revenue (% GDP) — explicit tax + fee burden
  try {
    console.log('  📊 World Bank: Government revenue...');
    const revData = await fetchGovRevenue(options);
    mergeIntoCountries(countries, dataPointsToTimeSeries(revData, 'gov_revenue_pct_gdp', 'Government Revenue (% GDP)'), 'gov_revenue_pct_gdp');
    sources.push('World Bank WDI (GC.REV.XGRT.GD.ZS)');
    console.log(`     ✅ ${revData.length} data points`);
  } catch (e) { console.log(`     ⚠️ Failed: ${e}`); }

  // 20. Labor force participation (% of 15+)
  try {
    console.log('  📊 World Bank: Labor force participation...');
    const lfpData = await fetchLaborForceParticipation(options);
    mergeIntoCountries(countries, dataPointsToTimeSeries(lfpData, 'labor_force_participation', 'Labor Force Participation (% of 15+)'), 'labor_force_participation');
    sources.push('World Bank WDI (SL.TLF.CACT.ZS)');
    console.log(`     ✅ ${lfpData.length} data points`);
  } catch (e) { console.log(`     ⚠️ Failed: ${e}`); }

  // 21. CO2 emissions per capita (metric tons)
  try {
    console.log('  📊 World Bank: CO2 emissions per capita...');
    const co2Data = await fetchCO2Emissions(options);
    mergeIntoCountries(countries, dataPointsToTimeSeries(co2Data, 'co2_emissions_per_capita', 'CO2 Emissions (metric tons per capita)'), 'co2_emissions_per_capita');
    sources.push('World Bank WDI (EN.ATM.CO2E.PC)');
    console.log(`     ✅ ${co2Data.length} data points`);
  } catch (e) { console.log(`     ⚠️ Failed: ${e}`); }

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
export function datasetToJSON(dataset: FetchedDataset): RawDatasetJSON {
  const countriesArr: RawDatasetJSON['countries'] = [];
  for (const [iso3, country] of dataset.countries) {
    const variables: Record<string, Array<{ year: number; value: number; unit?: string; source?: string }>> = {};
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
export function datasetFromJSON(json: RawDatasetJSON): FetchedDataset {
  const countries = new Map<string, CountryTimeSeries>();
  for (const c of json.countries) {
    const vars = new Map<string, TimeSeries>();
    for (const [varId, points] of Object.entries(c.variables)) {
      vars.set(varId, {
        variableId: `${c.iso3}:${varId}`,
        name: `${c.iso3} — ${varId}`,
        measurements: points.map((p) => ({
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

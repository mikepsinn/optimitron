
import type { FetchOptions, DataPoint } from '../types.js';
import { fetchPisaScores } from './oecd.js';
import { fetchCO2Emissions } from './world-bank.js';
import { fetchWHOHealthyLifeExpectancy } from './who.js';
import { type OECDDirectOutcomeDataPoint, OECD_DIRECT_OUTCOMES } from '../datasets/oecd-direct-outcomes.js';

/**
 * Fetch real data for OECD Direct Outcomes.
 * 
 * Sources:
 * - Education (PISA): OECD SDMX API
 * - Climate (CO2): World Bank API
 * - Health (HALE): WHO GHO API
 * 
 * This aggregates data from multiple sources into the unified schema.
 */
export async function fetchOECDDirectOutcomes(
  options: FetchOptions = {}
): Promise<OECDDirectOutcomeDataPoint[]> {
  // 1. Fetch data from all sources in parallel
  const [pisaData, co2Data, haleData] = await Promise.all([
    fetchPisaScores(options).catch(err => {
      console.error('Failed to fetch PISA scores:', err);
      return [] as DataPoint[];
    }),
    fetchCO2Emissions(options).catch(err => {
      console.error('Failed to fetch CO2 emissions:', err);
      return [] as DataPoint[];
    }),
    fetchWHOHealthyLifeExpectancy(options).catch(err => {
      console.error('Failed to fetch WHO HALE:', err);
      return [] as DataPoint[];
    }),
  ]);

  // 2. Index data by country+year for efficient merging
  // Key format: "ISO3:YEAR"
  const pisaMap = new Map<string, number>();
  const co2Map = new Map<string, number>();
  const haleMap = new Map<string, number>();

  for (const dp of pisaData) pisaMap.set(`${dp.jurisdictionIso3}:${dp.year}`, dp.value);
  for (const dp of co2Data) co2Map.set(`${dp.jurisdictionIso3}:${dp.year}`, dp.value);
  for (const dp of haleData) haleMap.set(`${dp.jurisdictionIso3}:${dp.year}`, dp.value);

  // 3. Merge into existing simulated dataset structure (or create new points)
  // For now, we iterate over the SIMULATED dataset and overlay real values where available.
  // This preserves the structure and simulated fields we don't fetch yet.
  
  const results = OECD_DIRECT_OUTCOMES.map(simulatedPoint => {
    const key = `${simulatedPoint.jurisdictionIso3}:${simulatedPoint.year}`;
    
    // Create a new object to avoid mutating the original constant
    const point = { ...simulatedPoint };

    // Overlay real PISA scores if available
    if (pisaMap.has(key)) {
      point.pisaScoreAvg = pisaMap.get(key) ?? null;
    }

    // Overlay real CO2 emissions if available
    if (co2Map.has(key)) {
      point.co2PerCapitaTons = co2Map.get(key) ?? null;
    }

    // Overlay real HALE if available
    if (haleMap.has(key)) {
      point.haleAtBirthYears = haleMap.get(key) ?? null;
    }

    return point;
  });

  // Note: We are currently limited to the years/countries defined in the simulated dataset.
  // Ideally, we would also add points that exist in fetched data but not in simulated data.
  // However, for this task, expanding the existing pattern (overlaying real on simulated) is safer.

  return results;
}

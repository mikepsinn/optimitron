/**
 * Unified Earth Agency data — merges performance grades with historical trends.
 *
 * Each `EarthAgency` brings together:
 * - Identity fields (id, name, emoji, country)
 * - Performance grading (spending vs outcome time series)
 * - Historical before/after creation trend data
 * - A `replacedBy` pointer to the Wishonia agency that supersedes it
 *
 * No data is duplicated — `performance` and `historical` reference the
 * original arrays from agency-performance.ts and agency-historical-trends.ts.
 */

import type { TimePoint, OutcomeSeries, AgencyGrade } from "./agency-performance.js";
import type { AgencyHistoricalTrend } from "./agency-historical-trends.js";
import { US_AGENCY_PERFORMANCE } from "./agency-performance.js";
import { ALL_HISTORICAL_TRENDS } from "./agency-historical-trends.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EarthAgencyPerformance {
  mission: string;
  spendingTimeSeries: TimePoint[];
  spendingLabel: string;
  outcomes: OutcomeSeries[];
  annotations?: { year: number; label: string; url?: string }[];
  grade: AgencyGrade;
  gradeRationale: string;
  wishoniaQuote: string;
  sources: { label: string; url: string }[];
}

export interface EarthAgency {
  id: string;
  name: string;
  emoji: string;
  countryCode: string;
  replacedBy?: string;
  performance?: EarthAgencyPerformance;
  historical?: AgencyHistoricalTrend;
}

// ---------------------------------------------------------------------------
// Mapping: Earth agency ID → Wishonia agency ID
// ---------------------------------------------------------------------------

const replacedByMap: Record<string, string> = {
  irs: "dirs",
  fed: "dfed",
  nih: "dih",
  fda: "dih",
  hhs: "dih",
  dea: "dih",
  va: "dih",
  dod: "ddod",
  tsa: "ddod",
  state: "ddod",
  doed: "domb",
  ice: "dcensus",
  bop: "dcbo",
  epa: "dcbo",
  fbi: "dgao",
  cyber: "dgao",
  usda: "dcbo",
  hud: "domb",
  osha: "dcbo",
};

// ---------------------------------------------------------------------------
// Historical ID mapping — the historical trends file uses slightly different
// IDs for some agencies.
// ---------------------------------------------------------------------------

const historicalIdMap: Record<string, string> = {
  "fda-1962": "fda",
  "hhs-cms": "hhs",
};

/**
 * Resolve a historical trend's agencyId to the canonical performance agencyId.
 */
function canonicalId(historicalAgencyId: string): string {
  return historicalIdMap[historicalAgencyId] ?? historicalAgencyId;
}

// ---------------------------------------------------------------------------
// Build the unified array
// ---------------------------------------------------------------------------

/** Index historical trends by canonical agency ID for O(1) lookup. */
const historicalByCanonicalId = new Map<string, AgencyHistoricalTrend>();
for (const trend of ALL_HISTORICAL_TRENDS) {
  historicalByCanonicalId.set(canonicalId(trend.agencyId), trend);
}

function buildPerformance(ap: {
  mission: string;
  spendingTimeSeries: TimePoint[];
  spendingLabel: string;
  outcomes: OutcomeSeries[];
  annotations?: { year: number; label: string; url?: string }[];
  grade: AgencyGrade;
  gradeRationale: string;
  wishoniaQuote: string;
  sources: { label: string; url: string }[];
}): EarthAgencyPerformance {
  return {
    mission: ap.mission,
    spendingTimeSeries: ap.spendingTimeSeries,
    spendingLabel: ap.spendingLabel,
    outcomes: ap.outcomes,
    annotations: ap.annotations,
    grade: ap.grade,
    gradeRationale: ap.gradeRationale,
    wishoniaQuote: ap.wishoniaQuote,
    sources: ap.sources,
  };
}

/**
 * All Earth agencies with merged performance and historical data.
 *
 * Built from `US_AGENCY_PERFORMANCE` (20 entries). Each entry is checked
 * against `ALL_HISTORICAL_TRENDS` (14 entries) for a matching historical
 * record.
 */
export const EARTH_AGENCIES: EarthAgency[] = US_AGENCY_PERFORMANCE.map(
  (ap) => {
    const agency: EarthAgency = {
      id: ap.agencyId,
      name: ap.agencyName,
      emoji: ap.emoji,
      countryCode: ap.countryCode,
      performance: buildPerformance(ap),
    };

    const historical = historicalByCanonicalId.get(ap.agencyId);
    if (historical) {
      agency.historical = historical;
    }

    const replacement = replacedByMap[ap.agencyId];
    if (replacement) {
      agency.replacedBy = replacement;
    }

    return agency;
  },
);

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

/**
 * Get a single Earth agency by its ID.
 */
export function getEarthAgency(id: string): EarthAgency | undefined {
  return EARTH_AGENCIES.find((a) => a.id === id);
}

/**
 * Get all Earth agencies for a given country code (e.g. "US").
 */
export function getEarthAgenciesByCountry(code: string): EarthAgency[] {
  return EARTH_AGENCIES.filter((a) => a.countryCode === code);
}

/**
 * Get agencies that have performance data, optionally filtered by country.
 */
export function getEarthAgenciesWithPerformance(
  code?: string,
): EarthAgency[] {
  return EARTH_AGENCIES.filter(
    (a) => a.performance && (code === undefined || a.countryCode === code),
  );
}

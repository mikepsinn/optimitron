/**
 * Cross-Country Panel Dataset Helpers
 *
 * Generic utilities for assembling cross-country time series panels from
 * DataPoint arrays. Used by any analysis that needs per-jurisdiction
 * annual data (budget analysis, policy analysis, etc.).
 *
 * Sources:
 *   - World Bank WDI: life expectancy, GNI per capita PPP, GDP per capita PPP,
 *     Gini, inflation, broad money growth
 *   - FRED: M2 year-over-year change (US-specific higher resolution)
 */

import type { DataPoint } from '../types.js';

/**
 * Annual time series for one variable in one jurisdiction.
 * Structurally compatible with @optimitron/obg's AnnualTimeSeries.
 */
export interface MonetaryPolicyTimeSeries {
  jurisdictionId: string;
  jurisdictionName: string;
  variableId: string;
  variableName: string;
  unit: string;
  annualValues: Map<number, number>;
}

// ─── Interface ────────────────────────────────────────────────────────

export interface MonetaryPolicyPanelRow {
  jurisdictionIso3: string;
  year: number;
  /** Broad money growth (annual %) — the supply expansion rate */
  broadMoneyGrowth: number | null;
  /** Life expectancy at birth (years) */
  lifeExpectancy: number | null;
  /** GNI per capita, PPP (current international $) */
  gniPerCapitaPpp: number | null;
  /** GDP per capita, PPP (current international $) */
  gdpPerCapitaPpp: number | null;
  /** Gini index (0–100) */
  giniIndex: number | null;
  /** Inflation rate (%) — needed to distinguish real from nominal effects */
  inflationRate: number | null;
}

// ─── Countries with good broad money + outcome data coverage ──────────

export const MONETARY_POLICY_COUNTRIES = [
  'AUS', 'AUT', 'BEL', 'CAN', 'CHE', 'CZE', 'DEU', 'DNK',
  'ESP', 'FIN', 'FRA', 'GBR', 'GRC', 'HUN', 'IRL', 'ISL',
  'ITA', 'JPN', 'KOR', 'MEX', 'NLD', 'NOR', 'NZL', 'POL',
  'PRT', 'SVK', 'SWE', 'TUR', 'USA',
] as const;

const COUNTRY_NAMES: Record<string, string> = {
  AUS: 'Australia', AUT: 'Austria', BEL: 'Belgium', CAN: 'Canada',
  CHE: 'Switzerland', CZE: 'Czech Republic', DEU: 'Germany', DNK: 'Denmark',
  ESP: 'Spain', FIN: 'Finland', FRA: 'France', GBR: 'United Kingdom',
  GRC: 'Greece', HUN: 'Hungary', IRL: 'Ireland', ISL: 'Iceland',
  ITA: 'Italy', JPN: 'Japan', KOR: 'South Korea', MEX: 'Mexico',
  NLD: 'Netherlands', NOR: 'Norway', NZL: 'New Zealand', POL: 'Poland',
  PRT: 'Portugal', SVK: 'Slovakia', SWE: 'Sweden', TUR: 'Turkey',
  USA: 'United States',
};

// ─── Helpers ──────────────────────────────────────────────────────────

/** Group DataPoint[] by jurisdiction → year → value, averaging sub-annual data */
function groupByJurisdictionYear(points: DataPoint[]): Map<string, Map<number, number>> {
  const grouped = new Map<string, Map<number, { sum: number; count: number }>>();

  for (const dp of points) {
    if (!grouped.has(dp.jurisdictionIso3)) {
      grouped.set(dp.jurisdictionIso3, new Map());
    }
    const byYear = grouped.get(dp.jurisdictionIso3)!;
    const existing = byYear.get(dp.year);
    if (existing) {
      existing.sum += dp.value;
      existing.count += 1;
    } else {
      byYear.set(dp.year, { sum: dp.value, count: 1 });
    }
  }

  const result = new Map<string, Map<number, number>>();
  for (const [iso3, byYear] of grouped) {
    const averaged = new Map<number, number>();
    for (const [year, { sum, count }] of byYear) {
      averaged.set(year, sum / count);
    }
    result.set(iso3, averaged);
  }
  return result;
}

/**
 * Convert grouped DataPoint data into MonetaryPolicyTimeSeries[].
 * One time series per jurisdiction.
 */
export function dataPointsToTimeSeries(
  points: DataPoint[],
  variableId: string,
  variableName: string,
  unit: string,
): MonetaryPolicyTimeSeries[] {
  const grouped = groupByJurisdictionYear(points);
  const result: MonetaryPolicyTimeSeries[] = [];

  for (const [iso3, annualValues] of grouped) {
    if (annualValues.size === 0) continue;
    result.push({
      jurisdictionId: iso3,
      jurisdictionName: COUNTRY_NAMES[iso3] ?? iso3,
      variableId,
      variableName,
      unit,
      annualValues,
    });
  }

  return result;
}


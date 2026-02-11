/**
 * Convert static datasets into optimizer-compatible TimeSeries.
 *
 * Each country/jurisdiction becomes an "entity" whose measurements are
 * national statistics — the same format used for personal health data.
 * This enables the optimizer to find causal relationships between policy
 * inputs and population outcomes using the same pipeline.
 *
 * @see https://dfda-spec.warondisease.org — dFDA Specification
 * @see https://opg.warondisease.org — Optimal Policy Generator
 */

import type { TimeSeries, Measurement } from '@optomitron/optimizer';
import {
  HEALTH_SYSTEM_COMPARISON,
  DRUG_POLICY_COMPARISON,
  EDUCATION_COMPARISON,
  CRIMINAL_JUSTICE_COMPARISON,
  type CountryHealthData,
  type CountryDrugPolicy,
  type CountryEducationData,
  type CountryCriminalJustice,
} from './international-comparisons.js';
import {
  US_FEDERAL_BUDGET,
  type BudgetCategory,
} from './us-federal-budget.js';
import {
  OECD_BUDGET_PANEL,
  type OECDBudgetPanelDataPoint,
} from './oecd-budget-panel.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Create a single-point TimeSeries (cross-sectional snapshot) */
function pointSeries(
  variableId: string,
  name: string,
  value: number,
  year: number = 2023,
  unit?: string,
  source?: string,
): TimeSeries {
  return {
    variableId,
    name,
    measurements: [
      {
        timestamp: new Date(`${year}-01-01`).getTime(),
        value,
        unit,
        source,
      },
    ],
  };
}

/** Create a multi-year TimeSeries from historical data */
function historicalSeries(
  variableId: string,
  name: string,
  data: { year: number; amount: number }[],
  unit?: string,
  source?: string,
): TimeSeries {
  return {
    variableId,
    name,
    measurements: data.map((d) => ({
      timestamp: new Date(`${d.year}-01-01`).getTime(),
      value: d.amount,
      unit,
      source,
    })),
  };
}

// ─── Health Data → TimeSeries ────────────────────────────────────────────────

/** Convert one country's health data into TimeSeries */
export function healthCountryToTimeSeries(
  country: CountryHealthData,
): TimeSeries[] {
  const prefix = country.iso3;
  const src = country.source;
  return [
    pointSeries(`${prefix}:health_spending_per_capita`, `${country.country} — Health Spending per Capita`, country.healthSpendingPerCapita, 2023, 'USD PPP', src),
    pointSeries(`${prefix}:health_spending_pct_gdp`, `${country.country} — Health Spending % GDP`, country.healthSpendingPctGDP, 2023, '%', src),
    pointSeries(`${prefix}:life_expectancy`, `${country.country} — Life Expectancy`, country.lifeExpectancy, 2023, 'years', src),
    pointSeries(`${prefix}:infant_mortality`, `${country.country} — Infant Mortality`, country.infantMortality, 2023, 'per 1,000', src),
    pointSeries(`${prefix}:maternal_mortality`, `${country.country} — Maternal Mortality`, country.maternalMortality, 2023, 'per 100,000', src),
    pointSeries(`${prefix}:uninsured_rate`, `${country.country} — Uninsured Rate`, country.uninsuredRate, 2023, '%', src),
    pointSeries(`${prefix}:out_of_pocket_pct`, `${country.country} — Out-of-Pocket %`, country.outOfPocketPctTotal, 2023, '%', src),
    pointSeries(`${prefix}:physicians_per_thousand`, `${country.country} — Physicians per 1,000`, country.physiciansPerThousand, 2023, 'per 1,000', src),
  ];
}

/** Convert all countries' health data into TimeSeries, grouped by country ISO3 */
export function healthComparisonToTimeSeries(): Map<string, TimeSeries[]> {
  const result = new Map<string, TimeSeries[]>();
  for (const country of HEALTH_SYSTEM_COMPARISON) {
    result.set(country.iso3, healthCountryToTimeSeries(country));
  }
  return result;
}

// ─── Drug Policy → TimeSeries ────────────────────────────────────────────────

export function drugPolicyCountryToTimeSeries(
  country: CountryDrugPolicy,
): TimeSeries[] {
  const prefix = country.iso3;
  const src = country.source;
  return [
    pointSeries(`${prefix}:drug_deaths_per_100k`, `${country.country} — Drug Deaths per 100K`, country.drugDeathsPer100K, 2023, 'per 100,000', src),
    pointSeries(`${prefix}:drug_incarceration_per_100k`, `${country.country} — Drug Incarceration per 100K`, country.incarcerationRatePer100K, 2023, 'per 100,000', src),
    pointSeries(`${prefix}:hiv_rate_pwid`, `${country.country} — HIV Rate Among PWID`, country.hivRateAmongPWID, 2023, '%', src),
    pointSeries(`${prefix}:treatment_access_rate`, `${country.country} — Treatment Access Rate`, country.treatmentAccessRate, 2023, '%', src),
  ];
}

export function drugPolicyToTimeSeries(): Map<string, TimeSeries[]> {
  const result = new Map<string, TimeSeries[]>();
  for (const country of DRUG_POLICY_COMPARISON) {
    const existing = result.get(country.iso3) || [];
    result.set(country.iso3, [...existing, ...drugPolicyCountryToTimeSeries(country)]);
  }
  return result;
}

// ─── Education → TimeSeries ──────────────────────────────────────────────────

export function educationCountryToTimeSeries(
  country: CountryEducationData,
): TimeSeries[] {
  const prefix = country.iso3;
  const src = country.source;
  return [
    pointSeries(`${prefix}:education_spending_pct_gdp`, `${country.country} — Education Spending % GDP`, country.educationSpendingPctGDP, 2023, '%', src),
    pointSeries(`${prefix}:pisa_math`, `${country.country} — PISA Math Score`, country.pisaScoreMath, 2023, 'score', src),
    pointSeries(`${prefix}:pisa_reading`, `${country.country} — PISA Reading Score`, country.pisaScoreReading, 2023, 'score', src),
    pointSeries(`${prefix}:pisa_science`, `${country.country} — PISA Science Score`, country.pisaScoreScience, 2023, 'score', src),
    pointSeries(`${prefix}:tertiary_enrollment`, `${country.country} — Tertiary Enrollment Rate`, country.tertiaryEnrollmentRate, 2023, '%', src),
    pointSeries(`${prefix}:student_teacher_ratio`, `${country.country} — Student-Teacher Ratio`, country.studentTeacherRatio, 2023, 'ratio', src),
  ];
}

export function educationToTimeSeries(): Map<string, TimeSeries[]> {
  const result = new Map<string, TimeSeries[]>();
  for (const country of EDUCATION_COMPARISON) {
    const existing = result.get(country.iso3) || [];
    result.set(country.iso3, [...existing, ...educationCountryToTimeSeries(country)]);
  }
  return result;
}

// ─── Criminal Justice → TimeSeries ───────────────────────────────────────────

export function criminalJusticeCountryToTimeSeries(
  country: CountryCriminalJustice,
): TimeSeries[] {
  const prefix = country.iso3;
  const src = country.source;
  return [
    pointSeries(`${prefix}:incarceration_rate`, `${country.country} — Incarceration Rate`, country.incarcerationRatePer100K, 2023, 'per 100,000', src),
    pointSeries(`${prefix}:recidivism_rate`, `${country.country} — Recidivism Rate`, country.recidivismRate, 2023, '%', src),
    pointSeries(`${prefix}:homicide_rate`, `${country.country} — Homicide Rate`, country.homicideRatePer100K, 2023, 'per 100,000', src),
    pointSeries(`${prefix}:police_per_capita`, `${country.country} — Police per 100,000`, country.policePerCapita, 2023, 'per 100,000', src),
    pointSeries(`${prefix}:justice_spending_pct_gdp`, `${country.country} — Justice Spending % GDP`, country.justiceSpendingPctGDP, 2023, '%', src),
  ];
}

export function criminalJusticeToTimeSeries(): Map<string, TimeSeries[]> {
  const result = new Map<string, TimeSeries[]>();
  for (const country of CRIMINAL_JUSTICE_COMPARISON) {
    const existing = result.get(country.iso3) || [];
    result.set(country.iso3, [...existing, ...criminalJusticeCountryToTimeSeries(country)]);
  }
  return result;
}

// ─── US Federal Budget → TimeSeries ──────────────────────────────────────────

/** Convert US federal budget historical spending into multi-year TimeSeries per category */
export function budgetToTimeSeries(): TimeSeries[] {
  return US_FEDERAL_BUDGET.categories.map((cat: BudgetCategory) =>
    historicalSeries(
      `US:budget:${cat.name.toLowerCase().replace(/\s+/g, '_')}`,
      `US Federal Budget — ${cat.name}`,
      cat.historicalSpending,
      'billions USD',
      'CBO / OMB',
    ),
  );
}

/** Convert US budget outcome metrics into single-point TimeSeries */
export function budgetOutcomesToTimeSeries(): TimeSeries[] {
  const series: TimeSeries[] = [];
  for (const cat of US_FEDERAL_BUDGET.categories) {
    for (const metric of cat.outcomeMetrics) {
      series.push(
        pointSeries(
          `US:outcome:${cat.name.toLowerCase().replace(/\s+/g, '_')}:${metric.name.toLowerCase().replace(/\s+/g, '_')}`,
          `US — ${metric.name}`,
          metric.value,
          2023,
          metric.unit,
          metric.source,
        ),
      );
    }
  }
  return series;
}

// ─── Combined ────────────────────────────────────────────────────────────────

/**
 * Generate all jurisdiction TimeSeries from all datasets.
 * Returns a map: jurisdiction ISO3 (or "US" for budget) → TimeSeries[]
 */
export function allDatasetsToTimeSeries(): Map<string, TimeSeries[]> {
  const result = new Map<string, TimeSeries[]>();

  // Merge function: append to existing or create new entry
  const merge = (source: Map<string, TimeSeries[]>) => {
    for (const [key, series] of source) {
      const existing = result.get(key) || [];
      result.set(key, [...existing, ...series]);
    }
  };

  merge(healthComparisonToTimeSeries());
  merge(drugPolicyToTimeSeries());
  merge(educationToTimeSeries());
  merge(criminalJusticeToTimeSeries());

  // US federal budget as its own jurisdiction
  const usSeries = result.get('USA') || [];
  result.set('USA', [...usSeries, ...budgetToTimeSeries(), ...budgetOutcomesToTimeSeries()]);

  return result;
}

/**
 * Get cross-country TimeSeries for a single variable across all countries.
 * Useful for cross-sectional analysis (e.g., "life expectancy for all countries").
 *
 * @param variableSuffix - The suffix after the ISO3 prefix (e.g., "life_expectancy")
 * @returns Array of {country, timeSeries} pairs
 */
export function getCrossCountryVariable(
  variableSuffix: string,
): { country: string; timeSeries: TimeSeries }[] {
  const all = allDatasetsToTimeSeries();
  const results: { country: string; timeSeries: TimeSeries }[] = [];

  for (const [iso3, seriesList] of all) {
    const match = seriesList.find((s) => s.variableId.endsWith(`:${variableSuffix}`));
    if (match) {
      results.push({ country: iso3, timeSeries: match });
    }
  }

  return results;
}

// ─── OECD Budget Panel → SpendingOutcomePoint ─────────────────────────────

/** A spending-outcome observation suitable for diminishing-returns fitting */
export interface SpendingOutcomePoint {
  spending: number;
  outcome: number;
  jurisdiction: string;
  year: number;
}

/**
 * Extract spending→outcome pairs from the OECD Budget Panel dataset.
 *
 * Uses per-capita PPP spending fields (not % GDP) to avoid the GDP-denominator
 * distortion. Filters out rows where either field is null.
 *
 * @param spendingField - Per-capita PPP spending field (e.g., 'healthSpendingPerCapitaPpp')
 * @param outcomeField  - Outcome field (e.g., 'lifeExpectancyYears')
 * @returns Array of spending→outcome points with jurisdiction and year
 */
export function oecdBudgetPanelToSpendingOutcome(
  spendingField: keyof OECDBudgetPanelDataPoint,
  outcomeField: keyof OECDBudgetPanelDataPoint,
): SpendingOutcomePoint[] {
  return OECD_BUDGET_PANEL
    .filter(row => row[spendingField] != null && row[outcomeField] != null)
    .map(row => ({
      spending: row[spendingField] as number,
      outcome: row[outcomeField] as number,
      jurisdiction: row.jurisdictionIso3,
      year: row.year,
    }));
}

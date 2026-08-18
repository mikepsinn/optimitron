/**
 * Collapse Clock constants and projection math.
 *
 * Values sourced from parameters-calculations-citations.ts where available.
 * See that file for full citations and confidence intervals.
 */

import {
  GDP_BASELINE_GROWTH_RATE,
  GLOBAL_DISEASE_DEATHS_DAILY,
  GLOBAL_MILITARY_SPENDING_ANNUAL_2024,
  GLOBAL_CYBERCRIME_COST_ANNUAL_2025,
  GLOBAL_CYBERCRIME_CAGR,
  GLOBAL_GDP_2025,
  POLITICAL_DYSFUNCTION_GLOBAL_OPPORTUNITY_COST_TOTAL,
  TRADITIONAL_PHASE3_COST_PER_PATIENT,
  TREATY_TRAJECTORY_CAGR_YEAR_20,
  WISHONIA_TRAJECTORY_CAGR_YEAR_20,
} from "@optimitron/data/parameters";

// ── Base constants ──────────────────────────────────────────────────

/** Preventable deaths per day (WHO, treatable diseases) */
export const DEATHS_PER_DAY = GLOBAL_DISEASE_DEATHS_DAILY.value;

/** Destructive economy baseline in trillions (military + cybercrime, 2024) */
export const DESTRUCTIVE_BASE_T =
  (GLOBAL_MILITARY_SPENDING_ANNUAL_2024.value +
    GLOBAL_CYBERCRIME_COST_ANNUAL_2025.value) /
  1e12;

/** Destructive economy compound annual growth rate */
export const DESTRUCTIVE_CAGR = GLOBAL_CYBERCRIME_CAGR.value;

/** Global GDP baseline in trillions (2024) */
export const GLOBAL_GDP_T = GLOBAL_GDP_2025.value / 1e12;

/** Productive economy compound annual growth rate (GDP_BASELINE_GROWTH_RATE from parameters) */
export const PRODUCTIVE_CAGR = GDP_BASELINE_GROWTH_RATE.value;

/** Collapse threshold: destructive/GDP ratio (Soviet precedent 20-25%).
 * Matches DESTRUCTIVE_ECONOMY_25PCT_YEAR parameter formula threshold. */
export const COLLAPSE_RATIO = 0.25;

/** Baseline date for all projections */
export const BASELINE_DATE = new Date("2024-01-01T00:00:00Z");

/** Number of years to project in the trajectory chart */
export const PROJECTION_YEARS = 20;

/** 1% Treaty scenario: CAGR implied by Treaty Trajectory GDP over 20 years */
export const TREATY_CAGR = TREATY_TRAJECTORY_CAGR_YEAR_20.value;

/** Wishonia full optimization scenario: CAGR implied by Wishonia Trajectory GDP over 20 years */
export const WISHONIA_CAGR = WISHONIA_TRAJECTORY_CAGR_YEAR_20.value;

/** Political Dysfunction Tax per year in USD (page hero stat) */
export const DYSFUNCTION_TAX_PER_YEAR = POLITICAL_DYSFUNCTION_GLOBAL_OPPORTUNITY_COST_TOTAL.value;

/** Average cost of a Phase III clinical trial.
 * Uses TRADITIONAL_PHASE3_COST_PER_PATIENT × typical Phase III enrollment (~4,000 patients). */
export const CLINICAL_TRIAL_COST = TRADITIONAL_PHASE3_COST_PER_PATIENT.value * 4000;

const SECONDS_PER_YEAR = 365.25 * 86_400;

// ── Derived per-second rates ────────────────────────────────────────

/** Deaths per second from treatable diseases */
export const DEATHS_PER_SECOND = DEATHS_PER_DAY / 86_400; // ~1.736

/** Dysfunction tax per second */
export const DYSFUNCTION_TAX_PER_SECOND =
  DYSFUNCTION_TAX_PER_YEAR / SECONDS_PER_YEAR; // ~$3.2M

/** Destructive economy per second (military + cybercrime) */
export const DESTRUCTIVE_PER_SECOND =
  (DESTRUCTIVE_BASE_T * 1e12) / SECONDS_PER_YEAR; // ~$418K

/** Clinical trials that could be funded per second with dysfunction waste */
export const TRIALS_UNFUNDED_PER_SECOND =
  DYSFUNCTION_TAX_PER_SECOND / CLINICAL_TRIAL_COST; // ~0.064

// ── Projection functions ────────────────────────────────────────────

/**
 * Solve for t where destructive/GDP >= COLLAPSE_RATIO:
 *   DESTRUCTIVE_BASE_T * (1 + DESTRUCTIVE_CAGR)^t / (GLOBAL_GDP_T * (1 + PRODUCTIVE_CAGR)^t) >= COLLAPSE_RATIO
 *
 * Rearranging:
 *   t = ln(COLLAPSE_RATIO * GLOBAL_GDP_T / DESTRUCTIVE_BASE_T) / ln((1 + DESTRUCTIVE_CAGR) / (1 + PRODUCTIVE_CAGR))
 */
export function computeCollapseYears(): number {
  const numerator = Math.log(
    (COLLAPSE_RATIO * GLOBAL_GDP_T) / DESTRUCTIVE_BASE_T,
  );
  const denominator = Math.log(
    (1 + DESTRUCTIVE_CAGR) / (1 + PRODUCTIVE_CAGR),
  );
  return numerator / denominator;
}

/**
 * Returns the projected collapse date.
 */
export function computeCollapseDate(): Date {
  const years = computeCollapseYears();
  const ms = BASELINE_DATE.getTime() + years * 365.25 * 24 * 60 * 60 * 1000;
  return new Date(ms);
}

export interface TrajectoryPoint {
  year: number;
  productive: number;
  destructive: number;
  ratio: number;
}

/**
 * Generate trajectory data for t = 0..PROJECTION_YEARS.
 */
export function generateTrajectoryData(): TrajectoryPoint[] {
  const points: TrajectoryPoint[] = [];
  for (let t = 0; t <= PROJECTION_YEARS; t++) {
    const productive = GLOBAL_GDP_T * Math.pow(1 + PRODUCTIVE_CAGR, t);
    const destructive =
      DESTRUCTIVE_BASE_T * Math.pow(1 + DESTRUCTIVE_CAGR, t);
    points.push({
      year: 2024 + t,
      productive,
      destructive,
      ratio: destructive / productive,
    });
  }
  return points;
}

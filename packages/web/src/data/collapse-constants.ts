/**
 * Collapse Clock constants and projection math.
 *
 * Sources:
 * - Military spending: SIPRI 2024 ($2.72T)
 * - Cybercrime: Cybersecurity Ventures 2024 ($10.5T, 15% CAGR)
 * - Global GDP: World Bank 2024 (~$115T)
 * - Collapse threshold: Soviet precedent (20-25% extraction → collapse)
 * - GDP trajectories: https://manual.warondisease.org/knowledge/economics/gdp-trajectories.html
 */

/** Preventable deaths per day (WHO, treatable diseases) */
export const DEATHS_PER_DAY = 150_000;

/** Derived: deaths per second */
export const DEATHS_PER_SECOND = DEATHS_PER_DAY / 86_400; // ~1.736

/** Political Dysfunction Tax per year in USD (page hero stat) */
export const DYSFUNCTION_TAX_PER_YEAR = 101e12; // $101T

/** Derived: dysfunction tax per second */
export const DYSFUNCTION_TAX_PER_SECOND = DYSFUNCTION_TAX_PER_YEAR / (365.25 * 86_400); // ~$3.2M

/** Destructive economy per second (military + cybercrime, $13.2T/yr) */
export const DESTRUCTIVE_PER_SECOND = DESTRUCTIVE_BASE_T * 1e12 / (365.25 * 86_400); // ~$418K

/** Average cost of a clinical trial (NIH estimate, Phase I-III) */
export const CLINICAL_TRIAL_COST = 50e6; // $50M

/** Treatments unfunded per second (dysfunction waste that could have funded trials) */
export const TRIALS_UNFUNDED_PER_SECOND = DYSFUNCTION_TAX_PER_SECOND / CLINICAL_TRIAL_COST; // ~0.064

/** Destructive economy baseline in trillions (military $2.72T + cybercrime $10.5T, 2024) */
export const DESTRUCTIVE_BASE_T = 13.2;

/** Destructive economy compound annual growth rate */
export const DESTRUCTIVE_CAGR = 0.15;

/** Global GDP baseline in trillions (2024) */
export const GLOBAL_GDP_T = 115;

/** Productive economy compound annual growth rate (~3% real growth) */
export const PRODUCTIVE_CAGR = 0.03;

/** Collapse threshold: destructive/GDP ratio (Soviet precedent 20-25%) */
export const COLLAPSE_RATIO = 0.25;

/** Baseline date for all projections */
export const BASELINE_DATE = new Date("2024-01-01T00:00:00Z");

/** Number of years to project in the trajectory chart */
export const PROJECTION_YEARS = 20;

/** 1% Treaty scenario: destructive CAGR drops to 17.9% of baseline */
export const TREATY_CAGR = 0.179;

/** Wishonia full optimization scenario: destructive CAGR drops to 25.4% of baseline */
export const WISHONIA_CAGR = 0.254;

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
    const destructive = DESTRUCTIVE_BASE_T * Math.pow(1 + DESTRUCTIVE_CAGR, t);
    points.push({
      year: 2024 + t,
      productive,
      destructive,
      ratio: destructive / productive,
    });
  }
  return points;
}

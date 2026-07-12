/**
 * Cash-flow math for the /compute basement-rig calculator.
 *
 * Model: buy N cards up front, rent them on a marketplace at some
 * utilization, pay for power while rented, sell the rig at the horizon
 * for a residual value that drifts by a user-supplied annual rate.
 * Monthly cash flows; IRR solved by bisection and annualized.
 */

/** Wall-power multiplier over GPU TDP for CPU/board/fans/PSU losses. */
export const SYSTEM_POWER_OVERHEAD = 1.2;

export const HOURS_PER_MONTH = 730;

export interface RigScenario {
  cardCount: number;
  /** USD paid per card, today. */
  pricePerCard: number;
  /** Per-card TDP in watts. */
  tdpWatts: number;
  /** Fraction of all hours the rig is rented out (0..1). */
  utilization: number;
  /** Gross marketplace rate, USD per card-hour. */
  rentalPerCardHour: number;
  /** Marketplace fee on rental income (0..1). */
  marketplaceFee: number;
  /** Residential electricity price, USD per kWh. */
  electricityPerKwh: number;
  /** Annual drift in the rig's resale value (0.10 = +10%/yr, -0.30 = -30%/yr). */
  residualAnnualGrowth: number;
  /** Holding period in months. */
  horizonMonths: number;
}

export interface RigOutcome {
  totalInvested: number;
  /** Steady-state net cash per month (rental income minus power). */
  monthlyNet: number;
  /** Estimated resale value of the rig at the horizon. */
  residualValue: number;
  /** Months until cumulative net cash repays the purchase; null if it never does within the horizon. */
  paybackMonths: number | null;
  /** Annualized IRR including the residual sale; null when no rate solves the cash flows. */
  annualizedIrr: number | null;
  /** Total multiple-on-invested minus one over the horizon. */
  totalReturn: number;
}

export function monthlyNetCash(s: RigScenario): number {
  const rentedHours = HOURS_PER_MONTH * clamp01(s.utilization);
  const income =
    s.cardCount * s.rentalPerCardHour * rentedHours * (1 - clamp01(s.marketplaceFee));
  const kwPerCard = (s.tdpWatts * SYSTEM_POWER_OVERHEAD) / 1000;
  const powerCost = s.cardCount * kwPerCard * rentedHours * s.electricityPerKwh;
  return income - powerCost;
}

export function residualValueAt(s: RigScenario): number {
  const invested = s.cardCount * s.pricePerCard;
  const years = s.horizonMonths / 12;
  return invested * Math.pow(1 + s.residualAnnualGrowth, years);
}

function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x));
}

function npvAtMonthlyRate(rate: number, flows: readonly number[]): number {
  let npv = 0;
  for (let t = 0; t < flows.length; t++) {
    npv += (flows[t] ?? 0) / Math.pow(1 + rate, t);
  }
  return npv;
}

/**
 * Solve the monthly IRR by bisection. Returns null when the cash-flow
 * signs admit no root in (-99%, +1000%) monthly.
 */
export function solveMonthlyIrr(flows: readonly number[]): number | null {
  let lo = -0.99;
  let hi = 10;
  let fLo = npvAtMonthlyRate(lo, flows);
  const fHi = npvAtMonthlyRate(hi, flows);
  if (Number.isNaN(fLo) || Number.isNaN(fHi) || fLo * fHi > 0) return null;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    const fMid = npvAtMonthlyRate(mid, flows);
    if (Math.abs(fMid) < 1e-7) return mid;
    if (fLo * fMid < 0) {
      hi = mid;
    } else {
      lo = mid;
      fLo = fMid;
    }
  }
  return (lo + hi) / 2;
}

export function evaluateRig(s: RigScenario): RigOutcome {
  const totalInvested = s.cardCount * s.pricePerCard;
  const monthlyNet = monthlyNetCash(s);
  const residualValue = residualValueAt(s);

  const months = Math.max(1, Math.round(s.horizonMonths));
  const flows: number[] = [-totalInvested];
  for (let t = 1; t < months; t++) flows.push(monthlyNet);
  flows.push(monthlyNet + residualValue);

  let paybackMonths: number | null = null;
  if (monthlyNet > 0) {
    const raw = totalInvested / monthlyNet;
    paybackMonths = raw <= months ? Math.ceil(raw) : null;
  }

  const monthlyIrr = totalInvested > 0 ? solveMonthlyIrr(flows) : null;
  const annualizedIrr =
    monthlyIrr === null ? null : Math.pow(1 + monthlyIrr, 12) - 1;

  const totalCash = monthlyNet * months + residualValue;
  const totalReturn = totalInvested > 0 ? totalCash / totalInvested - 1 : 0;

  return {
    totalInvested,
    monthlyNet,
    residualValue,
    paybackMonths,
    annualizedIrr,
    totalReturn,
  };
}

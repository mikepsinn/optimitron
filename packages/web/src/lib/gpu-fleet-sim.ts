/**
 * Fleet ROI simulation for the /compute Basement Professor analyzer.
 *
 * Pure math, no I/O, no clock, no randomness. Ported verbatim from the
 * reference "GPU Fleet ROI Analyzer" model:
 *
 * - Buy as many card+system units as the budget allows after a setup cost
 *   that scales with fleet size and wattage (dedicated circuits, cooling).
 * - Rent them out monthly at a host rate scaled by a tapered rate-trend path
 *   and an age-based occupancy factor; pay power, fixed overhead, and tax.
 * - Resale at any month = cards at 92% of trended value + 30% of the rest of
 *   the system. Total value = leftover cash + cumulative after-tax net +
 *   resale. Annualized return = (value/invest)^(12/months) - 1.
 *
 * Companion dataset: GPU_FLEET_CATALOG in @optimitron/data.
 */

import type { GpuFleetCard } from "@optimitron/data";

export const HOURS_PER_MONTH = 730;
export const SIM_MONTHS = 60;

/** Cards resell near market value; cases/PSUs/wiring mostly don't. */
export const CARD_RESALE_FRACTION = 0.92;
export const SYSTEM_RESALE_FRACTION = 0.3;

/**
 * Fixed benchmark returns (fractions per year). Not sliders.
 * dcDeveloper = a company that builds AI data centers (ground-up hyperscale
 * projects track 25-40%/yr); neocloud = a big company renting out GPUs
 * (long-term contracted deals lock in roughly 15-20%/yr).
 */
export const BENCHMARK_RETURNS = {
  sp500: 0.1,
  tbill: 0.043,
  realEstate: 0.09,
  dcDeveloper: 0.3,
  neocloud: 0.17,
} as const;

export interface FleetSimState {
  /** Total budget, USD. */
  investUsd: number;
  /** Residential electricity, US cents per kWh. */
  elecCentsPerKwh: number;
  /** % of hours rented out (month 1, before ageing). */
  utilizationPct: number;
  /** Marketplace fee, % of rental revenue. */
  marketplaceFeePct: number;
  /** Flat tax rate on monthly profit, %. */
  taxRatePct: number;
  /** User's global card-price trend, %/yr, added to each card's own drift. */
  cardDriftPctPerYear: number;
  /** Rental-rate trend, %/yr. */
  rateDriftPctPerYear: number;
  /** Holding period in months (12/24/36/60). */
  horizonMonths: number;
}

export const DEFAULT_FLEET_STATE: FleetSimState = {
  investUsd: 100_000,
  elecCentsPerKwh: 16,
  utilizationPct: 70,
  marketplaceFeePct: 20,
  taxRatePct: 30,
  cardDriftPctPerYear: 0,
  rateDriftPctPerYear: -10,
  horizonMonths: 36,
};

export interface FleetScenario {
  /** Host earnings, USD per card-hour. */
  ratePerHourUsd: number;
  utilizationPct: number;
  /** Combined card drift (card's own + global slider +/- scenario shift), %/yr. */
  cardDriftPctPerYear: number;
  rateDriftPctPerYear: number;
  /** Singularity preset: positive trends compound untapered. */
  noTaper: boolean;
}

/**
 * Shortage-premium taper. A positive price/rate trend runs at full strength
 * through month 9 (the confirmed-shortage window), then declines linearly to
 * a 15% residual by month 30 as new fab capacity comes online, and holds
 * there. Negative trends (plain depreciation) are not shortage artifacts and
 * are never tapered.
 */
export function taperFactor(month: number): number {
  if (month <= 9) return 1;
  if (month >= 30) return 0.15;
  return 1 - (0.85 * (month - 9)) / 21;
}

/**
 * Monthly compounding multiplier path over SIM_MONTHS. `annualRate` is a
 * fraction (0.18 = +18%/yr). Positive rates are tapered per taperFactor
 * (evaluated at mid-month) unless `noTaper`; negative rates compound as-is.
 */
export function taperedPath(annualRate: number, noTaper: boolean): number[] {
  const mult: number[] = [1];
  for (let m = 1; m <= SIM_MONTHS; m++) {
    const eff =
      !noTaper && annualRate > 0 ? annualRate * taperFactor(m - 0.5) : annualRate;
    mult[m] = (mult[m - 1] ?? 1) * Math.pow(1 + eff, 1 / 12);
  }
  return mult;
}

/**
 * Renters gravitate to whatever's newest; a card's occupancy softens with
 * age independent of its rate: 100% through month 12, linearly down to 70%
 * by month 60.
 */
export function utilizationAgeFactor(month: number): number {
  if (month <= 12) return 1;
  if (month >= 60) return 0.7;
  return 1 - (0.3 * (month - 12)) / 48;
}

/**
 * One-time setup cost: a card or two needs cables and a shelf; a
 * double-digit-kW fleet needs dedicated 240V circuits and real cooling.
 */
export function setupCostFor(units: number, watts: number): number {
  return Math.round(
    Math.min(2500, 150 + units * 150) +
      Math.max(0, (units * watts) / 1000 - 2) * 500,
  );
}

export interface FleetEconomics {
  units: number;
  setupUsd: number;
  hwCardsUsd: number;
  hwOverheadUsd: number;
  /** Setup + all hardware. */
  capitalUsd: number;
  /** Budget not spent (held as cash). */
  leftoverUsd: number;
  /** Month-1 figures. */
  monthlyKwh: number;
  monthlyGrossUsd: number;
  monthlyFeesUsd: number;
  monthlyPowerUsd: number;
  monthlyFixedUsd: number;
  monthlyTaxUsd: number;
  monthlyNetUsd: number;
  /** First month where cumulative after-tax net repays capital; null if never within SIM_MONTHS. */
  paybackMonths: number | null;
  /** Hardware resale value at month m. */
  resaleAt: (month: number) => number;
  /** leftover + cumulative net + resale at month m. */
  valueAt: (month: number) => number;
  /** (valueAt(T)/invest)^(12/T) - 1; 0 when the budget buys zero units. */
  annualizedAt: (months: number) => number;
}

export function computeFleetEconomics(
  card: GpuFleetCard,
  scenario: FleetScenario,
  state: Pick<
    FleetSimState,
    "investUsd" | "elecCentsPerKwh" | "marketplaceFeePct" | "taxRatePct"
  >,
): FleetEconomics {
  const util0 = scenario.utilizationPct / 100;
  const cardDrift = scenario.cardDriftPctPerYear / 100;
  const rateDrift = scenario.rateDriftPctPerYear / 100;
  const feeFrac = state.marketplaceFeePct / 100;
  const taxFrac = Math.max(0, Math.min(0.6, state.taxRatePct / 100));
  const unitCost = card.priceUsd + card.overheadUsd;

  // Units the budget buys after setup; setup itself depends on units, so
  // estimate, subtract, re-floor, then recompute setup for the final count.
  let units = Math.floor(state.investUsd / unitCost);
  let setupUsd = setupCostFor(units, card.watts);
  units = Math.floor(Math.max(0, state.investUsd - setupUsd) / unitCost);
  setupUsd = setupCostFor(units, card.watts);

  const hwCardsUsd = units * card.priceUsd;
  const hwOverheadUsd = units * card.overheadUsd;
  const capitalUsd = setupUsd + hwCardsUsd + hwOverheadUsd;
  const leftoverUsd = state.investUsd - capitalUsd;

  // Wall power is 1.25x TDP; idle cards still draw 15% of rented load; +15%
  // for cooling. Priced at month-1 utilization for the whole sim.
  const monthlyKwh =
    ((units * (card.watts * 1.25)) / 1000) *
    HOURS_PER_MONTH *
    (util0 + 0.15 * (1 - util0)) *
    1.15;
  const monthlyPowerUsd = (monthlyKwh * state.elecCentsPerKwh) / 100;

  // Internet/insurance/repair reserve ramps with fleet size, plus 1%/yr of
  // hardware value as a maintenance reserve.
  const monthlyFixedUsd =
    Math.min(210, 20 + units * 15) + ((hwCardsUsd + hwOverheadUsd) * 0.01) / 12;

  const monthlyGrossUsd = units * scenario.ratePerHourUsd * HOURS_PER_MONTH * util0;
  const monthlyFeesUsd = monthlyGrossUsd * feeFrac;
  const preTaxNet = monthlyGrossUsd - monthlyFeesUsd - monthlyPowerUsd - monthlyFixedUsd;
  const monthlyTaxUsd = Math.max(0, preTaxNet) * taxFrac;
  const monthlyNetUsd = preTaxNet - monthlyTaxUsd;

  const cardMult = taperedPath(cardDrift, scenario.noTaper);
  const rateMult = taperedPath(rateDrift, scenario.noTaper);

  const cum: number[] = [0];
  let payback: number | null = null;
  for (let m = 1; m <= SIM_MONTHS; m++) {
    const util = util0 * utilizationAgeFactor(m);
    const rateM = scenario.ratePerHourUsd * (rateMult[m] ?? 1);
    const grossM = units * rateM * HOURS_PER_MONTH * util;
    const preTaxM = grossM - grossM * feeFrac - monthlyPowerUsd - monthlyFixedUsd;
    const netM = preTaxM - Math.max(0, preTaxM) * taxFrac;
    cum[m] = (cum[m - 1] ?? 0) + netM;
    if (payback === null && units > 0 && (cum[m] ?? 0) >= capitalUsd) payback = m;
  }

  const clampMonth = (m: number): number =>
    Math.min(SIM_MONTHS, Math.max(0, Math.round(m)));
  const resaleAt = (month: number): number =>
    hwCardsUsd * (cardMult[clampMonth(month)] ?? 1) * CARD_RESALE_FRACTION +
    hwOverheadUsd * SYSTEM_RESALE_FRACTION;
  const valueAt = (month: number): number =>
    leftoverUsd + (cum[clampMonth(month)] ?? 0) + resaleAt(month);
  const annualizedAt = (months: number): number =>
    units === 0
      ? 0
      : Math.pow(Math.max(0.01, valueAt(months)) / state.investUsd, 12 / months) - 1;

  return {
    units,
    setupUsd,
    hwCardsUsd,
    hwOverheadUsd,
    capitalUsd,
    leftoverUsd,
    monthlyKwh,
    monthlyGrossUsd,
    monthlyFeesUsd,
    monthlyPowerUsd,
    monthlyFixedUsd,
    monthlyTaxUsd,
    monthlyNetUsd,
    paybackMonths: payback,
    resaleAt,
    valueAt,
    annualizedAt,
  };
}

export interface FleetScenarioSet {
  base: FleetScenario;
  lo: FleetScenario;
  hi: FleetScenario;
}

/**
 * Base uses the card's base rate and the user's sliders; lo/hi shift rate,
 * utilization, and both drifts to the card's worst/best published bands.
 */
export function scenariosFor(
  card: GpuFleetCard,
  state: Pick<
    FleetSimState,
    "utilizationPct" | "cardDriftPctPerYear" | "rateDriftPctPerYear"
  >,
  noTaper: boolean,
): FleetScenarioSet {
  const d = card.resaleDriftPctPerYear + state.cardDriftPctPerYear;
  return {
    base: {
      ratePerHourUsd: card.ratePerHourUsd,
      utilizationPct: state.utilizationPct,
      cardDriftPctPerYear: d,
      rateDriftPctPerYear: state.rateDriftPctPerYear,
      noTaper,
    },
    lo: {
      ratePerHourUsd: card.rateLowPerHourUsd,
      utilizationPct: Math.max(20, state.utilizationPct - 15),
      cardDriftPctPerYear: d - 12,
      rateDriftPctPerYear: state.rateDriftPctPerYear - 15,
      noTaper,
    },
    hi: {
      ratePerHourUsd: card.rateHighPerHourUsd,
      utilizationPct: Math.min(95, state.utilizationPct + 10),
      cardDriftPctPerYear: d + 10,
      rateDriftPctPerYear: state.rateDriftPctPerYear + 10,
      noTaper,
    },
  };
}

/** invest * (1 + annualReturn)^(months/12). */
export function benchmarkValue(
  investUsd: number,
  annualReturn: number,
  month: number,
): number {
  return investUsd * Math.pow(1 + annualReturn, month / 12);
}

/** Cash eroded by inflation: invest * (1 - inflation)^(months/12). */
export function cashValue(
  investUsd: number,
  inflationPctPerYear: number,
  month: number,
): number {
  return investUsd * Math.pow(1 - inflationPctPerYear / 100, month / 12);
}

/** GLM 5.2 (~700B params) memory needs by quality setting, GB. */
export const GLM_MEMORY_GB = {
  fp8: 800,
  q4: 440,
  q3: 340,
} as const;

export type GlmQuant = keyof typeof GLM_MEMORY_GB;

export type GlmVerdict =
  | "Fleet too small"
  | "Yes — clean fit"
  | "Impractical"
  | "Yes, with effort";

export interface GlmFit {
  cardsNeeded: number;
  pooledVramGb: number;
  hardwareCostUsd: number;
  powerKw: number;
  verdict: GlmVerdict;
}

export function glmFit(
  card: GpuFleetCard,
  quant: GlmQuant,
  fleetUnits: number,
): GlmFit {
  const needGb = GLM_MEMORY_GB[quant];
  const cardsNeeded = Math.ceil(needGb / card.vramGb);
  const verdict: GlmVerdict =
    fleetUnits < cardsNeeded
      ? "Fleet too small"
      : card.vramGb >= 80
        ? "Yes — clean fit"
        : cardsNeeded > 16
          ? "Impractical"
          : "Yes, with effort";
  return {
    cardsNeeded,
    pooledVramGb: cardsNeeded * card.vramGb,
    hardwareCostUsd: cardsNeeded * (card.priceUsd + card.overheadUsd),
    powerKw: (cardsNeeded * card.watts * 1.25) / 1000,
    verdict,
  };
}

export type FleetPresetId =
  | "best"
  | "base"
  | "worst"
  | "restrict"
  | "singularity";

export interface FleetPreset {
  id: FleetPresetId;
  name: string;
  description: string;
  utilizationPct: number;
  cardDriftPctPerYear: number;
  rateDriftPctPerYear: number;
  noTaper: boolean;
}

/** Scenario presets. Each sets only utilization + the two trend sliders. */
export const FLEET_PRESETS: FleetPreset[] = [
  {
    id: "best",
    name: "Shortage ends by late 2026",
    description:
      "Chip factories catch up by late 2026 — card prices and rental rates start cooling. Lowest returns for this investment.",
    utilizationPct: 60,
    cardDriftPctPerYear: -15,
    rateDriftPctPerYear: -20,
    noTaper: false,
  },
  {
    id: "base",
    name: "Shortage eases by mid-2027",
    description:
      "The timeline most analyst reports converge on: still tight through 2026, roughly normal by mid-2027 — though these forecasts have been sliding later, not earlier, all year.",
    utilizationPct: 68,
    cardDriftPctPerYear: 0,
    rateDriftPctPerYear: -8,
    noTaper: false,
  },
  {
    id: "worst",
    name: "Shortage lasts into 2028",
    description:
      "AI data centers keep buying up all the memory chips — no relief for years. Best returns for this investment.",
    utilizationPct: 80,
    cardDriftPctPerYear: 15,
    rateDriftPctPerYear: 5,
    noTaper: false,
  },
  {
    id: "restrict",
    name: "Governments restrict AI chips",
    description:
      "If owning powerful GPUs ever needs a license or hits a quota, cards you already own could get more valuable, not less.",
    utilizationPct: 85,
    cardDriftPctPerYear: 20,
    rateDriftPctPerYear: 12,
    noTaper: false,
  },
  {
    id: "singularity",
    name: "AI takes off very fast (extreme case)",
    description:
      "No probability estimate — sliders are just pushed to this page's max, not a real projection.",
    utilizationPct: 95,
    cardDriftPctPerYear: 70,
    rateDriftPctPerYear: 60,
    noTaper: true,
  },
];

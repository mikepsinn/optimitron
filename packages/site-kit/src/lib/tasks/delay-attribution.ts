/**
 * Delay attribution — computes "share of the treaty-level cost of delay" that
 * can be attributed to a specific signer based on their country's share of
 * global military spending.
 *
 * The core argument:
 *   - Every day the 1% Treaty is unsigned, disease keeps killing people.
 *   - Per WHO Global Burden of Disease 2024: ~150K deaths/day and ~$40.8B/day
 *     in direct medical + productivity cost (sum of GLOBAL_DISEASE_DIRECT_MEDICAL_COST_ANNUAL
 *     and GLOBAL_DISEASE_PRODUCTIVITY_LOSS_ANNUAL, divided by 365).
 *   - Each country's share of the treaty fund = its military / global military.
 *   - Therefore each signer's share of the delay cost = the same ratio.
 *
 * That's the math a journalist can verify with one Google search of the cited
 * WHO/SIPRI numbers. No DALY welfare valuation gymnastics.
 */

import {
  GLOBAL_DISEASE_DEATHS_DAILY,
  GLOBAL_DISEASE_DIRECT_MEDICAL_COST_ANNUAL,
  GLOBAL_DISEASE_PRODUCTIVITY_LOSS_ANNUAL,
  GLOBAL_MILITARY_SPENDING_ANNUAL_2024,
} from "@optimitron/data/parameters";

/** Daily global deaths from disease + aging, per WHO GBD 2024. */
export const DAILY_DISEASE_DEATHS = GLOBAL_DISEASE_DEATHS_DAILY.value;

/**
 * Daily global cost of disease in direct medical + productivity-loss dollars.
 * Sum of the two hard-market parameters, divided by 365. No QALY welfare
 * valuation — these are real dollars that actually change hands.
 */
export const DAILY_DISEASE_COST_USD =
  (GLOBAL_DISEASE_DIRECT_MEDICAL_COST_ANNUAL.value +
    GLOBAL_DISEASE_PRODUCTIVITY_LOSS_ANNUAL.value) /
  365;

/** Total global military spending, 2024, per SIPRI. */
export const GLOBAL_MILITARY_USD = GLOBAL_MILITARY_SPENDING_ANNUAL_2024.value;

export interface DelayAttribution {
  /** Share of global military spending (0 to 1). */
  shareOfGlobalMilitary: number;
  /** Deaths attributable to this signer's share of the delay. */
  deathsFromDelay: number;
  /** USD attributable to this signer's share of the delay. */
  wastedUsd: number;
}

export interface TreatyLevelCostOfDelay {
  /** Total deaths across all days of delay (full 100%). */
  deathsFromDelay: number;
  /** Total USD wasted across all days of delay (full 100%). */
  wastedUsd: number;
}

/**
 * Compute a signer's share of the treaty-level delay cost, proportional to
 * their country's share of global military spending.
 *
 * Returns null when there's no budget or no delay — the caller should render
 * a dash or hide the cell.
 */
export function getSignerDelayAttribution(
  countryMilitaryBudgetUsd: number | null | undefined,
  currentDelayDays: number,
): DelayAttribution | null {
  if (countryMilitaryBudgetUsd == null || countryMilitaryBudgetUsd <= 0) {
    return null;
  }
  if (currentDelayDays <= 0) return null;
  const share = countryMilitaryBudgetUsd / GLOBAL_MILITARY_USD;
  return {
    shareOfGlobalMilitary: share,
    deathsFromDelay: DAILY_DISEASE_DEATHS * currentDelayDays * share,
    wastedUsd: DAILY_DISEASE_COST_USD * currentDelayDays * share,
  };
}

/**
 * Compute the full treaty-level cost of delay (no per-signer attribution).
 * Used on parent task rows, treaty detail page, and OG images showing the
 * full treaty scope.
 */
export function getTreatyLevelCostOfDelay(
  currentDelayDays: number,
): TreatyLevelCostOfDelay | null {
  if (currentDelayDays <= 0) return null;
  return {
    deathsFromDelay: DAILY_DISEASE_DEATHS * currentDelayDays,
    wastedUsd: DAILY_DISEASE_COST_USD * currentDelayDays,
  };
}

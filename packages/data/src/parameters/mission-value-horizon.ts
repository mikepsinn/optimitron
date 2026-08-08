import {
  DISEASE_BURDEN_GDP_DRAG_PCT,
  GLOBAL_ANNUAL_DIRECT_INDIRECT_WAR_COST,
  GLOBAL_GDP_2025,
  GLOBAL_LIFE_EXPECTANCY_2024,
} from "./parameters-calculations-citations";

/**
 * The single evaluation horizon for task expected values: one human lifetime,
 * measured rather than chosen.
 *
 * Full rules in docs/EXPECTED_VALUE_METHODOLOGY.md. In short: conditional value
 * is an annual welfare effect multiplied by this horizon, undiscounted, with
 * probability carried separately in `successProbabilityBase`.
 *
 * Discount rate is zero deliberately. Uncertainty is already priced by the
 * probability, so discounting for risk would charge for it twice; what remains
 * is pure time preference, which is an ethical choice rather than a
 * measurement. Zero makes that choice uniform and visible, and lets a reader
 * who disagrees apply their own rate to a stated undiscounted number.
 *
 * Note the parameters named GLOBAL_WAR_COST_LIFETIME_* use an 80-year
 * "lifespan" and compound at SIPRI's real CAGR. They predate this constant and
 * feed published manual pages, so they are not silently rewritten here. The
 * measured figure is 73.4 -- GLOBAL_LIFE_EXPECTANCY_2024 itself was corrected
 * down from 79 by adversarial review on the principle that a measured external
 * parameter must carry the measured value. Reconciling those two is a
 * follow-up, not a side effect of this file.
 */
export const MISSION_VALUE_HORIZON_YEARS = GLOBAL_LIFE_EXPECTANCY_2024.value;

/** Annual welfare effect -> conditional value over one lifetime, undiscounted. */
export function toLifetimeValue(annualValue: number) {
  return annualValue * MISSION_VALUE_HORIZON_YEARS;
}

/**
 * Ending war: the full direct + indirect annual cost of war, over a lifetime.
 *
 * Deliberately NOT the peace dividend. PEACE_DIVIDEND_ANNUAL_SOCIETAL_BENEFIT
 * is the gain from a *one percent* redirection, which is what the treaty asks
 * for; the mission is the whole quantity, so it uses the whole cost.
 */
export const END_WAR_LIFETIME_VALUE_USD = toLifetimeValue(
  GLOBAL_ANNUAL_DIRECT_INDIRECT_WAR_COST.value,
);

/**
 * Ending disease: the share of GDP disease currently consumes, over a lifetime.
 *
 * Economic drag only (lost productivity plus medical costs diverted from
 * productive use). It does not price the suffering itself -- that belongs in
 * the DALY fields, on the same horizon and the same zero discount rate.
 */
export const END_DISEASE_LIFETIME_VALUE_USD = toLifetimeValue(
  DISEASE_BURDEN_GDP_DRAG_PCT.value * GLOBAL_GDP_2025.value,
);

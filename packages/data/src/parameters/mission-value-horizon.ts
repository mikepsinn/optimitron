import {
  DISEASE_BURDEN_GDP_DRAG_PCT,
  GLOBAL_ANNUAL_DIRECT_INDIRECT_WAR_COST,
  GLOBAL_GDP_2025,
  GLOBAL_LIFE_EXPECTANCY_2024,
} from "./parameters-calculations-citations";

export const VALUE_IF_ACHIEVED_USD_METRIC_KEY = "value_if_achieved_usd";

/**
 * Chosen comparison period for mission outcome scenarios.
 *
 * The value comes from global life expectancy at birth. That source does not
 * make this a universal task duration. Task estimates keep the duration that
 * their own evidence supports.
 */
export const MISSION_VALUE_HORIZON_YEARS = GLOBAL_LIFE_EXPECTANCY_2024.value;

/** Annual outcome value -> flat, immediate, undiscounted mission scenario. */
function toMissionScenarioValue(annualValue: number) {
  return annualValue * MISSION_VALUE_HORIZON_YEARS;
}

/**
 * Ending war: value if achieved under the mission comparison scenario.
 *
 * This is not expected value. The mission probability is not estimated.
 */
export const END_WAR_MISSION_SCENARIO_VALUE_USD = toMissionScenarioValue(
  GLOBAL_ANNUAL_DIRECT_INDIRECT_WAR_COST.value,
);

/**
 * Ending disease: value if achieved under the mission comparison scenario.
 *
 * This covers economic drag only. It does not price suffering and is not
 * expected value. The mission probability is not estimated.
 */
export const END_DISEASE_MISSION_SCENARIO_VALUE_USD = toMissionScenarioValue(
  DISEASE_BURDEN_GDP_DRAG_PCT.value * GLOBAL_GDP_2025.value,
);

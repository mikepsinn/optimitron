import {
  DISEASE_BURDEN_GDP_DRAG_PCT,
  GLOBAL_ANNUAL_DIRECT_INDIRECT_WAR_COST,
  GLOBAL_GDP_2025,
  GLOBAL_LIFE_EXPECTANCY_2024,
  GLOBAL_MEDIAN_AFTER_TAX_INCOME_2025,
  GLOBAL_POPULATION_2024,
  POLITICAL_DYSFUNCTION_GLOBAL_OPPORTUNITY_COST_TOTAL,
  PRIZE_TARGET_MEDIAN_INCOME_YEAR_15,
  VALUE_OF_STATISTICAL_LIFE,
} from "./parameters-calculations-citations";
import type { Parameter } from "./parameters-calculations-citations";

export const VALUE_IF_ACHIEVED_USD_METRIC_KEY = "value_if_achieved_usd";

/**
 * Chosen comparison period for mission outcome scenarios.
 *
 * The value comes from global life expectancy at birth. That source does not
 * make this a universal task duration. Task estimates keep the duration that
 * their own evidence supports.
 */
export const MISSION_VALUE_HORIZON_YEARS = GLOBAL_LIFE_EXPECTANCY_2024.value;

/**
 * Observed annual farmed-animal advocacy allocation. This is funding context,
 * not a price for an animal, a welfare preference, or an outcome value.
 */
export const FARMED_ANIMAL_ADVOCACY_SPENDING_2024: Parameter = {
  confidence: "medium",
  conservative: true,
  description:
    "Farmed-animal advocacy funding allocated in 2024. This is an input cost, not a valuation of animal welfare.",
  displayName: "Farmed-animal advocacy spending in 2024",
  parameterName: "FARMED_ANIMAL_ADVOCACY_SPENDING_2024",
  sourceType: "external",
  sourceUrl:
    "https://animalcharityevaluators.org/blog/better-for-animals-the-evidence-behind-conducting-research-for-effective-advocacy/",
  unit: "USD/year",
  value: 260_000_000,
};

/** Annual outcome value -> flat, immediate, undiscounted mission scenario. */
function toMissionScenarioValue(annualValue: number) {
  return annualValue * MISSION_VALUE_HORIZON_YEARS;
}

/**
 * Optimizing Earth: recapture the annual global opportunity cost of governance
 * failures over the common mission comparison period.
 *
 * This is a non-additive root scenario. It does not add child mission values.
 * Disease productivity losses and medical costs overlap this opportunity-cost
 * estimate. This is not expected value because success probability is unknown.
 */
export const OPTIMIZE_EARTH_MISSION_SCENARIO_VALUE_USD = toMissionScenarioValue(
  POLITICAL_DYSFUNCTION_GLOBAL_OPPORTUNITY_COST_TOTAL.value,
);

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

/**
 * Ending poverty: population-equivalent value of closing the annual gap from
 * the current global median income to the 2040 prize target.
 *
 * This is not expected value. The mission probability is not estimated.
 */
export const END_POVERTY_MISSION_SCENARIO_VALUE_USD = toMissionScenarioValue(
  (PRIZE_TARGET_MEDIAN_INCOME_YEAR_15.value -
    GLOBAL_MEDIAN_AFTER_TAX_INCOME_2025.value) *
    GLOBAL_POPULATION_2024.value,
);

/**
 * Preventing extinction reference scenario: current human lives valued once.
 * This excludes all future generations and does not use the mission horizon.
 *
 * This is not comparable with the annual-flow mission scenarios. It is not
 * expected value. The mission probability is not estimated.
 */
export const PREVENT_EXTINCTION_MISSION_SCENARIO_VALUE_USD =
  GLOBAL_POPULATION_2024.value * VALUE_OF_STATISTICAL_LIFE.value;

/**
 * Farmed-animal advocacy spending over the mission comparison period. This is
 * funding context only. It is not the value of minimizing animal suffering.
 *
 * This is not expected value and must not enter mission or task ranking.
 */
export const MINIMIZE_ANIMAL_SUFFERING_MISSION_SCENARIO_VALUE_USD =
  toMissionScenarioValue(FARMED_ANIMAL_ADVOCACY_SPENDING_2024.value);

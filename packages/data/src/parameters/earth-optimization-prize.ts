import {
  GLOBAL_HALE_CURRENT,
  TREATY_PROJECTED_HALE_YEAR_15,
  TREATY_HALE_GAIN_YEAR_15,
  CURRENT_TRAJECTORY_AVG_INCOME_YEAR_15,
  TREATY_TRAJECTORY_AVG_INCOME_YEAR_15,
} from './parameters-calculations-citations';

export const EARTH_OPTIMIZATION_PRIZE_DEADLINE_YEAR = 2040;
export const EARTH_OPTIMIZATION_PRIZE_DEADLINE = new Date('2040-12-31T23:59:59Z');
export const EARTH_OPTIMIZATION_PRIZE_MANUAL_URL =
  'https://manual.warondisease.org/knowledge/strategy/earth-optimization-prize.html';
export const EARTH_OPTIMIZATION_PRIZE_GDP_TRAJECTORIES_URL =
  'https://manual.warondisease.org/knowledge/economics/gdp-trajectories.html';

export interface EarthOptimizationPrizeWinCondition {
  deadline: Date;
  deadlineYear: number;
  hale: {
    baseline: number;
    target: number;
    deltaRequired: number;
    unit: 'years';
  };
  medianIncome: {
    baseline: number;
    target: number;
    deltaRequired: number;
    unit: 'USD';
  };
  manualUrl: string;
  gdpTrajectoriesUrl: string;
}

const medianIncomeDelta =
  TREATY_TRAJECTORY_AVG_INCOME_YEAR_15.value -
  CURRENT_TRAJECTORY_AVG_INCOME_YEAR_15.value;

const YEARS_TO_2040 = 15;

// Continuous-compounding pp/year uplift that maps the baseline 2040 trajectory
// onto the treaty 2040 trajectory over 15 years. This is the extra real growth
// rate the treaty buys on top of status quo: ln(treaty/baseline)/years.
export const EARTH_OPTIMIZATION_PRIZE_INCOME_GROWTH_EFFECT_PP_PER_YEAR =
  (Math.log(
    TREATY_TRAJECTORY_AVG_INCOME_YEAR_15.value /
      CURRENT_TRAJECTORY_AVG_INCOME_YEAR_15.value,
  ) /
    YEARS_TO_2040) *
  100;

export const earthOptimizationPrizeWinCondition: EarthOptimizationPrizeWinCondition = {
  deadline: EARTH_OPTIMIZATION_PRIZE_DEADLINE,
  deadlineYear: EARTH_OPTIMIZATION_PRIZE_DEADLINE_YEAR,
  hale: {
    baseline: GLOBAL_HALE_CURRENT.value,
    target: TREATY_PROJECTED_HALE_YEAR_15.value,
    deltaRequired: TREATY_HALE_GAIN_YEAR_15.value,
    unit: 'years',
  },
  medianIncome: {
    baseline: CURRENT_TRAJECTORY_AVG_INCOME_YEAR_15.value,
    target: TREATY_TRAJECTORY_AVG_INCOME_YEAR_15.value,
    deltaRequired: medianIncomeDelta,
    unit: 'USD',
  },
  manualUrl: EARTH_OPTIMIZATION_PRIZE_MANUAL_URL,
  gdpTrajectoriesUrl: EARTH_OPTIMIZATION_PRIZE_GDP_TRAJECTORIES_URL,
};

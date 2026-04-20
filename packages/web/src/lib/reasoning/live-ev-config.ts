import {
  SHARING_OPPORTUNITY_COST,
  STANDARD_ECONOMIC_QALY_VALUE_USD,
  VOTER_LIVES_SAVED,
  VOTER_SUFFERING_HOURS_PREVENTED,
} from "@optimitron/data/parameters";
import type { EvConfig } from "./ev";

export const LIVE_EV_CONFIG: EvConfig = {
  livesPerVote: VOTER_LIVES_SAVED.value,
  sufferingHoursPerVote: VOTER_SUFFERING_HOURS_PREVENTED.value,
  usdPerQaly: STANDARD_ECONOMIC_QALY_VALUE_USD.value,
  forwardCostUsd: SHARING_OPPORTUNITY_COST.value,
  defaultConversionP: 0.1,
  minProbability: 0.01,
  conversionBounds: [0.01, 1.0],
};

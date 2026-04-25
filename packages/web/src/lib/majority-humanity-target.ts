import {
  GLOBAL_REGISTERED_VOTERS,
  type Parameter,
} from "@optimitron/data/parameters";

export const MAJORITY_OF_HUMANS_ON_EARTH: Parameter = {
  ...GLOBAL_REGISTERED_VOTERS,
  displayName: "Majority of humans on Earth",
  description:
    "The campaign target used as the denominator for per-vote treaty impact: a majority of humans on Earth.",
  unit: "people",
};

export const MAJORITY_OF_HUMANS_ON_EARTH_VALUE =
  MAJORITY_OF_HUMANS_ON_EARTH.value;

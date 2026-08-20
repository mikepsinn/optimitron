import {
  GLOBAL_COORDINATION_TARGET_PCT,
  GLOBAL_REGISTERED_VOTERS,
  type Parameter,
} from "@optimitron/data/parameters"

export const MAJORITY_OF_HUMANS_ON_EARTH: Parameter = {
  ...GLOBAL_REGISTERED_VOTERS,
  displayName: "Majority of humans on Earth",
  description:
    "The generated majority-of-humanity denominator used for coordination and per-vote impact math.",
}

export const MAJORITY_OF_HUMANS_SHARE_OF_EARTH: Parameter = {
  ...GLOBAL_COORDINATION_TARGET_PCT,
  displayName: "Majority of humans as share of Earth",
  description:
    "The majority-of-humanity denominator divided by current global population.",
}

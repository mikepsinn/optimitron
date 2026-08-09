import {
  weightSeedImpactFrame,
  type SeedTaskImpactInput,
} from "./seed-impact.js";

export function buildSeedImpactExpectationFields(
  impact: SeedTaskImpactInput,
  omitExpectedValue = false,
) {
  if (omitExpectedValue) {
    return {
      expectedDalysAvertedBase: null,
      expectedEconomicValueUsdBase: null,
      successProbabilityBase: null,
    };
  }

  const weighted = weightSeedImpactFrame(impact);
  return {
    expectedDalysAvertedBase: weighted.expectedDalysAvertedBase,
    expectedEconomicValueUsdBase: weighted.expectedEconomicValueUsdBase,
    successProbabilityBase: impact.successProbabilityBase,
  };
}

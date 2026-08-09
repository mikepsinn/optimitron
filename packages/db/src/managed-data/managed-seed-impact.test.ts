import { describe, expect, it } from "vitest";
import { buildSeedImpactExpectationFields } from "./managed-seed-impact.js";
import type { SeedTaskImpactInput } from "./seed-impact.js";

const treatyImpact = {
  benefitDurationYears: 212,
  conditionalDalysAvertedBase: 500,
  conditionalEconomicValueUsdBase: 10_000,
  delayDalysLostPerDayBase: 2,
  delayEconomicValueUsdLostPerDayBase: 300,
  estimatedCashCostUsdBase: 0,
  successProbabilityBase: 0.01,
} satisfies SeedTaskImpactInput;

describe("buildSeedImpactExpectationFields", () => {
  it("omits probability and expected values for the Optimize Earth root", () => {
    expect(buildSeedImpactExpectationFields(treatyImpact, true)).toEqual({
      expectedDalysAvertedBase: null,
      expectedEconomicValueUsdBase: null,
      successProbabilityBase: null,
    });
  });

  it("keeps the authoritative Treaty frame probability-weighted", () => {
    expect(buildSeedImpactExpectationFields(treatyImpact)).toEqual({
      expectedDalysAvertedBase: 5,
      expectedEconomicValueUsdBase: 100,
      successProbabilityBase: 0.01,
    });
  });
});

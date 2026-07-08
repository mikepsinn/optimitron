import { describe, expect, it } from "vitest";
import { weightSeedImpactFrame } from "./seed-impact.js";

describe("weightSeedImpactFrame", () => {
  it("probability-weights conditional economic value and DALYs", () => {
    const weighted = weightSeedImpactFrame({
      estimatedCashCostUsdBase: 0,
      conditionalEconomicValueUsdBase: 8.478655100264984e16,
      conditionalDalysAvertedBase: 5.65e11,
      delayEconomicValueUsdLostPerDayBase: 1,
      delayDalysLostPerDayBase: 1,
      successProbabilityBase: 0.01,
      benefitDurationYears: 212,
    });

    expect(weighted.expectedEconomicValueUsdBase).toBeCloseTo(
      8.478655100264984e14,
    );
    expect(weighted.expectedDalysAvertedBase).toBeCloseTo(5.65e9);
  });

  it("passes conditional values through unchanged at probability 1", () => {
    const weighted = weightSeedImpactFrame({
      estimatedCashCostUsdBase: 3,
      conditionalEconomicValueUsdBase: 10_000,
      conditionalDalysAvertedBase: 40,
      delayEconomicValueUsdLostPerDayBase: 1,
      delayDalysLostPerDayBase: 1,
      successProbabilityBase: 1,
      benefitDurationYears: 1,
    });

    expect(weighted.expectedEconomicValueUsdBase).toBe(10_000);
    expect(weighted.expectedDalysAvertedBase).toBe(40);
  });
});

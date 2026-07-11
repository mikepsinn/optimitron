import { TaskImpactFrameKey } from "@optimitron/db";
import { describe, expect, it } from "vitest";
import type { TaskImpactFrameSummary } from "./impact";
import { getExplicitEdgeMarginalFrames } from "./marginal-impact";

const downstreamFrame: TaskImpactFrameSummary = {
  annualDiscountRate: 0.03,
  adoptionRampYears: 0,
  benefitDurationYears: 1,
  customFrameLabel: null,
  delayDalysLostPerDayBase: 2,
  delayDalysLostPerDayHigh: 3,
  delayDalysLostPerDayLow: 1,
  delayEconomicValueUsdLostPerDayBase: 10,
  delayEconomicValueUsdLostPerDayHigh: 15,
  delayEconomicValueUsdLostPerDayLow: 5,
  estimatedCashCostUsdBase: 0,
  estimatedCashCostUsdHigh: 0,
  estimatedCashCostUsdLow: 0,
  estimatedEffortHoursBase: 10,
  estimatedEffortHoursHigh: 12,
  estimatedEffortHoursLow: 8,
  evaluationHorizonYears: 1,
  expectedDalysAvertedBase: 100,
  expectedDalysAvertedHigh: 150,
  expectedDalysAvertedLow: 50,
  expectedEconomicValueUsdBase: 1_000,
  expectedEconomicValueUsdHigh: 1_500,
  expectedEconomicValueUsdLow: 500,
  frameKey: TaskImpactFrameKey.ONE_YEAR,
  frameSlug: "downstream",
  medianHealthyLifeYearsEffectBase: 0.1,
  medianHealthyLifeYearsEffectHigh: 0.15,
  medianHealthyLifeYearsEffectLow: 0.05,
  medianIncomeGrowthEffectPpPerYearBase: 0.1,
  medianIncomeGrowthEffectPpPerYearHigh: 0.15,
  medianIncomeGrowthEffectPpPerYearLow: 0.05,
  metrics: [],
  successProbabilityBase: 0.5,
  successProbabilityHigh: 0.7,
  successProbabilityLow: 0.3,
  summaryStatsJson: null,
  timeToImpactStartDays: 0,
};

describe("getExplicitEdgeMarginalFrames", () => {
  it("gives an unannotated edge no inherited value", () => {
    expect(
      getExplicitEdgeMarginalFrames({
        downstreamFrame,
        edge: {},
        sourceTaskId: "upstream",
        sourceTaskTitle: "Do research",
      }),
    ).toEqual([]);
  });

  it("computes probability and time contributions explicitly", () => {
    const frames = getExplicitEdgeMarginalFrames({
      downstreamFrame,
      edge: { probabilityDeltaBase: 0.2, timeDeltaDaysBase: 3 },
      estimatedEffortHours: 2,
      sourceTaskId: "upstream",
      sourceTaskTitle: "Do research",
    });

    expect(frames[0]?.expectedEconomicValueUsdBase).toBe(400);
    expect(frames[0]?.estimatedCashCostUsdBase).toBeNull();
    expect(frames[0]?.estimatedEffortHoursBase).toBe(2);
    expect(frames[1]?.expectedEconomicValueUsdBase).toBe(30);
    expect(frames[1]?.expectedDalysAvertedBase).toBe(6);
    expect(frames[1]?.estimatedEffortHoursBase).toBe(2);
  });

  it("does not invent gross value when downstream probability is unavailable", () => {
    expect(
      getExplicitEdgeMarginalFrames({
        downstreamFrame: {
          ...downstreamFrame,
          successProbabilityBase: null,
        },
        edge: { probabilityDeltaBase: 0.2 },
        sourceTaskId: "upstream",
        sourceTaskTitle: "Do research",
      }),
    ).toEqual([]);
  });
});

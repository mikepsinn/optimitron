import { TaskImpactFrameKey } from "@optimitron/db";
import { describe, expect, it } from "vitest";
import {
  computeParentContributionShare,
  DEFAULT_TASK_IMPACT_FRAME,
  deriveImpactRatios,
  getNormalizedImpactComponents,
  getPrimarySourceArtifact,
  scaleImpactFrameSummary,
  selectImpactFrame,
  sumImpactFrameSummaries,
  type TaskImpactEstimateSetSummary,
  type TaskImpactFrameSummary,
} from "./impact";

const baseEstimateSet: TaskImpactEstimateSetSummary = {
  assumptionsJson: { source: "test" },
  calculationVersion: "calc-v1",
  counterfactualKey: "baseline",
  createdAt: new Date("2026-04-09T00:00:00.000Z"),
  estimateKind: "FORECAST",
  frames: [
    {
      annualDiscountRate: 0.03,
      adoptionRampYears: 0.5,
      benefitDurationYears: 1,
      customFrameLabel: null,
      delayDalysLostPerDayBase: 2,
      delayDalysLostPerDayHigh: 3,
      delayDalysLostPerDayLow: 1,
      delayEconomicValueUsdLostPerDayBase: 10_000,
      delayEconomicValueUsdLostPerDayHigh: 20_000,
      delayEconomicValueUsdLostPerDayLow: 5_000,
      estimatedCashCostUsdBase: 100,
      estimatedCashCostUsdHigh: 120,
      estimatedCashCostUsdLow: 80,
      estimatedEffortHoursBase: 4,
      estimatedEffortHoursHigh: 5,
      estimatedEffortHoursLow: 3,
      evaluationHorizonYears: 1,
      expectedDalysAvertedBase: 40,
      expectedDalysAvertedHigh: 50,
      expectedDalysAvertedLow: 30,
      expectedEconomicValueUsdBase: 200_000,
      expectedEconomicValueUsdHigh: 240_000,
      expectedEconomicValueUsdLow: 150_000,
      frameKey: TaskImpactFrameKey.ONE_YEAR,
      frameSlug: "one-year",
      medianHealthyLifeYearsEffectBase: 0.01,
      medianHealthyLifeYearsEffectHigh: 0.015,
      medianHealthyLifeYearsEffectLow: 0.005,
      medianIncomeGrowthEffectPpPerYearBase: 0.02,
      medianIncomeGrowthEffectPpPerYearHigh: 0.03,
      medianIncomeGrowthEffectPpPerYearLow: 0.01,
      metrics: [],
      successProbabilityBase: 0.2,
      successProbabilityHigh: 0.3,
      successProbabilityLow: 0.1,
      summaryStatsJson: { p95: 0.3 },
      timeToImpactStartDays: 30,
    },
    {
      annualDiscountRate: 0.03,
      adoptionRampYears: 1,
      benefitDurationYears: 20,
      customFrameLabel: null,
      delayDalysLostPerDayBase: 5,
      delayDalysLostPerDayHigh: 8,
      delayDalysLostPerDayLow: 2,
      delayEconomicValueUsdLostPerDayBase: 50_000,
      delayEconomicValueUsdLostPerDayHigh: 70_000,
      delayEconomicValueUsdLostPerDayLow: 25_000,
      estimatedCashCostUsdBase: 250,
      estimatedCashCostUsdHigh: 300,
      estimatedCashCostUsdLow: 200,
      estimatedEffortHoursBase: 10,
      estimatedEffortHoursHigh: 12,
      estimatedEffortHoursLow: 8,
      evaluationHorizonYears: 20,
      expectedDalysAvertedBase: 500,
      expectedDalysAvertedHigh: 700,
      expectedDalysAvertedLow: 350,
      expectedEconomicValueUsdBase: 5_000_000,
      expectedEconomicValueUsdHigh: 7_000_000,
      expectedEconomicValueUsdLow: 3_500_000,
      frameKey: TaskImpactFrameKey.TWENTY_YEAR,
      frameSlug: "twenty-year",
      medianHealthyLifeYearsEffectBase: 0.2,
      medianHealthyLifeYearsEffectHigh: 0.25,
      medianHealthyLifeYearsEffectLow: 0.1,
      medianIncomeGrowthEffectPpPerYearBase: 0.05,
      medianIncomeGrowthEffectPpPerYearHigh: 0.07,
      medianIncomeGrowthEffectPpPerYearLow: 0.03,
      metrics: [
        {
          baseValue: 0.9,
          displayGroup: "opg",
          highValue: null,
          lowValue: null,
          metadataJson: null,
          metricKey: "opg_policy_impact_score",
          summaryStatsJson: null,
          unit: "score",
          valueJson: null,
        },
      ],
      successProbabilityBase: 0.4,
      successProbabilityHigh: 0.5,
      successProbabilityLow: 0.3,
      summaryStatsJson: { p95: 0.5 },
      timeToImpactStartDays: 120,
    },
  ],
  id: "impact_set_1",
  isCurrent: true,
  methodologyKey: "test-method",
  parameterSetHash: "params-v1",
  publicationStatus: "PUBLISHED",
  sourceArtifacts: [
    {
      isPrimary: false,
      sourceArtifact: {
        artifactType: "MANUAL_SECTION",
        contentHash: null,
        sourceKey: "manual:test",
        sourceRef: "manual/test",
        sourceSystem: "MANUAL",
        sourceUrl: "https://manual.example/task",
        title: "Manual section",
        versionKey: "v1",
      },
    },
    {
      isPrimary: true,
      sourceArtifact: {
        artifactType: "OPG_POLICY_REPORT",
        contentHash: null,
        sourceKey: "opg:test",
        sourceRef: "policy/test",
        sourceSystem: "OPG",
        sourceUrl: "https://opg.example/report",
        title: "Policy report",
        versionKey: "v2",
      },
    },
  ],
  sourceSystem: "COMBINED",
};

describe("impact helpers", () => {
  it("defaults to the twenty-year frame and exposes metric lookups", () => {
    const selection = selectImpactFrame(baseEstimateSet);

    expect(DEFAULT_TASK_IMPACT_FRAME).toBe(TaskImpactFrameKey.TWENTY_YEAR);
    expect(selection.selectedFrame?.frameKey).toBe(TaskImpactFrameKey.TWENTY_YEAR);
    expect(selection.metricsByKey.opg_policy_impact_score?.baseValue).toBe(0.9);
  });

  it("selects a requested frame by slug or enum", () => {
    expect(selectImpactFrame(baseEstimateSet, "one-year").selectedFrame?.frameKey).toBe(
      TaskImpactFrameKey.ONE_YEAR,
    );
    expect(selectImpactFrame(baseEstimateSet, TaskImpactFrameKey.ONE_YEAR).selectedFrame?.frameSlug).toBe(
      "one-year",
    );
  });

  it("derives value-per-hour and cost-per-daly from the selected frame", () => {
    const ratios = deriveImpactRatios(baseEstimateSet.frames[1]);

    expect(ratios.expectedValuePerHourDalys).toBe(50);
    expect(ratios.expectedValuePerHourUsd).toBe(500_000);
    expect(ratios.expectedValuePerDollar).toBe(20_000);
    expect(ratios.costPerDalyUsd).toBe(0.5);
  });

  it("normalizes actor-hour and delay signals without mixing raw units", () => {
    const components = getNormalizedImpactComponents(baseEstimateSet.frames[1]);

    expect(components.actorHourComponent).toBeGreaterThan(0);
    expect(components.delayComponent).toBeGreaterThan(0);
    expect(components.actorHourComponent).toBeLessThanOrEqual(1);
    expect(components.delayComponent).toBeLessThanOrEqual(1);
  });

  it("prefers the primary source artifact when available", () => {
    const primary = getPrimarySourceArtifact(baseEstimateSet.sourceArtifacts);

    expect(primary?.sourceKey).toBe("opg:test");
    expect(primary?.sourceUrl).toBe("https://opg.example/report");
  });

  it("scales an impact frame summary for inherited child value", () => {
    const scaled = scaleImpactFrameSummary(baseEstimateSet.frames[1], 0.25, {
      estimatedEffortHoursBase: 0.25,
      frameSlug: "twenty-year-child-share",
      metrics: [],
    });

    expect(scaled.expectedEconomicValueUsdBase).toBe(1_250_000);
    expect(scaled.delayEconomicValueUsdLostPerDayBase).toBe(12_500);
    expect(scaled.estimatedEffortHoursBase).toBe(0.25);
    expect(scaled.frameSlug).toBe("twenty-year-child-share");
  });

  it("keeps success probability unscaled when inheriting a parent share", () => {
    const scaled = scaleImpactFrameSummary(baseEstimateSet.frames[1], 1 / 202, {
      metrics: [],
    });

    expect(scaled.successProbabilityBase).toBe(0.4);
    expect(scaled.successProbabilityHigh).toBe(0.5);
    expect(scaled.successProbabilityLow).toBe(0.3);
    expect(scaled.expectedEconomicValueUsdBase).toBeCloseTo(5_000_000 / 202);
  });

  it("does not sum success probabilities across merged frames", () => {
    const merged = sumImpactFrameSummaries([
      baseEstimateSet.frames[0],
      baseEstimateSet.frames[1],
    ]);

    expect(merged?.successProbabilityBase).toBe(0.2);
    expect(merged?.expectedEconomicValueUsdBase).toBe(5_200_000);
  });

  it("sums impact frames for downstream unlocked value", () => {
    const merged = sumImpactFrameSummaries(
      [
        baseEstimateSet.frames[0],
        scaleImpactFrameSummary(baseEstimateSet.frames[1], 0.5, {
          metrics: [],
        }),
      ],
      {
        estimatedEffortHoursBase: 1,
        frameSlug: "aggregated",
      },
    );

    expect(merged?.expectedEconomicValueUsdBase).toBe(2_700_000);
    expect(merged?.delayEconomicValueUsdLostPerDayBase).toBe(35_000);
    expect(merged?.estimatedEffortHoursBase).toBe(1);
    expect(merged?.frameSlug).toBe("aggregated");
  });

  describe("computeParentContributionShare", () => {
    const frame = (
      hale: number | null,
      income: number | null,
    ): TaskImpactFrameSummary => ({
      ...baseEstimateSet.frames[1]!,
      medianHealthyLifeYearsEffectBase: hale,
      medianIncomeGrowthEffectPpPerYearBase: income,
    });

    it("returns ratios when child consumes part of parent target", () => {
      const parent = frame(21.7, 9.4);
      const child = frame(10.85, 4.7);
      const share = computeParentContributionShare(parent, child);
      expect(share.haleShare).toBeCloseTo(0.5);
      expect(share.incomeShare).toBeCloseTo(0.5);
    });

    it("allows shares greater than 1 when a child overshoots the parent", () => {
      const parent = frame(10, 2);
      const child = frame(15, 3);
      const share = computeParentContributionShare(parent, child);
      expect(share.haleShare).toBe(1.5);
      expect(share.incomeShare).toBe(1.5);
    });

    it("returns null for a metric when either side is missing or zero", () => {
      expect(
        computeParentContributionShare(frame(null, 2), frame(5, 1)),
      ).toEqual({ haleShare: null, incomeShare: 0.5 });
      expect(
        computeParentContributionShare(frame(0, 2), frame(5, 1)),
      ).toEqual({ haleShare: null, incomeShare: 0.5 });
      expect(
        computeParentContributionShare(frame(10, 2), frame(5, null)),
      ).toEqual({ haleShare: 0.5, incomeShare: null });
      expect(computeParentContributionShare(null, frame(5, 1))).toEqual({
        haleShare: null,
        incomeShare: null,
      });
    });
  });
});

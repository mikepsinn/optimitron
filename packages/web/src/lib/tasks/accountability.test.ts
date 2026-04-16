import { TaskImpactFrameKey, TaskStatus } from "@optimitron/db";
import { describe, expect, it } from "vitest";
import { renderTemplate } from "@/components/tasks/blocks/render-template";
import {
  aggregateTaskDelayStats,
  buildTaskShareText,
  buildTaskShareTokens,
  getTaskDelayStats,
} from "./accountability";
import { SHARE_TEMPLATES, getUsableShareTemplates } from "./share-templates";

describe("task accountability helpers", () => {
  it("derives overdue cost from frame-level delay metrics and treaty-specific metrics", () => {
    const now = new Date("2026-04-10T00:00:00.000Z");
    const task = {
      dueAt: new Date("2026-04-05T00:00:00.000Z"),
      impact: {
        selectedFrame: {
          annualDiscountRate: 0.03,
          adoptionRampYears: 1,
          benefitDurationYears: 20,
          customFrameLabel: null,
          delayDalysLostPerDayBase: 100,
          delayDalysLostPerDayHigh: null,
          delayDalysLostPerDayLow: null,
          delayEconomicValueUsdLostPerDayBase: 2_000_000,
          delayEconomicValueUsdLostPerDayHigh: null,
          delayEconomicValueUsdLostPerDayLow: null,
          estimatedCashCostUsdBase: null,
          estimatedCashCostUsdHigh: null,
          estimatedCashCostUsdLow: null,
          estimatedEffortHoursBase: 1,
          estimatedEffortHoursHigh: null,
          estimatedEffortHoursLow: null,
          evaluationHorizonYears: 20,
          expectedDalysAvertedBase: 1_000_000,
          expectedDalysAvertedHigh: null,
          expectedDalysAvertedLow: null,
          expectedEconomicValueUsdBase: 500_000_000,
          expectedEconomicValueUsdHigh: null,
          expectedEconomicValueUsdLow: null,
          frameKey: TaskImpactFrameKey.TWENTY_YEAR,
          frameSlug: "twenty-year",
          medianHealthyLifeYearsEffectBase: null,
          medianHealthyLifeYearsEffectHigh: null,
          medianHealthyLifeYearsEffectLow: null,
          medianIncomeGrowthEffectPpPerYearBase: null,
          medianIncomeGrowthEffectPpPerYearHigh: null,
          medianIncomeGrowthEffectPpPerYearLow: null,
          metrics: [],
          successProbabilityBase: 0.25,
          successProbabilityHigh: null,
          successProbabilityLow: null,
          summaryStatsJson: null,
          timeToImpactStartDays: 30,
        },
        selectedMetrics: {
          contribution_lives_saved_per_pct_point: {
            baseValue: 7305,
            displayGroup: "health",
            highValue: null,
            lowValue: null,
            metadataJson: null,
            metricKey: "contribution_lives_saved_per_pct_point",
            summaryStatsJson: null,
            unit: "lives",
            valueJson: null,
          },
          contribution_suffering_hours_per_pct_point: {
            baseValue: 73050,
            displayGroup: "health",
            highValue: null,
            lowValue: null,
            metadataJson: null,
            metricKey: "contribution_suffering_hours_per_pct_point",
            summaryStatsJson: null,
            unit: "hours",
            valueJson: null,
          },
        },
      },
      status: TaskStatus.ACTIVE,
    };

    const stats = getTaskDelayStats(task, now);

    expect(stats.isOverdue).toBe(true);
    expect(stats.currentDelayDays).toBe(5);
    expect(stats.currentEconomicValueUsdLost).toBe(10_000_000);
    expect(stats.currentHumanLivesLost).toBeCloseTo(5, 5);
    expect(stats.currentSufferingHoursLost).toBeCloseTo(50, 5);
  });

  it("aggregates direct child task delay totals", () => {
    const now = new Date("2026-04-10T00:00:00.000Z");
    const summary = aggregateTaskDelayStats(
      [
        {
          dueAt: new Date("2026-04-08T00:00:00.000Z"),
          impact: {
            selectedFrame: {
              annualDiscountRate: 0.03,
              adoptionRampYears: 1,
              benefitDurationYears: 20,
              customFrameLabel: null,
              delayDalysLostPerDayBase: 0,
              delayDalysLostPerDayHigh: null,
              delayDalysLostPerDayLow: null,
              delayEconomicValueUsdLostPerDayBase: 100,
              delayEconomicValueUsdLostPerDayHigh: null,
              delayEconomicValueUsdLostPerDayLow: null,
              estimatedCashCostUsdBase: null,
              estimatedCashCostUsdHigh: null,
              estimatedCashCostUsdLow: null,
              estimatedEffortHoursBase: 1,
              estimatedEffortHoursHigh: null,
              estimatedEffortHoursLow: null,
              evaluationHorizonYears: 20,
              expectedDalysAvertedBase: 0,
              expectedDalysAvertedHigh: null,
              expectedDalysAvertedLow: null,
              expectedEconomicValueUsdBase: 0,
              expectedEconomicValueUsdHigh: null,
              expectedEconomicValueUsdLow: null,
              frameKey: TaskImpactFrameKey.TWENTY_YEAR,
              frameSlug: "twenty-year",
              medianHealthyLifeYearsEffectBase: null,
              medianHealthyLifeYearsEffectHigh: null,
              medianHealthyLifeYearsEffectLow: null,
              medianIncomeGrowthEffectPpPerYearBase: null,
              medianIncomeGrowthEffectPpPerYearHigh: null,
              medianIncomeGrowthEffectPpPerYearLow: null,
              metrics: [],
              successProbabilityBase: 1,
              successProbabilityHigh: null,
              successProbabilityLow: null,
              summaryStatsJson: null,
              timeToImpactStartDays: 0,
            },
            selectedMetrics: {},
          },
          status: TaskStatus.ACTIVE,
        },
        {
          dueAt: new Date("2026-04-07T00:00:00.000Z"),
          impact: {
            selectedFrame: {
              annualDiscountRate: 0.03,
              adoptionRampYears: 1,
              benefitDurationYears: 20,
              customFrameLabel: null,
              delayDalysLostPerDayBase: 0,
              delayDalysLostPerDayHigh: null,
              delayDalysLostPerDayLow: null,
              delayEconomicValueUsdLostPerDayBase: 200,
              delayEconomicValueUsdLostPerDayHigh: null,
              delayEconomicValueUsdLostPerDayLow: null,
              estimatedCashCostUsdBase: null,
              estimatedCashCostUsdHigh: null,
              estimatedCashCostUsdLow: null,
              estimatedEffortHoursBase: 1,
              estimatedEffortHoursHigh: null,
              estimatedEffortHoursLow: null,
              evaluationHorizonYears: 20,
              expectedDalysAvertedBase: 0,
              expectedDalysAvertedHigh: null,
              expectedDalysAvertedLow: null,
              expectedEconomicValueUsdBase: 0,
              expectedEconomicValueUsdHigh: null,
              expectedEconomicValueUsdLow: null,
              frameKey: TaskImpactFrameKey.TWENTY_YEAR,
              frameSlug: "twenty-year",
              medianHealthyLifeYearsEffectBase: null,
              medianHealthyLifeYearsEffectHigh: null,
              medianHealthyLifeYearsEffectLow: null,
              medianIncomeGrowthEffectPpPerYearBase: null,
              medianIncomeGrowthEffectPpPerYearHigh: null,
              medianIncomeGrowthEffectPpPerYearLow: null,
              metrics: [],
              successProbabilityBase: 1,
              successProbabilityHigh: null,
              successProbabilityLow: null,
              summaryStatsJson: null,
              timeToImpactStartDays: 0,
            },
            selectedMetrics: {},
          },
          status: TaskStatus.VERIFIED,
          verifiedAt: new Date("2026-04-09T00:00:00.000Z"),
        },
      ],
      now,
    );

    expect(summary.overdueTaskCount).toBe(1);
    expect(summary.verifiedTaskCount).toBe(1);
    expect(summary.currentEconomicValueUsdLost).toBe(600);
  });

  it("builds a compact public share sentence", () => {
    const text = buildTaskShareText({
      currentDelayDays: 12,
      currentEconomicValueUsdLost: 1_200_000_000,
      currentHumanLivesLost: 5_500,
      currentSufferingHoursLost: 250_000,
      targetLabel: "President of the United States",
      taskTitle: "President of the United States signs the 1% Treaty",
    });

    expect(text).toContain("12 days overdue");
    expect(text).toContain("lives");
    expect(text).toContain("1% Treaty");
  });
});

describe("buildTaskShareTokens", () => {
  const SIGNER_INPUT = {
    countryCode: "US",
    currentDelayDays: 500,
    currentEconomicValueUsdLost: 10_000_000,
    currentHumanLivesLost: 5_000,
    governmentBudgetUsdPerYear: 7_000_000_000_000,
    leaderHandle: "@realPres",
    militaryBudgetUsdPerYear: 900_000_000_000,
    now: new Date("2026-07-02T00:00:00.000Z"),
    targetLabel: "The President",
    taskTitle: "Sign the 1% Treaty",
  } as const;

  it("resolves every template token for a fully-populated signer", () => {
    const tokens = buildTaskShareTokens(SIGNER_INPUT);

    expect(tokens.leader_name).toBe("The President");
    expect(tokens.country).toBe("United States");
    expect(tokens.leader_handle).toBe("realPres");
    expect(tokens.citizen_name).toBe("A citizen");
    expect(tokens.days_overdue).toBe("500");
    expect(tokens.deaths_from_delay).not.toBe("");
    expect(tokens.money_wasted).not.toBe("");
    expect(tokens.deaths_per_day).not.toBe("");
    expect(tokens.money_wasted_per_day).not.toBe("");
    // Mid-year (day 182 of 365 → ~49.9%) of $7T ≈ $3.49T.
    expect(tokens.government_spending_ytd).toMatch(/\$3\.[0-9]+T/);
  });

  it("leaves optional tokens empty for a non-signer task", () => {
    const tokens = buildTaskShareTokens({
      currentDelayDays: 3,
      currentEconomicValueUsdLost: null,
      currentHumanLivesLost: null,
      targetLabel: "Humanity",
      taskTitle: "Sign up for the prize",
    });

    expect(tokens.country).toBe("");
    expect(tokens.government_spending_ytd).toBe("");
    expect(tokens.leader_handle).toBe("");
    expect(tokens.days_overdue).toBe("3");
    // Treaty-wide per-day rates are always available (no attribution share).
    expect(tokens.deaths_per_day).not.toBe("");
    expect(tokens.money_wasted_per_day).not.toBe("");
  });

  it("uses the supplied citizen_name when provided", () => {
    const tokens = buildTaskShareTokens({
      ...SIGNER_INPUT,
      citizenName: "Alice",
    });

    expect(tokens.citizen_name).toBe("Alice");
  });
});

describe("share-text templates", () => {
  const tokens = buildTaskShareTokens({
    countryCode: "US",
    currentDelayDays: 500,
    currentEconomicValueUsdLost: 10_000_000,
    currentHumanLivesLost: 5_000,
    governmentBudgetUsdPerYear: 7_000_000_000_000,
    leaderHandle: "realPres",
    militaryBudgetUsdPerYear: 900_000_000_000,
    now: new Date("2026-07-02T00:00:00.000Z"),
    targetLabel: "The President",
    taskTitle: "Sign the 1% Treaty",
  });

  for (const template of SHARE_TEMPLATES) {
    it(`renders template "${template.id}" with no leftover placeholders`, () => {
      const rendered = renderTemplate(template.body, tokens);
      expect(rendered).not.toMatch(/\{\w+\}/);
      expect(rendered.length).toBeGreaterThan(0);
    });
  }

  it("filters templates requiring tax data when it is missing", () => {
    const nonSignerTokens = buildTaskShareTokens({
      currentDelayDays: 3,
      currentEconomicValueUsdLost: null,
      currentHumanLivesLost: null,
      targetLabel: "Humanity",
      taskTitle: "Sign up for the prize",
    });

    const usable = getUsableShareTemplates(nonSignerTokens);
    // Every remaining template must not require government_spending_ytd.
    for (const template of usable) {
      expect(template.requiredTokens).not.toContain("government_spending_ytd");
    }
  });
});

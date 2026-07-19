import { TaskClaimPolicy, TaskImpactFrameKey } from "@optimitron/db";
import { describe, expect, it } from "vitest";
import { buildOnePercentTreatyPolicyModelRun } from "./one-percent-treaty-policy-model";

describe("buildOnePercentTreatyPolicyModelRun", () => {
  it("compiles the treaty parameter export into a risk-adjusted policy model run", () => {
    const run = buildOnePercentTreatyPolicyModelRun(
      {
        citations: {
          "icbl-ottawa-treaty": {
            id: "icbl-ottawa-treaty",
            title: "Ottawa Treaty campaign precedent",
            url: "https://example.com/ottawa",
            urls: [],
          },
        },
        sourceFile: "dih_models/parameters.py",
        parameters: {
          CONTRIBUTION_DALYS_PER_PCT_POINT: {
            chapterUrl:
              "https://manual.warondisease.org/knowledge/strategy/earth-optimization-prize.html",
            confidence: "high",
            description: "Expected DALYs averted per percentage point of implementation probability shift.",
            unit: "DALYs",
            value: 5_652_436_733.51,
          },
          CONTRIBUTION_LIVES_SAVED_PER_PCT_POINT: {
            description: "Expected lives saved per percentage point of implementation probability shift.",
            unit: "lives",
            value: 107_455_177.49,
          },
          CONTRIBUTION_SUFFERING_HOURS_PER_PCT_POINT: {
            description: "Expected suffering hours eliminated per percentage point of implementation probability shift.",
            unit: "hours",
            value: 19_310_984_856_363.5,
          },
          DFDA_TRIAL_CAPACITY_MULTIPLIER: {
            chapterUrl:
              "https://manual.warondisease.org/knowledge/economics/1-pct-treaty-impact.html",
            confidence: "high",
            description: "Trial capacity multiplier from dFDA funding.",
            unit: "x",
            value: 12.3279134327,
          },
          DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_DALYS: {
            chapterUrl:
              "https://manual.warondisease.org/knowledge/economics/1-pct-treaty-impact.html",
            confidence: "low",
            description: "Total DALYs averted if the treaty succeeds.",
            unit: "DALYs",
            value: 565_243_673_351,
          },
          DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_ECONOMIC_VALUE: {
            chapterUrl:
              "https://manual.warondisease.org/knowledge/economics/1-pct-treaty-impact.html",
            confidence: "low",
            description: "Total economic value if the treaty succeeds.",
            unit: "USD",
            value: 84_786_551_002_649_840,
          },
          DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED: {
            description: "Total lives saved if the treaty succeeds.",
            unit: "lives",
            value: 10_745_517_748.6,
          },
          DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_SUFFERING_HOURS: {
            description: "Total suffering hours eliminated if the treaty succeeds.",
            unit: "hours",
            value: 1_931_098_485_636_352.8,
          },
          DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_YEARS: {
            description: "Years treatments arrive earlier.",
            unit: "years",
            value: 211.885791973,
          },
          POLITICAL_SUCCESS_PROBABILITY: {
            chapterUrl:
              "https://manual.warondisease.org/knowledge/economics/1-pct-treaty-impact.html",
            confidence: "low",
            confidenceInterval: [0.001, 0.1],
            description: "Estimated probability of ratification and implementation.",
            sourceRef: "icbl-ottawa-treaty",
            sourceType: "external",
            unit: "rate",
            value: 0.01,
          },
          TREATY_CAMPAIGN_DURATION_YEARS: {
            confidenceInterval: [3, 5],
            description: "Treaty campaign duration.",
            unit: "years",
            value: 4,
          },
          TREATY_CAMPAIGN_TOTAL_COST: {
            chapterUrl:
              "https://manual.warondisease.org/knowledge/economics/1-pct-treaty-impact.html",
            description: "Total campaign cost.",
            unit: "USD",
            value: 1_000_000_000,
          },
          TREATY_COST_PER_DALY_TRIAL_CAPACITY_PLUS_EFFICACY_LAG: {
            description: "Conditional cost per DALY.",
            unit: "USD/DALY",
            value: 0.0017691485,
          },
          TREATY_CUMULATIVE_20YR_WITH_RATCHET: {
            chapterUrl:
              "https://manual.warondisease.org/knowledge/economics/peace-dividend.html",
            description: "20-year treaty funding with ratchet.",
            unit: "USD",
            value: 3_155_200_000_000,
          },
          TREATY_EXPECTED_COST_PER_DALY: {
            description: "Expected cost per DALY.",
            unit: "USD/DALY",
            value: 0.1769148506,
          },
          TREATY_EXPECTED_ROI_TRIAL_CAPACITY_PLUS_EFFICACY_LAG: {
            description: "Expected treaty ROI.",
            unit: "ratio",
            value: 847_865.510026,
          },
          TREATY_HALE_GAIN_YEAR_15: {
            chapterUrl:
              "https://manual.warondisease.org/knowledge/strategy/earth-optimization-prize.html",
            description: "HALE gain by year 15.",
            unit: "years",
            value: 21.7,
          },
          TREATY_LIVES_SAVED_ANNUAL_GLOBAL: {
            description: "Annual lives saved from peace dividend.",
            unit: "lives/year",
            value: 2446,
          },
          TREATY_PEACE_RECOVERY_GDP_GROWTH_BONUS_YEAR_20: {
            description: "Year-20 growth bonus from avoided war-cost drag.",
            unit: "rate",
            value: 0.0057279287,
          },
          TREATY_CYBERCRIME_RECOVERY_GDP_GROWTH_BONUS_YEAR_20: {
            description: "Year-20 growth bonus from cybercrime reduction.",
            unit: "rate",
            value: 0.0052956522,
          },
          TREATY_HEALTH_RECOVERY_GDP_GROWTH_BONUS_YEAR_20: {
            description: "Year-20 growth bonus from lower disease burden.",
            unit: "rate",
            value: 0.0628351848,
          },
          TREATY_PERSONAL_UPSIDE_INCOME_PLUS_HEALTH: {
            chapterUrl:
              "https://manual.warondisease.org/knowledge/call-to-action/your-personal-benefits.html",
            description: "Blended personal upside.",
            unit: "USD/person",
            value: 6_735_017.19315,
          },
          TREATY_QALYS_GAINED_ANNUAL_GLOBAL: {
            description: "Annual QALYs gained.",
            unit: "QALYs/year",
            value: 85_610,
          },
          TREATY_REDIRECT_GDP_GROWTH_BONUS_YEAR_20: {
            description: "Year-20 growth bonus from military-spending redirect.",
            unit: "rate",
            value: 0.0106333333,
          },
          TREATY_TOTAL_ANNUAL_COSTS: {
            description: "Total annual system costs.",
            unit: "USD/year",
            value: 290_000_000,
          },
          TREATY_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA: {
            chapterUrl:
              "https://manual.warondisease.org/knowledge/appendix/recruitment-and-propaganda-plan.html",
            description: "Lifetime income gain per capita.",
            unit: "USD",
            value: 3_480_017.19315,
          },
        },
        shareableSnippets: {},
      },
      {
        calculationVersion: "one-percent-treaty-compiler-v1",
        generatedAt: "2026-04-09T23:30:00.000Z",
        parameterSetHash: "sha256:test",
      },
    );

    const frame = run.frames.find((entry) => entry.frameKey === TaskImpactFrameKey.TWENTY_YEAR);

    expect(run.calculationVersion).toBe("one-percent-treaty-compiler-v1");
    expect(run.executionHints?.targetActors[0]?.claimPolicyHint).toBe(TaskClaimPolicy.ASSIGNED_ONLY);
    expect(run.executionHints?.targetActors[0]?.contactUrl).toBe(
      "https://www.whitehouse.gov/contact/",
    );
    expect(frame?.canonical.expectedDalysAverted.base).toBeCloseTo(5_652_436_733.51, 2);
    expect(frame?.canonical.expectedEconomicValueUsd.base).toBeCloseTo(
      847_865_510_026_498.4,
      1,
    );
    expect(frame?.canonical.estimatedEffortHours.base).toBeCloseTo(30 / 3600, 6);
    expect(frame?.canonical.medianIncomeGrowthEffectPpPerYear.base).toBeCloseTo(8.4492099, 5);
    expect(frame?.metrics.some((metric) => metric.key === "expected_value_per_hour_usd")).toBe(true);
    expect(frame?.metrics.some((metric) => metric.key === "trial_capacity_multiplier")).toBe(true);
  });
});

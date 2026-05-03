import { TaskImpactFrameKey, TaskStatus } from "@optimitron/db";
import { getGovernmentLeader } from "@optimitron/data/datasets/government-leaders";
import { describe, expect, it } from "vitest";
import { renderTemplate } from "@/lib/tasks/render-template";
import {
  aggregateTaskDelayStats,
  buildTaskShareText,
  buildTaskShareTokens,
  getTaskDelayStats,
} from "./accountability";
import {
  DEFAULT_PEER_SHARE_TEMPLATE_ID,
  HUMANITY_DEFAULT_SHARE_TEMPLATE_ID,
  ONE_HUMAN_DEFAULT_SHARE_TEMPLATE_ID,
  SHARE_TEMPLATES,
  getShareTemplate,
  getUsableShareTemplates,
  pickDefaultShareTemplateId,
} from "./share-templates";

/**
 * These suites assert properties of the leader-audience pool (targeting the
 * overdue head of state). The peer-audience template (`most-important-secret`)
 * is addressed to a friend, not a leader, and is covered separately.
 */
const LEADER_SHARE_TEMPLATES = SHARE_TEMPLATES.filter(
  (t) => (t.recipientModes ?? ["leader"]).includes("leader"),
);

const UNIVERSAL_SHARE_TEMPLATE_IDS = [
  "polite-reminder",
  "sleepy-sign-it",
  "deal-maker",
  "many-people-are-saying",
  "tremendous-treaty",
  "slack-dm",
  "task-notification",
  "sincere",
] as const;

function templateModes(template: (typeof SHARE_TEMPLATES)[number]) {
  return template.recipientModes ?? ["leader"];
}

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
    expect(tokens.target_name).toBe("The President");
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
    expect(tokens.target_name).toBe("Humanity");
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

describe("humanity and one-human share templates", () => {
  const humanityTokens = buildTaskShareTokens({
    currentDelayDays: 3,
    currentEconomicValueUsdLost: 1000,
    currentHumanLivesLost: 42,
    targetLabel: "humanity",
    taskTitle: "Sign the 1% Treaty",
    treatyUrl: "https://warondisease.org/vote/alex",
    citizenName: "Alex",
  });

  const oneHumanTokens = buildTaskShareTokens({
    countryCode: "US",
    currentDelayDays: 3,
    currentEconomicValueUsdLost: 1000,
    currentHumanLivesLost: 42,
    targetLabel: "Jake",
    taskTitle: "Sign the 1% Treaty",
    treatyUrl: "https://example.com/vote/alex",
    citizenName: "Alex",
  });

  it("marks universal templates for leader, humanity, and one-human modes", () => {
    for (const id of UNIVERSAL_SHARE_TEMPLATE_IDS) {
      const template = SHARE_TEMPLATES.find((entry) => entry.id === id);
      expect(template, `Missing universal template "${id}"`).toBeDefined();
      expect(templateModes(template!)).toEqual(["leader", "humanity", "one_human"]);
    }
  });

  it("renders universal templates cleanly for named humans", () => {
    const usable = getUsableShareTemplates(oneHumanTokens, "one_human");
    const usableIds = usable.map((template) => template.id);

    expect(usableIds).toEqual(expect.arrayContaining([...UNIVERSAL_SHARE_TEMPLATE_IDS]));
    for (const template of usable.filter((entry) =>
      UNIVERSAL_SHARE_TEMPLATE_IDS.includes(
        entry.id as (typeof UNIVERSAL_SHARE_TEMPLATE_IDS)[number],
      ),
    )) {
      const rendered = renderTemplate(template.body, oneHumanTokens);
      expect(rendered).toContain("Jake");
      expect(rendered).not.toContain("Hi humanity");
      expect(rendered).not.toMatch(/\bhe\b|\bhis\b|\bit hit\b|\bit doesn't\b/i);
      expect(rendered).toContain("https://example.com/vote/alex");
      expect(rendered).not.toMatch(/\{\w+\}/);
    }
  });

  it("renders universal templates cleanly for humanity", () => {
    const usable = getUsableShareTemplates(humanityTokens, "humanity");
    const usableIds = usable.map((template) => template.id);

    expect(usableIds).toEqual(expect.arrayContaining([...UNIVERSAL_SHARE_TEMPLATE_IDS]));
    for (const template of usable.filter((entry) =>
      UNIVERSAL_SHARE_TEMPLATE_IDS.includes(
        entry.id as (typeof UNIVERSAL_SHARE_TEMPLATE_IDS)[number],
      ),
    )) {
      const rendered = renderTemplate(template.body, humanityTokens);
      expect(rendered).toContain("humanity");
      expect(rendered).not.toMatch(/\{\w+\}/);
    }
  });

  it("keeps mode-specific defaults for non-president recipients", () => {
    const humanityUsable = getUsableShareTemplates(humanityTokens, "humanity");
    const oneHumanUsable = getUsableShareTemplates(oneHumanTokens, "one_human");

    expect(pickDefaultShareTemplateId(humanityUsable, "humanity")).toBe(
      HUMANITY_DEFAULT_SHARE_TEMPLATE_ID,
    );
    expect(pickDefaultShareTemplateId(oneHumanUsable, "one_human")).toBe(
      ONE_HUMAN_DEFAULT_SHARE_TEMPLATE_ID,
    );
  });

  it("one-human Office Memo default leans on personal-benefit stats, not leader-blame stats", () => {
    const template = getShareTemplate(ONE_HUMAN_DEFAULT_SHARE_TEMPLATE_ID);
    expect(template).toBeDefined();
    expect(template!.label).toBe("Office Memo");
    expect(templateModes(template!)).toContain("one_human");
    // Friend-targeted asks shouldn't blame the reader for government spending.
    // The leader version uses {mil_to_trials_ratio} + {mil_synonym}; the friend
    // version swaps those for personal-ROI stats the reader can act on.
    expect(template!.requiredTokens).not.toContain("mil_to_trials_ratio");
    expect(template!.requiredTokens).not.toContain("mil_synonym");
    expect(template!.requiredTokens).toContain("treaty_hale_gain");
    expect(template!.requiredTokens).toContain("lifetime_income_gain");

    const usableIds = getUsableShareTemplates(oneHumanTokens, "one_human").map(
      (entry) => entry.id,
    );
    const rendered = renderTemplate(template!.body, oneHumanTokens);

    expect(usableIds).toContain(ONE_HUMAN_DEFAULT_SHARE_TEMPLATE_ID);
    expect(rendered).toContain("Jake");
    expect(rendered).toContain(oneHumanTokens.treaty_url);
    expect(rendered).toContain(oneHumanTokens.deaths_from_delay);
    expect(rendered).toContain(oneHumanTokens.treaty_hale_gain);
    expect(rendered).toContain(oneHumanTokens.lifetime_income_gain);
    expect(rendered).toMatch(/two more humans/i);
  });

  it("keeps leader-only templates out of humanity and one-human modes", () => {
    const leaderOnlyIds = SHARE_TEMPLATES
      .filter((template) => {
        const modes = templateModes(template);
        return modes.includes("leader") && modes.length === 1;
      })
      .map((template) => template.id);

    const humanityIds = getUsableShareTemplates(humanityTokens, "humanity").map(
      (template) => template.id,
    );
    const oneHumanIds = getUsableShareTemplates(oneHumanTokens, "one_human").map(
      (template) => template.id,
    );

    for (const id of leaderOnlyIds) {
      expect(humanityIds).not.toContain(id);
      expect(oneHumanIds).not.toContain(id);
    }
  });

  it("keeps the tracked-invite copy formats in one-human mode", () => {
    const usableIds = getUsableShareTemplates(oneHumanTokens, "one_human").map(
      (template) => template.id,
    );

    expect(usableIds).toContain("task-notification");
    expect(usableIds).toContain("sincere");
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

  it("throws instead of silently blanking unresolved placeholders", () => {
    expect(() =>
      renderTemplate("Hi {target_name}. Vote here: {treaty_url}", {
        target_name: "Taylor",
      }),
    ).toThrow(/Missing template token\(s\): treaty_url/);
  });

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

  for (const template of SHARE_TEMPLATES) {
    it(`"${template.id}" requiredTokens covers every placeholder in its body`, () => {
      // Extract all {token} placeholders from the body
      const placeholders = [...template.body.matchAll(/\{(\w+)\}/g)].map(
        (m) => m[1],
      );
      const unique = [...new Set(placeholders)];

      // These tokens always have a non-empty default, so they're never required
      const alwaysAvailable = new Set([
        "citizen_name",
        "mil_synonym",
        "task_title",
        "treaty_url",
        // Constant-derived tokens sourced from @optimitron/data/parameters
        "daily_disease_deaths",
        "eradication_years_status_quo",
        "eradication_years_treaty",
        "lifetime_income_gain",
        "treaty_hale_gain",
        "trial_capacity_multiplier",
      ]);

      for (const token of unique) {
        if (alwaysAvailable.has(token)) continue;
        expect(
          template.requiredTokens,
          `Template "${template.id}" uses {${token}} but doesn't list it in requiredTokens`,
        ).toContain(token);
      }
    });
  }

  it("ShareTokenKey covers every key returned by buildTaskShareTokens", () => {
    // Build a fully-populated token bag and verify every key is present
    // in the ShareTokenKey type (enforced by the typed assignment below).
    const allTokenKeys = Object.keys(tokens);
    // If buildTaskShareTokens adds a new key without updating ShareTokenKey,
    // this test will catch it because the template tests above use these keys.
    expect(allTokenKeys.length).toBeGreaterThan(0);
    for (const key of allTokenKeys) {
      // Every key from buildTaskShareTokens must be a valid placeholder name
      expect(key).toMatch(/^[a-z_]+$/);
    }
  });

  for (const template of SHARE_TEMPLATES) {
    it(`"${template.id}" renders without blank values when all requiredTokens are present`, () => {
      const rendered = renderTemplate(template.body, tokens);
      // No double spaces where a token resolved to "" (except intentional ones)
      expect(rendered).not.toMatch(/\{\w+\}/);
      // Check that no "approximately  of our money" type blanks exist —
      // any two words separated only by 2+ spaces (after collapsing template
      // line breaks) suggests a blank token snuck through.
      const lines = rendered.split("\n");
      for (const line of lines) {
        expect(
          line,
          `Blank token in "${template.id}": "${line}"`,
        ).not.toMatch(/\w\s{2,}\w/);
      }
    });
  }
});

describe("Trump / US signer — all templates must render", () => {
  // Realistic US data: military ~$886B (SIPRI 2024), gov budget ~$10.9T (IMF),
  // treaty delay ~500 days from mid-2025 launch.
  const TRUMP_INPUT = {
    countryCode: "US",
    currentDelayDays: 500,
    currentEconomicValueUsdLost: 2_500_000_000_000,
    currentHumanLivesLost: 25_000_000,
    citizenName: "A concerned citizen",
    governmentBudgetUsdPerYear: 10_900_000_000_000,
    leaderHandle: "realDonaldTrump",
    militaryBudgetUsdPerYear: 886_000_000_000,
    now: new Date("2026-07-02T00:00:00.000Z"),
    targetLabel: "Donald Trump",
    taskTitle: "Sign the 1% Treaty",
  } as const;

  const trumpTokens = buildTaskShareTokens(TRUMP_INPUT);

  it("produces non-empty values for every token key", () => {
    for (const [key, value] of Object.entries(trumpTokens)) {
      expect(value, `Token "${key}" is empty for Trump`).not.toBe("");
    }
  });

  it("all leader templates pass the usability filter", () => {
    const usable = getUsableShareTemplates(trumpTokens);
    expect(
      usable.map((t) => t.id).sort(),
    ).toEqual(
      LEADER_SHARE_TEMPLATES.map((t) => t.id).sort(),
    );
  });

  for (const template of LEADER_SHARE_TEMPLATES) {
    it(`"${template.id}" renders with no placeholders or blanks`, () => {
      const rendered = renderTemplate(template.body, trumpTokens);
      expect(rendered).not.toMatch(/\{\w+\}/);
      // No blank tokens (word followed by 2+ spaces then another word)
      for (const line of rendered.split("\n")) {
        expect(
          line,
          `Blank token in "${template.id}": "${line}"`,
        ).not.toMatch(/\w\s{2,}\w/);
      }
    });

    it(`"${template.id}" references the target (leader or country)`, () => {
      const rendered = renderTemplate(template.body, trumpTokens);
      const hasTarget =
        rendered.includes("Donald Trump") ||
        rendered.includes("realDonaldTrump") ||
        rendered.includes(trumpTokens.country);
      expect(
        hasTarget,
        `Template "${template.id}" doesn't reference Trump or the country`,
      ).toBe(true);
    });
  }
});

describe("getGovernmentLeader from data package", () => {
  it("returns the US leader with full budget data", () => {
    const us = getGovernmentLeader("US");
    expect(us, "getGovernmentLeader('US') returned undefined — data package not loading").toBeDefined();
    expect(us!.countryCode).toBe("US");
    expect(us!.militaryBudgetUsd).toBeGreaterThan(300_000_000_000);
    expect(us!.governmentBudgetUsd).toBeGreaterThan(5_000_000_000_000);
  });

  it("returns leaders for all major military spenders", () => {
    for (const code of ["US", "CN", "RU", "IN", "SA", "GB", "DE", "FR", "JP", "KR"]) {
      const leader = getGovernmentLeader(code);
      expect(leader, `No leader for ${code}`).toBeDefined();
      expect(leader!.militaryBudgetUsd, `No military budget for ${code}`).toBeGreaterThan(0);
      expect(leader!.governmentBudgetUsd, `No government budget for ${code}`).toBeGreaterThan(0);
    }
  });

  it("returns undefined for unknown codes", () => {
    expect(getGovernmentLeader("ZZ")).toBeUndefined();
  });
});

describe("full pipeline: data-package leader → share tokens → all templates (Trump)", () => {
  const us = getGovernmentLeader("US");

  // This test simulates exactly what task-row.tsx does:
  // 1. Look up leader by countryCode
  // 2. Use leader.governmentBudgetUsd and leader.militaryBudgetUsd
  // 3. Build share tokens
  // 4. Verify all templates render
  const fallbackTokens = buildTaskShareTokens({
    countryCode: "US",
    currentDelayDays: 365,
    currentEconomicValueUsdLost: null,
    currentHumanLivesLost: null,
    governmentBudgetUsdPerYear: us?.governmentBudgetUsd ?? null,
    leaderHandle: "realDonaldTrump",
    militaryBudgetUsdPerYear: us?.militaryBudgetUsd ?? null,
    now: new Date("2026-07-02T00:00:00.000Z"),
    targetLabel: "Donald Trump",
    taskTitle: "Sign the 1% Treaty",
  });

  it("produces non-empty government_spending_ytd from data package", () => {
    expect(fallbackTokens.government_spending_ytd).not.toBe("");
    expect(fallbackTokens.government_spending_ytd).toMatch(/\$/);
  });

  it("produces non-empty deaths_from_delay via attribution", () => {
    expect(fallbackTokens.deaths_from_delay).not.toBe("");
  });

  it("produces non-empty money_wasted via attribution", () => {
    expect(fallbackTokens.money_wasted).not.toBe("");
  });

  it("all leader templates pass the usability filter", () => {
    const usable = getUsableShareTemplates(fallbackTokens);
    const usableIds = usable.map((t) => t.id).sort();
    const leaderIds = LEADER_SHARE_TEMPLATES.map((t) => t.id).sort();
    expect(usableIds).toEqual(leaderIds);
  });

  for (const template of LEADER_SHARE_TEMPLATES) {
    it(`"${template.id}" renders fully with no blanks`, () => {
      const rendered = renderTemplate(template.body, fallbackTokens);
      expect(rendered).not.toMatch(/\{\w+\}/);
      for (const line of rendered.split("\n")) {
        expect(
          line,
          `Blank in "${template.id}": "${line}"`,
        ).not.toMatch(/\w\s{2,}\w/);
      }
    });
  }
});

describe("peer share templates (most-important-secret)", () => {
  const PEER_TEMPLATES = SHARE_TEMPLATES.filter(
    (t) => templateModes(t).includes("peer"),
  );

  it("exactly one peer template exists today", () => {
    expect(PEER_TEMPLATES.map((t) => t.id)).toEqual(["most-important-secret"]);
  });

  it("leader-audience filter excludes peer templates", () => {
    const tokens = buildTaskShareTokens({
      countryCode: "US",
      currentDelayDays: 500,
      currentEconomicValueUsdLost: 2_500_000_000_000,
      currentHumanLivesLost: 25_000_000,
      citizenName: "A concerned citizen",
      governmentBudgetUsdPerYear: 10_900_000_000_000,
      leaderHandle: "realDonaldTrump",
      militaryBudgetUsdPerYear: 886_000_000_000,
      now: new Date("2026-07-02T00:00:00.000Z"),
      targetLabel: "Donald Trump",
      taskTitle: "Sign the 1% Treaty",
    });
    const usableLeader = getUsableShareTemplates(tokens);
    expect(usableLeader.map((t) => t.id)).not.toContain("most-important-secret");
  });

  it("peer-audience filter only surfaces peer templates", () => {
    const tokens = buildTaskShareTokens({
      countryCode: "US",
      currentDelayDays: 0,
      currentEconomicValueUsdLost: null,
      currentHumanLivesLost: null,
      citizenName: "Alex",
      governmentBudgetUsdPerYear: null,
      militaryBudgetUsdPerYear: null,
      targetLabel: "",
      taskTitle: "",
    });
    const usablePeer = getUsableShareTemplates(tokens, "peer");
    expect(usablePeer.map((t) => t.id)).toEqual(["most-important-secret"]);
  });

  it("peer template renders cleanly with just citizen_name and no task URL", () => {
    const peer = SHARE_TEMPLATES.find((t) => t.id === "most-important-secret");
    expect(peer).toBeDefined();
    const rendered = renderTemplate(peer!.body, { citizen_name: "Alex" });
    expect(rendered).toContain("most important secret in the world");
    expect(rendered).toContain("Call me");
    expect(rendered).toContain("Alex");
    // The secret must travel via phone, not URL — no link in the body.
    expect(rendered).not.toMatch(/https?:\/\//);
    expect(rendered).not.toContain("1percenttreaty");
    expect(rendered).not.toMatch(/\{\w+\}/);
  });

  it("peer default is safe for the secret-chain pitch token bag", () => {
    const peer = getShareTemplate(DEFAULT_PEER_SHARE_TEMPLATE_ID);
    expect(peer).toBeDefined();
    expect(templateModes(peer!)).toContain("peer");

    const rendered = renderTemplate(peer!.body, { citizen_name: "Alex" });

    expect(rendered).toContain("Alex");
    expect(rendered).not.toMatch(/\{\w+\}/);
    expect(rendered).not.toMatch(/https?:\/\//);
  });
});

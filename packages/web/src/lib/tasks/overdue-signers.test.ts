import { TaskImpactFrameKey, TaskStatus } from "@optimitron/db";
import { describe, expect, it } from "vitest";
import {
  countOverdueSigners,
  getOverdueSignerHighlights,
  type SignerTaskLike,
} from "./overdue-signers.server";

const NOW = new Date("2026-04-15T00:00:00.000Z");

function buildFrame(delayEconomicValueUsdLostPerDayBase: number) {
  return {
    annualDiscountRate: 0.03,
    adoptionRampYears: 1,
    benefitDurationYears: 20,
    customFrameLabel: null,
    delayDalysLostPerDayBase: null,
    delayDalysLostPerDayHigh: null,
    delayDalysLostPerDayLow: null,
    delayEconomicValueUsdLostPerDayBase,
    delayEconomicValueUsdLostPerDayHigh: null,
    delayEconomicValueUsdLostPerDayLow: null,
    estimatedCashCostUsdBase: null,
    estimatedCashCostUsdHigh: null,
    estimatedCashCostUsdLow: null,
    estimatedEffortHoursBase: 1,
    estimatedEffortHoursHigh: null,
    estimatedEffortHoursLow: null,
    evaluationHorizonYears: 20,
    expectedDalysAvertedBase: null,
    expectedDalysAvertedHigh: null,
    expectedDalysAvertedLow: null,
    expectedEconomicValueUsdBase: null,
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
    successProbabilityBase: 0.5,
    successProbabilityHigh: null,
    successProbabilityLow: null,
    summaryStatsJson: null,
    timeToImpactStartDays: 0,
  };
}

function buildSignerTask(input: {
  id: string;
  countryCode: string;
  displayName: string;
  dueDaysAgo: number;
  economicDelayUsdPerDay?: number;
  livesPerPctPoint?: number;
  roleTitle?: string | null;
  affiliation?: string | null;
}): SignerTaskLike {
  const dueAt = new Date(NOW.getTime() - input.dueDaysAgo * 24 * 60 * 60 * 1000);
  return {
    id: input.id,
    taskKey: `program:one-percent-treaty:signer:${input.countryCode}`,
    dueAt,
    status: TaskStatus.ACTIVE,
    roleTitle: input.roleTitle ?? "President",
    assigneeAffiliationSnapshot: input.affiliation ?? null,
    assigneePerson: {
      countryCode: input.countryCode.toUpperCase(),
      currentAffiliation: input.affiliation ?? `Government of ${input.countryCode.toUpperCase()}`,
      displayName: input.displayName,
      image: `https://example.invalid/${input.countryCode}.jpg`,
    },
    impact: {
      selectedFrame: buildFrame(input.economicDelayUsdPerDay ?? 1_000_000),
      selectedMetrics: input.livesPerPctPoint
        ? {
            contribution_lives_saved_per_pct_point: {
              baseValue: input.livesPerPctPoint,
              displayGroup: "health",
              highValue: null,
              lowValue: null,
              metadataJson: null,
              metricKey: "contribution_lives_saved_per_pct_point",
              summaryStatsJson: null,
              unit: "lives",
              valueJson: null,
            },
          }
        : {},
    },
  };
}

function buildNonSignerTask(id: string): SignerTaskLike {
  return {
    id,
    taskKey: "program:one-percent-treaty:ratify",
    dueAt: new Date(NOW.getTime() - 30 * 24 * 60 * 60 * 1000),
    status: TaskStatus.ACTIVE,
    assigneePerson: {
      countryCode: "US",
      displayName: "Parent Task",
      image: null,
    },
    impact: {
      selectedFrame: buildFrame(10_000_000),
      selectedMetrics: {},
    },
  };
}

describe("getOverdueSignerHighlights", () => {
  const us = buildSignerTask({
    id: "1-pct-treaty-signer-us",
    countryCode: "us",
    displayName: "Joe Testington",
    dueDaysAgo: 500,
    economicDelayUsdPerDay: 2_000_000,
    livesPerPctPoint: 100,
  });
  const gb = buildSignerTask({
    id: "1-pct-treaty-signer-gb",
    countryCode: "gb",
    displayName: "Rishi Example",
    dueDaysAgo: 800,
    economicDelayUsdPerDay: 3_000_000,
    livesPerPctPoint: 300,
  });
  const cn = buildSignerTask({
    id: "1-pct-treaty-signer-cn",
    countryCode: "cn",
    displayName: "Xi Placeholder",
    dueDaysAgo: 900,
    economicDelayUsdPerDay: 5_000_000,
    livesPerPctPoint: 500,
  });
  const inTask = buildSignerTask({
    id: "1-pct-treaty-signer-in",
    countryCode: "in",
    displayName: "Narendra Sample",
    dueDaysAgo: 700,
    economicDelayUsdPerDay: 1_500_000,
    livesPerPctPoint: 200,
  });
  const br = buildSignerTask({
    id: "1-pct-treaty-signer-br",
    countryCode: "br",
    displayName: "Lula Demo",
    dueDaysAgo: 400,
    economicDelayUsdPerDay: 800_000,
    livesPerPctPoint: 80,
  });

  const allSigners = [us, gb, cn, inTask, br];

  it("promotes user's country to the first slot", () => {
    const result = getOverdueSignerHighlights({
      decoratedTasks: allSigners,
      userCountryCode: "US",
      now: NOW,
      limit: 3,
    });
    expect(result).toHaveLength(3);
    expect(result[0]!.taskId).toBe("1-pct-treaty-signer-us");
    // Remaining slots rank by deaths-from-delay desc (CN > GB > IN > BR).
    expect(result[1]!.taskId).toBe("1-pct-treaty-signer-cn");
    expect(result[2]!.taskId).toBe("1-pct-treaty-signer-gb");
  });

  it("ranks globally by deaths-from-delay when no country match", () => {
    const result = getOverdueSignerHighlights({
      decoratedTasks: allSigners,
      userCountryCode: null,
      now: NOW,
      limit: 5,
    });
    expect(result.map((h) => h.taskId)).toEqual([
      "1-pct-treaty-signer-cn",
      "1-pct-treaty-signer-gb",
      "1-pct-treaty-signer-in",
      "1-pct-treaty-signer-us",
      "1-pct-treaty-signer-br",
    ]);
  });

  it("falls back to global ranking when the user's country has no signer task", () => {
    const result = getOverdueSignerHighlights({
      decoratedTasks: allSigners,
      userCountryCode: "ZZ",
      now: NOW,
      limit: 3,
    });
    expect(result[0]!.taskId).toBe("1-pct-treaty-signer-cn");
  });

  it("returns an empty array when no decorated tasks are provided", () => {
    const result = getOverdueSignerHighlights({
      decoratedTasks: [],
      userCountryCode: "US",
      now: NOW,
    });
    expect(result).toEqual([]);
  });

  it("filters out non-signer tasks and signers missing an assignee person", () => {
    const orphanSigner: SignerTaskLike = {
      ...us,
      id: "1-pct-treaty-signer-xx",
      taskKey: "program:one-percent-treaty:signer:xx",
      assigneePerson: null,
    };
    const parentTask = buildNonSignerTask("1-pct-treaty");

    const result = getOverdueSignerHighlights({
      decoratedTasks: [parentTask, orphanSigner, us],
      userCountryCode: null,
      now: NOW,
    });
    expect(result).toHaveLength(1);
    expect(result[0]!.taskId).toBe("1-pct-treaty-signer-us");
  });

  it("filters out tasks that are not overdue", () => {
    const futureDue: SignerTaskLike = {
      ...us,
      id: "1-pct-treaty-signer-fr",
      taskKey: "program:one-percent-treaty:signer:fr",
      dueAt: new Date(NOW.getTime() + 30 * 24 * 60 * 60 * 1000),
      assigneePerson: {
        ...us.assigneePerson!,
        countryCode: "FR",
        displayName: "Emmanuel Demo",
      },
    };

    const result = getOverdueSignerHighlights({
      decoratedTasks: [futureDue, us],
      userCountryCode: null,
      now: NOW,
    });
    expect(result).toHaveLength(1);
    expect(result[0]!.taskId).toBe("1-pct-treaty-signer-us");
  });

  it("respects the limit parameter", () => {
    const one = getOverdueSignerHighlights({
      decoratedTasks: allSigners,
      userCountryCode: "US",
      now: NOW,
      limit: 1,
    });
    expect(one).toHaveLength(1);
    expect(one[0]!.taskId).toBe("1-pct-treaty-signer-us");

    const zero = getOverdueSignerHighlights({
      decoratedTasks: allSigners,
      userCountryCode: "US",
      now: NOW,
      limit: 0,
    });
    expect(zero).toEqual([]);
  });

  it("countOverdueSigners counts only overdue signer tasks", () => {
    const futureTask: SignerTaskLike = {
      ...us,
      id: "1-pct-treaty-signer-fr",
      taskKey: "program:one-percent-treaty:signer:fr",
      dueAt: new Date(NOW.getTime() + 30 * 24 * 60 * 60 * 1000),
    };
    const parentTask = buildNonSignerTask("1-pct-treaty");
    const count = countOverdueSigners(
      [parentTask, futureTask, ...allSigners],
      NOW,
    );
    expect(count).toBe(allSigners.length);
  });

  it("formats leader name, href, overdue label, and cost-of-delay fields", () => {
    const [first] = getOverdueSignerHighlights({
      decoratedTasks: [us],
      userCountryCode: null,
      now: NOW,
    });
    expect(first).toBeDefined();
    expect(first!.leaderFirstName).toBe("Joe");
    expect(first!.leaderFullName).toBe("Joe Testington");
    expect(first!.taskHref).toBe("/tasks/1-pct-treaty-signer-us");
    expect(first!.overdueLabel).toMatch(/overdue$/);
    expect(first!.overdueLabel).toMatch(/year/);
    expect(first!.wastedUsdLabel).not.toBeNull();
    expect(first!.roleTitle).toBe("President");
  });
});

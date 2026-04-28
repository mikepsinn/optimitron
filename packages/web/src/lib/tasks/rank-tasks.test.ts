import {
  TaskClaimPolicy,
  TaskDifficulty,
  TaskImpactFrameKey,
  TaskStatus,
} from "@optimitron/db";
import { describe, expect, it } from "vitest";
import {
  blockerProgress,
  canTaskAcceptMoreClaims,
  computeTaskPriority,
  hasActiveChildTasks,
  isTaskBlocked,
  rankTasksForUser,
  scoreTaskForAccountability,
  scoreTaskForUser,
} from "./rank-tasks";

describe("computeTaskPriority", () => {
  it("uses the exact personal task priority formula", () => {
    const result = computeTaskPriority({
      estimatedEffortHours: 6,
      selectedImpactFrame: {
        annualDiscountRate: 0.03,
        adoptionRampYears: 0,
        benefitDurationYears: 1,
        customFrameLabel: null,
        delayDalysLostPerDayBase: null,
        delayDalysLostPerDayHigh: null,
        delayDalysLostPerDayLow: null,
        delayEconomicValueUsdLostPerDayBase: null,
        delayEconomicValueUsdLostPerDayHigh: null,
        delayEconomicValueUsdLostPerDayLow: null,
        estimatedCashCostUsdBase: 0,
        estimatedCashCostUsdHigh: null,
        estimatedCashCostUsdLow: null,
        estimatedEffortHoursBase: 6,
        estimatedEffortHoursHigh: null,
        estimatedEffortHoursLow: null,
        evaluationHorizonYears: 1,
        expectedDalysAvertedBase: null,
        expectedDalysAvertedHigh: null,
        expectedDalysAvertedLow: null,
        expectedEconomicValueUsdBase: 45_000,
        expectedEconomicValueUsdHigh: null,
        expectedEconomicValueUsdLow: null,
        frameKey: TaskImpactFrameKey.ONE_YEAR,
        frameSlug: "personal-task",
        medianHealthyLifeYearsEffectBase: null,
        medianHealthyLifeYearsEffectHigh: null,
        medianHealthyLifeYearsEffectLow: null,
        medianIncomeGrowthEffectPpPerYearBase: null,
        medianIncomeGrowthEffectPpPerYearHigh: null,
        medianIncomeGrowthEffectPpPerYearLow: null,
        metrics: [],
        successProbabilityBase: 0.9,
        successProbabilityHigh: null,
        successProbabilityLow: null,
        summaryStatsJson: null,
        timeToImpactStartDays: 3650,
      },
    });

    expect(result.priority).toBe(7500);
    expect("sprintPriority" in result).toBe(false);
    expect("taskPriority" in result).toBe(false);
  });

  it("converts cash cost into time through the buyback rate denominator", () => {
    const result = computeTaskPriority(
      {
        estimatedEffortHours: 1,
        selectedImpactFrame: {
          annualDiscountRate: 0.03,
          adoptionRampYears: 0,
          benefitDurationYears: 1,
          customFrameLabel: null,
          delayDalysLostPerDayBase: null,
          delayDalysLostPerDayHigh: null,
          delayDalysLostPerDayLow: null,
          delayEconomicValueUsdLostPerDayBase: null,
          delayEconomicValueUsdLostPerDayHigh: null,
          delayEconomicValueUsdLostPerDayLow: null,
          estimatedCashCostUsdBase: 1000,
          estimatedCashCostUsdHigh: null,
          estimatedCashCostUsdLow: null,
          estimatedEffortHoursBase: 1,
          estimatedEffortHoursHigh: null,
          estimatedEffortHoursLow: null,
          evaluationHorizonYears: 1,
          expectedDalysAvertedBase: null,
          expectedDalysAvertedHigh: null,
          expectedDalysAvertedLow: null,
          expectedEconomicValueUsdBase: 5000,
          expectedEconomicValueUsdHigh: null,
          expectedEconomicValueUsdLow: null,
          frameKey: TaskImpactFrameKey.ONE_YEAR,
          frameSlug: "cash-cost",
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
      },
      { buybackRate: 1000 },
    );

    expect(result.priority).toBe(2000);
  });
});

describe("rankTasksForUser", () => {
  const user = {
    availableHoursPerWeek: 5,
    interestTags: ["tobacco-policy", "public-health"],
    maxTaskDifficulty: TaskDifficulty.INTERMEDIATE,
    skillTags: ["writing", "spanish"],
  };

  const strongFitTask = {
    activeClaimCount: 0,
    claimPolicy: TaskClaimPolicy.OPEN_SINGLE,
    difficulty: TaskDifficulty.BEGINNER,
    estimatedEffortHours: 2,
    interestTags: ["tobacco-policy"],
    maxClaims: null,
    selectedImpactFrame: {
      annualDiscountRate: 0.03,
      adoptionRampYears: 1,
      benefitDurationYears: 20,
      customFrameLabel: null,
      delayDalysLostPerDayBase: 15,
      delayDalysLostPerDayHigh: 25,
      delayDalysLostPerDayLow: 10,
      delayEconomicValueUsdLostPerDayBase: 1_000_000,
      delayEconomicValueUsdLostPerDayHigh: 2_000_000,
      delayEconomicValueUsdLostPerDayLow: 500_000,
      estimatedCashCostUsdBase: 10,
      estimatedCashCostUsdHigh: 20,
      estimatedCashCostUsdLow: 5,
      estimatedEffortHoursBase: 2,
      estimatedEffortHoursHigh: 3,
      estimatedEffortHoursLow: 1,
      evaluationHorizonYears: 20,
      expectedDalysAvertedBase: 50_000,
      expectedDalysAvertedHigh: 75_000,
      expectedDalysAvertedLow: 25_000,
      expectedEconomicValueUsdBase: 100_000_000,
      expectedEconomicValueUsdHigh: 150_000_000,
      expectedEconomicValueUsdLow: 50_000_000,
      frameKey: TaskImpactFrameKey.TWENTY_YEAR,
      frameSlug: "twenty-year",
      medianHealthyLifeYearsEffectBase: 0.5,
      medianHealthyLifeYearsEffectHigh: 0.7,
      medianHealthyLifeYearsEffectLow: 0.2,
      medianIncomeGrowthEffectPpPerYearBase: 0.2,
      medianIncomeGrowthEffectPpPerYearHigh: 0.3,
      medianIncomeGrowthEffectPpPerYearLow: 0.1,
      metrics: [],
      successProbabilityBase: 0.3,
      successProbabilityHigh: 0.5,
      successProbabilityLow: 0.1,
      summaryStatsJson: null,
      timeToImpactStartDays: 30,
    },
    skillTags: ["writing"],
    status: TaskStatus.ACTIVE,
  };

  const weakFitTask = {
    activeClaimCount: 0,
    claimPolicy: TaskClaimPolicy.OPEN_SINGLE,
    difficulty: TaskDifficulty.ADVANCED,
    estimatedEffortHours: 8,
    interestTags: ["defi"],
    maxClaims: null,
    selectedImpactFrame: {
      ...strongFitTask.selectedImpactFrame,
      delayDalysLostPerDayBase: 0.1,
      delayEconomicValueUsdLostPerDayBase: 100,
      estimatedCashCostUsdBase: 500,
      estimatedEffortHoursBase: 8,
      expectedDalysAvertedBase: 10,
      expectedEconomicValueUsdBase: 1_000,
    },
    skillTags: ["solidity"],
    status: TaskStatus.ACTIVE,
  };

  it("scores stronger overlaps above weak fits", () => {
    expect(scoreTaskForUser(strongFitTask, user)).toBeGreaterThan(0.3);
    expect(scoreTaskForUser(weakFitTask, user)).toBeLessThan(0.2);

    const ranked = rankTasksForUser([weakFitTask, strongFitTask], user, 2);

    expect(ranked[0]?.task).toBe(strongFitTask);
    expect(ranked[1]?.task).toBe(weakFitTask);
  });

  it("prioritizes much higher-value executable work over a merely better fit", () => {
    const modestFitHugeImpactTask = {
      ...weakFitTask,
      difficulty: TaskDifficulty.INTERMEDIATE,
      estimatedEffortHours: 4,
      selectedImpactFrame: {
        ...weakFitTask.selectedImpactFrame,
        delayDalysLostPerDayBase: 50_000,
        delayEconomicValueUsdLostPerDayBase: 20_000_000_000,
        estimatedEffortHoursBase: 4,
        expectedDalysAvertedBase: 5_000_000,
        expectedEconomicValueUsdBase: 80_000_000_000_000,
      },
    };

    const ranked = rankTasksForUser([strongFitTask, modestFitHugeImpactTask], user, 2);

    expect(ranked[0]?.task).toBe(modestFitHugeImpactTask);
  });

  it("enforces claim-capacity constraints before ranking", () => {
    expect(
      canTaskAcceptMoreClaims({
        ...strongFitTask,
        activeClaimCount: 1,
      }),
    ).toBe(false);

    expect(
      canTaskAcceptMoreClaims({
        ...strongFitTask,
        claimPolicy: TaskClaimPolicy.OPEN_MANY,
        activeClaimCount: 3,
        maxClaims: 3,
      }),
    ).toBe(false);

    expect(
      canTaskAcceptMoreClaims({
        ...strongFitTask,
        claimPolicy: TaskClaimPolicy.ASSIGNED_ONLY,
      }),
    ).toBe(false);
  });

  it("keeps accountability scores normalized instead of summing raw units", () => {
    expect(scoreTaskForAccountability(strongFitTask)).toBeGreaterThan(0);
    expect(scoreTaskForAccountability(strongFitTask)).toBeLessThanOrEqual(1);
  });

  it("excludes blocked tasks from ranking", () => {
    const blockedTask = {
      ...strongFitTask,
      blockerStatuses: [TaskStatus.ACTIVE],
    };
    const unblockedTask = {
      ...weakFitTask,
      blockerStatuses: [TaskStatus.VERIFIED],
    };

    const ranked = rankTasksForUser([blockedTask, unblockedTask], user, 10);
    expect(ranked).toHaveLength(1);
    expect(ranked[0]?.task).toBe(unblockedTask);
  });

  it("includes tasks whose blockers are all verified", () => {
    const resolved = {
      ...strongFitTask,
      blockerStatuses: [TaskStatus.VERIFIED, TaskStatus.VERIFIED],
    };
    const ranked = rankTasksForUser([resolved], user, 10);
    expect(ranked).toHaveLength(1);
  });

  it("includes tasks with no blockers", () => {
    const noDeps = { ...strongFitTask, blockerStatuses: [] };
    const ranked = rankTasksForUser([noDeps], user, 10);
    expect(ranked).toHaveLength(1);
  });

  it("prefers executable leaf tasks over parent orchestration nodes", () => {
    const parentTask = {
      ...strongFitTask,
      activeChildTaskCount: 3,
      selectedImpactFrame: {
        ...strongFitTask.selectedImpactFrame,
        delayDalysLostPerDayBase: 60_000,
        delayEconomicValueUsdLostPerDayBase: 30_000_000_000,
        expectedDalysAvertedBase: 10_000_000,
        expectedEconomicValueUsdBase: 90_000_000_000_000,
      },
    };
    const leafTask = {
      ...weakFitTask,
      activeChildTaskCount: 0,
      difficulty: TaskDifficulty.INTERMEDIATE,
      estimatedEffortHours: 3,
      selectedImpactFrame: {
        ...weakFitTask.selectedImpactFrame,
        delayDalysLostPerDayBase: 40_000,
        delayEconomicValueUsdLostPerDayBase: 18_000_000_000,
        estimatedEffortHoursBase: 3,
        expectedDalysAvertedBase: 7_000_000,
        expectedEconomicValueUsdBase: 70_000_000_000_000,
      },
    };

    const ranked = rankTasksForUser([parentTask, leafTask], user, 10, {
      preferLeafExecution: true,
    });

    expect(ranked).toHaveLength(1);
    expect(ranked[0]?.task).toBe(leafTask);
  });
});

describe("isTaskBlocked", () => {
  it("returns false for tasks with no blockers", () => {
    expect(isTaskBlocked({ blockerStatuses: [] })).toBe(false);
    expect(isTaskBlocked({ blockerStatuses: undefined })).toBe(false);
  });

  it("returns true when any blocker is not completed/verified", () => {
    expect(isTaskBlocked({ blockerStatuses: [TaskStatus.ACTIVE] })).toBe(true);
    expect(isTaskBlocked({ blockerStatuses: [TaskStatus.VERIFIED, TaskStatus.ACTIVE] })).toBe(true);
    expect(isTaskBlocked({ blockerStatuses: [TaskStatus.DRAFT] })).toBe(true);
    expect(isTaskBlocked({ blockerStatuses: [TaskStatus.STALE] })).toBe(true);
  });

  it("returns false when all blockers are verified", () => {
    expect(isTaskBlocked({ blockerStatuses: [TaskStatus.VERIFIED] })).toBe(false);
    expect(isTaskBlocked({ blockerStatuses: [TaskStatus.VERIFIED, TaskStatus.VERIFIED] })).toBe(false);
  });
});

describe("blockerProgress", () => {
  it("returns 1 for tasks with no blockers", () => {
    expect(blockerProgress({ blockerStatuses: [] })).toBe(1);
    expect(blockerProgress({ blockerStatuses: undefined })).toBe(1);
  });

  it("returns 0 when no blockers are resolved", () => {
    expect(blockerProgress({ blockerStatuses: [TaskStatus.ACTIVE, TaskStatus.DRAFT] })).toBe(0);
  });

  it("returns fractional progress", () => {
    expect(blockerProgress({ blockerStatuses: [TaskStatus.VERIFIED, TaskStatus.ACTIVE] })).toBe(0.5);
  });

  it("returns 1 when all blockers are resolved", () => {
    expect(blockerProgress({ blockerStatuses: [TaskStatus.VERIFIED, TaskStatus.VERIFIED] })).toBe(1);
  });
});

describe("hasActiveChildTasks", () => {
  it("returns true only when the task still has child tasks to execute", () => {
    expect(hasActiveChildTasks({ activeChildTaskCount: 1 })).toBe(true);
    expect(hasActiveChildTasks({ activeChildTaskCount: 0 })).toBe(false);
    expect(hasActiveChildTasks({ activeChildTaskCount: undefined })).toBe(false);
  });
});

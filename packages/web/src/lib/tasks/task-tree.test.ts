import { describe, expect, it } from "vitest";
import { TaskStatus } from "@optimitron/db";
import { TaskImpactFrameKey } from "@optimitron/db/enums";
import { buildTaskTree, countTaskTreeNodes } from "./task-tree";
import type { TaskTreeFlatTask } from "./task-tree";

function flatTask(
  id: string,
  parentTaskId: string | null,
  overrides: Partial<TaskTreeFlatTask> = {},
): TaskTreeFlatTask {
  return {
    blockerStatuses: [],
    createdAt: new Date("2026-01-01T00:00:00Z"),
    dueAt: null,
    estimatedEffortHours: null,
    id,
    isPublic: true,
    parentTaskId,
    selectedImpactFrame: null,
    sortOrder: null,
    status: TaskStatus.ACTIVE,
    taskKey: null,
    title: id,
    ...overrides,
  };
}

describe("buildTaskTree", () => {
  it("nests a flat task list into a tree rooted at the given id", () => {
    const tree = buildTaskTree(
      [
        flatTask("root", null),
        flatTask("a", "root"),
        flatTask("b", "root"),
        flatTask("a1", "a"),
      ],
      "root",
    );

    expect(tree?.id).toBe("root");
    expect(tree?.children.map((child) => child.id)).toEqual(["a", "b"]);
    const branchA = tree?.children.find((child) => child.id === "a");
    expect(branchA?.children.map((child) => child.id)).toEqual(["a1"]);
    expect(branchA && countTaskTreeNodes(branchA)).toBe(2);
  });

  it("returns null when the root task itself is missing or invisible", () => {
    const tree = buildTaskTree([flatTask("a", "root")], "root");
    expect(tree).toBeNull();
  });

  it("drops a task whose parent chain never reaches the root, without attaching it elsewhere", () => {
    // "orphan"'s parent ("missing-parent") isn't in the viewer-visible set at
    // all — e.g. a private task whose parent the anonymous viewer can't see.
    const tree = buildTaskTree(
      [
        flatTask("root", null),
        flatTask("visible-child", "root"),
        flatTask("orphan", "missing-parent"),
      ],
      "root",
    );

    expect(tree?.children.map((child) => child.id)).toEqual([
      "visible-child",
    ]);
  });

  it("excludes tasks in a parent-chain cycle instead of infinite-looping", () => {
    // a -> b -> a is a cycle that never reaches "root"; this must terminate
    // and drop both nodes rather than hang or throw.
    const tree = buildTaskTree(
      [
        flatTask("root", null),
        flatTask("kept", "root"),
        flatTask("a", "b"),
        flatTask("b", "a"),
      ],
      "root",
    );

    expect(tree?.children.map((child) => child.id)).toEqual(["kept"]);
  });

  it("sorts siblings by sortOrder, then createdAt, then id", () => {
    const tree = buildTaskTree(
      [
        flatTask("root", null),
        flatTask("later-but-first", "root", {
          createdAt: new Date("2026-01-02T00:00:00Z"),
          sortOrder: 0,
        }),
        flatTask("earlier-but-second", "root", {
          createdAt: new Date("2026-01-01T00:00:00Z"),
          sortOrder: 1,
        }),
        flatTask("tie-break-by-id-a", "root", {
          createdAt: new Date("2026-01-03T00:00:00Z"),
          sortOrder: 2,
        }),
        flatTask("tie-break-by-id-b", "root", {
          createdAt: new Date("2026-01-03T00:00:00Z"),
          sortOrder: 2,
        }),
      ],
      "root",
    );

    expect(tree?.children.map((child) => child.id)).toEqual([
      "later-but-first",
      "earlier-but-second",
      "tie-break-by-id-a",
      "tie-break-by-id-b",
    ]);
  });

  it("computes each node's EV numbers via the shared priority formula, not a new one", () => {
    const tree = buildTaskTree(
      [
        flatTask("root", null),
        flatTask("estimated", "root", {
          estimatedEffortHours: 10,
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
            estimatedEffortHoursBase: 10,
            estimatedEffortHoursHigh: null,
            estimatedEffortHoursLow: null,
            evaluationHorizonYears: 1,
            expectedDalysAvertedBase: null,
            expectedDalysAvertedHigh: null,
            expectedDalysAvertedLow: null,
            expectedEconomicValueUsdBase: 1000,
            expectedEconomicValueUsdHigh: null,
            expectedEconomicValueUsdLow: null,
            frameKey: TaskImpactFrameKey.TWENTY_YEAR,
            frameSlug: "test-frame",
            medianHealthyLifeYearsEffectBase: null,
            medianHealthyLifeYearsEffectHigh: null,
            medianHealthyLifeYearsEffectLow: null,
            medianIncomeGrowthEffectPpPerYearBase: null,
            medianIncomeGrowthEffectPpPerYearHigh: null,
            medianIncomeGrowthEffectPpPerYearLow: null,
            metrics: [],
            successProbabilityBase: null,
            successProbabilityHigh: null,
            successProbabilityLow: null,
            summaryStatsJson: null,
            timeToImpactStartDays: 0,
          },
        }),
        flatTask("unestimated", "root"),
      ],
      "root",
    );

    const estimated = tree?.children.find((child) => child.id === "estimated");
    expect(estimated?.evValid).toBe(true);
    expect(estimated?.realEv).toBe(1000);
    expect(estimated?.priority).toBe(100); // 1000 / 10 hours, per the shared formula

    const unestimated = tree?.children.find(
      (child) => child.id === "unestimated",
    );
    expect(unestimated?.evValid).toBe(false);
    expect(unestimated?.realEv).toBe(0);
  });

  it("marks evValid false for a task with real effort hours but no EV estimate, instead of rendering a measured zero", () => {
    // Positive effort hours alone make the priority formula's denominator
    // usable (valid=true upstream), but with no expectedEconomicValueUsdBase
    // there is no actual EV number — evValid must still be false so the UI
    // shows "no direct estimate" rather than "EV $0".
    const tree = buildTaskTree(
      [
        flatTask("root", null),
        flatTask("effort-only", "root", { estimatedEffortHours: 5 }),
      ],
      "root",
    );

    const effortOnly = tree?.children.find(
      (child) => child.id === "effort-only",
    );
    expect(effortOnly?.evValid).toBe(false);
    expect(effortOnly?.realEv).toBe(0);
  });
});

describe("countTaskTreeNodes", () => {
  it("counts the root plus every descendant", () => {
    const tree = buildTaskTree(
      [
        flatTask("root", null),
        flatTask("a", "root"),
        flatTask("b", "root"),
        flatTask("a1", "a"),
        flatTask("a2", "a"),
      ],
      "root",
    );

    expect(tree && countTaskTreeNodes(tree)).toBe(5);
  });
});

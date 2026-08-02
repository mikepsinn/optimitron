import {
  TaskImpactPublicationStatus,
  TaskStatus,
} from "@optimitron/db/enums";
import { describe, expect, it } from "vitest";
import {
  buildPersonalQueueRows,
  type PersonalQueueTaskRecord,
} from "./personal-planning.server";
import { computeTaskPriority, isTaskBlocked } from "./rank-tasks";

const ranking = { computeTaskPriority, isTaskBlocked };

function task(input: {
  activeChildTaskCount?: number;
  blockerIds?: string[];
  blockerStatuses?: TaskStatus[];
  estimatedEffortHours: number;
  expectedValue?: number;
  hiddenUnresolvedBlockerCount?: number;
  id: string;
  isPublic?: boolean;
  parentTaskId?: string;
  publicationStatus?: TaskImpactPublicationStatus;
}) {
  const blockerIds = input.blockerIds ?? [];
  const blockerStatuses = input.blockerStatuses ?? [];
  return {
    activeChildTaskCount: input.activeChildTaskCount ?? 0,
    activeExecutionAttemptCount: 0,
    blockerStatuses,
    contextJson: { executor_type: "Self" },
    estimatedEffortHours: input.estimatedEffortHours,
    hiddenUnresolvedBlockerCount: input.hiddenUnresolvedBlockerCount ?? 0,
    id: input.id,
    incomingEdges: blockerIds.map((blockerId, index) => ({
      edgeType: "BLOCKS",
      fromTask: {
        id: blockerId,
        status: blockerStatuses[index] ?? TaskStatus.ACTIVE,
      },
      probabilityDeltaBase: 0,
    })),
    impact:
      input.publicationStatus == null
        ? undefined
        : {
            currentSet: {
              publicationStatus: input.publicationStatus,
            },
          },
    isPublic: input.isPublic ?? false,
    marginalImpactFrame:
      input.expectedValue == null
        ? null
        : {
            estimatedCashCostUsdBase: 0,
            estimatedEffortHoursBase: input.estimatedEffortHours,
            expectedEconomicValueUsdBase: input.expectedValue,
          },
    parentTaskId: input.parentTaskId ?? "optimize-earth",
    status: TaskStatus.ACTIVE,
    title: input.id,
  } satisfies PersonalQueueTaskRecord;
}

function queue(tasks: PersonalQueueTaskRecord[]) {
  return buildPersonalQueueRows(tasks, ranking, 1_000, {
    executorProfiles: [{ executorKind: "human" }],
    limit: tasks.length,
    now: new Date("2026-08-02T12:00:00.000Z"),
    requireExecutable: true,
    requireUnblocked: true,
    rootedTaskIds: new Set(tasks.map((entry) => entry.id)),
  });
}

describe("personal queue blocker semantics", () => {
  it("gates the exact blocked task and ranks its zero-delta blocker by the remaining plan", () => {
    const rows = queue([
      task({ estimatedEffortHours: 1, id: "blocker" }),
      task({
        blockerIds: ["blocker"],
        blockerStatuses: [TaskStatus.ACTIVE],
        estimatedEffortHours: 9,
        expectedValue: 1_000,
        id: "blocked",
      }),
    ]);

    expect(rows.map((row) => row.id)).toEqual(["blocker"]);
    expect(rows[0]).toMatchObject({
      hasMarginalEstimate: false,
      hasStructuralUnlockEstimate: true,
      priority: 100,
      realEv: 0,
      structuralUnlockPriority: 100,
      unlocksTaskIds: ["blocked"],
    });
  });

  it("uses all unresolved blocker effort without cloning downstream value onto every blocker", () => {
    const rows = queue([
      task({ estimatedEffortHours: 1, id: "blocker-a" }),
      task({ estimatedEffortHours: 1, id: "blocker-b" }),
      task({
        blockerIds: ["blocker-a", "blocker-b"],
        blockerStatuses: [TaskStatus.ACTIVE, TaskStatus.ACTIVE],
        estimatedEffortHours: 8,
        expectedValue: 900,
        id: "blocked",
      }),
    ]);

    expect(rows.map((row) => row.id).sort()).toEqual([
      "blocker-a",
      "blocker-b",
    ]);
    expect(rows.every((row) => row.structuralUnlockPriority === 90)).toBe(true);
    expect(rows.every((row) => row.realEv === 0)).toBe(true);
  });

  it("does not implicitly cascade a container blocker to the container's children", () => {
    const rows = queue([
      task({ estimatedEffortHours: 1, id: "blocker" }),
      task({
        activeChildTaskCount: 1,
        blockerIds: ["blocker"],
        blockerStatuses: [TaskStatus.ACTIVE],
        estimatedEffortHours: 9,
        expectedValue: 1_000,
        id: "container",
      }),
      task({
        estimatedEffortHours: 5,
        expectedValue: 500,
        id: "child",
        parentTaskId: "container",
      }),
    ]);

    expect(rows.map((row) => row.id)).toEqual(["blocker", "child"]);
    expect(rows.find((row) => row.id === "child")).toMatchObject({
      blockersCount: 0,
      priority: 100,
    });
  });

  it("keeps a task gated when its blocker identity is private", () => {
    const rows = queue([
      task({
        estimatedEffortHours: 1,
        expectedValue: 1_000,
        hiddenUnresolvedBlockerCount: 1,
        id: "blocked-by-private-task",
      }),
    ]);

    expect(rows).toEqual([]);
  });

  it("does not lend an unpublished public estimate to a blocker", () => {
    const rows = queue([
      task({ estimatedEffortHours: 1, id: "blocker" }),
      task({
        blockerIds: ["blocker"],
        blockerStatuses: [TaskStatus.ACTIVE],
        estimatedEffortHours: 9,
        expectedValue: 1_000,
        id: "blocked-draft",
        isPublic: true,
        publicationStatus: TaskImpactPublicationStatus.DRAFT,
      }),
    ]);

    expect(rows).toEqual([]);
  });
});

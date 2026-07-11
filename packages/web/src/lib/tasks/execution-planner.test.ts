import { TaskKind, TaskStatus } from "@optimitron/db";
import { describe, expect, it } from "vitest";
import {
  buildExecutionPlan,
  EXECUTION_PLANNER_VERSION,
  type ExecutionPlanningTask,
} from "./execution-planner";

const NOW = new Date("2026-07-10T14:00:00.000Z");

function task(
  id: string,
  overrides: Partial<ExecutionPlanningTask> = {},
): ExecutionPlanningTask {
  return {
    activeChildTaskCount: 0,
    availableAt: null,
    blockers: [],
    deadlinePolicy: "NONE",
    deadlineStatus: "none",
    dueAt: null,
    executorType: "Self",
    hasMarginalEstimate: true,
    hours: 1,
    id,
    kind: TaskKind.TASK,
    parentTaskId: "mike-project",
    priority: 100,
    realEv: 100,
    rooted: true,
    title: id,
    valid: true,
    validationNotes: [],
    ...overrides,
  };
}

function plan(tasks: ExecutionPlanningTask[], overrides = {}) {
  return buildExecutionPlan({
    availableMinutes: 240,
    now: NOW,
    planningWindowEnd: "2026-07-10T22:00:00.000Z",
    planningWindowStart: "2026-07-10T14:00:00.000Z",
    tasks,
    ...overrides,
  });
}

describe("buildExecutionPlan", () => {
  it("never places projects, parents, milestones, or unrooted rows in the checklist", () => {
    const result = plan([
      task("project", { kind: TaskKind.PROJECT, priority: 10_000 }),
      task("parent", { activeChildTaskCount: 1, priority: 9_000 }),
      task("milestone", { completionMilestone: true, priority: 8_000 }),
      task("unrooted", { rooted: false, priority: 7_000 }),
      task("atomic", { priority: 1 }),
    ]);

    expect(result.checklist.map((item) => item.id)).toEqual(["atomic"]);
  });

  it("simulates completion to unlock the next feasible dependency", () => {
    const result = plan([
      task("mercury", { hours: 1, priority: 100 }),
      task("bank-dependent", {
        blockers: [{ status: TaskStatus.ACTIVE, taskId: "mercury" }],
        hours: 1,
        priority: 1_000,
      }),
    ]);

    expect(result.checklist.map((item) => item.id)).toEqual([
      "mercury",
      "bank-dependent",
    ]);
    expect(result.checklist[1]?.reason).toContain("unlocks");
  });

  it("keeps externally blocked work out of the checklist", () => {
    const result = plan([
      task("blocked", {
        blockers: [{ status: TaskStatus.ACTIVE, taskId: "outside-window" }],
      }),
    ]);

    expect(result.checklist).toEqual([]);
    expect(result.blockedWork).toEqual([
      {
        blockerTaskIds: ["outside-window"],
        id: "blocked",
        title: "blocked",
      },
    ]);
  });

  it("uses stable IDs to order equal-priority tasks deterministically", () => {
    const result = plan([task("z-task"), task("a-task")]);
    expect(result.checklist.map((item) => item.id)).toEqual([
      "a-task",
      "z-task",
    ]);
  });

  it("applies required latest-start guardrails before raw priority", () => {
    const result = plan([
      task("huge-upside", { priority: 1_000_000 }),
      task("file-taxes", {
        deadlinePolicy: "REQUIRED",
        deadlineStatus: "start_now",
        priority: 1,
      }),
    ]);
    expect(result.nextAction?.id).toBe("file-taxes");
  });

  it("subtracts fixed commitments and stops at the remaining capacity", () => {
    const result = plan(
      [task("first", { hours: 1 }), task("second", { hours: 1 })],
      {
        availableMinutes: 180,
        commitments: [
          {
            startAt: "2026-07-10T15:00:00.000Z",
            endAt: "2026-07-10T17:30:00.000Z",
            title: "Meetings",
          },
        ],
        planningWindowEnd: "2026-07-10T17:00:00.000Z",
      },
    );

    expect(result.fixedCommitmentMinutes).toBe(120);
    expect(result.availableMinutes).toBe(60);
    expect(result.checklist).toHaveLength(1);
  });

  it("counts overlapping fixed commitments only once", () => {
    const result = plan([task("work", { hours: 2 })], {
      commitments: [
        {
          startAt: "2026-07-10T15:00:00.000Z",
          endAt: "2026-07-10T16:30:00.000Z",
          title: "Meeting one",
        },
        {
          startAt: "2026-07-10T16:00:00.000Z",
          endAt: "2026-07-10T17:00:00.000Z",
          title: "Meeting two",
        },
      ],
      planningWindowEnd: "2026-07-10T18:00:00.000Z",
    });

    expect(result.fixedCommitmentMinutes).toBe(120);
    expect(result.availableMinutes).toBe(120);
    expect(result.checklist.map((item) => item.id)).toEqual(["work"]);
  });

  it("separates AI-routed work and never starts it automatically", () => {
    const result = plan([
      task("human-formation"),
      task("draft-pitch", {
        executorType: "AI Agent",
        priority: 1_000,
      }),
    ]);

    expect(result.checklist.map((item) => item.id)).toEqual([
      "human-formation",
    ]);
    expect(result.proposedAiAssistedWork.map((item) => item.id)).toEqual([
      "draft-pitch",
    ]);
    expect(result.proposedAiAssistedWork[0]?.reason).toContain(
      "does not start",
    );
  });

  it("reports zero or missing marginal estimates instead of ranking them", () => {
    const result = plan([
      task("unknown-value", {
        hasMarginalEstimate: false,
        realEv: 0,
      }),
    ]);

    expect(result.checklist).toEqual([]);
    expect(result.itemsNeedingEstimates[0]).toMatchObject({
      id: "unknown-value",
    });
    expect(result.plannerVersion).toBe(EXECUTION_PLANNER_VERSION);
  });
});

import { TaskStatus } from "@optimitron/db";
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
    capabilityReasons: [],
    capabilityStatus: "eligible",
    deadlinePolicy: "NONE",
    deadlineStatus: "none",
    dueAt: null,
    executionEligible: true,
    executorType: "Self",
    effortEstimateSource: "task-estimate",
    hasMarginalEstimate: true,
    hours: 1,
    id,
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
  it("never places parents, milestones, or unrooted rows in the checklist", () => {
    const result = plan([
      task("parent", { activeChildTaskCount: 1, priority: 10_000 }),
      task("milestone", { completionMilestone: true, priority: 8_000 }),
      task("unrooted", { rooted: false, priority: 7_000 }),
      task("atomic", { priority: 1 }),
    ]);

    expect(result.checklist.map((item) => item.id)).toEqual(["atomic"]);
  });

  it("never places application listings in execution outputs", () => {
    const result = plan([
      task("listing", { executionEligible: false, priority: 10_000 }),
      task("atomic", { priority: 1 }),
    ]);

    expect(result.checklist.map((item) => item.id)).toEqual(["atomic"]);
    expect(result.itemsNeedingEstimates).toEqual([]);
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
    expect(result.checklist[0]).toMatchObject({
      scheduledStartAt: "2026-07-10T14:00:00.000Z",
      scheduledEndAt: "2026-07-10T15:00:00.000Z",
    });
    expect(result.checklist[1]).toMatchObject({
      scheduledStartAt: "2026-07-10T15:00:00.000Z",
      scheduledEndAt: "2026-07-10T16:00:00.000Z",
    });
  });

  it("reconsiders required work after a required prerequisite completes", () => {
    const requiredWithoutImpact = {
      deadlinePolicy: "REQUIRED" as const,
      deadlineStatus: "future" as const,
      hasMarginalEstimate: false,
      priority: 0,
      realEv: 0,
      valid: false,
    };
    const result = plan([
      task("required-prerequisite", {
        ...requiredWithoutImpact,
        dueAt: "2026-07-10T16:00:00.000Z",
      }),
      task("required-dependent", {
        ...requiredWithoutImpact,
        blockers: [
          { status: TaskStatus.ACTIVE, taskId: "required-prerequisite" },
        ],
        dueAt: "2026-07-10T17:00:00.000Z",
      }),
    ]);

    expect(result.checklist.map((item) => item.id)).toEqual([
      "required-prerequisite",
      "required-dependent",
    ]);
  });

  it("reconsiders required work after an estimated prerequisite completes", () => {
    const result = plan([
      task("estimated-prerequisite"),
      task("required-dependent", {
        blockers: [
          { status: TaskStatus.ACTIVE, taskId: "estimated-prerequisite" },
        ],
        deadlinePolicy: "REQUIRED",
        deadlineStatus: "future",
        dueAt: "2026-07-10T17:00:00.000Z",
        hasMarginalEstimate: false,
        priority: 0,
        realEv: 0,
        valid: false,
      }),
    ]);

    expect(result.checklist.map((item) => item.id)).toEqual([
      "estimated-prerequisite",
      "required-dependent",
    ]);
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

  it("never decays an overdue required task back to expected-value ranking", () => {
    const result = plan([
      task("old-required", {
        deadlineOverrideEligible: false,
        deadlinePolicy: "REQUIRED",
        deadlineStatus: "missed",
        priority: 1,
      }),
      task("current-high-value", { priority: 1_000_000 }),
    ]);

    expect(result.nextAction?.id).toBe("old-required");
  });

  it("schedules required health guardrails even while their EV needs review", () => {
    const result = plan([
      task("take-medication", {
        deadlinePolicy: "REQUIRED",
        deadlineStatus: "start_now",
        hasMarginalEstimate: false,
        priority: 0,
        realEv: 0,
        valid: false,
        validationNotes: ["Missing expected economic value estimate."],
      }),
      task("ordinary-work", { priority: 1_000_000 }),
    ]);

    expect(result.nextAction?.id).toBe("take-medication");
    expect(result.itemsNeedingEstimates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "take-medication" }),
      ]),
    );
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
    const result = plan([task("work", { hours: 1 })], {
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

  it("does not pretend a task fits across disconnected calendar gaps", () => {
    const result = plan([task("deep-work", { hours: 2 })], {
      commitments: [
        {
          startAt: "2026-07-10T15:00:00.000Z",
          endAt: "2026-07-10T17:00:00.000Z",
          title: "Meetings",
        },
      ],
      planningWindowEnd: "2026-07-10T18:00:00.000Z",
    });

    expect(result.availableMinutes).toBe(120);
    expect(result.checklist).toEqual([]);
    expect(result.unusedMinutes).toBe(120);
  });

  it("schedules future-available work no earlier than its availability", () => {
    const result = plan([
      task("later", {
        availableAt: "2026-07-10T17:30:00.000Z",
        hours: 0.5,
      }),
    ]);

    expect(result.checklist[0]).toMatchObject({
      scheduledStartAt: "2026-07-10T17:30:00.000Z",
      scheduledEndAt: "2026-07-10T18:00:00.000Z",
    });
  });

  it("reserves required work in its due window before flexible work", () => {
    const result = plan(
      [
        task("deep-work", { hours: 1.5, priority: 1_000_000 }),
        task("take-medication", {
          availableAt: "2026-07-10T15:00:00.000Z",
          deadlinePolicy: "REQUIRED",
          deadlineStatus: "future",
          dueAt: "2026-07-10T15:10:00.000Z",
          hasMarginalEstimate: false,
          hours: 1 / 6,
          priority: 0,
          realEv: 0,
          valid: false,
        }),
      ],
      { availableMinutes: 100 },
    );

    expect(result.checklist.map((item) => item.id)).toEqual([
      "take-medication",
      "deep-work",
    ]);
    expect(result.checklist[0]).toMatchObject({
      scheduledStartAt: "2026-07-10T15:00:00.000Z",
      scheduledEndAt: "2026-07-10T15:10:00.000Z",
    });
    expect(result.checklist[1]).toMatchObject({
      scheduledStartAt: "2026-07-10T15:10:00.000Z",
      scheduledEndAt: "2026-07-10T16:40:00.000Z",
    });
  });

  it("reserves earlier required deadlines before higher-value later ones", () => {
    const result = plan([
      task("later-high-value", {
        deadlinePolicy: "REQUIRED",
        deadlineStatus: "future",
        dueAt: "2026-07-10T18:00:00.000Z",
        priority: 1_000_000,
      }),
      task("earlier-low-value", {
        deadlinePolicy: "REQUIRED",
        deadlineStatus: "future",
        dueAt: "2026-07-10T16:00:00.000Z",
        priority: 1,
      }),
    ]);

    expect(result.checklist).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "earlier-low-value",
          scheduledEndAt: "2026-07-10T16:00:00.000Z",
        }),
        expect.objectContaining({
          id: "later-high-value",
          scheduledEndAt: "2026-07-10T18:00:00.000Z",
        }),
      ]),
    );
  });

  it("leaves time before a future required task for flexible work", () => {
    const result = plan([
      task("future-required", {
        deadlinePolicy: "REQUIRED",
        deadlineStatus: "future",
        dueAt: "2026-07-10T18:00:00.000Z",
        priority: 1,
      }),
      task("flexible", { priority: 1_000 }),
    ]);

    expect(result.checklist.map((item) => item.id)).toEqual([
      "flexible",
      "future-required",
    ]);
    expect(result.nextAction?.id).toBe("flexible");
    expect(result.checklist[1]).toMatchObject({
      scheduledStartAt: "2026-07-10T17:00:00.000Z",
      scheduledEndAt: "2026-07-10T18:00:00.000Z",
    });
  });

  it("treats a soft due date as guidance rather than a scheduling cutoff", () => {
    const result = plan(
      [
        task("soft-deadline", {
          deadlinePolicy: "SOFT",
          deadlineStatus: "future",
          dueAt: "2026-07-10T14:30:00.000Z",
          hours: 1,
        }),
      ],
      {
        commitments: [
          {
            startAt: "2026-07-10T14:00:00.000Z",
            endAt: "2026-07-10T15:00:00.000Z",
            title: "Meeting",
          },
        ],
      },
    );

    expect(result.checklist[0]).toMatchObject({
      id: "soft-deadline",
      scheduledStartAt: "2026-07-10T15:00:00.000Z",
    });
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

  it("reports unknown and mismatched capabilities outside execution queues", () => {
    const result = plan([
      task("unknown", {
        capabilityReasons: ["No skills are recorded for the target executor."],
        capabilityStatus: "unknown",
      }),
      task("mismatch", {
        capabilityReasons: ["Missing required skills: bookkeeping."],
        capabilityStatus: "ineligible",
      }),
    ]);

    expect(result.checklist).toEqual([]);
    expect(result.itemsNeedingCapabilityConfirmation).toEqual([
      {
        id: "unknown",
        reasons: ["No skills are recorded for the target executor."],
        title: "unknown",
      },
    ]);
    expect(result.capabilityExcludedWork).toEqual([
      {
        id: "mismatch",
        reasons: ["Missing required skills: bookkeeping."],
        title: "mismatch",
      },
    ]);
  });
});

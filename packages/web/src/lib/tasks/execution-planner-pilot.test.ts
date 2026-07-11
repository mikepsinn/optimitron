import { TaskStatus } from "@optimitron/db";
import { describe, expect, it } from "vitest";
import {
  auditExecutionGraph,
  OPTIMIZE_EARTH_ROOT_TASK_ID,
} from "./execution-planner-audit";
import {
  buildExecutionPlan,
  type ExecutionPlanningTask,
} from "./execution-planner";
import {
  findPilotDuplicateGroups,
  normalizeCalendarForPlanning,
  normalizeNotionPlanningItems,
} from "./execution-source-normalization";

function task(
  id: string,
  parentTaskId: string | null,
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
    hours: 0.5,
    id,
    parentTaskId,
    priority: 500,
    realEv: 1_000,
    rooted: true,
    title: id,
    valid: true,
    validationNotes: [],
    ...overrides,
  };
}

describe("Mike + EOS execution-planner pilot", () => {
  it("deduplicates source material and returns a plausible reviewed frontier plan", () => {
    const notionItems = [
      {
        actionContext: "Open the EOS bank account needed before funded work.",
        estimatedEffortHours: 0.5,
        id: "notion-bank",
        title: "Open bank account for EOS Inc.",
        url: "https://notion.so/notion-bank",
      },
      {
        actionContext: "Complete the investor-facing pitch assets.",
        estimatedEffortHours: 1,
        id: "notion-pitch",
        title: "Finish the pitch deck core",
        url: "https://notion.so/notion-pitch",
      },
      {
        actionContext: "Review the concise investor summary.",
        estimatedEffortHours: 0.5,
        id: "notion-one-pager",
        title: "Investor One-Pager",
        url: "https://notion.so/notion-one-pager",
      },
    ];
    const calendarEvents = [
      {
        endAt: "2026-07-10T14:10:00.000Z",
        id: "morning-meds-a",
        kind: "routine" as const,
        recurringSeriesId: "meds-series-a",
        startAt: "2026-07-10T14:00:00.000Z",
        title: "Morning meds/supplements",
      },
      {
        endAt: "2026-07-10T15:25:00.000Z",
        id: "morning-meds-b",
        kind: "routine" as const,
        recurringSeriesId: "meds-series-b",
        startAt: "2026-07-10T15:15:00.000Z",
        title: "Morning medication and supplements",
      },
      {
        endAt: "2026-07-10T17:00:00.000Z",
        id: "foundation-call",
        kind: "commitment" as const,
        startAt: "2026-07-10T16:00:00.000Z",
        title: "Foundation call",
      },
      {
        endAt: "2026-07-10T18:30:00.000Z",
        id: "calendar-mercury",
        kind: "task" as const,
        startAt: "2026-07-10T18:00:00.000Z",
        title: "Open Mercury bank account for EOS",
      },
    ];
    const notion = normalizeNotionPlanningItems({ items: notionItems });
    const calendar = normalizeCalendarForPlanning(calendarEvents);
    const duplicateConcepts = findPilotDuplicateGroups([
      ...notionItems,
      ...calendarEvents,
    ]).map((group) => group.concept);

    expect(duplicateConcepts).toEqual([
      "eos-pitch",
      "medication-routine",
      "mercury-account",
    ]);
    expect(notion.proposals).toHaveLength(3);
    expect(calendar.fixedCommitments).toHaveLength(1);
    expect(calendar.routineProposals).toHaveLength(1);
    expect(calendar.taskProposals).toHaveLength(1);

    const mikeProjectId = "project:mike";
    const eosProjectId = "project:eos";
    const tasks = [
      task(OPTIMIZE_EARTH_ROOT_TASK_ID, null, {
        activeChildTaskCount: 2,
        hasMarginalEstimate: false,
        hours: null,
        realEv: 0,
        title: "Optimize Earth",
      }),
      task(mikeProjectId, OPTIMIZE_EARTH_ROOT_TASK_ID, {
        activeChildTaskCount: 2,
        hasMarginalEstimate: false,
        hours: null,
        realEv: 0,
        title: "Mike projects",
      }),
      task(eosProjectId, OPTIMIZE_EARTH_ROOT_TASK_ID, {
        activeChildTaskCount: 4,
        hasMarginalEstimate: false,
        hours: null,
        realEv: 0,
        title: "EOS projects",
      }),
      task("mercury", eosProjectId, {
        priority: 900,
        title: "Open Mercury bank account for EOS",
      }),
      task("bank-dependent", eosProjectId, {
        blockers: [{ status: TaskStatus.ACTIVE, taskId: "mercury" }],
        priority: 2_000,
        title: "Connect EOS banking to funded operations",
      }),
      task("formation-review", eosProjectId, {
        hours: 0.75,
        priority: 800,
        title: "Review the corrected EOS formation record",
      }),
      task("draft-pitch", eosProjectId, {
        executorType: "AI Agent",
        hours: 1,
        priority: 1_800,
        title: "Prepare the EOS investor pitch draft",
      }),
      task("health-check-in", mikeProjectId, {
        hours: 0.25,
        priority: 300,
        title: "Record daily symptoms and medication response",
      }),
      task("review-pitch", mikeProjectId, {
        blockers: [{ status: TaskStatus.ACTIVE, taskId: "draft-pitch" }],
        priority: 1_600,
        title: "Review the EOS investor pitch",
      }),
    ];
    const plan = buildExecutionPlan({
      availableMinutes: 240,
      commitments: calendar.fixedCommitments,
      now: new Date("2026-07-10T14:00:00.000Z"),
      planningWindowEnd: "2026-07-10T18:00:00.000Z",
      planningWindowStart: "2026-07-10T14:00:00.000Z",
      tasks,
    });

    expect(plan.fixedCommitmentMinutes).toBe(60);
    expect(plan.availableMinutes).toBe(180);
    expect(plan.nextAction?.id).toBe("mercury");
    expect(plan.checklist.map((item) => item.id)).toEqual([
      "mercury",
      "bank-dependent",
      "formation-review",
      "health-check-in",
    ]);
    expect(plan.proposedAiAssistedWork.map((item) => item.id)).toEqual([
      "draft-pitch",
    ]);
    expect(plan.blockedWork).toContainEqual(
      expect.objectContaining({
        blockerTaskIds: ["draft-pitch"],
        id: "review-pitch",
      }),
    );
    expect(plan.itemsNeedingEstimates).toEqual([]);
    expect(plan.checklist.every((item) => item.realEv !== 0)).toBe(true);

    const queueEligibleIds = new Set(plan.checklist.map((item) => item.id));
    const findings = auditExecutionGraph({
      edges: [
        {
          edgeType: "BLOCKS",
          fromTaskId: "mercury",
          toTaskId: "bank-dependent",
        },
        {
          edgeType: "BLOCKS",
          fromTaskId: "draft-pitch",
          toTaskId: "review-pitch",
        },
      ],
      tasks: tasks.map((item) => ({
        activeChildTaskCount: item.activeChildTaskCount,
        hasMarginalEstimate: item.hasMarginalEstimate,
        id: item.id,
        parentTaskId: item.parentTaskId,
        priority: item.priority,
        queueEligible: queueEligibleIds.has(item.id),
      })),
    });

    expect(findings.filter((finding) => finding.severity === "high")).toEqual(
      [],
    );
  });
});

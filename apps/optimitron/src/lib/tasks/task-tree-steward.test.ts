import { describe, expect, it } from "vitest";
import { auditTaskTree, type TaskTreeStewardTask } from "./task-tree-steward";

function task(
  id: string,
  parentTaskId: string | null,
  overrides: Partial<TaskTreeStewardTask> = {},
): TaskTreeStewardTask {
  return {
    activeCandidateMatchCount: 0,
    activeChildTaskCount: 0,
    assigneeOrganizationId: null,
    assigneePersonId: null,
    category: "OTHER",
    claimPolicy: "OPEN_SINGLE",
    contextJson: {
      acceptanceCriteria: ["A reviewer can verify the deliverable."],
      value: 100,
    },
    description: "Produce one bounded deliverable with cited evidence.",
    estimatePublicationEligible: true,
    estimatedEffortHours: 2,
    executionMode: "HUMAN_OR_AGENT",
    hasMarginalEstimate: true,
    hasSourceUrl: false,
    id,
    isPublic: false,
    parentTaskId,
    preferredSkillTags: [],
    requiredAccessTags: [],
    requiredCredentialTags: [],
    requiredToolTags: [],
    roleTitle: null,
    skillTags: ["research"],
    sourceArtifactCount: 0,
    status: "ACTIVE",
    taskKey: `task:${id}`,
    title: `Task ${id}`,
    ...overrides,
  };
}

describe("auditTaskTree", () => {
  it("finds structural, duplicate, routing, and bounded-execution problems", () => {
    const result = auditTaskTree({
      edges: [],
      tasks: [
        task("optimize-earth", null, {
          activeChildTaskCount: 2,
          title: "Optimize Earth",
        }),
        task("duplicate-a", "optimize-earth", {
          executionMode: "AGENT_ONLY",
          estimatedEffortHours: 12,
          skillTags: [],
          taskKey: null,
          title: "Research the intervention",
        }),
        task("duplicate-b", "optimize-earth", {
          contextJson: {},
          description: "short",
          estimatedEffortHours: null,
          skillTags: [],
          title: " Research the intervention ",
        }),
        task("orphan", "missing-parent", {
          claimPolicy: "ASSIGNED_ONLY",
        }),
      ],
    });

    expect(result.complete).toBe(true);
    expect(result.summary).toMatchObject({
      activeLeafTasks: 3,
      agentExecutableLeaves: 1,
      duplicateGroups: 1,
      tasksNeedingCandidateResearch: 3,
      totalTasks: 4,
      unrootedTasks: 1,
    });
    const codes = result.issues.map((issue) => issue.code);
    expect(codes).toEqual(
      expect.arrayContaining([
        "AGENT_ROUTE_NEEDED",
        "CANDIDATE_RESEARCH_NEEDED",
        "DUPLICATE_TASK_FINGERPRINT",
        "MISSING_ACCEPTANCE_CRITERIA",
        "MISSING_EFFORT_ESTIMATE",
        "MISSING_PARENT_TASK",
        "MISSING_TASK_BRIEF",
        "UNASSIGNED_ASSIGNED_ONLY_TASK",
        "UNBOUNDED_AGENT_TASK",
        "UNKEYED_ROOT_CHILD",
        "UNROOTED_TASK",
      ]),
    );
    expect(
      result.issues.find(
        (issue) => issue.code === "DUPLICATE_TASK_FINGERPRINT",
      ),
    ).toMatchObject({
      relatedTaskIds: ["duplicate-a", "duplicate-b"],
      requiresApproval: true,
    });
  });

  it("pages findings with a stable issue cursor", () => {
    const tasks = [
      task("optimize-earth", null, { activeChildTaskCount: 2 }),
      task("a", "optimize-earth", {
        contextJson: {},
        description: "",
        estimatedEffortHours: null,
        skillTags: [],
      }),
      task("b", "optimize-earth", {
        contextJson: {},
        description: "",
        estimatedEffortHours: null,
        skillTags: [],
      }),
    ];

    const first = auditTaskTree({ edges: [], limit: 2, tasks });
    expect(first.complete).toBe(false);
    expect(first.issues).toHaveLength(2);
    expect(first.nextCursor).toBe(first.issues[1]?.issueKey);

    const second = auditTaskTree({
      cursor: first.nextCursor,
      edges: [],
      limit: 500,
      tasks,
    });
    expect(second.issues.length).toBeGreaterThan(0);
    expect(second.issues[0]?.issueKey).not.toBe(first.issues[0]?.issueKey);
    expect(second.issues[0]?.issueKey).not.toBe(first.issues[1]?.issueKey);
    expect(second.summary).toEqual(first.summary);
    expect(second.complete).toBe(true);
  });

  it("rejects an unknown cursor instead of silently restarting", () => {
    expect(() =>
      auditTaskTree({
        cursor: "not-a-real-issue",
        edges: [],
        tasks: [task("optimize-earth", null)],
      }),
    ).toThrow("Invalid task tree audit cursor");
  });

  it("counts a direct source URL as public-task provenance", () => {
    const result = auditTaskTree({
      edges: [],
      tasks: [
        task("optimize-earth", null, { activeChildTaskCount: 1 }),
        task("public-leaf", "optimize-earth", {
          hasSourceUrl: true,
          isPublic: true,
        }),
      ],
    });

    expect(
      result.issues.filter(
        (finding) => finding.code === "MISSING_PUBLIC_SOURCE",
      ),
    ).toEqual([]);
  });
});

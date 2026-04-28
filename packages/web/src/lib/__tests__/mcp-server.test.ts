import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { TaskClaimPolicy, TaskStatus } from "@optimitron/db/enums";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  listTasks: vi.fn(),
  getTaskDetailData: vi.fn(),
  computeTaskPriority: vi.fn(),
  rankTasksForUser: vi.fn(),
  isTaskBlocked: vi.fn(),
  isTaskLeased: vi.fn(),
  taskCreate: vi.fn(),
  taskUpdate: vi.fn(),
  taskFindFirst: vi.fn(),
  taskFindMany: vi.fn(),
  taskEdgeCreateMany: vi.fn(),
  taskEdgeFindMany: vi.fn(),
  taskEdgeUpdateMany: vi.fn(),
  taskImpactEstimateSetCreate: vi.fn(),
  taskImpactFrameEstimateCreate: vi.fn(),
  transaction: vi.fn(),
  upsertPrimaryTaskCommunicationEndpoint: vi.fn(),
  countUserCommentsInWindow: vi.fn(),
  postComment: vi.fn(),
  notifyTaskCommentRecipients: vi.fn(),
  generateAndPostWishoniaReply: vi.fn(),
}));

vi.mock("../tasks.server", () => ({
  listTasks: mocks.listTasks,
  getTaskDetailData: mocks.getTaskDetailData,
}));

vi.mock("../tasks/rank-tasks", () => ({
  computeTaskPriority: mocks.computeTaskPriority,
  rankTasksForUser: mocks.rankTasksForUser,
  isTaskBlocked: mocks.isTaskBlocked,
}));

vi.mock("../tasks/agent-lease.server", () => ({
  isTaskLeased: mocks.isTaskLeased,
  acquireLease: vi.fn(),
  heartbeatLease: vi.fn(),
  releaseLease: vi.fn(),
}));

vi.mock("../tasks/impact", () => ({}));
vi.mock("../tasks/task-communications.server", () => ({}));
vi.mock("../tasks/task-communication-endpoints.server", () => ({
  upsertPrimaryTaskCommunicationEndpoint: mocks.upsertPrimaryTaskCommunicationEndpoint,
}));
vi.mock("../tasks/task-comments.server", () => ({
  countUserCommentsInWindow: mocks.countUserCommentsInWindow,
  postComment: mocks.postComment,
}));
vi.mock("../tasks/task-comment-notifications.server", () => ({
  notifyTaskCommentRecipients: mocks.notifyTaskCommentRecipients,
}));
vi.mock("../tasks/wishonia-task-reply.server", () => ({
  generateAndPostWishoniaReply: mocks.generateAndPostWishoniaReply,
}));

vi.mock("../prisma", () => ({
  prisma: {
    $transaction: mocks.transaction,
    task: {
      create: mocks.taskCreate,
      findFirst: mocks.taskFindFirst,
      findMany: mocks.taskFindMany,
      update: mocks.taskUpdate,
    },
    taskEdge: {
      createMany: mocks.taskEdgeCreateMany,
      findMany: mocks.taskEdgeFindMany,
      updateMany: mocks.taskEdgeUpdateMany,
    },
    taskImpactEstimateSet: { create: mocks.taskImpactEstimateSetCreate },
    taskImpactFrameEstimate: { create: mocks.taskImpactFrameEstimateCreate },
  },
}));

import { ALL_SCOPES, McpScope, createMcpServer } from "../mcp-server";

interface ToolText {
  text: string;
}

async function setup(userId: string | undefined, scopes: McpScope[] = ALL_SCOPES) {
  const server = createMcpServer(userId, scopes);
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  const client = new Client({ name: "test-client", version: "1.0.0" });
  await client.connect(clientTransport);
  return client;
}

function parseToolBody(result: unknown): Record<string, unknown> {
  const content = (result as { content?: ToolText[] }).content;
  expect(content?.[0]?.text).toBeTypeOf("string");
  return JSON.parse(content![0]!.text) as Record<string, unknown>;
}

function makeOwnedTask(overrides: Record<string, unknown> = {}) {
  return {
    id: "task-1",
    title: "Owned task",
    description: "A task this user owns",
    status: TaskStatus.ACTIVE,
    category: "OUTREACH",
    difficulty: "TRIVIAL",
    taskKey: "owned:1",
    dueAt: null,
    parentTaskId: null,
    impactStatement: null,
    primaryEndpoint: null,
    claimPolicy: TaskClaimPolicy.OPEN_SINGLE,
    skillTags: [],
    interestTags: [],
    estimatedEffortHours: 1,
    blockerStatuses: [],
    milestones: [],
    childTasks: [],
    assigneePerson: null,
    assigneeOrganization: null,
    assigneePersonId: null,
    assigneeOrganizationId: null,
    ownerUserId: "user-1",
    ...overrides,
  };
}

function makePriority(overrides: Record<string, unknown> = {}) {
  return {
    priority: 100,
    realEv: 200,
    buybackRate: 1000,
    blockersCount: 0,
    blockersResolved: 0,
    unblockedBlockers: 0,
    evMath: "test",
    valid: true,
    validationNotes: [],
    ...overrides,
  };
}

beforeEach(() => {
  for (const fn of Object.values(mocks)) fn.mockReset();
  mocks.transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) =>
    callback({
      task: {
        create: mocks.taskCreate,
        update: mocks.taskUpdate,
      },
      taskEdge: {
        createMany: mocks.taskEdgeCreateMany,
        updateMany: mocks.taskEdgeUpdateMany,
      },
      taskImpactEstimateSet: { create: mocks.taskImpactEstimateSetCreate },
      taskImpactFrameEstimate: { create: mocks.taskImpactFrameEstimateCreate },
    }),
  );
  mocks.taskImpactEstimateSetCreate.mockResolvedValue({ id: "estimate-set-1" });
  mocks.taskImpactFrameEstimateCreate.mockResolvedValue({ id: "frame-1" });
  mocks.taskUpdate.mockImplementation(async ({ data, where }: { data: Record<string, unknown>; where: { id: string } }) => ({
    id: where.id,
    status: data.status ?? TaskStatus.ACTIVE,
    title: data.title ?? "Updated task",
  }));
  mocks.taskCreate.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
    id: "created-task",
    status: data.status ?? TaskStatus.ACTIVE,
    title: data.title,
  }));
  mocks.taskEdgeCreateMany.mockResolvedValue({ count: 0 });
  mocks.taskEdgeUpdateMany.mockResolvedValue({ count: 0 });
  mocks.upsertPrimaryTaskCommunicationEndpoint.mockResolvedValue(null);
  mocks.countUserCommentsInWindow.mockResolvedValue(0);
  mocks.postComment.mockResolvedValue({ id: "comment-1", taskId: "task-1", message: "Comment" });
  mocks.notifyTaskCommentRecipients.mockResolvedValue({ sentCount: 1 });
  mocks.generateAndPostWishoniaReply.mockResolvedValue(null);
});

describe("MCP server tool dispatch", () => {
  it("does not expose manual notification envelope tools", async () => {
    const client = await setup("user-1", ALL_SCOPES);

    const result = await client.listTools();
    const names = result.tools.map((tool) => tool.name);

    expect(names).not.toContain("draftTaskNotification");
    expect(names).not.toContain("sendTaskNotification");
    expect(names).toContain("postTaskComment");
  });

  describe("authentication", () => {
    it("returns structured authentication_required for personal tools when userId is missing", async () => {
      const client = await setup(undefined, ALL_SCOPES);

      const result = await client.callTool({ name: "getNextAction", arguments: {} });

      expect(result.isError).toBe(true);
      const body = parseToolBody(result);
      expect(body.error).toBe("authentication_required");
      expect(body.tool).toBe("getNextAction");
      expect(body.remediation).toMatchObject({
        remote_http: expect.objectContaining({
          authorizeEndpoint: expect.stringMatching(/oauth\/authorize$/),
          resourceMetadata: expect.stringContaining("/.well-known/oauth-protected-resource/mcp"),
        }),
      });
    });

    it("rejects anonymous calls to getMyQueue / getAIQueue / getQueueAudit with the same structured error", async () => {
      const client = await setup(undefined, ALL_SCOPES);

      for (const tool of ["getMyQueue", "getAIQueue", "getQueueAudit"] as const) {
        const result = await client.callTool({ name: tool, arguments: {} });
        expect(result.isError, `${tool} should error`).toBe(true);
        const body = parseToolBody(result);
        expect(body.error, `${tool} error code`).toBe("authentication_required");
      }
    });

    it("returns Insufficient scope when caller lacks the required scope", async () => {
      const client = await setup("user-1", [McpScope.SEARCH]);

      const result = await client.callTool({ name: "getNextAction", arguments: {} });

      expect(result.isError).toBe(true);
      const body = parseToolBody(result);
      expect(body.error).toContain("Insufficient scope");
      expect(body.error).toContain("getNextAction");
    });
  });

  describe("catch block", () => {
    it("surfaces the actual error message + stack when a handler throws", async () => {
      mocks.listTasks.mockRejectedValue(new Error("Simulated DB failure: relation does not exist"));

      const client = await setup("user-1", ALL_SCOPES);
      const result = await client.callTool({ name: "getNextAction", arguments: {} });

      expect(result.isError).toBe(true);
      const body = parseToolBody(result);
      expect(body.error).toBe("tool_execution_failed");
      expect(body.tool).toBe("getNextAction");
      expect(body.message).toBe("Simulated DB failure: relation does not exist");
      expect(body.stack).toContain("Error: Simulated DB failure");
      expect(body.userId).toBe("user-1");
    });

    it("includes args in the error payload so we can replay the failing call", async () => {
      mocks.listTasks.mockRejectedValue(new Error("boom"));

      const client = await setup("user-1", ALL_SCOPES);
      const result = await client.callTool({
        name: "getNextAction",
        arguments: { buybackRate: 500 },
      });

      const body = parseToolBody(result);
      expect(body.args).toEqual({ buybackRate: 500 });
    });
  });

  describe("getNextAction happy path", () => {
    it("returns the top-ranked owned task with its priority", async () => {
      mocks.listTasks.mockResolvedValue([
        makeOwnedTask({ id: "task-a", title: "Lower priority" }),
        makeOwnedTask({ id: "task-b", title: "Higher priority" }),
      ]);
      mocks.isTaskBlocked.mockReturnValue(false);
      mocks.computeTaskPriority.mockImplementation((task: { id: string }) =>
        makePriority({ priority: task.id === "task-b" ? 999 : 1 }),
      );

      const client = await setup("user-1", ALL_SCOPES);
      const result = await client.callTool({ name: "getNextAction", arguments: {} });

      expect(result.isError).toBeFalsy();
      const body = parseToolBody(result);
      expect(body.task).toMatchObject({ id: "task-b", title: "Higher priority" });
      expect(body.priority).toBe(999);
      expect(body.sprintPriority).toBeUndefined();
      expect((body.task as Record<string, unknown>).taskPriority).toBeUndefined();
      expect(body.queueAudit).toMatchObject({ activeOwnedTasks: 2 });
    });

    it("filters out blocked tasks before picking the top action", async () => {
      const blocked = makeOwnedTask({ id: "blocked", blockerStatuses: [TaskStatus.ACTIVE] });
      const open = makeOwnedTask({ id: "open" });
      mocks.listTasks.mockResolvedValue([blocked, open]);
      mocks.isTaskBlocked.mockImplementation(({ blockerStatuses }: { blockerStatuses: string[] }) =>
        (blockerStatuses ?? []).some((s) => s !== TaskStatus.VERIFIED),
      );
      mocks.computeTaskPriority.mockReturnValue(makePriority());

      const client = await setup("user-1", ALL_SCOPES);
      const result = await client.callTool({ name: "getNextAction", arguments: {} });

      const body = parseToolBody(result);
      expect((body.task as { id: string }).id).toBe("open");
    });

    it("returns null task with the expected envelope when the queue is empty", async () => {
      mocks.listTasks.mockResolvedValue([]);
      mocks.isTaskBlocked.mockReturnValue(false);
      mocks.computeTaskPriority.mockReturnValue(makePriority());

      const client = await setup("user-1", ALL_SCOPES);
      const result = await client.callTool({ name: "getNextAction", arguments: {} });

      const body = parseToolBody(result);
      expect(body.task).toBeNull();
      expect(body.priority).toBe(0);
      expect(body.queueAudit).toMatchObject({ activeOwnedTasks: 0, unblockedTasks: 0 });
    });

    it("returns a required-deadline task when it has reached latest-start time even if another task has higher priority", async () => {
      const dueSoon = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      mocks.listTasks.mockResolvedValue([
        makeOwnedTask({ id: "big-upside", title: "Big upside task", estimatedEffortHours: 1 }),
        makeOwnedTask({
          id: "taxes",
          title: "File taxes",
          dueAt: dueSoon,
          deadlinePolicy: "REQUIRED",
          estimatedEffortHours: 2,
          contextJson: {
            deadline_rationale: "Taxes must be filed by the legal deadline.",
          },
        }),
      ]);
      mocks.isTaskBlocked.mockReturnValue(false);
      mocks.computeTaskPriority.mockImplementation((task: { id: string }) =>
        makePriority({ priority: task.id === "big-upside" ? 999 : 10 }),
      );

      const client = await setup("user-1", ALL_SCOPES);
      const result = await client.callTool({ name: "getNextAction", arguments: {} });

      const body = parseToolBody(result);
      expect(body.task).toMatchObject({
        id: "taxes",
        deadlinePolicy: "REQUIRED",
        deadlineStatus: "start_now",
        priority: 10,
      });
      expect(body.deadlineOverride).toBe(true);
      expect(body.selectionReason).toBe("deadline_latest_start");
      expect(body.priority).toBe(10);
    });
  });

  describe("personal queues", () => {
    it("splits self-executed tasks from AI-agent-executed tasks", async () => {
      mocks.listTasks.mockResolvedValue([
        makeOwnedTask({ id: "self", title: "Self task", contextJson: { executor_type: "Self" } }),
        makeOwnedTask({ id: "default-self", title: "Default self task", contextJson: {} }),
        makeOwnedTask({ id: "agent", title: "Agent task", contextJson: { executor_type: "AI Agent" } }),
      ]);
      mocks.isTaskBlocked.mockReturnValue(false);
      mocks.computeTaskPriority.mockImplementation((task: { id: string }) =>
        makePriority({ priority: task.id === "agent" ? 50 : 100 }),
      );

      const client = await setup("user-1", ALL_SCOPES);
      const myQueueResult = await client.callTool({ name: "getMyQueue", arguments: {} });
      const aiQueueResult = await client.callTool({ name: "getAIQueue", arguments: {} });

      const myQueue = parseToolBody(myQueueResult).queue as Array<Record<string, unknown>>;
      const aiQueue = parseToolBody(aiQueueResult).queue as Array<Record<string, unknown>>;
      expect(myQueue.map((task) => task.id)).toEqual(["self", "default-self"]);
      expect(aiQueue.map((task) => task.id)).toEqual(["agent"]);
      expect(myQueue[0]).toMatchObject({ priority: 100, executorType: "Self" });
      expect(myQueue[0]?.sprintPriority).toBeUndefined();
      expect(myQueue[0]?.taskPriority).toBeUndefined();
    });

    it("hides blocked tasks until all blockers are verified", async () => {
      mocks.listTasks.mockResolvedValue([
        makeOwnedTask({ id: "blocked", blockerStatuses: [TaskStatus.ACTIVE] }),
        makeOwnedTask({ id: "open", blockerStatuses: [TaskStatus.VERIFIED] }),
      ]);
      mocks.isTaskBlocked.mockImplementation(({ blockerStatuses }: { blockerStatuses: string[] }) =>
        (blockerStatuses ?? []).some((s) => s !== TaskStatus.VERIFIED),
      );
      mocks.computeTaskPriority.mockReturnValue(makePriority());

      const client = await setup("user-1", ALL_SCOPES);
      const result = await client.callTool({ name: "getMyQueue", arguments: {} });

      const queue = parseToolBody(result).queue as Array<Record<string, unknown>>;
      expect(queue.map((task) => task.id)).toEqual(["open"]);
    });

    it("hides tasks before availableAt and expired expiring opportunities", async () => {
      mocks.listTasks.mockResolvedValue([
        makeOwnedTask({
          id: "future",
          availableAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        }),
        makeOwnedTask({
          id: "expired-grant",
          deadlinePolicy: "EXPIRES",
          dueAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        }),
        makeOwnedTask({ id: "open" }),
      ]);
      mocks.isTaskBlocked.mockReturnValue(false);
      mocks.computeTaskPriority.mockReturnValue(makePriority());

      const client = await setup("user-1", ALL_SCOPES);
      const result = await client.callTool({ name: "getMyQueue", arguments: {} });

      const queue = parseToolBody(result).queue as Array<Record<string, unknown>>;
      expect(queue.map((task) => task.id)).toEqual(["open"]);
    });
  });

  describe("getQueueAudit happy path", () => {
    it("flags tasks with invalid priority inputs", async () => {
      mocks.listTasks.mockResolvedValue([
        makeOwnedTask({ id: "good" }),
        makeOwnedTask({ id: "bad" }),
      ]);
      mocks.taskEdgeFindMany.mockResolvedValue([]);
      mocks.isTaskBlocked.mockReturnValue(false);
      mocks.computeTaskPriority.mockImplementation((task: { id: string }) =>
        makePriority(
          task.id === "bad"
            ? { valid: false, validationNotes: ["missing estimatedEffortHours"] }
            : {},
        ),
      );

      const client = await setup("user-1", ALL_SCOPES);
      const result = await client.callTool({ name: "getQueueAudit", arguments: {} });

      expect(result.isError).toBeFalsy();
      const body = parseToolBody(result);
      expect(body.summary).toMatchObject({ activeOwnedTasks: 2, unblockedTasks: 2 });
      const issues = body.issues as Array<{ taskId: string; code: string }>;
      expect(issues.some((i) => i.taskId === "bad" && i.code === "INVALID_SCORE")).toBe(true);
    });

    it("flags blocked tasks and orphaned dependencies", async () => {
      mocks.listTasks.mockResolvedValue([
        makeOwnedTask({ id: "blocked", blockerStatuses: [TaskStatus.ACTIVE] }),
        makeOwnedTask({ id: "orphan" }),
      ]);
      mocks.taskEdgeFindMany.mockResolvedValue([
        {
          fromTaskId: "deleted-dep",
          toTaskId: "orphan",
          fromTask: { id: "deleted-dep", deletedAt: new Date(), status: TaskStatus.ACTIVE },
        },
      ]);
      mocks.isTaskBlocked.mockImplementation(({ blockerStatuses }: { blockerStatuses: string[] }) =>
        (blockerStatuses ?? []).some((s) => s !== TaskStatus.VERIFIED),
      );
      mocks.computeTaskPriority.mockReturnValue(makePriority());

      const client = await setup("user-1", ALL_SCOPES);
      const result = await client.callTool({ name: "getQueueAudit", arguments: {} });

      const body = parseToolBody(result);
      const codes = (body.issues as Array<{ code: string }>).map((i) => i.code);
      expect(codes).toContain("BLOCKED_DEPENDENCY");
      expect(codes).toContain("ORPHAN_DEPENDENCY");
    });

    it("flags deadline-policy tasks that cannot be scheduled without an hour estimate", async () => {
      mocks.listTasks.mockResolvedValue([
        makeOwnedTask({
          id: "taxes",
          dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          deadlinePolicy: "REQUIRED",
          estimatedEffortHours: null,
        }),
      ]);
      mocks.taskEdgeFindMany.mockResolvedValue([]);
      mocks.isTaskBlocked.mockReturnValue(false);
      mocks.computeTaskPriority.mockReturnValue(makePriority());

      const client = await setup("user-1", ALL_SCOPES);
      const result = await client.callTool({ name: "getQueueAudit", arguments: {} });

      const body = parseToolBody(result);
      const issues = body.issues as Array<{ code: string; taskId: string }>;
      expect(issues).toContainEqual(
        expect.objectContaining({
          code: "DEADLINE_MISSING_HOURS",
          taskId: "taxes",
        }),
      );
    });
  });

  describe("task writes", () => {
    it("createTask accepts personal task aliases and returns a numeric priority", async () => {
      const dueAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      mocks.taskFindMany.mockResolvedValue([{ id: "blocker-1", isPublic: false, ownerUserId: "user-1" }]);
      mocks.getTaskDetailData.mockResolvedValue({
        task: makeOwnedTask({
          id: "created-task",
          title: "Build product demo",
          estimatedEffortHours: 6,
          dueAt,
          deadlinePolicy: "EXPIRES",
          contextJson: {
            deadline_rationale: "Grant portal closes on this date.",
            executor_type: "Self",
            value: 50000,
            p_success: 0.9,
            cash_cost: 0,
          },
          selectedImpactFrame: {
            expectedEconomicValueUsdBase: 45000,
            estimatedCashCostUsdBase: 0,
            estimatedEffortHoursBase: 6,
            successProbabilityBase: 0.9,
          },
        }),
      });
      mocks.computeTaskPriority.mockReturnValue(makePriority({ priority: 7500, realEv: 45000 }));

      const client = await setup("user-1", ALL_SCOPES);
      const result = await client.callTool({
        name: "createTask",
        arguments: {
          title: "Build product demo",
          hours: 6,
          value: 50000,
          p_success: 0.9,
          cash_cost: 0,
          executor_type: "Self",
          due_at: dueAt.toISOString(),
          deadline_policy: "EXPIRES",
          deadline_rationale: "Grant portal closes on this date.",
          depends_on: ["blocker-1"],
        },
      });

      const body = parseToolBody(result);
      expect(body).toMatchObject({
        id: "created-task",
        priority: 7500,
        executorType: "Self",
        hours: 6,
        value: 50000,
        pSuccess: 0.9,
        cashCost: 0,
      });
      expect(mocks.taskCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            contextJson: expect.objectContaining({
              deadline_rationale: "Grant portal closes on this date.",
            }),
            deadlinePolicy: "EXPIRES",
            dueAt: expect.any(Date),
            estimatedEffortHours: 6,
            isPublic: false,
            status: TaskStatus.ACTIVE,
          }),
        }),
      );
      expect(mocks.taskEdgeCreateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: [expect.objectContaining({ fromTaskId: "blocker-1", toTaskId: "created-task" })],
          skipDuplicates: true,
        }),
      );
    });

    it("updateTask replaces dependencies with depends_on", async () => {
      mocks.getTaskDetailData
        .mockResolvedValueOnce({
          task: makeOwnedTask({
            id: "task-1",
            ownerUserId: "user-1",
            contextJson: { executor_type: "Self" },
            selectedImpactFrame: {
              expectedEconomicValueUsdBase: 100,
              estimatedCashCostUsdBase: 0,
              estimatedEffortHoursBase: 1,
              successProbabilityBase: 1,
            },
          }),
        })
        .mockResolvedValueOnce({ task: makeOwnedTask({ id: "task-1", contextJson: { executor_type: "Self" } }) });
      mocks.taskFindMany.mockResolvedValue([{ id: "new-blocker", isPublic: false, ownerUserId: "user-1" }]);
      mocks.computeTaskPriority.mockReturnValue(makePriority({ priority: 100 }));

      const client = await setup("user-1", ALL_SCOPES);
      await client.callTool({
        name: "updateTask",
        arguments: { taskId: "task-1", depends_on: ["new-blocker"] },
      });

      expect(mocks.taskEdgeUpdateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ toTaskId: "task-1" }),
          data: expect.objectContaining({ deletedAt: expect.any(Date) }),
        }),
      );
      expect(mocks.taskEdgeCreateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: [expect.objectContaining({ fromTaskId: "new-blocker", toTaskId: "task-1" })],
          skipDuplicates: true,
        }),
      );
    });
  });

  describe("task comments", () => {
    it("postTaskComment creates a comment and triggers comment notifications with the author excluded", async () => {
      mocks.postComment.mockResolvedValueOnce({
        id: "comment-1",
        taskId: "task-1",
        message: "Owner/assignee update",
      });

      const client = await setup("user-1", ALL_SCOPES);
      const result = await client.callTool({
        name: "postTaskComment",
        arguments: {
          taskId: "task-1",
          message: "Owner/assignee update",
        },
      });

      const body = parseToolBody(result);
      expect(body.comment).toMatchObject({ id: "comment-1" });
      expect(mocks.postComment).toHaveBeenCalledWith({
        authorUserId: "user-1",
        mediaUrl: null,
        message: "Owner/assignee update",
        parentCommentId: null,
        taskId: "task-1",
      });
      expect(mocks.notifyTaskCommentRecipients).toHaveBeenCalledWith({
        authorUserId: "user-1",
        commentId: "comment-1",
        message: "Owner/assignee update",
        taskId: "task-1",
      });
    });
  });
});

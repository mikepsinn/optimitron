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
  userFindUnique: vi.fn(),
  upsertPrimaryTaskCommunicationEndpoint: vi.fn(),
  countUserCommentsInWindow: vi.fn(),
  postComment: vi.fn(),
  notifyTaskCommentRecipients: vi.fn(),
  generateAndPostWishoniaReply: vi.fn(),
  getProfileIdentityData: vi.fn(),
  updateUserProfile: vi.fn(),
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

class ProfileValidationError extends Error {
  field: string;
  constructor(message: string, field = "other") {
    super(message);
    this.name = "ProfileValidationError";
    this.field = field;
  }
}

vi.mock("../profile-identity.server", () => ({
  getProfileIdentityData: mocks.getProfileIdentityData,
  updateUserProfile: mocks.updateUserProfile,
  ProfileValidationError,
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
    user: {
      findUnique: mocks.userFindUnique,
    },
  },
}));

import { ALL_SCOPES, McpScope, createMcpServer } from "../mcp-server";

interface ToolText {
  text: string;
}

async function setup(
  userId: string | undefined,
  scopes: McpScope[] = ALL_SCOPES,
  options: { isAdmin?: boolean } = {},
) {
  const server = createMcpServer(userId, scopes, options);
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
  mocks.taskEdgeFindMany.mockResolvedValue([]);
  mocks.userFindUnique.mockResolvedValue({ personId: "person-1" });
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
    expect(names).not.toContain("recordTaskCommunication");
    expect(names).not.toContain("checkTaskCommunicationCooldown");
    expect(names).toContain("postTaskComment");
  });

  it("exposes public read and knowledge tools without legacy read/search scopes", async () => {
    const client = await setup("user-1", [McpScope.TASKS_PERSONAL]);

    const result = await client.listTools();
    const names = result.tools.map((tool) => tool.name);

    expect(names).toContain("listTasks");
    expect(names).toContain("getTask");
    expect(names).toContain("searchManual");
    expect(names).toContain("askWishonia");
  });

  it("hides public Earth write tools from non-admin MCP users", async () => {
    const nonAdminClient = await setup("user-1", ALL_SCOPES);
    const adminClient = await setup("admin-1", ALL_SCOPES, { isAdmin: true });

    const nonAdminNames = (await nonAdminClient.listTools()).tools.map((tool) => tool.name);
    const adminNames = (await adminClient.listTools()).tools.map((tool) => tool.name);

    expect(nonAdminNames).not.toContain("proposeTaskBundle");
    expect(nonAdminNames).not.toContain("setTaskImpact");
    expect(nonAdminNames).not.toContain("addDependency");
    expect(nonAdminNames).not.toContain("acquireLease");
    expect(nonAdminNames).not.toContain("logAgentRun");
    expect(nonAdminNames).toContain("createTask");

    expect(adminNames).toContain("proposeTaskBundle");
    expect(adminNames).toContain("setTaskImpact");
    expect(adminNames).toContain("addDependency");
    expect(adminNames).toContain("acquireLease");
    expect(adminNames).toContain("logAgentRun");
  });

  describe("task read tools", () => {
    it("advertises and applies assignedToMe without requiring the caller to know their personId", async () => {
      const client = await setup("user-1", ALL_SCOPES);

      const tools = await client.listTools();
      const listTasksTool = tools.tools.find((tool) => tool.name === "listTasks");
      expect(listTasksTool?.inputSchema.properties).toMatchObject({
        assignedToMe: expect.objectContaining({ type: "boolean" }),
      });

      mocks.listTasks.mockResolvedValue([
        makeOwnedTask({
          id: "assigned",
          title: "Assigned to me",
          assigneePersonId: "person-1",
        }),
      ]);

      const result = await client.callTool({
        name: "listTasks",
        arguments: { assignedToMe: true, status: "ACTIVE", limit: 5 },
      });

      expect(result.isError).toBeFalsy();
      expect(mocks.userFindUnique).toHaveBeenCalledWith({
        where: { id: "user-1" },
        select: { personId: true },
      });
      expect(mocks.listTasks).toHaveBeenCalledWith(
        expect.objectContaining({
          assigneePersonId: "person-1",
          limit: 5,
          status: TaskStatus.ACTIVE,
          userId: "user-1",
          visibility: "accessible",
        }),
      );
      const body = parseToolBody(result) as unknown as Array<Record<string, unknown>>;
      expect(body[0]).toMatchObject({ id: "assigned", title: "Assigned to me" });
    });

    it("enriches getTask output with executorType and markdown acceptance criteria when contextJson is missing them", async () => {
      mocks.getTaskDetailData.mockResolvedValue({
        taskCommunicationCount: 0,
        task: makeOwnedTask({
          id: "task-criteria",
          description: [
            "## Problem",
            "",
            "Do the work.",
            "",
            "## Acceptance criteria",
            "",
            "- [ ] First thing works",
            "- Second thing works",
          ].join("\n"),
          contextJson: { executor_type: "AI Agent" },
        }),
      });

      const client = await setup("user-1", ALL_SCOPES);
      const result = await client.callTool({
        name: "getTask",
        arguments: { taskId: "task-criteria" },
      });

      expect(result.isError).toBeFalsy();
      const body = parseToolBody(result);
      const task = body.task as Record<string, unknown>;
      expect(task.executorType).toBe("AI Agent");
      expect(task.contextJson).toMatchObject({
        acceptanceCriteria: ["First thing works", "Second thing works"],
        executor_type: "AI Agent",
      });
    });

    it("getBlockers ignores soft-deleted dependency edges so it agrees with getTask visibility", async () => {
      const client = await setup("user-1", ALL_SCOPES);
      await client.callTool({ name: "getBlockers", arguments: { taskId: "task-1" } });

      expect(mocks.taskEdgeFindMany).toHaveBeenCalledTimes(2);
      expect(mocks.taskEdgeFindMany.mock.calls[0]![0]).toMatchObject({
        where: { deletedAt: null, toTaskId: "task-1" },
      });
      expect(mocks.taskEdgeFindMany.mock.calls[1]![0]).toMatchObject({
        where: { deletedAt: null, fromTaskId: "task-1" },
      });
    });
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
      const client = await setup("user-1", []);

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
    it("rejects public task creation for non-admin users even with tasks:admin", async () => {
      const client = await setup("user-1", [McpScope.TASKS_PERSONAL, McpScope.TASKS_ADMIN]);

      const result = await client.callTool({
        name: "createTask",
        arguments: {
          title: "Public Earth task",
          isPublic: true,
        },
      });

      expect(result.isError).toBe(true);
      const body = parseToolBody(result);
      expect(body.error).toContain("admin user");
      expect(mocks.taskCreate).not.toHaveBeenCalled();
    });

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

    it("createTask copies markdown acceptance criteria into contextJson when the agent puts them in the description", async () => {
      mocks.getTaskDetailData.mockResolvedValue({
        task: makeOwnedTask({
          id: "created-task",
          contextJson: {
            executor_type: "Self",
            acceptanceCriteria: ["The page inventory tool is discoverable"],
          },
          selectedImpactFrame: {
            expectedEconomicValueUsdBase: 50,
            estimatedCashCostUsdBase: 0,
            estimatedEffortHoursBase: 1,
            successProbabilityBase: 0.5,
          },
        }),
      });
      mocks.computeTaskPriority.mockReturnValue(makePriority({ priority: 50 }));

      const client = await setup("user-1", ALL_SCOPES);
      await client.callTool({
        name: "createTask",
        arguments: {
          title: "Add site inventory tools",
          description: [
            "## Problem",
            "",
            "Agents need to see what pages exist.",
            "",
            "## Acceptance criteria",
            "",
            "- [ ] The page inventory tool is discoverable",
            "- [ ] Page content comes back as clean markdown",
          ].join("\n"),
          hours: 1,
          value: 100,
          p_success: 0.5,
        },
      });

      const data = (mocks.taskCreate.mock.calls[0]![0] as { data: Record<string, unknown> }).data;
      expect(data.contextJson).toMatchObject({
        acceptanceCriteria: [
          "The page inventory tool is discoverable",
          "Page content comes back as clean markdown",
        ],
      });
    });

    it("createTask omits null FK fields and sourceUrl from prisma.task.create — Prisma's checked TaskCreateInput rejects scalar FKs and the Task model has no sourceUrl column", async () => {
      // Regression for two production bugs found via the structured catch block:
      //   1. `parentTaskId: null` → "Unknown argument `parentTaskId`. Did you mean `parentTask`?"
      //   2. `sourceUrl: <anything>` → "Unknown argument `sourceUrl`" (no such column)
      mocks.getTaskDetailData.mockResolvedValue({
        task: makeOwnedTask({
          id: "created-task",
          contextJson: {
            executor_type: "Self",
            value: 100,
            p_success: 0.5,
            cash_cost: 0,
            sourceUrls: ["https://example.com/source"],
          },
          selectedImpactFrame: {
            expectedEconomicValueUsdBase: 50,
            estimatedCashCostUsdBase: 0,
            estimatedEffortHoursBase: 1,
            successProbabilityBase: 0.5,
          },
        }),
      });
      mocks.computeTaskPriority.mockReturnValue(makePriority({ priority: 50 }));

      const client = await setup("user-1", ALL_SCOPES);
      await client.callTool({
        name: "createTask",
        arguments: {
          title: "Without parent or assignee or sourceUrl column",
          hours: 1,
          value: 100,
          p_success: 0.5,
          executor_type: "Self",
          sourceUrl: "https://example.com/source",
        },
      });

      expect(mocks.taskCreate).toHaveBeenCalledTimes(1);
      const data = (mocks.taskCreate.mock.calls[0]![0] as { data: Record<string, unknown> }).data;
      expect(data).not.toHaveProperty("parentTaskId");
      expect(data).not.toHaveProperty("assigneePersonId");
      expect(data).not.toHaveProperty("assigneeOrganizationId");
      expect(data).not.toHaveProperty("sourceUrl");
      // The URL should still survive — folded into contextJson.sourceUrls.
      expect(data.contextJson).toMatchObject({
        sourceUrls: expect.arrayContaining(["https://example.com/source"]),
      });
    });

    it("createTask passes parentTaskId / assigneePersonId when supplied (the spread is conditional, not always-omit)", async () => {
      mocks.taskFindMany.mockResolvedValue([
        { id: "parent-1", isPublic: false, ownerUserId: "user-1" },
      ]);
      mocks.getTaskDetailData.mockResolvedValue({
        task: makeOwnedTask({
          id: "created-task",
          parentTaskId: "parent-1",
          contextJson: { executor_type: "Self", value: 100, p_success: 0.5, cash_cost: 0 },
          selectedImpactFrame: {
            expectedEconomicValueUsdBase: 50,
            estimatedCashCostUsdBase: 0,
            estimatedEffortHoursBase: 1,
            successProbabilityBase: 0.5,
          },
        }),
      });
      mocks.computeTaskPriority.mockReturnValue(makePriority({ priority: 50 }));

      const client = await setup("user-1", ALL_SCOPES);
      await client.callTool({
        name: "createTask",
        arguments: {
          title: "Subtask with parent + assignee",
          hours: 1,
          value: 100,
          p_success: 0.5,
          parentTaskId: "parent-1",
          assigneePersonId: "person-1",
        },
      });

      const data = (mocks.taskCreate.mock.calls[0]![0] as { data: Record<string, unknown> }).data;
      expect(data.parentTaskId).toBe("parent-1");
      expect(data.assigneePersonId).toBe("person-1");
    });

    it("updateTask replaces dependencies without losing retained soft-deleted edges", async () => {
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
          where: expect.objectContaining({
            toTaskId: "task-1",
            fromTaskId: { notIn: ["new-blocker"] },
          }),
          data: expect.objectContaining({ deletedAt: expect.any(Date) }),
        }),
      );
      expect(mocks.taskEdgeUpdateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            toTaskId: "task-1",
            fromTaskId: { in: ["new-blocker"] },
          }),
          data: { deletedAt: null },
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

  describe("getMe / updateMyProfile", () => {
    const profile = {
      user: {
        id: "user-1",
        name: "Test User",
        username: "testuser",
        email: "test@example.com",
        bio: "",
        headline: null,
        website: null,
        coverImage: null,
        isPublic: true,
        referralCode: null,
        image: null,
        newsletterSubscribed: false,
      },
      socialAccounts: [],
      linkedAuthProviderIds: ["google"],
    };

    it("getMe returns the profile for the authenticated user", async () => {
      mocks.getProfileIdentityData.mockResolvedValue(profile);
      const client = await setup("user-1", [McpScope.TASKS_PERSONAL]);

      const result = await client.callTool({ name: "getMe", arguments: {} });

      expect(result.isError).toBeFalsy();
      const body = parseToolBody(result);
      expect(body.userId).toBe("user-1");
      expect(body.personId).toBe("person-1");
      expect(mocks.userFindUnique).toHaveBeenCalledWith({
        where: { id: "user-1" },
        select: { personId: true },
      });
      expect(body.user).toMatchObject({ id: "user-1", email: "test@example.com" });
      expect(mocks.getProfileIdentityData).toHaveBeenCalledWith("user-1");
    });

    it("getMe returns authentication_required when called anonymously", async () => {
      const client = await setup(undefined, ALL_SCOPES);

      const result = await client.callTool({ name: "getMe", arguments: {} });

      expect(result.isError).toBe(true);
      const body = parseToolBody(result);
      expect(body.error).toBe("authentication_required");
      expect(body.tool).toBe("getMe");
    });

    it("updateMyProfile forwards only the supplied fields and returns the fresh profile", async () => {
      mocks.updateUserProfile.mockResolvedValue(profile);
      const client = await setup("user-1", [McpScope.TASKS_PERSONAL]);

      const result = await client.callTool({
        name: "updateMyProfile",
        arguments: { name: "New Name", username: "newhandle", bio: "hi" },
      });

      expect(result.isError).toBeFalsy();
      expect(mocks.updateUserProfile).toHaveBeenCalledWith("user-1", {
        name: "New Name",
        username: "newhandle",
        bio: "hi",
        headline: undefined,
        website: undefined,
        coverImage: undefined,
        isPublic: undefined,
        newsletterSubscribed: undefined,
        unsubscribedScopes: undefined,
      });
      const body = parseToolBody(result);
      expect(body.user).toMatchObject({ id: "user-1" });
    });

    it("updateMyProfile maps a ProfileValidationError to a clean tool error", async () => {
      mocks.updateUserProfile.mockRejectedValue(
        new ProfileValidationError(
          "That player name is already taken. Please choose another.",
          "username",
        ),
      );
      const client = await setup("user-1", [McpScope.TASKS_PERSONAL]);

      const result = await client.callTool({
        name: "updateMyProfile",
        arguments: { username: "taken" },
      });

      expect(result.isError).toBe(true);
      const body = parseToolBody(result);
      expect(body.error).toContain("already taken");
    });

    it("updateMyProfile rethrows non-validation errors so the catch block can capture the stack", async () => {
      mocks.updateUserProfile.mockRejectedValue(new Error("DB unreachable"));
      const client = await setup("user-1", [McpScope.TASKS_PERSONAL]);

      const result = await client.callTool({
        name: "updateMyProfile",
        arguments: { name: "Whatever" },
      });

      expect(result.isError).toBe(true);
      const body = parseToolBody(result);
      expect(body.error).toBe("tool_execution_failed");
      expect(body.message).toBe("DB unreachable");
    });
  });
});

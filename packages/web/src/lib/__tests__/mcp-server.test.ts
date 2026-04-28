import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { TaskClaimPolicy, TaskStatus } from "@optimitron/db/enums";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  listTasks: vi.fn(),
  getTaskDetailData: vi.fn(),
  computeSprintPriority: vi.fn(),
  rankTasksForUser: vi.fn(),
  isTaskBlocked: vi.fn(),
  isTaskLeased: vi.fn(),
  taskEdgeFindMany: vi.fn(),
}));

vi.mock("../tasks.server", () => ({
  listTasks: mocks.listTasks,
  getTaskDetailData: mocks.getTaskDetailData,
}));

vi.mock("../tasks/rank-tasks", () => ({
  computeSprintPriority: mocks.computeSprintPriority,
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
vi.mock("../tasks/task-communication-endpoints.server", () => ({}));

vi.mock("../prisma", () => ({
  prisma: {
    taskEdge: { findMany: mocks.taskEdgeFindMany },
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

function makeSprintPriority(overrides: Record<string, unknown> = {}) {
  return {
    sprintPriority: 100,
    realEv: 200,
    buybackRate: 1000,
    deadlineUrgency: 1,
    timeDiscount: 1,
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
});

describe("MCP server tool dispatch", () => {
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
    it("returns the top-ranked owned task with its sprint priority", async () => {
      mocks.listTasks.mockResolvedValue([
        makeOwnedTask({ id: "task-a", title: "Lower priority" }),
        makeOwnedTask({ id: "task-b", title: "Higher priority" }),
      ]);
      mocks.isTaskBlocked.mockReturnValue(false);
      mocks.computeSprintPriority.mockImplementation((task: { id: string }) =>
        makeSprintPriority({ sprintPriority: task.id === "task-b" ? 999 : 1 }),
      );

      const client = await setup("user-1", ALL_SCOPES);
      const result = await client.callTool({ name: "getNextAction", arguments: {} });

      expect(result.isError).toBeFalsy();
      const body = parseToolBody(result);
      expect(body.task).toMatchObject({ id: "task-b", title: "Higher priority" });
      expect(body.sprintPriority).toBe(999);
      expect(body.queueAudit).toMatchObject({ activeOwnedTasks: 2 });
    });

    it("filters out blocked tasks before picking the top action", async () => {
      const blocked = makeOwnedTask({ id: "blocked", blockerStatuses: [TaskStatus.ACTIVE] });
      const open = makeOwnedTask({ id: "open" });
      mocks.listTasks.mockResolvedValue([blocked, open]);
      mocks.isTaskBlocked.mockImplementation(({ blockerStatuses }: { blockerStatuses: string[] }) =>
        (blockerStatuses ?? []).some((s) => s !== TaskStatus.VERIFIED),
      );
      mocks.computeSprintPriority.mockReturnValue(makeSprintPriority());

      const client = await setup("user-1", ALL_SCOPES);
      const result = await client.callTool({ name: "getNextAction", arguments: {} });

      const body = parseToolBody(result);
      expect((body.task as { id: string }).id).toBe("open");
    });

    it("returns null task with the expected envelope when the queue is empty", async () => {
      mocks.listTasks.mockResolvedValue([]);
      mocks.isTaskBlocked.mockReturnValue(false);
      mocks.computeSprintPriority.mockReturnValue(makeSprintPriority());

      const client = await setup("user-1", ALL_SCOPES);
      const result = await client.callTool({ name: "getNextAction", arguments: {} });

      const body = parseToolBody(result);
      expect(body.task).toBeNull();
      expect(body.sprintPriority).toBe(0);
      expect(body.queueAudit).toMatchObject({ activeOwnedTasks: 0, unblockedTasks: 0 });
    });
  });

  describe("getQueueAudit happy path", () => {
    it("flags tasks with invalid sprint-priority inputs", async () => {
      mocks.listTasks.mockResolvedValue([
        makeOwnedTask({ id: "good" }),
        makeOwnedTask({ id: "bad" }),
      ]);
      mocks.taskEdgeFindMany.mockResolvedValue([]);
      mocks.isTaskBlocked.mockReturnValue(false);
      mocks.computeSprintPriority.mockImplementation((task: { id: string }) =>
        makeSprintPriority(
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
      mocks.computeSprintPriority.mockReturnValue(makeSprintPriority());

      const client = await setup("user-1", ALL_SCOPES);
      const result = await client.callTool({ name: "getQueueAudit", arguments: {} });

      const body = parseToolBody(result);
      const codes = (body.issues as Array<{ code: string }>).map((i) => i.code);
      expect(codes).toContain("BLOCKED_DEPENDENCY");
      expect(codes).toContain("ORPHAN_DEPENDENCY");
    });
  });
});

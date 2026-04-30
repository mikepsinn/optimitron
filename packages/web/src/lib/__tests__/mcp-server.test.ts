import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { ReferendumStatus, TaskClaimPolicy, TaskStatus } from "@optimitron/db/enums";
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
  referendumCreate: vi.fn(),
  referendumFindMany: vi.fn(),
  transaction: vi.fn(),
  userFindUnique: vi.fn(),
  upsertPrimaryTaskCommunicationEndpoint: vi.fn(),
  countUserCommentsInWindow: vi.fn(),
  postComment: vi.fn(),
  notifyTaskCommentRecipients: vi.fn(),
  generateAndPostWishoniaReply: vi.fn(),
  getProfileIdentityData: vi.fn(),
  updateUserProfile: vi.fn(),
  taskFindUnique: vi.fn(),
  upsertSignerReminderTask: vi.fn(),
  createTaskTrigger: vi.fn(),
  updateTaskTrigger: vi.fn(),
  disableTaskTrigger: vi.fn(),
  listTaskTriggers: vi.fn(),
  getTaskTrigger: vi.fn(),
  fireTaskTrigger: vi.fn(),
  fireTaskTriggersForEvent: vi.fn().mockResolvedValue([]),
  listSitePages: vi.fn(),
  getPageContent: vi.fn(),
}));

vi.mock("../triggers", () => ({
  fireTaskTrigger: mocks.fireTaskTrigger,
  fireTaskTriggersForEvent: vi.fn().mockResolvedValue([]),
  buildTriggerContext: (extras: Record<string, unknown> = {}) => extras,
  buildTriggerParams: () => ({}),
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

vi.mock("../signer-reminder-tasks.server", () => ({
  upsertSignerReminderTask: mocks.upsertSignerReminderTask,
  buildSignerReminderTaskKey: (cc: string, uid: string) =>
    `program:one-percent-treaty:reminder:${cc.toLowerCase()}:${uid}`,
}));

vi.mock("../triggers/admin", () => ({
  createTaskTrigger: mocks.createTaskTrigger,
  updateTaskTrigger: mocks.updateTaskTrigger,
  disableTaskTrigger: mocks.disableTaskTrigger,
  listTaskTriggers: mocks.listTaskTriggers,
  getTaskTrigger: mocks.getTaskTrigger,
}));

vi.mock("../triggers/fire", () => ({
  fireTaskTrigger: mocks.fireTaskTrigger,
}));

vi.mock("../site-inventory.server", () => ({
  listSitePages: mocks.listSitePages,
  getPageContent: mocks.getPageContent,
}));

vi.mock("../prisma", () => ({
  prisma: {
    $transaction: mocks.transaction,
    task: {
      create: mocks.taskCreate,
      findFirst: mocks.taskFindFirst,
      findMany: mocks.taskFindMany,
      findUnique: mocks.taskFindUnique,
      update: mocks.taskUpdate,
    },
    taskEdge: {
      createMany: mocks.taskEdgeCreateMany,
      findMany: mocks.taskEdgeFindMany,
      updateMany: mocks.taskEdgeUpdateMany,
    },
    taskImpactEstimateSet: { create: mocks.taskImpactEstimateSetCreate },
    taskImpactFrameEstimate: { create: mocks.taskImpactFrameEstimateCreate },
    referendum: {
      create: mocks.referendumCreate,
      findMany: mocks.referendumFindMany,
    },
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
  vi.unstubAllGlobals();
  delete process.env.GITHUB_PAT;
  delete process.env.GITHUB_TOKEN;
  delete process.env.GITHUB_REPO_ALLOWLIST;
  delete process.env.GITHUB_DEFAULT_REPO;
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
  mocks.referendumCreate.mockResolvedValue({
    id: "ref-new",
    title: "Trial Abundance Referendum",
    slug: "trial-abundance-referendum",
    description: "Should we fund pragmatic trials?",
    status: ReferendumStatus.DRAFT,
    jurisdictionId: null,
    createdByUserId: "user-1",
    createdAt: new Date("2026-04-29T12:00:00.000Z"),
    updatedAt: new Date("2026-04-29T12:00:00.000Z"),
    _count: { votes: 0, surveys: 0, organizationPositions: 0 },
  });
  mocks.referendumFindMany.mockResolvedValue([]);
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

function jsonResponse(body: unknown, init: { status?: number; headers?: Record<string, string> } = {}) {
  const status = init.status ?? 200;
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get(name: string) {
        return init.headers?.[name.toLowerCase()] ?? null;
      },
    },
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as Response;
}

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

  describe("repository and site inventory tools", () => {
    it("exposes GitHub repo tools (admin-only) and site inventory tools to authenticated MCP clients", async () => {
      const client = await setup("admin-1", ALL_SCOPES, { isAdmin: true });

      const result = await client.listTools();
      const names = result.tools.map((tool) => tool.name);

      expect(names).toEqual(
        expect.arrayContaining([
          "searchRepo",
          "getFileContent",
          "listRepoFiles",
          "githubApi",
          "listSitePages",
          "getPageContent",
        ]),
      );
    });

    it("hides GitHub repo tools from non-admin clients", async () => {
      const client = await setup("user-1", ALL_SCOPES);
      const result = await client.listTools();
      const names = result.tools.map((tool) => tool.name);

      expect(names).not.toContain("searchRepo");
      expect(names).not.toContain("getFileContent");
      expect(names).not.toContain("listRepoFiles");
      expect(names).not.toContain("githubApi");
    });

    it("searchRepo returns file matches without exposing the GitHub token", async () => {
      process.env.GITHUB_PAT = "ghp_secret";
      const fetchMock = vi.fn(async (url: string) => {
        expect(url).toContain("https://api.github.com/search/code");
        expect(url).toContain("repo%3Amikepsinn%2Foptimitron");
        return jsonResponse({
          total_count: 1,
          items: [
            {
              name: "mcp-server.ts",
              path: "packages/web/src/lib/mcp-server.ts",
              sha: "abc123",
              html_url:
                "https://github.com/mikepsinn/optimitron/blob/main/packages/web/src/lib/mcp-server.ts",
              repository: { full_name: "mikepsinn/optimitron" },
              text_matches: [{ fragment: "const TASK_TOOL_DEFINITIONS = []" }],
            },
          ],
        });
      });
      vi.stubGlobal("fetch", fetchMock);

      const client = await setup("admin-1", ALL_SCOPES, { isAdmin: true });
      const result = await client.callTool({
        name: "searchRepo",
        arguments: { query: "TASK_TOOL_DEFINITIONS", repo: "optimitron", fileType: "ts" },
      });

      expect(result.isError).toBeFalsy();
      const body = parseToolBody(result);
      expect(body).toMatchObject({ totalCount: 1 });
      expect((body.results as Array<Record<string, unknown>>)[0]).toMatchObject({
        path: "packages/web/src/lib/mcp-server.ts",
        repo: "mikepsinn/optimitron",
      });
      expect(JSON.stringify(body)).not.toContain("ghp_secret");
      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            authorization: "Bearer ghp_secret",
          }),
        }),
      );
    });

    it("getFileContent and listRepoFiles read through GitHub Contents API", async () => {
      const source = "export const value = 42;\n";
      const fetchMock = vi.fn(async (url: string) => {
        if (url.includes("packages%2Fweb%2Fsrc%2Fvalue.ts")) {
          return jsonResponse(
            {
              content: Buffer.from(source, "utf8").toString("base64"),
              encoding: "base64",
              html_url:
                "https://github.com/mikepsinn/optimitron/blob/main/packages/web/src/value.ts",
              name: "value.ts",
              path: "packages/web/src/value.ts",
              sha: "sha-file",
              size: source.length,
              type: "file",
            },
            { headers: { "last-modified": "Wed, 29 Apr 2026 12:00:00 GMT" } },
          );
        }

        return jsonResponse([
          {
            html_url:
              "https://github.com/mikepsinn/optimitron/tree/main/packages/web/src",
            name: "lib",
            path: "packages/web/src/lib",
            sha: "sha-dir",
            size: 0,
            type: "dir",
          },
        ]);
      });
      vi.stubGlobal("fetch", fetchMock);

      const client = await setup("admin-1", ALL_SCOPES, { isAdmin: true });
      const fileResult = await client.callTool({
        name: "getFileContent",
        arguments: {
          repo: "mikepsinn/optimitron",
          path: "packages/web/src/value.ts",
        },
      });
      const listResult = await client.callTool({
        name: "listRepoFiles",
        arguments: { repo: "optimitron", path: "packages/web/src" },
      });

      expect(fileResult.isError).toBeFalsy();
      expect(parseToolBody(fileResult)).toMatchObject({
        content: source,
        lastModified: "Wed, 29 Apr 2026 12:00:00 GMT",
        path: "packages/web/src/value.ts",
        repo: "mikepsinn/optimitron",
      });
      expect(listResult.isError).toBeFalsy();
      expect(parseToolBody(listResult).entries).toEqual([
        expect.objectContaining({ path: "packages/web/src/lib", type: "dir" }),
      ]);
    });

    it("listSitePages filters to one configured domain", async () => {
      mocks.listSitePages.mockResolvedValue({
        count: 2,
        pages: [
          {
            description: "Vote on the 1% Treaty.",
            lastModified: "2026-04-29T12:00:00.000Z",
            path: "/vote",
            site: "warondisease.org",
            title: "Vote",
            url: "https://warondisease.org/vote",
          },
          {
            description: "Read the treaty.",
            lastModified: "2026-04-29T12:00:00.000Z",
            path: "/treaty",
            site: "warondisease.org",
            title: "Read the Treaty",
            url: "https://warondisease.org/treaty",
          },
        ],
      });
      const client = await setup("user-1", ALL_SCOPES);

      const result = await client.callTool({
        name: "listSitePages",
        arguments: { site: "warondisease.org" },
      });

      expect(result.isError).toBeFalsy();
      expect(mocks.listSitePages).toHaveBeenCalledWith({ site: "warondisease.org" });
      const body = parseToolBody(result);
      const pages = body.pages as Array<Record<string, unknown>>;
      expect(pages.length).toBeGreaterThan(0);
      expect(pages.every((page) => String(page.url).startsWith("https://warondisease.org/"))).toBe(
        true,
      );
      expect(pages.some((page) => page.url === "https://warondisease.org/vote")).toBe(true);
    }, 15_000);

    it("getPageContent returns markdown for an allowed Optimitron property URL", async () => {
      mocks.getPageContent.mockResolvedValue({
        content: "# Vote\n\nNo HTML soup.\n\n- One task",
        lastModified: "Wed, 29 Apr 2026 12:00:00 GMT",
        sections: ["Vote"],
        title: "Vote",
        url: "https://warondisease.org/vote",
      });
      const client = await setup("user-1", ALL_SCOPES);

      const result = await client.callTool({
        name: "getPageContent",
        arguments: { url: "https://warondisease.org/vote" },
      });

      expect(result.isError).toBeFalsy();
      expect(mocks.getPageContent).toHaveBeenCalledWith({
        url: "https://warondisease.org/vote",
      });
      const body = parseToolBody(result);
      expect(body).toMatchObject({
        title: "Vote",
        url: "https://warondisease.org/vote",
        lastModified: "Wed, 29 Apr 2026 12:00:00 GMT",
      });
      expect(body.content).toContain("# Vote");
      expect(body.content).toContain("- One task");
      expect(body.content).not.toContain("<main");
      expect(body.sections).toEqual(["Vote"]);
    }, 15_000);
  });

  describe("referendum tools", () => {
    it("exposes listReferendums publicly and createReferendum only to admins", async () => {
      const publicClient = await setup(undefined, []);
      const adminClient = await setup("admin-1", ALL_SCOPES, { isAdmin: true });

      const publicNames = (await publicClient.listTools()).tools.map((tool) => tool.name);
      const adminNames = (await adminClient.listTools()).tools.map((tool) => tool.name);

      expect(publicNames).toContain("listReferendums");
      expect(publicNames).not.toContain("createReferendum");
      expect(adminNames).toContain("listReferendums");
      expect(adminNames).toContain("createReferendum");
    });

    it("listReferendums returns active referendums with vote counts by default", async () => {
      mocks.referendumFindMany.mockResolvedValue([
        {
          id: "ref-1",
          title: "1% Treaty",
          slug: "one-percent-treaty",
          description: "Redirect 1% of military spending to pragmatic trials.",
          status: ReferendumStatus.ACTIVE,
          jurisdictionId: null,
          createdByUserId: "seed",
          createdAt: new Date("2026-04-20T12:00:00.000Z"),
          updatedAt: new Date("2026-04-21T12:00:00.000Z"),
          _count: { votes: 42, surveys: 3, organizationPositions: 2 },
        },
      ]);

      const client = await setup(undefined, []);
      const result = await client.callTool({
        name: "listReferendums",
        arguments: { limit: 5 },
      });

      expect(result.isError).toBeFalsy();
      expect(mocks.referendumFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { deletedAt: null, status: ReferendumStatus.ACTIVE },
          take: 5,
        }),
      );
      const body = parseToolBody(result);
      expect(body.referendums).toEqual([
        expect.objectContaining({
          id: "ref-1",
          slug: "one-percent-treaty",
          status: ReferendumStatus.ACTIVE,
          voteCount: 42,
          path: "/agencies/dcongress/referendums/one-percent-treaty",
        }),
      ]);
    });

    it("createReferendum creates a draft referendum by default and attributes the creator", async () => {
      const client = await setup("user-1", ALL_SCOPES, { isAdmin: true });
      const result = await client.callTool({
        name: "createReferendum",
        arguments: {
          title: "Trial Abundance Referendum",
          description: "Should we fund pragmatic trials?",
        },
      });

      expect(result.isError).toBeFalsy();
      expect(mocks.referendumCreate).toHaveBeenCalledWith({
        data: {
          title: "Trial Abundance Referendum",
          slug: "trial-abundance-referendum",
          description: "Should we fund pragmatic trials?",
          status: ReferendumStatus.DRAFT,
          createdByUserId: "user-1",
        },
        select: expect.any(Object),
      });
      const body = parseToolBody(result);
      expect(body.referendum).toMatchObject({
        id: "ref-new",
        slug: "trial-abundance-referendum",
        status: ReferendumStatus.DRAFT,
        voteCount: 0,
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
    describe("createTask required-field validation", () => {
      it("rejects when description is missing", async () => {
        const client = await setup("user-1", ALL_SCOPES);
        const result = await client.callTool({
          name: "createTask",
          arguments: {
            title: "no description",
            category: "ENGINEERING",
            acceptanceCriteria: ["x"],
            impactStatement: "y",
            hours: 1,
            value: 100,
            p_success: 0.5,
          },
        });
        expect(result.isError).toBe(true);
        expect(parseToolBody(result).error).toContain("description is required");
        expect(mocks.taskCreate).not.toHaveBeenCalled();
      });

      it("rejects when category is missing or invalid", async () => {
        const client = await setup("user-1", ALL_SCOPES);
        const result = await client.callTool({
          name: "createTask",
          arguments: {
            title: "no category",
            description: "x",
            acceptanceCriteria: ["x"],
            impactStatement: "y",
            hours: 1,
            value: 100,
            p_success: 0.5,
          },
        });
        expect(result.isError).toBe(true);
        expect(parseToolBody(result).error).toContain("category is required");
        expect(mocks.taskCreate).not.toHaveBeenCalled();
      });

      it("rejects when impactStatement is missing", async () => {
        const client = await setup("user-1", ALL_SCOPES);
        const result = await client.callTool({
          name: "createTask",
          arguments: {
            title: "no impact",
            description: "x",
            category: "ENGINEERING",
            acceptanceCriteria: ["x"],
            hours: 1,
            value: 100,
            p_success: 0.5,
          },
        });
        expect(result.isError).toBe(true);
        expect(parseToolBody(result).error).toContain("impactStatement is required");
        expect(mocks.taskCreate).not.toHaveBeenCalled();
      });

      it("rejects when neither acceptanceCriteria array nor markdown checklist is present", async () => {
        const client = await setup("user-1", ALL_SCOPES);
        const result = await client.callTool({
          name: "createTask",
          arguments: {
            title: "no acceptance",
            description: "Plain prose with no checklist bullets at all.",
            category: "ENGINEERING",
            impactStatement: "y",
            hours: 1,
            value: 100,
            p_success: 0.5,
          },
        });
        expect(result.isError).toBe(true);
        expect(parseToolBody(result).error).toContain("acceptanceCriteria is required");
        expect(mocks.taskCreate).not.toHaveBeenCalled();
      });

      it("rejects when hours, value, and p_success are all missing", async () => {
        const client = await setup("user-1", ALL_SCOPES);
        const result = await client.callTool({
          name: "createTask",
          arguments: {
            title: "no economics",
            description: "x",
            category: "ENGINEERING",
            acceptanceCriteria: ["x"],
            impactStatement: "y",
          },
        });
        expect(result.isError).toBe(true);
        const errMsg = parseToolBody(result).error;
        expect(errMsg).toContain("Missing ranking-critical fields");
        expect(errMsg).toContain("hours");
        expect(errMsg).toContain("value");
        expect(errMsg).toContain("p_success");
        expect(mocks.taskCreate).not.toHaveBeenCalled();
      });

      it("response includes missingFields[] for soft-recommended fields", async () => {
        mocks.getTaskDetailData.mockResolvedValue({
          task: makeOwnedTask({
            id: "created-task",
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
        const result = await client.callTool({
          name: "createTask",
          arguments: {
            title: "minimal-but-valid",
            description: "x",
            category: "ENGINEERING",
            acceptanceCriteria: ["x"],
            impactStatement: "y",
            hours: 1,
            value: 100,
            p_success: 0.5,
            // Skipped: cash_cost, executor_type, difficulty, timeToImpactStartDays, taskKey
          },
        });
        const body = parseToolBody(result);
        expect(body.missingFields).toEqual(
          expect.arrayContaining([
            "cash_cost",
            "executor_type",
            "difficulty",
            "timeToImpactStartDays",
            expect.stringContaining("taskKey"),
          ]),
        );
        expect(body.recommendation).toContain("updateTask");
      });

      it("accepts markdown 'Acceptance criteria' section in lieu of explicit array", async () => {
        // This is documented as the intended fallback in the createTask description.
        mocks.getTaskDetailData.mockResolvedValue({
          task: makeOwnedTask({
            id: "created-task",
            contextJson: {
              executor_type: "Self",
              acceptanceCriteria: ["bullet one", "bullet two"],
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
        const result = await client.callTool({
          name: "createTask",
          arguments: {
            title: "markdown-only criteria",
            description: "## Acceptance criteria\n- [ ] bullet one\n- [ ] bullet two\n",
            category: "ENGINEERING",
            impactStatement: "y",
            hours: 1,
            value: 100,
            p_success: 0.5,
          },
        });
        expect(result.isError).toBeFalsy();
        expect(mocks.taskCreate).toHaveBeenCalledTimes(1);
      });

      it("explicit p_success round-trips into stored contextJson (no silent inflation)", async () => {
        // Regression guard for the 2026-04-30 bug where the old default
        // was 1.0 — a task without explicit p_success was treated as a
        // guaranteed success, inflating EV. The default is now 0.5 (in
        // resolveTaskEconomics); createTask additionally hard-requires
        // p_success at the handler boundary so the default only matters
        // for updateTask paths. This test confirms a passed value
        // round-trips unchanged into the stored task contextJson.
        mocks.getTaskDetailData.mockResolvedValue({
          task: makeOwnedTask({
            id: "created-task",
            contextJson: { executor_type: "Self", value: 100, p_success: 0.42 },
            selectedImpactFrame: {
              expectedEconomicValueUsdBase: 42,
              estimatedCashCostUsdBase: 0,
              estimatedEffortHoursBase: 1,
              successProbabilityBase: 0.42,
            },
          }),
        });
        mocks.computeTaskPriority.mockReturnValue(makePriority({ priority: 42 }));
        const client = await setup("user-1", ALL_SCOPES);
        await client.callTool({
          name: "createTask",
          arguments: {
            title: "explicit p_success",
            description: "x",
            category: "ENGINEERING",
            acceptanceCriteria: ["x"],
            impactStatement: "y",
            hours: 1,
            value: 100,
            p_success: 0.42,
          },
        });
        const ctx = (mocks.taskCreate.mock.calls[0]![0] as {
          data: { contextJson?: { p_success?: number } };
        }).data.contextJson;
        expect(ctx?.p_success).toBe(0.42);
      });
    });

    it("rejects public task creation for non-admin users even with tasks:admin", async () => {
      const client = await setup("user-1", [McpScope.TASKS_PERSONAL, McpScope.TASKS_ADMIN]);

      const result = await client.callTool({
        name: "createTask",
        arguments: {
          title: "Public Earth task",
          description: "A public task that should be rejected for non-admin users.",
          category: "ENGINEERING",
          acceptanceCriteria: ["Public visibility is rejected for non-admin users"],
          impactStatement: "Verifies the admin gate on public task creation.",
          hours: 1,
          value: 100,
          p_success: 0.5,
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
          description: "Record a 5-minute walkthrough of the new dashboard.",
          category: "ENGINEERING",
          acceptanceCriteria: [
            "Demo video is recorded end-to-end",
            "Video is uploaded and shareable link works",
          ],
          impactStatement: "Unlocks the grant submission worth $50K.",
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
          category: "ENGINEERING",
          impactStatement: "Lets agents discover and read site pages programmatically.",
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
          description: "Create a task with no parent, no assignee, and a sourceUrl that should be folded into contextJson.",
          category: "ENGINEERING",
          acceptanceCriteria: ["sourceUrl is folded into contextJson.sourceUrls"],
          impactStatement: "Regression-test the prisma write shape.",
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
          description: "A subtask attached to parent-1 and assigned to person-1.",
          category: "ENGINEERING",
          acceptanceCriteria: ["parentTaskId is set to parent-1", "assigneePersonId is set to person-1"],
          impactStatement: "Verifies conditional-spread of FK fields in the create payload.",
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

    it("addDependency stores downstream lift metadata on the edge", async () => {
      mocks.taskFindMany.mockResolvedValue([
        { id: "blocked-task", isPublic: false, ownerUserId: "user-1" },
        { id: "blocker-task", isPublic: false, ownerUserId: "user-1" },
      ]);

      const client = await setup("user-1", ALL_SCOPES, { isAdmin: true });
      const result = await client.callTool({
        name: "addDependency",
        arguments: {
          blockedTaskId: "blocked-task",
          blockerTaskId: "blocker-task",
          increases_p_success: 0.35,
          time_delta_days: 14,
          assumptions: ["Drafting the evidence memo raises grant odds from 20% to 55%."],
          label: "Raises grant odds",
          calculationVersion: "edge-lift-v1",
        },
      });

      const body = parseToolBody(result);
      expect(body).toMatchObject({
        blockedTaskId: "blocked-task",
        blockerTaskId: "blocker-task",
        probabilityDeltaBase: 0.35,
        timeDeltaDaysBase: 14,
        notes: "Raises grant odds",
      });
      expect(mocks.taskEdgeUpdateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            deletedAt: null,
            probabilityDeltaBase: 0.35,
            timeDeltaDaysBase: 14,
            assumptionsJson: {
              assumptions: ["Drafting the evidence memo raises grant odds from 20% to 55%."],
            },
            calculationVersion: "edge-lift-v1",
            notes: "Raises grant odds",
          }),
        }),
      );
      expect(mocks.taskEdgeCreateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: [
            expect.objectContaining({
              fromTaskId: "blocker-task",
              toTaskId: "blocked-task",
              probabilityDeltaBase: 0.35,
              timeDeltaDaysBase: 14,
              notes: "Raises grant odds",
            }),
          ],
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

  describe("claimSignerReminder", () => {
    function mockSignerTaskExists() {
      mocks.taskFindUnique.mockResolvedValue({
        id: "1-pct-treaty-signer-va",
        taskKey: "program:one-percent-treaty:signer:va",
        roleTitle: "Head of Government",
        assigneePerson: { displayName: "Raffaella Petrini" },
        assigneeOrganization: { name: "Government of Holy See (Vatican City)" },
      });
    }

    function mockUserHasReferralCode() {
      mocks.userFindUnique.mockResolvedValue({
        id: "user-1",
        personId: "person-1",
        referralCode: "MIKE-CFCFHP5W",
      });
    }

    it("requires authentication", async () => {
      const client = await setup(undefined, ALL_SCOPES);
      const result = await client.callTool({
        name: "claimSignerReminder",
        arguments: { signerTaskId: "1-pct-treaty-signer-va" },
      });
      expect(result.isError).toBe(true);
      const body = parseToolBody(result);
      expect(body.error).toBe("authentication_required");
      expect(body.tool).toBe("claimSignerReminder");
    });

    it("rejects non-signer task IDs (taskKey doesn't match the signer pattern)", async () => {
      mocks.taskFindUnique.mockResolvedValue({
        id: "some-other-task",
        taskKey: "owned:1",
        roleTitle: null,
        assigneePerson: null,
        assigneeOrganization: null,
      });
      mockUserHasReferralCode();

      const client = await setup("user-1", ALL_SCOPES);
      const result = await client.callTool({
        name: "claimSignerReminder",
        arguments: { signerTaskId: "some-other-task" },
      });

      expect(result.isError).toBe(true);
      const body = parseToolBody(result);
      expect(String(body.error)).toContain("not a 1% Treaty signer task");
    });

    it("rejects when caller is missing a referralCode", async () => {
      mockSignerTaskExists();
      mocks.userFindUnique.mockResolvedValue({
        id: "user-1",
        personId: "person-1",
        referralCode: null,
      });

      const client = await setup("user-1", ALL_SCOPES);
      const result = await client.callTool({
        name: "claimSignerReminder",
        arguments: { signerTaskId: "1-pct-treaty-signer-va" },
      });

      expect(result.isError).toBe(true);
      const body = parseToolBody(result);
      expect(String(body.error)).toContain("referralCode");
    });

    it("happy path: passes signer + caller info to upsertSignerReminderTask, returns the new subtask", async () => {
      mockSignerTaskExists();
      mockUserHasReferralCode();
      mocks.upsertSignerReminderTask.mockResolvedValue({
        alreadyExisted: false,
        taskId: "reminder-task-1",
        taskKey: "program:one-percent-treaty:reminder:va:user-1",
      });
      mocks.getTaskDetailData.mockResolvedValue({
        task: makeOwnedTask({
          id: "reminder-task-1",
          title: "Remind Raffaella Petrini to sign the 1% Treaty",
          ownerUserId: "user-1",
          parentTaskId: "1-pct-treaty-signer-va",
        }),
      });
      mocks.computeTaskPriority.mockReturnValue(makePriority({ priority: 999 }));

      const client = await setup("user-1", ALL_SCOPES);
      const result = await client.callTool({
        name: "claimSignerReminder",
        arguments: { signerTaskId: "1-pct-treaty-signer-va" },
      });

      expect(result.isError).toBeFalsy();
      const body = parseToolBody(result);
      expect(body).toMatchObject({
        alreadyExisted: false,
        countryCode: "va",
        parentSignerTaskId: "1-pct-treaty-signer-va",
        taskId: "reminder-task-1",
        taskKey: "program:one-percent-treaty:reminder:va:user-1",
      });

      // Verify the helper was called with the citizen's identity + signer details.
      expect(mocks.upsertSignerReminderTask).toHaveBeenCalledTimes(1);
      const helperCall = mocks.upsertSignerReminderTask.mock.calls[0]![0];
      expect(helperCall).toMatchObject({
        ownerPersonId: "person-1",
        ownerUserId: "user-1",
        referralCode: "MIKE-CFCFHP5W",
        signer: {
          countryCode: "va",
          governmentName: "Government of Holy See (Vatican City)",
          id: "1-pct-treaty-signer-va",
          leaderName: "Raffaella Petrini",
          roleTitle: "Head of Government",
        },
      });
    });

    it("idempotent: when helper reports alreadyExisted=true, the response surfaces it", async () => {
      mockSignerTaskExists();
      mockUserHasReferralCode();
      mocks.upsertSignerReminderTask.mockResolvedValue({
        alreadyExisted: true,
        taskId: "reminder-task-1",
        taskKey: "program:one-percent-treaty:reminder:va:user-1",
      });
      mocks.getTaskDetailData.mockResolvedValue({
        task: makeOwnedTask({ id: "reminder-task-1", ownerUserId: "user-1" }),
      });
      mocks.computeTaskPriority.mockReturnValue(makePriority());

      const client = await setup("user-1", ALL_SCOPES);
      const result = await client.callTool({
        name: "claimSignerReminder",
        arguments: { signerTaskId: "1-pct-treaty-signer-va" },
      });

      const body = parseToolBody(result);
      expect(body.alreadyExisted).toBe(true);
    });

    it("missing signerTaskId arg surfaces a clean error", async () => {
      mockUserHasReferralCode();
      const client = await setup("user-1", ALL_SCOPES);
      const result = await client.callTool({
        name: "claimSignerReminder",
        arguments: {},
      });
      expect(result.isError).toBe(true);
      const body = parseToolBody(result);
      expect(String(body.error)).toContain("signerTaskId is required");
    });

    it("non-existent signer task returns a not-found error", async () => {
      mocks.taskFindUnique.mockResolvedValue(null);
      mockUserHasReferralCode();

      const client = await setup("user-1", ALL_SCOPES);
      const result = await client.callTool({
        name: "claimSignerReminder",
        arguments: { signerTaskId: "ghost-task" },
      });

      expect(result.isError).toBe(true);
      const body = parseToolBody(result);
      expect(String(body.error)).toContain("Signer task not found");
    });
  });

  describe("dashboard lifecycle (fresh-user onboarding queue)", () => {
    // The system auto-spawns 4 tasks at signup (ensureUserTreatyTask in
    // user-treaty-task.server.ts):
    //   - parent: "Get 4 billion people to vote on the 1% Treaty"
    //   - subtask: "Share your 1% Treaty referral URL"             (sortOrder 0)
    //   - subtask: "Give your first human the 1% Treaty voting task"   (sortOrder 10)
    //   - subtask: "Give your second human the 1% Treaty voting task"  (sortOrder 20)
    //   - subtask: "Humanity Management Training"                  (sortOrder 30, auto-VERIFIED when 1+2+3 done)
    //
    // These tests pin the shape of getMyQueue for a user who has just signed
    // up and not yet sent any invitations. They replace "log in to a fresh
    // demo user and eyeball the queue" manual checks.

    function makeAutoSpawnedTasks(userId: string) {
      const parentKey = `program:one-percent-treaty:user:${userId}`;
      return [
        // Parent (huge realEv → always sorts first)
        makeOwnedTask({
          id: `parent-${userId}`,
          title: "Get 4 billion people to vote on the 1% Treaty",
          taskKey: parentKey,
          ownerUserId: userId,
          parentTaskId: "1-pct-treaty",
        }),
        // Share referral URL (highest among subtasks)
        makeOwnedTask({
          id: `share-${userId}`,
          title: "Share your 1% Treaty referral URL",
          taskKey: `${parentKey}:shareReferralUrl`,
          ownerUserId: userId,
          parentTaskId: `parent-${userId}`,
        }),
        // Assign first human
        makeOwnedTask({
          id: `assign1-${userId}`,
          title: "Give your first human the 1% Treaty voting task",
          taskKey: `${parentKey}:assignFirstHuman`,
          ownerUserId: userId,
          parentTaskId: `parent-${userId}`,
        }),
        // Assign second human
        makeOwnedTask({
          id: `assign2-${userId}`,
          title: "Give your second human the 1% Treaty voting task",
          taskKey: `${parentKey}:assignSecondHuman`,
          ownerUserId: userId,
          parentTaskId: `parent-${userId}`,
        }),
        // Humanity Management Training meta-task
        makeOwnedTask({
          id: `training-${userId}`,
          title: "Humanity Management Training",
          taskKey: `${parentKey}:completeTraining`,
          ownerUserId: userId,
          parentTaskId: `parent-${userId}`,
        }),
      ];
    }

    it("a fresh user sees all five auto-spawned onboarding tasks in priority order (parent first, training meta last)", async () => {
      const userId = "fresh-user-1";
      const tasks = makeAutoSpawnedTasks(userId);
      mocks.listTasks.mockResolvedValue(tasks);
      mocks.isTaskBlocked.mockReturnValue(false);
      // Priority mirrors production: parent has huge realEv, subtasks rank
      // by their inputs (share is fastest = highest, training has no value
      // until completion = lowest among ACTIVE).
      mocks.computeTaskPriority.mockImplementation(
        (input: { id: string; taskKey?: string }) => {
          const key = input.taskKey ?? "";
          if (key.endsWith(":completeTraining")) return makePriority({ priority: 1, realEv: 0 });
          if (key.endsWith(":shareReferralUrl")) return makePriority({ priority: 5_000, realEv: 100 });
          if (key.endsWith(":assignFirstHuman")) return makePriority({ priority: 4_000, realEv: 100 });
          if (key.endsWith(":assignSecondHuman")) return makePriority({ priority: 4_000, realEv: 100 });
          // Parent treaty task: enormous expected value
          return makePriority({ priority: 9e14, realEv: 4.5e14 });
        },
      );

      const client = await setup(userId, ALL_SCOPES);
      const result = await client.callTool({ name: "getMyQueue", arguments: { maxResults: 10 } });

      expect(result.isError).toBeFalsy();
      const body = parseToolBody(result);
      const queue = body.queue as Array<{ id: string; taskKey: string; title: string }>;

      expect(queue).toHaveLength(5);
      // Parent always at top because of its priority
      expect(queue[0]?.taskKey).toBe(`program:one-percent-treaty:user:${userId}`);
      // Training meta-task always at the bottom (auto-completes via the others)
      expect(queue[queue.length - 1]?.taskKey).toBe(
        `program:one-percent-treaty:user:${userId}:completeTraining`,
      );
      // Share referral URL is the highest-priority concrete first action
      const shareIndex = queue.findIndex((t) =>
        t.taskKey.endsWith(":shareReferralUrl"),
      );
      const assign1Index = queue.findIndex((t) =>
        t.taskKey.endsWith(":assignFirstHuman"),
      );
      expect(shareIndex).toBeLessThan(assign1Index);
    });

    it("after share-referral and both assignments verify, queue collapses to just the parent", async () => {
      const userId = "fresh-user-2";
      const tasks = makeAutoSpawnedTasks(userId);
      // Simulate the three subtasks completing — listTasks at status=ACTIVE
      // returns only what's still active (parent + training meta until the
      // training auto-verifies).
      const remainingActive = tasks.filter(
        (t) => !t.taskKey.includes(":shareReferralUrl") &&
               !t.taskKey.includes(":assignFirstHuman") &&
               !t.taskKey.includes(":assignSecondHuman"),
      );
      mocks.listTasks.mockResolvedValue(remainingActive);
      mocks.isTaskBlocked.mockReturnValue(false);
      mocks.computeTaskPriority.mockImplementation(
        (input: { id: string; taskKey?: string }) => {
          if (input.taskKey?.endsWith(":completeTraining")) return makePriority({ priority: 1 });
          return makePriority({ priority: 9e14 });
        },
      );

      const client = await setup(userId, ALL_SCOPES);
      const result = await client.callTool({ name: "getMyQueue", arguments: {} });

      const body = parseToolBody(result);
      const queue = body.queue as Array<{ id: string; taskKey: string }>;
      // Parent + training meta survive (training will auto-VERIFY via
      // refreshHumanityManagementTrainingCompletion in the real system).
      expect(queue).toHaveLength(2);
      expect(queue.map((t) => t.taskKey)).toEqual([
        `program:one-percent-treaty:user:${userId}`,
        `program:one-percent-treaty:user:${userId}:completeTraining`,
      ]);
    });

    it("dynamic invitation tasks rank below the auto-spawned subtasks but above completed ones", async () => {
      const userId = "fresh-user-3";
      const baseline = makeAutoSpawnedTasks(userId);
      const inviteTask = makeOwnedTask({
        id: `invite-${userId}-alice`,
        title: "alice@example.com: vote on the 1% Treaty",
        taskKey: `program:one-percent-treaty:referral-invitation:invite-token-alice`,
        ownerUserId: userId,
        parentTaskId: `parent-${userId}`,
      });
      mocks.listTasks.mockResolvedValue([...baseline, inviteTask]);
      mocks.isTaskBlocked.mockReturnValue(false);
      mocks.computeTaskPriority.mockImplementation(
        (input: { id: string; taskKey?: string }) => {
          const key = input.taskKey ?? "";
          if (key.startsWith("program:one-percent-treaty:referral-invitation:")) {
            return makePriority({ priority: 200 });
          }
          if (key.endsWith(":completeTraining")) return makePriority({ priority: 1 });
          if (key.endsWith(":shareReferralUrl")) return makePriority({ priority: 5_000 });
          if (key.endsWith(":assignFirstHuman")) return makePriority({ priority: 4_000 });
          if (key.endsWith(":assignSecondHuman")) return makePriority({ priority: 4_000 });
          return makePriority({ priority: 9e14 });
        },
      );

      const client = await setup(userId, ALL_SCOPES);
      const result = await client.callTool({ name: "getMyQueue", arguments: { maxResults: 10 } });

      const body = parseToolBody(result);
      const queue = body.queue as Array<{ taskKey: string }>;
      const inviteIndex = queue.findIndex((t) =>
        t.taskKey.startsWith("program:one-percent-treaty:referral-invitation:"),
      );
      const trainingIndex = queue.findIndex((t) => t.taskKey.endsWith(":completeTraining"));
      const assignIndex = queue.findIndex((t) => t.taskKey.endsWith(":assignFirstHuman"));
      // Invite ranks below assignFirstHuman (lower priority value) but above training meta
      expect(inviteIndex).toBeGreaterThan(assignIndex);
      expect(inviteIndex).toBeLessThan(trainingIndex);
    });

    it("a signer-reminder subtask appears in the citizen's queue alongside the onboarding tasks", async () => {
      const userId = "fresh-user-4";
      const baseline = makeAutoSpawnedTasks(userId);
      const reminderTask = makeOwnedTask({
        id: `reminder-${userId}-va`,
        title: "Remind Raffaella Petrini to sign the 1% Treaty",
        taskKey: `program:one-percent-treaty:reminder:va:${userId}`,
        ownerUserId: userId,
        parentTaskId: "1-pct-treaty-signer-va",
      });
      mocks.listTasks.mockResolvedValue([...baseline, reminderTask]);
      mocks.isTaskBlocked.mockReturnValue(false);
      mocks.computeTaskPriority.mockImplementation(
        (input: { id: string; taskKey?: string }) => {
          const key = input.taskKey ?? "";
          if (key.startsWith("program:one-percent-treaty:reminder:")) {
            return makePriority({ priority: 50_000 });
          }
          if (key.endsWith(":completeTraining")) return makePriority({ priority: 1 });
          if (key.endsWith(":shareReferralUrl")) return makePriority({ priority: 5_000 });
          if (key.endsWith(":assignFirstHuman")) return makePriority({ priority: 4_000 });
          if (key.endsWith(":assignSecondHuman")) return makePriority({ priority: 4_000 });
          return makePriority({ priority: 9e14 });
        },
      );

      const client = await setup(userId, ALL_SCOPES);
      const result = await client.callTool({ name: "getMyQueue", arguments: { maxResults: 10 } });

      const body = parseToolBody(result);
      const queue = body.queue as Array<{ id: string; taskKey: string }>;

      const reminderIndex = queue.findIndex((t) =>
        t.taskKey.startsWith("program:one-percent-treaty:reminder:"),
      );
      expect(reminderIndex).toBeGreaterThanOrEqual(0);
      // High priority → ranks above the training meta-task and the assignment subtasks
      expect(reminderIndex).toBeLessThan(
        queue.findIndex((t) => t.taskKey.endsWith(":completeTraining")),
      );
    });
  });

  describe("task triggers", () => {
    it("hides createTaskTrigger / updateTaskTrigger / disableTaskTrigger from non-admin users", async () => {
      const nonAdmin = await setup("user-1", ALL_SCOPES);
      const admin = await setup("admin-1", ALL_SCOPES, { isAdmin: true });

      const nonAdminNames = (await nonAdmin.listTools()).tools.map((t) => t.name);
      const adminNames = (await admin.listTools()).tools.map((t) => t.name);

      expect(nonAdminNames).not.toContain("createTaskTrigger");
      expect(nonAdminNames).not.toContain("updateTaskTrigger");
      expect(nonAdminNames).not.toContain("disableTaskTrigger");
      // Read tools and fireTaskTrigger are not admin-gated.
      expect(nonAdminNames).toContain("listTaskTriggers");
      expect(nonAdminNames).toContain("getTaskTrigger");
      expect(nonAdminNames).toContain("fireTaskTrigger");

      expect(adminNames).toContain("createTaskTrigger");
      expect(adminNames).toContain("updateTaskTrigger");
      expect(adminNames).toContain("disableTaskTrigger");
    });

    it("createTaskTrigger forwards admin input and the actor user id", async () => {
      mocks.createTaskTrigger.mockResolvedValue({
        id: "trig-1",
        triggerKey: "demo:flow",
      });

      const client = await setup("admin-1", ALL_SCOPES, { isAdmin: true });
      const result = await client.callTool({
        name: "createTaskTrigger",
        arguments: {
          triggerKey: "demo:flow",
          eventName: "user.signup",
          idempotencyKeyTemplate: "demo:{{user.id}}",
          spawnSpecs: [
            {
              kind: "root",
              isParent: true,
              titleTemplate: "Hi {{user.name}}",
              descriptionTemplate: "...",
            },
          ],
        },
      });

      expect(result.isError).toBeFalsy();
      expect(mocks.createTaskTrigger).toHaveBeenCalledTimes(1);
      const [input, ctx] = mocks.createTaskTrigger.mock.calls[0]!;
      expect((input as { triggerKey: string }).triggerKey).toBe("demo:flow");
      expect(ctx).toEqual({ actorUserId: "admin-1" });
      const body = parseToolBody(result);
      expect(body.triggerKey).toBe("demo:flow");
    });

    it("fireTaskTrigger forwards dryRun and returns the rendered preview", async () => {
      mocks.fireTaskTrigger.mockResolvedValue({
        result: "spawned",
        triggerKey: "demo:flow",
        idempotencyKey: "demo:abc",
        spawnedTaskIds: [],
        spawnedTaskKeys: ["demo:abc"],
        reason: "dryRun",
      });

      const client = await setup("user-1", ALL_SCOPES);
      const result = await client.callTool({
        name: "fireTaskTrigger",
        arguments: {
          triggerKey: "demo:flow",
          context: { user: { id: "abc" } },
          dryRun: true,
        },
      });

      expect(result.isError).toBeFalsy();
      expect(mocks.fireTaskTrigger).toHaveBeenCalledTimes(1);
      const [triggerKey, context, options] = mocks.fireTaskTrigger.mock.calls[0]!;
      expect(triggerKey).toBe("demo:flow");
      expect(context).toEqual({ user: { id: "abc" } });
      expect(options).toEqual({ dryRun: true, actorUserId: "user-1" });
      const body = parseToolBody(result) as { spawnedTaskKeys?: string[]; reason?: string };
      expect(body.spawnedTaskKeys).toEqual(["demo:abc"]);
      expect(body.reason).toBe("dryRun");
    });

    it("fireTaskTrigger blocks non-admin committed writes from caller-controlled context", async () => {
      const client = await setup("user-1", ALL_SCOPES);
      const result = await client.callTool({
        name: "fireTaskTrigger",
        arguments: {
          triggerKey: "demo:flow",
          context: { user: { id: "abc" } },
        },
      });

      expect(result.isError).toBe(true);
      expect(mocks.fireTaskTrigger).not.toHaveBeenCalled();
      const body = parseToolBody(result);
      expect(String(body.error)).toContain("non-admin callers may only use dryRun:true");
    });

    it("fireTaskTrigger requires triggerKey", async () => {
      const client = await setup("user-1", ALL_SCOPES);
      const result = await client.callTool({
        name: "fireTaskTrigger",
        arguments: { context: {} },
      });
      expect(result.isError).toBe(true);
      const body = parseToolBody(result);
      expect(String(body.error)).toContain("triggerKey is required");
    });

    it("getTaskTrigger surfaces a clean not-found error", async () => {
      mocks.getTaskTrigger.mockResolvedValue(null);

      const client = await setup("user-1", ALL_SCOPES);
      const result = await client.callTool({
        name: "getTaskTrigger",
        arguments: { triggerKey: "nope" },
      });
      expect(result.isError).toBe(true);
      const body = parseToolBody(result);
      expect(String(body.error)).toContain("TaskTrigger not found: nope");
    });
  });
});

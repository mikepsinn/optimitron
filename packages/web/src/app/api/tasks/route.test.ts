import { beforeEach, describe, expect, it, vi } from "vitest";
import { TaskStatus } from "@optimitron/db";
import { McpScope } from "@/lib/mcp-scopes";

const mocks = vi.hoisted(() => ({
  authorizeOwnerSend: vi.fn(),
  canUserManageTask: vi.fn(),
  createTask: vi.fn(),
  getServerSession: vi.fn(),
  listTasks: vi.fn(),
  personFindFirst: vi.fn(),
  personUpsert: vi.fn(),
  requireAuth: vi.fn(),
  taskFindFirst: vi.fn(),
}));

vi.mock("next-auth", () => ({
  getServerSession: mocks.getServerSession,
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/email/outbound-authorization.server", () => ({
  authorizeOwnerSend: mocks.authorizeOwnerSend,
}));

// Mock requireAuth/getServerSession as the auth seams, but keep the REAL
// scope→boundary derivation from mcp-scopes so boundary assertions exercise
// production logic instead of a reimplementation.
vi.mock("@/lib/auth-utils", async () => {
  const { TASK_CLIENT_SCOPES, taskBoundaryFromScopes } =
    await import("@/lib/mcp-scopes");
  const hasBearerAuthorization = (request?: Request) =>
    /^Bearer\b/iu.test(request?.headers.get("authorization")?.trim() ?? "");
  const requireTaskRequestAuth = async (
    request: Request,
    requiredScopes: readonly unknown[] = TASK_CLIENT_SCOPES,
  ) => {
    const auth = await mocks.requireAuth(request, requiredScopes);
    return "scopes" in auth
      ? {
          clientAccessBoundary: taskBoundaryFromScopes(
            auth.scopes,
            auth.organizationIds,
          ),
          userId: auth.userId,
        }
      : { userId: auth.userId };
  };
  return {
    getTaskRequestIdentity: async (
      request: Request,
      requiredScopes: readonly unknown[] = TASK_CLIENT_SCOPES,
    ) => {
      if (hasBearerAuthorization(request)) {
        return requireTaskRequestAuth(request, requiredScopes);
      }
      const session = await mocks.getServerSession();
      return { userId: session?.user?.id ?? null };
    },
    hasBearerAuthorization,
    requireAuth: mocks.requireAuth,
    requireTaskRequestAuth,
  };
});

vi.mock("@/lib/prisma", () => ({
  prisma: {
    person: {
      findFirst: mocks.personFindFirst,
      upsert: mocks.personUpsert,
    },
    task: { findFirst: mocks.taskFindFirst },
  },
}));

vi.mock("@/lib/tasks.server", () => ({
  createTask: mocks.createTask,
  listTasks: mocks.listTasks,
}));

vi.mock("@/lib/tasks/task-visibility.server", () => ({
  canUserManageTask: mocks.canUserManageTask,
}));

import { GET, POST } from "./route";

describe("tasks route", () => {
  beforeEach(() => {
    mocks.authorizeOwnerSend.mockReset();
    mocks.authorizeOwnerSend.mockResolvedValue(null);
    mocks.createTask.mockReset();
    mocks.canUserManageTask.mockReset();
    mocks.getServerSession.mockReset();
    mocks.listTasks.mockReset();
    mocks.personFindFirst.mockReset();
    mocks.personUpsert.mockReset();
    mocks.requireAuth.mockReset();
    mocks.taskFindFirst.mockReset();
  });

  it("lists tasks created by the current user when requested", async () => {
    mocks.getServerSession.mockResolvedValue({ user: { id: "user_1" } });
    mocks.listTasks.mockResolvedValue([{ id: "task_1" }]);

    const response = await GET(
      new Request(
        "http://localhost/api/tasks?visibility=created&status=ACTIVE&frameKey=TWENTY_YEAR",
      ),
    );

    expect(response.status).toBe(200);
    expect(mocks.listTasks).toHaveBeenCalledWith(
      expect.objectContaining({
        frameKey: "TWENTY_YEAR",
        status: "ACTIVE",
        userId: "user_1",
        visibility: "created",
      }),
    );
    await expect(response.json()).resolves.toMatchObject({ success: true });
  });

  it("uses OAuth Bearer identity when listing caller-created tasks", async () => {
    mocks.requireAuth.mockResolvedValue({
      organizationIds: [],
      scopes: [McpScope.TASKS_PERSONAL],
      userId: "user_oauth",
    });
    mocks.listTasks.mockResolvedValue([{ id: "task_oauth" }]);

    const request = new Request(
      "http://localhost/api/tasks?visibility=created",
      { headers: { Authorization: "Bearer access_token" } },
    );

    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(mocks.listTasks).toHaveBeenCalledWith(
      expect.objectContaining({
        clientAccessBoundary: {
          allowPersonalPrivate: true,
          organizationIds: [],
        },
        userId: "user_oauth",
        visibility: "created",
      }),
    );
  });

  it("uses OAuth identity for lowercase bearer schemes", async () => {
    mocks.requireAuth.mockResolvedValue({
      organizationIds: ["org_selected"],
      scopes: [McpScope.TASKS_ORGANIZATION],
      userId: "user_oauth",
    });
    mocks.listTasks.mockResolvedValue([{ id: "task_oauth" }]);

    const response = await GET(
      new Request("http://localhost/api/tasks?visibility=created", {
        headers: { Authorization: "bearer access_token" },
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.getServerSession).not.toHaveBeenCalled();
    expect(mocks.requireAuth).toHaveBeenCalledWith(expect.any(Request), [
      McpScope.TASKS_PERSONAL,
      McpScope.TASKS_ORGANIZATION,
      McpScope.TASKS_ADMIN,
    ]);
    expect(mocks.listTasks).toHaveBeenCalledWith(
      expect.objectContaining({
        clientAccessBoundary: {
          allowPersonalPrivate: false,
          organizationIds: ["org_selected"],
        },
        userId: "user_oauth",
        visibility: "created",
      }),
    );
  });

  it("prefers an OAuth Bearer identity over a browser session", async () => {
    mocks.getServerSession.mockResolvedValue({ user: { id: "user_cookie" } });
    mocks.requireAuth.mockResolvedValue({
      organizationIds: [],
      scopes: [McpScope.TASKS_PERSONAL],
      userId: "user_oauth",
    });
    mocks.listTasks.mockResolvedValue([{ id: "task_oauth" }]);

    const response = await GET(
      new Request("http://localhost/api/tasks?visibility=created", {
        headers: { Authorization: "Bearer access_token" },
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.getServerSession).not.toHaveBeenCalled();
    expect(mocks.listTasks).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user_oauth",
        visibility: "created",
      }),
    );
  });

  it("returns 401 when creating a task without auth", async () => {
    mocks.requireAuth.mockRejectedValue(new Error("Unauthorized"));

    const response = await POST(
      new Request("http://localhost/api/tasks", {
        body: JSON.stringify({ title: "Write docs" }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("creates a task for the authenticated user", async () => {
    const ownerAuthorization = { kind: "owner", userId: "user_1" };
    mocks.authorizeOwnerSend.mockResolvedValue(ownerAuthorization);
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });
    mocks.createTask.mockResolvedValue({
      createdByUserId: "user_1",
      id: "task_1",
      title: "Write docs",
    });

    const response = await POST(
      new Request("http://localhost/api/tasks", {
        body: JSON.stringify({
          dueAt: "2026-04-15T00:00:00.000Z",
          isPublic: false,
          title: "Write docs",
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      }),
    );

    expect(response.status).toBe(201);
    expect(mocks.createTask).toHaveBeenCalledWith(
      "user_1",
      expect.objectContaining({
        dueAt: expect.any(Date),
        isPublic: false,
        title: "Write docs",
      }),
      { ownerAuthorization },
    );
    await expect(response.json()).resolves.toMatchObject({ success: true });
  });

  it("lets a manager add a step to an accessible private personal task", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });
    mocks.taskFindFirst.mockResolvedValue({
      id: "parent_1",
      isPublic: false,
      ownerOrganizationId: null,
      status: TaskStatus.ACTIVE,
    });
    mocks.canUserManageTask.mockResolvedValue(true);
    mocks.createTask.mockResolvedValue({ id: "step_1" });

    const response = await POST(
      new Request("http://localhost/api/tasks", {
        body: JSON.stringify({ parentTaskId: "parent_1", title: "First step" }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      }),
    );

    expect(response.status).toBe(201);
    expect(mocks.createTask).toHaveBeenCalledWith(
      "user_1",
      expect.objectContaining({
        isPublic: false,
        parentTaskId: "parent_1",
      }),
    );
  });

  it("keeps Add subtask self-only instead of creating dead-end assigned work", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });

    const response = await POST(
      new Request("http://localhost/api/tasks", {
        body: JSON.stringify({
          assigneePersonInvite: {
            email: "jane@example.org",
            firstName: "Jane",
            lastName: "Reviewer",
          },
          parentTaskId: "parent_1",
          title: "First step",
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Add subtask currently creates work only on your own task list.",
    });
    expect(mocks.personUpsert).not.toHaveBeenCalled();
    expect(mocks.taskFindFirst).not.toHaveBeenCalled();
    expect(mocks.createTask).not.toHaveBeenCalled();
  });

  it("hides a private parent from a user who cannot manage it", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });
    mocks.taskFindFirst.mockResolvedValue({
      id: "parent_1",
      isPublic: false,
      ownerOrganizationId: "org_private",
      status: TaskStatus.STALE,
    });
    mocks.canUserManageTask.mockResolvedValue(false);

    const response = await POST(
      new Request("http://localhost/api/tasks", {
        body: JSON.stringify({ parentTaskId: "parent_1", title: "First step" }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      }),
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Parent task not found.",
    });
    expect(mocks.createTask).not.toHaveBeenCalled();
  });

  it.each([
    [
      "organization-owned",
      {
        id: "parent_org",
        isPublic: true,
        ownerOrganizationId: "org_1",
        status: TaskStatus.ACTIVE,
      },
      "Organization-owned task steps are not supported here yet.",
    ],
    [
      "completed",
      {
        id: "parent_done",
        isPublic: true,
        ownerOrganizationId: null,
        status: TaskStatus.VERIFIED,
      },
      "Subtasks can only be added to draft or active tasks.",
    ],
  ])("rejects steps on %s parents", async (_kind, parent, error) => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });
    mocks.taskFindFirst.mockResolvedValue(parent);

    const response = await POST(
      new Request("http://localhost/api/tasks", {
        body: JSON.stringify({ parentTaskId: parent.id, title: "First step" }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error });
    expect(mocks.createTask).not.toHaveBeenCalled();
  });

  it("creates a public assigned task without letting the caller pick a creator", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_creator" });
    mocks.createTask.mockResolvedValue({
      assigneePersonId: "person_target",
      createdByUserId: "user_creator",
      id: "task_2",
      isPublic: true,
      title: "Fix the site",
    });

    const response = await POST(
      new Request("http://localhost/api/tasks", {
        body: JSON.stringify({
          assigneePersonId: "person_target",
          createdByUserId: "user_not_allowed",
          description: "The donate calculator needs clearer labels.",
          ownerUserId: "user_not_allowed",
          title: "Fix the site",
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      }),
    );

    expect(response.status).toBe(201);
    expect(mocks.createTask).toHaveBeenCalledWith(
      "user_creator",
      expect.objectContaining({
        assigneePersonId: "person_target",
        description: "The donate calculator needs clearer labels.",
        title: "Fix the site",
      }),
    );
    expect(mocks.createTask.mock.calls[0]?.[1]).not.toHaveProperty(
      "createdByUserId",
    );
    expect(mocks.createTask.mock.calls[0]?.[1]).not.toHaveProperty(
      "ownerUserId",
    );
  });

  it("resolves an assigned task target from a person profile URL", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_creator" });
    mocks.personFindFirst.mockResolvedValue({ id: "person_target" });
    mocks.createTask.mockResolvedValue({
      assigneePersonId: "person_target",
      createdByUserId: "user_creator",
      id: "task_3",
      isPublic: true,
      title: "Call your senator",
    });

    const response = await POST(
      new Request("http://localhost/api/tasks", {
        body: JSON.stringify({
          assigneePersonIdentifier: "https://warondisease.org/people/Wishonia",
          description: "Ask for a public yes on the treaty.",
          isPublic: true,
          title: "Call your senator",
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      }),
    );

    expect(response.status).toBe(201);
    expect(mocks.personFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            { handle: "Wishonia" },
            { handle: "wishonia" },
          ]),
        }),
      }),
    );
    expect(mocks.createTask).toHaveBeenCalledWith(
      "user_creator",
      expect.objectContaining({
        assigneePersonId: "person_target",
        description: "Ask for a public yes on the treaty.",
        isPublic: true,
        title: "Call your senator",
      }),
    );
    expect(mocks.createTask.mock.calls[0]?.[1]).not.toHaveProperty(
      "assigneePersonIdentifier",
    );
  });

  it("creates an invited assignee person by email before creating the task", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_creator" });
    mocks.personUpsert.mockResolvedValue({ id: "person_invited" });
    mocks.createTask.mockResolvedValue({
      assigneePersonId: "person_invited",
      createdByUserId: "user_creator",
      id: "task_invite",
      isPublic: true,
      title: "Review the treaty math",
    });

    const response = await POST(
      new Request("http://localhost/api/tasks", {
        body: JSON.stringify({
          assigneePersonInvite: {
            currentAffiliation: "Analytical Engine",
            email: "ADA@EXAMPLE.ORG",
            firstName: "Ada",
            lastName: "Lovelace",
          },
          description: "Check the clinical-trial capacity claim.",
          isPublic: true,
          title: "Review the treaty math",
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      }),
    );

    expect(response.status).toBe(201);
    expect(mocks.personUpsert).toHaveBeenCalledWith({
      create: expect.objectContaining({
        createdByUserId: "user_creator",
        currentAffiliation: "Analytical Engine",
        displayName: "Ada Lovelace",
        email: "ada@example.org",
        firstName: "Ada",
        isPublic: false,
        isPublicFigure: false,
        lastName: "Lovelace",
      }),
      select: { id: true },
      update: { deletedAt: null },
      where: { email: "ada@example.org" },
    });
    expect(mocks.createTask).toHaveBeenCalledWith(
      "user_creator",
      expect.objectContaining({
        assigneePersonId: "person_invited",
        description: "Check the clinical-trial capacity claim.",
        isPublic: true,
        title: "Review the treaty math",
      }),
    );
    expect(mocks.createTask.mock.calls[0]?.[1]).not.toHaveProperty(
      "assigneePersonInvite",
    );
  });

  it("rejects ambiguous assignee targets", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_creator" });

    const response = await POST(
      new Request("http://localhost/api/tasks", {
        body: JSON.stringify({
          assigneePersonId: "person_existing",
          assigneePersonInvite: {
            email: "ada@example.org",
            firstName: "Ada",
            lastName: "Lovelace",
          },
          title: "Review the treaty math",
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Choose one assignee.",
    });
    expect(mocks.personUpsert).not.toHaveBeenCalled();
    expect(mocks.createTask).not.toHaveBeenCalled();
  });

  it("rejects organization and person assignees together", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_creator" });

    const response = await POST(
      new Request("http://localhost/api/tasks", {
        body: JSON.stringify({
          assigneeOrganizationId: "org_iam",
          assigneePersonId: "person_existing",
          title: "Review the treaty math",
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Choose one assignee.",
    });
    expect(mocks.createTask).not.toHaveBeenCalled();
  });
});

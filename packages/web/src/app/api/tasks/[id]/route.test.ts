import { beforeEach, describe, expect, it, vi } from "vitest";
import { McpScope } from "@/lib/mcp-scopes";

const mocks = vi.hoisted(() => ({
  deleteTaskCreatedByUser: vi.fn(),
  getServerSession: vi.fn(),
  getTaskDetailData: vi.fn(),
  requireAuth: vi.fn(),
  updateTaskCreatedByUser: vi.fn(),
}));

vi.mock("next-auth", () => ({
  getServerSession: mocks.getServerSession,
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
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

vi.mock("@/lib/tasks.server", () => ({
  deleteTaskCreatedByUser: mocks.deleteTaskCreatedByUser,
  getTaskDetailData: mocks.getTaskDetailData,
  updateTaskCreatedByUser: mocks.updateTaskCreatedByUser,
}));

import { DELETE, GET, PATCH } from "./route";

describe("task detail route", () => {
  beforeEach(() => {
    mocks.deleteTaskCreatedByUser.mockReset();
    mocks.getServerSession.mockReset();
    mocks.getTaskDetailData.mockReset();
    mocks.requireAuth.mockReset();
    mocks.updateTaskCreatedByUser.mockReset();
  });

  it("returns 404 when the task is not accessible", async () => {
    mocks.getServerSession.mockResolvedValue(null);
    mocks.getTaskDetailData.mockResolvedValue(null);

    const response = await GET(
      new Request("http://localhost/api/tasks/task_1"),
      {
        params: Promise.resolve({ id: "task_1" }),
      },
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Task not found.",
    });
  });

  it("returns detail data for an accessible task", async () => {
    mocks.getServerSession.mockResolvedValue({ user: { id: "user_1" } });
    mocks.getTaskDetailData.mockResolvedValue({
      task: { id: "task_1" },
      viewer: null,
    });

    const response = await GET(
      new Request("http://localhost/api/tasks/task_1"),
      {
        params: Promise.resolve({ id: "task_1" }),
      },
    );

    expect(response.status).toBe(200);
    expect(mocks.getTaskDetailData).toHaveBeenCalledWith("task_1", "user_1");
    await expect(response.json()).resolves.toMatchObject({ success: true });
  });

  it.each([
    ["task-funding-receipt%3Apayment_123", "task-funding-receipt:payment_123"],
    ["task%253Aencoded", "task%3Aencoded"],
    ["bad%2", "bad%2"],
  ])(
    "decodes the task route id exactly once and safely preserves %s as %s",
    async (routeId, expectedTaskId) => {
      mocks.getServerSession.mockResolvedValue({ user: { id: "user_1" } });
      mocks.getTaskDetailData.mockResolvedValue({
        task: { id: expectedTaskId },
        viewer: null,
      });

      const response = await GET(
        new Request("http://localhost/api/tasks/route-id"),
        { params: Promise.resolve({ id: routeId }) },
      );

      expect(response.status).toBe(200);
      expect(mocks.getTaskDetailData).toHaveBeenCalledWith(
        expectedTaskId,
        "user_1",
      );
    },
  );

  it("prefers an OAuth Bearer identity over a browser session", async () => {
    mocks.getServerSession.mockResolvedValue({ user: { id: "user_cookie" } });
    mocks.requireAuth.mockResolvedValue({
      organizationIds: [],
      scopes: [McpScope.TASKS_PERSONAL],
      userId: "user_oauth",
    });
    mocks.getTaskDetailData.mockResolvedValue({
      task: { id: "task_1" },
      viewer: null,
    });

    const response = await GET(
      new Request("http://localhost/api/tasks/task_1", {
        headers: { Authorization: "Bearer access_token" },
      }),
      {
        params: Promise.resolve({ id: "task_1" }),
      },
    );

    expect(response.status).toBe(200);
    expect(mocks.getServerSession).not.toHaveBeenCalled();
    expect(mocks.requireAuth).toHaveBeenCalledWith(expect.any(Request), [
      McpScope.TASKS_PERSONAL,
      McpScope.TASKS_ORGANIZATION,
      McpScope.TASKS_ADMIN,
    ]);
    expect(mocks.getTaskDetailData).toHaveBeenCalledWith(
      "task_1",
      "user_oauth",
      {
        clientAccessBoundary: {
          allowPersonalPrivate: true,
          organizationIds: [],
        },
      },
    );
  });

  it("uses OAuth identity for lowercase bearer schemes", async () => {
    mocks.getServerSession.mockResolvedValue({ user: { id: "user_cookie" } });
    mocks.requireAuth.mockResolvedValue({
      organizationIds: ["org_selected"],
      scopes: [McpScope.TASKS_ORGANIZATION],
      userId: "user_oauth",
    });
    mocks.getTaskDetailData.mockResolvedValue({
      task: { id: "task_1" },
      viewer: null,
    });

    const response = await GET(
      new Request("http://localhost/api/tasks/task_1", {
        headers: { Authorization: "bearer access_token" },
      }),
      {
        params: Promise.resolve({ id: "task_1" }),
      },
    );

    expect(response.status).toBe(200);
    expect(mocks.getServerSession).not.toHaveBeenCalled();
    expect(mocks.getTaskDetailData).toHaveBeenCalledWith(
      "task_1",
      "user_oauth",
      {
        clientAccessBoundary: {
          allowPersonalPrivate: false,
          organizationIds: ["org_selected"],
        },
      },
    );
  });

  it("updates a task created by the authenticated user", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });
    mocks.updateTaskCreatedByUser.mockResolvedValue({
      id: "task_1",
      title: "Updated",
    });

    const response = await PATCH(
      new Request("http://localhost/api/tasks/task_1", {
        body: JSON.stringify({
          dueAt: "2026-04-20T00:00:00.000Z",
          title: "Updated",
        }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      }),
      {
        params: Promise.resolve({ id: "task_1" }),
      },
    );

    expect(response.status).toBe(200);
    expect(mocks.updateTaskCreatedByUser).toHaveBeenCalledWith(
      "task_1",
      "user_1",
      expect.objectContaining({
        dueAt: expect.any(Date),
        title: "Updated",
      }),
      { clientAccessBoundary: undefined },
    );
    await expect(response.json()).resolves.toMatchObject({ success: true });
  });

  it("rejects unsafe primary endpoint URLs", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });

    const response = await PATCH(
      new Request("http://localhost/api/tasks/task_1", {
        body: JSON.stringify({
          primaryEndpoint: {
            label: "Open link",
            url: "javascript:alert(document.cookie)",
          },
        }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      }),
      {
        params: Promise.resolve({ id: "task_1" }),
      },
    );

    expect(response.status).toBe(400);
    expect(mocks.updateTaskCreatedByUser).not.toHaveBeenCalled();
  });

  it("deletes a task created by the authenticated user", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });
    mocks.deleteTaskCreatedByUser.mockResolvedValue({
      id: "task_1",
      deleted: true,
    });

    const response = await DELETE(
      new Request("http://localhost/api/tasks/task_1", { method: "DELETE" }),
      { params: Promise.resolve({ id: "task_1" }) },
    );

    expect(response.status).toBe(200);
    expect(mocks.deleteTaskCreatedByUser).toHaveBeenCalledWith(
      "task_1",
      "user_1",
      { clientAccessBoundary: undefined },
    );
    await expect(response.json()).resolves.toMatchObject({ success: true });
  });

  it("returns 401 when delete is called without auth", async () => {
    mocks.requireAuth.mockRejectedValue(new Error("Unauthorized"));

    const response = await DELETE(
      new Request("http://localhost/api/tasks/task_1", { method: "DELETE" }),
      { params: Promise.resolve({ id: "task_1" }) },
    );

    expect(response.status).toBe(401);
  });

  it("returns 404 when delete target does not exist", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });
    mocks.deleteTaskCreatedByUser.mockRejectedValue(
      new Error("Task not found."),
    );

    const response = await DELETE(
      new Request("http://localhost/api/tasks/task_x", { method: "DELETE" }),
      { params: Promise.resolve({ id: "task_x" }) },
    );

    expect(response.status).toBe(404);
  });

  it("returns 400 when delete is rejected (e.g. public task)", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });
    mocks.deleteTaskCreatedByUser.mockRejectedValue(
      new Error("Public tasks can't be self-deleted. Ask an admin."),
    );

    const response = await DELETE(
      new Request("http://localhost/api/tasks/task_1", { method: "DELETE" }),
      { params: Promise.resolve({ id: "task_1" }) },
    );

    expect(response.status).toBe(400);
  });
});

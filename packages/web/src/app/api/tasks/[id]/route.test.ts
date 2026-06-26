import { beforeEach, describe, expect, it, vi } from "vitest";

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

vi.mock("@/lib/auth-utils", () => ({
  requireAuth: mocks.requireAuth,
}));

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

  it("prefers an OAuth Bearer identity over a browser session", async () => {
    mocks.getServerSession.mockResolvedValue({ user: { id: "user_cookie" } });
    mocks.requireAuth.mockResolvedValue({ userId: "user_oauth" });
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
    expect(mocks.getTaskDetailData).toHaveBeenCalledWith("task_1", "user_oauth");
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

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  claimTask: vi.fn(),
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/auth-utils", () => ({
  requireAuth: mocks.requireAuth,
}));

vi.mock("@/lib/tasks.server", () => ({
  claimTask: mocks.claimTask,
}));

import { POST } from "./route";

describe("task claim route", () => {
  beforeEach(() => {
    mocks.claimTask.mockReset();
    mocks.requireAuth.mockReset();
  });

  it("returns 401 when authentication fails", async () => {
    mocks.requireAuth.mockRejectedValue(new Error("Unauthorized"));

    const response = await POST(new Request("http://localhost/api/tasks/task_1/claim"), {
      params: Promise.resolve({ id: "task_1" }),
    });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("claims the task for the authenticated user", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });
    mocks.claimTask.mockResolvedValue({ id: "claim_1", taskId: "task_1", userId: "user_1" });

    const response = await POST(new Request("http://localhost/api/tasks/task_1/claim"), {
      params: Promise.resolve({ id: "task_1" }),
    });

    expect(response.status).toBe(200);
    expect(mocks.claimTask).toHaveBeenCalledWith("task_1", "user_1");
    await expect(response.json()).resolves.toMatchObject({ success: true });
  });
});

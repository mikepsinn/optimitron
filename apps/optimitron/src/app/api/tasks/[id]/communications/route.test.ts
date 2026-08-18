import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  recordTaskCommunication: vi.fn(),
}));

vi.mock("@/lib/auth-utils", () => ({
  getCurrentUser: mocks.getCurrentUser,
}));

vi.mock("@/lib/tasks/task-communications.server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/tasks/task-communications.server")>();
  return {
    ...actual,
    recordTaskCommunication: mocks.recordTaskCommunication,
  };
});

import { POST } from "./route";

describe("task communications route", () => {
  beforeEach(() => {
    mocks.getCurrentUser.mockReset();
    mocks.recordTaskCommunication.mockReset();
  });

  it("succeeds without tracking when the user is anonymous", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);

    const response = await POST(
      new Request("http://localhost/api/tasks/task_1/communications", {
        body: JSON.stringify({ channel: "externalUrl", href: "https://example.com/contact" }),
        method: "POST",
      }),
      {
        params: Promise.resolve({ id: "task_1" }),
      },
    );

    expect(response.status).toBe(200);
    expect(mocks.recordTaskCommunication).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual({ success: true, tracked: false });
  });

  it("records task communication for signed-in users", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "user_1" });
    mocks.recordTaskCommunication.mockResolvedValue({});

    const response = await POST(
      new Request("http://localhost/api/tasks/task_1/communications", {
        body: JSON.stringify({
          channel: "mailto",
          endpointId: "endpoint_1",
          href: "mailto:test@example.com",
          message: "Please do the task.",
        }),
        method: "POST",
      }),
      {
        params: Promise.resolve({ id: "task_1" }),
      },
    );

    expect(response.status).toBe(200);
    expect(mocks.recordTaskCommunication).toHaveBeenCalledWith({
      channel: "mailto",
      endpointId: "endpoint_1",
      href: "mailto:test@example.com",
      message: "Please do the task.",
      submittedAt: null,
      taskId: "task_1",
      userId: "user_1",
    });
    await expect(response.json()).resolves.toEqual({ success: true, tracked: true });
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  canUserViewTask: vi.fn(),
  countUserCommentsInWindow: vi.fn(),
  getCurrentUser: vi.fn(),
  getTaskActivityTimeline: vi.fn(),
  getTaskCommentFeed: vi.fn(),
  postComment: vi.fn(),
}));

vi.mock("@/lib/auth-utils", () => ({
  getCurrentUser: mocks.getCurrentUser,
}));

vi.mock("@/lib/tasks/task-comments.server", () => ({
  countUserCommentsInWindow: mocks.countUserCommentsInWindow,
  getTaskActivityTimeline: mocks.getTaskActivityTimeline,
  getTaskCommentFeed: mocks.getTaskCommentFeed,
  postComment: mocks.postComment,
}));

vi.mock("@/lib/tasks/task-visibility.server", () => ({
  TASK_NOT_FOUND_MESSAGE: "Task not found",
  canUserViewTask: mocks.canUserViewTask,
}));

vi.mock("@/lib/tasks/task-comment-notifications.server", () => ({
  notifyTaskCommentRecipients: vi.fn(),
}));

vi.mock("@/lib/tasks/wishonia-task-reply.server", () => ({
  buildCitationsJson: vi.fn(),
  generateAndPostWishoniaReply: vi.fn(),
  prepareWishoniaReply: vi.fn(),
  streamWishoniaReplyText: vi.fn(),
}));

import { GET, POST } from "./route";

const FEED = { comments: [], nextCursor: null, total: 0 };

function getRequest(taskId: string) {
  return GET(new Request(`http://localhost/api/tasks/${taskId}/comments`), {
    params: Promise.resolve({ id: taskId }),
  });
}

beforeEach(() => {
  for (const fn of Object.values(mocks)) {
    fn.mockReset();
  }
});

describe("GET /api/tasks/[id]/comments", () => {
  it("returns 404 for an anonymous viewer on a private task", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);
    mocks.getTaskCommentFeed.mockRejectedValue(new Error("Task not found"));
    mocks.getTaskActivityTimeline.mockRejectedValue(
      new Error("Task not found"),
    );

    const response = await getRequest("private_task");

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Task not found.",
    });
  });

  it("returns 200 with the feed for the task owner", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "owner_1" });
    mocks.getTaskCommentFeed.mockResolvedValue(FEED);
    mocks.getTaskActivityTimeline.mockResolvedValue([]);

    const response = await getRequest("private_task");

    expect(response.status).toBe(200);
    expect(mocks.getTaskCommentFeed).toHaveBeenCalledWith(
      expect.objectContaining({ currentUserId: "owner_1" }),
    );
    expect(mocks.getTaskActivityTimeline).toHaveBeenCalledWith(
      "private_task",
      50,
      "owner_1",
    );
  });

  it("returns 200 for an anonymous viewer on a public task", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);
    mocks.getTaskCommentFeed.mockResolvedValue(FEED);
    mocks.getTaskActivityTimeline.mockResolvedValue([]);

    const response = await getRequest("public_task");

    expect(response.status).toBe(200);
    expect(mocks.getTaskCommentFeed).toHaveBeenCalledWith(
      expect.objectContaining({ currentUserId: null }),
    );
    expect(mocks.getTaskActivityTimeline).toHaveBeenCalledWith(
      "public_task",
      50,
      null,
    );
  });
});

describe("POST /api/tasks/[id]/comments", () => {
  it("returns 404 when the author cannot view the task", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "stranger_1" });
    mocks.canUserViewTask.mockResolvedValue(false);

    const response = await POST(
      new Request("http://localhost/api/tasks/private_task/comments", {
        method: "POST",
        body: JSON.stringify({ message: "hello" }),
      }),
      { params: Promise.resolve({ id: "private_task" }) },
    );

    expect(response.status).toBe(404);
    expect(mocks.postComment).not.toHaveBeenCalled();
  });
});

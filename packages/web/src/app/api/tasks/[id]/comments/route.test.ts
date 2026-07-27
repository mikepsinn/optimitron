import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authorizeOwnerSend: vi.fn(),
  canUserCommentOnTask: vi.fn(),
  canUserViewTask: vi.fn(),
  buildDocumentCommentCitationsJson: vi.fn(),
  countUserCommentsInWindow: vi.fn(),
  getCurrentUser: vi.fn(),
  getTaskActivityTimeline: vi.fn(),
  getTaskCommentFeed: vi.fn(),
  postComment: vi.fn(),
  generateAndPostWishoniaReply: vi.fn(),
  notifyTaskCommentRecipients: vi.fn(),
}));

vi.mock("@/lib/email/outbound-authorization.server", () => ({
  authorizeOwnerSend: mocks.authorizeOwnerSend,
}));

// getCurrentUser stays the identity seam; getTaskRequestIdentity mirrors the
// route contract on top of it (bearer requests would go through requireAuth,
// which these session-only tests never exercise).
vi.mock("@/lib/auth-utils", () => ({
  getCurrentUser: mocks.getCurrentUser,
  getTaskRequestIdentity: async () => {
    const user = await mocks.getCurrentUser();
    return { userId: user?.id ?? null };
  },
}));

vi.mock("@/lib/tasks/task-comments.server", () => ({
  countUserCommentsInWindow: mocks.countUserCommentsInWindow,
  getTaskActivityTimeline: mocks.getTaskActivityTimeline,
  getTaskCommentFeed: mocks.getTaskCommentFeed,
  postComment: mocks.postComment,
}));

vi.mock("@/lib/tasks/task-visibility.server", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/tasks/task-visibility.server")>();
  return {
    ...actual,
    canUserCommentOnTask: mocks.canUserCommentOnTask,
    canUserViewTask: mocks.canUserViewTask,
  };
});

vi.mock("@/lib/tasks/task-comment-attachments.server", () => ({
  TaskCommentAttachmentInputError: class extends Error {
    status = 400;
  },
}));

vi.mock("@/lib/tasks/document-comment-anchor.server", () => ({
  buildDocumentCommentCitationsJson: mocks.buildDocumentCommentCitationsJson,
  DocumentCommentAnchorError: class extends Error {
    status = 400 as const;
  },
}));

vi.mock("@/lib/tasks/task-comment-notifications.server", () => ({
  notifyTaskCommentRecipients: mocks.notifyTaskCommentRecipients,
}));

vi.mock("@/lib/tasks/wishonia-task-reply.server", () => ({
  buildCitationsJson: vi.fn(),
  generateAndPostWishoniaReply: mocks.generateAndPostWishoniaReply,
  prepareWishoniaReply: vi.fn(),
  streamWishoniaReplyText: vi.fn(),
}));

import { GET, POST } from "./route";
import { DocumentCommentAnchorError } from "@/lib/tasks/document-comment-anchor.server";

const FEED = { comments: [], nextCursor: null, total: 0 };

function getRequest(taskId: string, query = "") {
  return GET(
    new Request(`http://localhost/api/tasks/${taskId}/comments${query}`),
    {
      params: Promise.resolve({ id: taskId }),
    },
  );
}

beforeEach(() => {
  for (const fn of Object.values(mocks)) {
    fn.mockReset();
  }
  mocks.canUserCommentOnTask.mockResolvedValue(true);
  mocks.authorizeOwnerSend.mockResolvedValue(null);
  mocks.canUserViewTask.mockResolvedValue(true);
  mocks.countUserCommentsInWindow.mockResolvedValue(0);
  mocks.postComment.mockResolvedValue({ id: "comment_1" });
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

  it.each([
    ["receipt%3Apayment_123", "receipt:payment_123"],
    ["receipt%253Apayment_123", "receipt%3Apayment_123"],
    ["bad%2", "bad%2"],
  ])(
    "decodes the comment feed task id exactly once and safely preserves %s as %s",
    async (routeId, expectedTaskId) => {
      mocks.getCurrentUser.mockResolvedValue(null);
      mocks.getTaskCommentFeed.mockResolvedValue(FEED);
      mocks.getTaskActivityTimeline.mockResolvedValue([]);

      const response = await getRequest(routeId);

      expect(response.status).toBe(200);
      expect(mocks.getTaskCommentFeed).toHaveBeenCalledWith(
        expect.objectContaining({ taskId: expectedTaskId }),
      );
      expect(mocks.getTaskActivityTimeline).toHaveBeenCalledWith(
        expectedTaskId,
        50,
        null,
      );
    },
  );

  it("truncates fractional page limits before querying Prisma", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);
    mocks.getTaskCommentFeed.mockResolvedValue(FEED);
    mocks.getTaskActivityTimeline.mockResolvedValue([]);

    const response = await getRequest("public_task", "?limit=50.5");

    expect(response.status).toBe(200);
    expect(mocks.getTaskCommentFeed).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 50 }),
    );
  });

  it("fetches document annotations without the unrelated activity feed", async () => {
    mocks.getTaskCommentFeed.mockResolvedValue(FEED);

    const response = await getRequest(
      "private_task",
      "?documentAnchors=1&limit=100",
    );

    expect(response.status).toBe(200);
    expect(mocks.getTaskCommentFeed).toHaveBeenCalledWith(
      expect.objectContaining({ documentAnchorsOnly: true, limit: 100 }),
    );
    expect(mocks.getTaskActivityTimeline).not.toHaveBeenCalled();
  });
});

describe("POST /api/tasks/[id]/comments", () => {
  it("returns 404 when the author cannot comment on the task", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "stranger_1" });
    mocks.canUserCommentOnTask.mockResolvedValue(false);

    const response = await POST(
      new Request("http://localhost/api/tasks/private_task/comments", {
        method: "POST",
        body: JSON.stringify({ documentAnchor: {}, message: "hello" }),
      }),
      { params: Promise.resolve({ id: "private_task" }) },
    );

    expect(response.status).toBe(404);
    expect(mocks.buildDocumentCommentCitationsJson).not.toHaveBeenCalled();
    expect(mocks.postComment).not.toHaveBeenCalled();
  });

  it("persists only the server-built exact-revision anchor metadata", async () => {
    const documentAnchor = {
      endOffset: 22,
      exact: "Review this",
      field: "BODY",
      revisionId: "revision-2",
      startOffset: 11,
    };
    const citationsJson = {
      documentAnchor: {
        schema: "optimitron.document-comment-anchor.v1",
      },
    };
    mocks.getCurrentUser.mockResolvedValue({ id: "reviewer-user" });
    mocks.buildDocumentCommentCitationsJson.mockResolvedValue(citationsJson);
    mocks.countUserCommentsInWindow.mockResolvedValue(5);

    const response = await POST(
      new Request("http://localhost/api/tasks/review-task/comments", {
        headers: { Accept: "application/x-ndjson" },
        method: "POST",
        body: JSON.stringify({ documentAnchor, message: "Please revise." }),
      }),
      { params: Promise.resolve({ id: "review-task" }) },
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(mocks.buildDocumentCommentCitationsJson).toHaveBeenCalledWith({
      clientAccessBoundary: undefined,
      rawAnchor: documentAnchor,
      taskId: "review-task",
      userId: "reviewer-user",
    });
    expect(mocks.postComment).toHaveBeenCalledWith(
      expect.objectContaining({ citationsJson }),
    );
    expect(mocks.generateAndPostWishoniaReply).not.toHaveBeenCalled();
  });

  it("returns a validation error instead of silently posting an unanchored comment", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "reviewer-user" });
    mocks.buildDocumentCommentCitationsJson.mockRejectedValue(
      new DocumentCommentAnchorError(
        "Inline document comments require an exact-version review task.",
      ),
    );

    const response = await POST(
      new Request("http://localhost/api/tasks/ordinary-task/comments", {
        method: "POST",
        body: JSON.stringify({
          documentAnchor: {
            endOffset: 4,
            exact: "Text",
            field: "BODY",
            revisionId: "revision-2",
            startOffset: 0,
          },
          message: "Please revise.",
        }),
      }),
      { params: Promise.resolve({ id: "ordinary-task" }) },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Inline document comments require an exact-version review task.",
    });
    expect(mocks.postComment).not.toHaveBeenCalled();
  });

  it("posts an attachment-only comment without starting an AI reply", async () => {
    const ownerAuthorization = { kind: "owner", userId: "owner_1" };
    mocks.authorizeOwnerSend.mockResolvedValue(ownerAuthorization);
    mocks.getCurrentUser.mockResolvedValue({ id: "owner_1" });

    const response = await POST(
      new Request("http://localhost/api/tasks/task_1/comments", {
        method: "POST",
        body: JSON.stringify({ attachmentIds: ["attachment_1"], message: "" }),
      }),
      { params: Promise.resolve({ id: "task_1" }) },
    );

    expect(response.status).toBe(200);
    expect(mocks.postComment).toHaveBeenCalledWith({
      attachmentIds: ["attachment_1"],
      authorUserId: "owner_1",
      enforceParentVisibility: true,
      mediaUrl: null,
      message: "",
      parentCommentId: null,
      taskId: "task_1",
    });
    expect(mocks.generateAndPostWishoniaReply).not.toHaveBeenCalled();
    expect(mocks.notifyTaskCommentRecipients).toHaveBeenCalledWith({
      authorUserId: "owner_1",
      commentId: "comment_1",
      message: "Attached 1 file",
      ownerAuthorization,
      taskId: "task_1",
    });
  });

  it("rejects malformed attachment IDs before posting", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "owner_1" });

    const response = await POST(
      new Request("http://localhost/api/tasks/task_1/comments", {
        method: "POST",
        body: JSON.stringify({ attachmentIds: [42], message: "Evidence" }),
      }),
      { params: Promise.resolve({ id: "task_1" }) },
    );

    expect(response.status).toBe(400);
    expect(mocks.postComment).not.toHaveBeenCalled();
  });
});

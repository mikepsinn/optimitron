import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createPendingTaskCommentAttachment: vi.fn(),
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/auth-utils", () => ({ requireAuth: mocks.requireAuth }));
vi.mock("@/lib/object-storage.server", () => ({
  PrivateObjectStorageNotConfiguredError: class extends Error {},
}));
vi.mock("@/lib/tasks/task-comment-attachments.server", () => ({
  createPendingTaskCommentAttachment: mocks.createPendingTaskCommentAttachment,
  TaskCommentAttachmentInputError: class extends Error {
    status = 400;
  },
}));
vi.mock("@/lib/tasks/task-visibility.server", () => ({
  TASK_NOT_FOUND_MESSAGE: "Task not found",
}));

import { POST } from "./route";

beforeEach(() => {
  mocks.createPendingTaskCommentAttachment.mockReset();
  mocks.requireAuth.mockReset();
});

describe("POST /api/tasks/[id]/attachments/presign", () => {
  it("returns a private upload grant for an authenticated task viewer", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });
    mocks.createPendingTaskCommentAttachment.mockResolvedValue({
      attachmentId: "attachment_1",
      contentType: "image/png",
      uploadUrl: "https://private-upload.example/signed",
    });

    const response = await POST(
      new Request("http://localhost/api/tasks/task_1/attachments/presign", {
        method: "POST",
        body: JSON.stringify({
          checksumSha256: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
          contentType: "image/png",
          fileName: "evidence.png",
          sizeBytes: 1234,
        }),
      }),
      { params: Promise.resolve({ id: "task_1" }) },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.not.toHaveProperty("publicUrl");
    expect(mocks.createPendingTaskCommentAttachment).toHaveBeenCalledWith({
      checksumSha256: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
      contentType: "image/png",
      fileName: "evidence.png",
      sizeBytes: 1234,
      taskId: "task_1",
      userId: "user_1",
    });
  });

  it("requires authentication before creating an upload record", async () => {
    mocks.requireAuth.mockRejectedValue(new Error("Unauthorized"));

    const response = await POST(
      new Request("http://localhost/api/tasks/task_1/attachments/presign", {
        method: "POST",
        body: JSON.stringify({
          contentType: "image/png",
          fileName: "evidence.png",
          sizeBytes: 1234,
        }),
      }),
      { params: Promise.resolve({ id: "task_1" }) },
    );

    expect(response.status).toBe(401);
    expect(mocks.createPendingTaskCommentAttachment).not.toHaveBeenCalled();
  });
});

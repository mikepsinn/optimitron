import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  getTaskCommentAttachmentDownload: vi.fn(),
}));

vi.mock("@/lib/auth-utils", () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock("@/lib/object-storage.server", () => ({
  PrivateObjectStorageNotConfiguredError: class extends Error {},
}));
vi.mock("@/lib/tasks/task-comment-attachments.server", () => ({
  getTaskCommentAttachmentDownload: mocks.getTaskCommentAttachmentDownload,
}));
vi.mock("@/lib/tasks/task-visibility.server", () => ({
  TASK_NOT_FOUND_MESSAGE: "Task not found",
}));

import { GET } from "./route";

beforeEach(() => {
  mocks.getCurrentUser.mockReset();
  mocks.getTaskCommentAttachmentDownload.mockReset();
});

describe("GET /api/tasks/attachments/[id]", () => {
  it("redirects an authorized viewer to a short-lived private URL", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "owner_1" });
    mocks.getTaskCommentAttachmentDownload.mockResolvedValue({
      downloadUrl: "https://private-download.example/signed",
      expiresInSeconds: 60,
    });

    const response = await GET(
      new Request("http://localhost/api/tasks/attachments/attachment_1"),
      { params: Promise.resolve({ id: "attachment_1" }) },
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://private-download.example/signed",
    );
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(mocks.getTaskCommentAttachmentDownload).toHaveBeenCalledWith({
      attachmentId: "attachment_1",
      userId: "owner_1",
    });
  });

  it("returns the same 404 for an inaccessible or missing file", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);
    mocks.getTaskCommentAttachmentDownload.mockRejectedValue(
      new Error("Task not found"),
    );

    const response = await GET(
      new Request("http://localhost/api/tasks/attachments/attachment_1"),
      { params: Promise.resolve({ id: "attachment_1" }) },
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "File not found.",
    });
  });
});

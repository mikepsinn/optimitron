import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  class InputError extends Error {
    constructor(
      message: string,
      readonly status = 400,
    ) {
      super(message);
    }
  }

  return {
    InputError,
    createPendingContentAttachment: vi.fn(),
    getCurrentUser: vi.fn(),
    listContentAttachments: vi.fn(),
    requireAuth: vi.fn(),
  };
});

vi.mock("@/lib/auth-utils", () => ({
  getCurrentUser: mocks.getCurrentUser,
  requireAuth: mocks.requireAuth,
}));

vi.mock("@/lib/content-attachments.server", () => ({
  ContentAttachmentInputError: mocks.InputError,
  createPendingContentAttachment: mocks.createPendingContentAttachment,
  listContentAttachments: mocks.listContentAttachments,
}));

vi.mock("@/lib/object-storage.server", () => ({
  PrivateObjectStorageNotConfiguredError: class extends Error {},
}));

import { GET, POST } from "./route";

beforeEach(() => {
  for (const mock of [
    mocks.createPendingContentAttachment,
    mocks.getCurrentUser,
    mocks.listContentAttachments,
    mocks.requireAuth,
  ]) {
    mock.mockReset();
  }
});

describe("content attachment collection route", () => {
  it("lets the shared access layer evaluate anonymous public-content reads", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);
    mocks.listContentAttachments.mockResolvedValue([]);

    const response = await GET(
      new Request(
        "https://optimitron.test/api/content/attachments?documentId=document_1",
      ),
    );

    expect(response.status).toBe(200);
    expect(mocks.listContentAttachments).toHaveBeenCalledWith({
      collectionRecordId: null,
      documentId: "document_1",
      userId: null,
    });
    expect(mocks.requireAuth).not.toHaveBeenCalled();
  });

  it("preserves attachment-specific HTTP statuses", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });
    mocks.createPendingContentAttachment.mockRejectedValue(
      new mocks.InputError("File is too large.", 413),
    );

    const response = await POST(
      new Request("https://optimitron.test/api/content/attachments", {
        method: "POST",
        body: JSON.stringify({
          checksumSha256: `${"A".repeat(43)}=`,
          contentType: "image/png",
          documentId: "document_1",
          fileName: "large.png",
          sizeBytes: 1,
        }),
      }),
    );

    expect(response.status).toBe(413);
    await expect(response.json()).resolves.toMatchObject({
      code: "INVALID_ATTACHMENT",
      error: "File is too large.",
    });
  });
});

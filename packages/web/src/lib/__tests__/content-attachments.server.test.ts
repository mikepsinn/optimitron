import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  access: {
    assertCollectionRecordAccess: vi.fn(),
    assertDocumentAccess: vi.fn(),
    lockContentResources: vi.fn(),
  },
  prisma: {
    contentAttachmentFindFirst: vi.fn(),
    transaction: vi.fn(),
    txContentAttachmentFindFirst: vi.fn(),
    txContentAttachmentUpdateMany: vi.fn(),
  },
  storage: {
    deletePrivateObject: vi.fn(),
    headPrivateObject: vi.fn(),
    presignPrivateDownload: vi.fn(),
    presignPrivateUpload: vi.fn(),
    readPrivateObjectPrefix: vi.fn(),
  },
}));

vi.mock("@/lib/content-access.server", () => ({
  assertCollectionRecordAccess: mocks.access.assertCollectionRecordAccess,
  assertDocumentAccess: mocks.access.assertDocumentAccess,
  CONTENT_NOT_FOUND_MESSAGE: "Content not found",
  lockContentResources: mocks.access.lockContentResources,
}));

vi.mock("@/lib/object-storage.server", () => ({
  deletePrivateObject: mocks.storage.deletePrivateObject,
  headPrivateObject: mocks.storage.headPrivateObject,
  presignPrivateDownload: mocks.storage.presignPrivateDownload,
  presignPrivateUpload: mocks.storage.presignPrivateUpload,
  readPrivateObjectPrefix: mocks.storage.readPrivateObjectPrefix,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: mocks.prisma.transaction,
    contentAttachment: {
      findFirst: mocks.prisma.contentAttachmentFindFirst,
    },
  },
}));

import {
  completeContentAttachment,
  getContentAttachmentDownload,
} from "../content-attachments.server";

const EXPIRES_AT = new Date("2099-07-14T12:00:00Z");

function documentAttachment() {
  return {
    checksumSha256: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
    collectionRecordId: null,
    contentType: "image/png",
    deletedAt: null,
    documentId: "document_1",
    expiresAt: EXPIRES_AT,
    fileName: "evidence.png",
    id: "attachment_1",
    sizeBytes: 8,
    storageKey: "content-attachments/attachment_1",
    uploadedAt: null,
    uploadedByUserId: "user_1",
  };
}

beforeEach(() => {
  for (const group of Object.values(mocks)) {
    for (const fn of Object.values(group)) fn.mockReset();
  }
  mocks.prisma.transaction.mockImplementation(
    async (callback: (tx: unknown) => Promise<unknown>) =>
      callback({
        contentAttachment: {
          findFirst: mocks.prisma.txContentAttachmentFindFirst,
          updateMany: mocks.prisma.txContentAttachmentUpdateMany,
        },
      }),
  );
});

describe("private content attachments", () => {
  it("does not presign a download after authorization fails", async () => {
    mocks.prisma.contentAttachmentFindFirst.mockResolvedValue({
      ...documentAttachment(),
      expiresAt: null,
      uploadedAt: new Date("2026-07-14T12:00:00Z"),
    });
    mocks.access.assertDocumentAccess.mockRejectedValue(
      new Error("Content not found"),
    );

    await expect(
      getContentAttachmentDownload({
        attachmentId: "attachment_1",
        userId: "viewer_1",
      }),
    ).rejects.toThrow("Content not found");
    expect(mocks.storage.presignPrivateDownload).not.toHaveBeenCalled();
  });

  it("reauthorizes inside completion so a revoked editor cannot publish", async () => {
    const attachment = documentAttachment();
    mocks.prisma.contentAttachmentFindFirst.mockResolvedValue(attachment);
    mocks.prisma.txContentAttachmentFindFirst.mockResolvedValue(attachment);
    mocks.access.assertDocumentAccess
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("Content not found"));
    mocks.storage.headPrivateObject.mockResolvedValue({
      contentLength: 8,
      contentType: "image/png",
    });
    mocks.storage.readPrivateObjectPrefix.mockResolvedValue(
      Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]),
    );

    await expect(
      completeContentAttachment({
        attachmentId: "attachment_1",
        userId: "user_1",
      }),
    ).rejects.toThrow("Content not found");
    expect(mocks.access.lockContentResources).toHaveBeenCalledWith(
      expect.anything(),
      [{ id: "document_1", type: "document" }],
    );
    expect(mocks.prisma.txContentAttachmentUpdateMany).not.toHaveBeenCalled();
  });

  it("returns only a short-lived private URL after view access succeeds", async () => {
    mocks.prisma.contentAttachmentFindFirst.mockResolvedValue({
      ...documentAttachment(),
      expiresAt: null,
      uploadedAt: new Date("2026-07-14T12:00:00Z"),
    });
    mocks.access.assertDocumentAccess.mockResolvedValue(undefined);
    mocks.storage.presignPrivateDownload.mockResolvedValue({
      downloadUrl: "https://private.example/signed",
      expiresInSeconds: 60,
    });

    await expect(
      getContentAttachmentDownload({
        attachmentId: "attachment_1",
        userId: "viewer_1",
      }),
    ).resolves.toEqual({
      downloadUrl: "https://private.example/signed",
      expiresInSeconds: 60,
    });
    expect(mocks.storage.presignPrivateDownload).toHaveBeenCalledWith(
      expect.objectContaining({
        contentType: "image/png",
        key: "content-attachments/attachment_1",
      }),
    );
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCollectionForViewer: vi.fn(),
  getDocumentForViewer: vi.fn(),
  listContentAttachments: vi.fn(),
  queryCollectionRecords: vi.fn(),
  contentAttachmentFindMany: vi.fn(),
  toCollectionDto: vi.fn(),
  toDocumentDto: vi.fn(),
}));

vi.mock("@/lib/collections.server", () => ({
  COLLECTION_NOT_FOUND_MESSAGE: "Collection not found",
  getCollectionForViewer: mocks.getCollectionForViewer,
  queryCollectionRecords: mocks.queryCollectionRecords,
  toCollectionDto: mocks.toCollectionDto,
}));

vi.mock("@/lib/content-attachments.server", () => ({
  contentAttachmentPublicSelect: {
    contentType: true,
    fileName: true,
    id: true,
    sizeBytes: true,
    uploadedAt: true,
  },
  listContentAttachments: mocks.listContentAttachments,
}));

vi.mock("@/lib/documents.server", () => ({
  DOCUMENT_NOT_FOUND_MESSAGE: "Document not found",
  getDocumentForViewer: mocks.getDocumentForViewer,
  toDocumentDto: mocks.toDocumentDto,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    contentAttachment: { findMany: mocks.contentAttachmentFindMany },
  },
}));

import { exportContent } from "../content-export.server";

beforeEach(() => {
  for (const fn of Object.values(mocks)) fn.mockReset();
});

describe("content exports", () => {
  it("does not query files when document authorization fails", async () => {
    mocks.getDocumentForViewer.mockResolvedValue(null);

    await expect(
      exportContent({
        resource: { type: "document", id: "private_document" },
        userId: "viewer_1",
      }),
    ).rejects.toThrow("Document not found");
    expect(mocks.listContentAttachments).not.toHaveBeenCalled();
  });

  it("exports only the authorized collection page and public file metadata", async () => {
    const view = { collection: { id: "collection_1" } };
    mocks.getCollectionForViewer.mockResolvedValue(view);
    mocks.toCollectionDto.mockReturnValue({ id: "collection_1" });
    mocks.queryCollectionRecords.mockResolvedValue({
      nextCursor: "record_2",
      records: [{ id: "record_1" }, { id: "record_2" }],
    });
    mocks.contentAttachmentFindMany.mockResolvedValue([
      {
        collectionRecordId: "record_1",
        contentType: "image/png",
        fileName: "evidence.png",
        id: "attachment_1",
        sizeBytes: 42,
        uploadedAt: new Date("2026-07-14T12:00:00Z"),
      },
    ]);

    const result = await exportContent({
      cursor: "record_0",
      limit: 2,
      resource: { type: "collection", id: "collection_1" },
      userId: "viewer_1",
    });

    expect(result).toMatchObject({
      resourceType: "collection",
      collection: { id: "collection_1" },
      nextCursor: "record_2",
      records: [{ id: "record_1" }, { id: "record_2" }],
      attachments: [
        expect.not.objectContaining({ storageKey: expect.anything() }),
      ],
    });
    expect(mocks.queryCollectionRecords).toHaveBeenCalledWith({
      collectionId: "collection_1",
      cursor: "record_0",
      limit: 2,
      userId: "viewer_1",
    });
  });
});

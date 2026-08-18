import {
  COLLECTION_NOT_FOUND_MESSAGE,
  getCollectionForViewer,
  queryCollectionRecords,
  toCollectionDto,
} from "@/lib/collections.server";
import {
  contentAttachmentPublicSelect,
  listContentAttachments,
} from "@/lib/content-attachments.server";
import {
  DOCUMENT_NOT_FOUND_MESSAGE,
  getDocumentForViewer,
  toDocumentDto,
} from "@/lib/documents.server";
import { prisma } from "@/lib/prisma";

const MAX_EXPORT_RECORDS = 500;

export type ContentExportResource =
  | { type: "document"; id: string }
  | { type: "collection"; id: string };

export async function exportContent(input: {
  cursor?: string | null;
  limit?: number | null;
  resource: ContentExportResource;
  userId?: string | null;
}) {
  const userId = input.userId?.trim() || null;
  const exportedAt = new Date().toISOString();

  if (input.resource.type === "document") {
    const view = await getDocumentForViewer(input.resource.id, userId);
    if (!view) throw new Error(DOCUMENT_NOT_FOUND_MESSAGE);
    const attachments = await listContentAttachments({
      documentId: view.document.id,
      userId,
    });
    return {
      schema: "optimitron-content-export.v1" as const,
      exportedAt,
      resourceType: "document" as const,
      document: toDocumentDto(view),
      versions: view.versions,
      attachments,
    };
  }

  const view = await getCollectionForViewer(input.resource.id, userId);
  if (!view) throw new Error(COLLECTION_NOT_FOUND_MESSAGE);
  const page = await queryCollectionRecords({
    collectionId: view.collection.id,
    cursor: input.cursor,
    limit: Math.min(
      Math.max(Math.trunc(input.limit ?? 100), 1),
      MAX_EXPORT_RECORDS,
    ),
    userId,
  });
  const recordIds = page.records.map((record) => record.id);
  const attachments = recordIds.length
    ? await prisma.contentAttachment.findMany({
        where: {
          collectionRecordId: { in: recordIds },
          deletedAt: null,
          uploadedAt: { not: null },
        },
        orderBy: [{ collectionRecordId: "asc" }, { createdAt: "asc" }],
        select: {
          ...contentAttachmentPublicSelect,
          collectionRecordId: true,
        },
      })
    : [];
  return {
    schema: "optimitron-content-export.v1" as const,
    exportedAt,
    resourceType: "collection" as const,
    collection: toCollectionDto(view),
    records: page.records,
    attachments,
    nextCursor: page.nextCursor,
  };
}

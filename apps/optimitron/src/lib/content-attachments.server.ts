import { randomUUID } from "node:crypto";
import type { Prisma } from "@optimitron/db";
import { ContentAccessLevel } from "@optimitron/db/enums";
import {
  assertCollectionRecordAccess,
  assertDocumentAccess,
  CONTENT_NOT_FOUND_MESSAGE,
  lockContentResources,
} from "@/lib/content-access.server";
import {
  deletePrivateObject,
  headPrivateObject,
  presignPrivateDownload,
  presignPrivateUpload,
  readPrivateObjectPrefix,
} from "@/lib/object-storage.server";
import { prisma } from "@/lib/prisma";
import {
  ALLOWED_TASK_COMMENT_ATTACHMENT_TYPES,
  buildAttachmentContentDisposition,
  isInlineTaskCommentImage,
  normalizeTaskCommentAttachmentContentType,
  sanitizeTaskCommentAttachmentFileName,
  taskCommentAttachmentBytesMatchContentType,
  TASK_COMMENT_ATTACHMENT_MAX_BYTES,
  TASK_COMMENT_ATTACHMENT_MAX_COUNT,
  TASK_COMMENT_ATTACHMENT_MAX_PENDING_BYTES,
  TASK_COMMENT_ATTACHMENT_MAX_PENDING_COUNT,
  TASK_COMMENT_ATTACHMENT_PENDING_TTL_MS,
} from "@/lib/tasks/task-comment-attachment-policy";

export const contentAttachmentPublicSelect = {
  contentType: true,
  fileName: true,
  id: true,
  sizeBytes: true,
  uploadedAt: true,
} satisfies Prisma.ContentAttachmentSelect;

export class ContentAttachmentInputError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
    this.name = "ContentAttachmentInputError";
  }
}

type AttachmentResource =
  | { documentId: string; collectionRecordId: null }
  | { collectionRecordId: string; documentId: null };

type AttachmentAccessClient = Pick<
  Prisma.TransactionClient,
  | "collection"
  | "collectionRecord"
  | "document"
  | "organization"
  | "organizationMember"
  | "user"
>;

function normalizeResource(input: {
  collectionRecordId?: string | null;
  documentId?: string | null;
}): AttachmentResource {
  const documentId = input.documentId?.trim() || null;
  const collectionRecordId = input.collectionRecordId?.trim() || null;
  if (Number(Boolean(documentId)) + Number(Boolean(collectionRecordId)) !== 1) {
    throw new ContentAttachmentInputError(
      "Exactly one documentId or collectionRecordId is required.",
    );
  }
  return documentId
    ? { documentId, collectionRecordId: null }
    : { collectionRecordId: collectionRecordId as string, documentId: null };
}

async function assertResourceAccess(
  resource: AttachmentResource,
  userId: string | null | undefined,
  required: ContentAccessLevel,
  client: AttachmentAccessClient = prisma,
): Promise<void> {
  if (resource.documentId) {
    await assertDocumentAccess(resource.documentId, userId, required, client);
    return;
  }
  if (!resource.collectionRecordId) {
    throw new ContentAttachmentInputError("Attachment resource is invalid.");
  }
  await assertCollectionRecordAccess(
    resource.collectionRecordId,
    userId,
    required,
    client,
  );
}

async function lockAttachmentResource(
  tx: Prisma.TransactionClient,
  resource: AttachmentResource,
): Promise<void> {
  if (resource.documentId) {
    await lockContentResources(tx, [
      { type: "document", id: resource.documentId },
    ]);
    return;
  }
  if (!resource.collectionRecordId) {
    throw new ContentAttachmentInputError("Attachment resource is invalid.");
  }
  const record = await tx.collectionRecord.findFirst({
    where: { id: resource.collectionRecordId, deletedAt: null },
    select: { collectionId: true },
  });
  if (!record) throw new Error(CONTENT_NOT_FOUND_MESSAGE);
  await lockContentResources(tx, [
    { type: "collection", id: record.collectionId },
  ]);
}

export async function createPendingContentAttachment(input: {
  checksumSha256: string;
  collectionRecordId?: string | null;
  contentType: string;
  documentId?: string | null;
  fileName: string;
  sizeBytes: number;
  userId: string;
}) {
  const resource = normalizeResource(input);
  await assertResourceAccess(
    resource,
    input.userId,
    ContentAccessLevel.EDIT_CONTENT,
  );

  const fileName = sanitizeTaskCommentAttachmentFileName(input.fileName);
  const contentType = normalizeTaskCommentAttachmentContentType(
    fileName,
    input.contentType,
  );
  if (!ALLOWED_TASK_COMMENT_ATTACHMENT_TYPES.has(contentType)) {
    throw new ContentAttachmentInputError("This file type is not supported.");
  }
  if (
    !Number.isInteger(input.sizeBytes) ||
    input.sizeBytes < 1 ||
    input.sizeBytes > TASK_COMMENT_ATTACHMENT_MAX_BYTES
  ) {
    throw new ContentAttachmentInputError(
      `Files must be ${TASK_COMMENT_ATTACHMENT_MAX_BYTES} bytes or smaller.`,
      413,
    );
  }
  if (!/^[A-Za-z0-9+/]{43}=$/u.test(input.checksumSha256)) {
    throw new ContentAttachmentInputError("The file checksum is invalid.");
  }

  const attachmentId = randomUUID();
  const storageKey = `content-attachments/${attachmentId}`;
  const expiresAt = new Date(
    Date.now() + TASK_COMMENT_ATTACHMENT_PENDING_TTL_MS,
  );
  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await lockAttachmentResource(tx, resource);
    await assertResourceAccess(
      resource,
      input.userId,
      ContentAccessLevel.EDIT_CONTENT,
      tx,
    );
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('content-attachment-quota'), hashtext(${input.userId}))`;
    const pendingWhere = {
      deletedAt: null,
      expiresAt: { gt: now },
      uploadedAt: null,
      uploadedByUserId: input.userId,
    } as const;
    const [pendingCount, pendingBytes, resourceCount] = await Promise.all([
      tx.contentAttachment.count({ where: pendingWhere }),
      tx.contentAttachment.aggregate({
        where: pendingWhere,
        _sum: { sizeBytes: true },
      }),
      tx.contentAttachment.count({
        where: {
          ...resource,
          deletedAt: null,
          OR: [{ uploadedAt: { not: null } }, { expiresAt: { gt: now } }],
        },
      }),
    ]);
    if (
      pendingCount >= TASK_COMMENT_ATTACHMENT_MAX_PENDING_COUNT ||
      (pendingBytes._sum.sizeBytes ?? 0) + input.sizeBytes >
        TASK_COMMENT_ATTACHMENT_MAX_PENDING_BYTES
    ) {
      throw new ContentAttachmentInputError(
        "Finish or wait for existing uploads before adding more files.",
        429,
      );
    }
    if (resourceCount >= TASK_COMMENT_ATTACHMENT_MAX_COUNT) {
      throw new ContentAttachmentInputError(
        `This item can have at most ${TASK_COMMENT_ATTACHMENT_MAX_COUNT} files.`,
      );
    }
    await tx.contentAttachment.create({
      data: {
        ...resource,
        checksumSha256: input.checksumSha256,
        contentType,
        expiresAt,
        fileName,
        id: attachmentId,
        sizeBytes: input.sizeBytes,
        storageKey,
        uploadedByUserId: input.userId,
      },
    });
  });

  try {
    const presigned = await presignPrivateUpload({
      checksumSha256: input.checksumSha256,
      contentLength: input.sizeBytes,
      contentType,
      key: storageKey,
    });
    return { attachmentId, contentType, expiresAt, ...presigned };
  } catch (error) {
    await prisma.contentAttachment.updateMany({
      where: { id: attachmentId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    throw error;
  }
}

export async function completeContentAttachment(input: {
  attachmentId: string;
  userId: string;
}) {
  const attachment = await prisma.contentAttachment.findFirst({
    where: {
      deletedAt: null,
      id: input.attachmentId,
      uploadedAt: null,
      uploadedByUserId: input.userId,
    },
  });
  if (
    !attachment ||
    !attachment.expiresAt ||
    attachment.expiresAt <= new Date()
  ) {
    throw new Error(CONTENT_NOT_FOUND_MESSAGE);
  }
  const resource = normalizeResource(attachment);
  await assertResourceAccess(
    resource,
    input.userId,
    ContentAccessLevel.EDIT_CONTENT,
  );
  try {
    const [metadata, prefix] = await Promise.all([
      headPrivateObject(attachment.storageKey),
      readPrivateObjectPrefix(attachment.storageKey),
    ]);
    const storedContentType =
      metadata.contentType?.split(";", 1)[0]?.trim().toLowerCase() ?? null;
    if (
      metadata.contentLength !== attachment.sizeBytes ||
      storedContentType !== attachment.contentType ||
      !taskCommentAttachmentBytesMatchContentType(
        attachment.contentType,
        prefix,
      )
    ) {
      throw new Error("Uploaded object metadata does not match");
    }
  } catch {
    throw new ContentAttachmentInputError(
      "The file did not finish uploading. Try again.",
    );
  }
  return prisma.$transaction(async (tx) => {
    const current = await tx.contentAttachment.findFirst({
      where: {
        deletedAt: null,
        expiresAt: attachment.expiresAt,
        id: attachment.id,
        uploadedAt: null,
        uploadedByUserId: input.userId,
      },
    });
    if (!current) throw new Error(CONTENT_NOT_FOUND_MESSAGE);
    const currentResource = normalizeResource(current);
    await lockAttachmentResource(tx, currentResource);
    await assertResourceAccess(
      currentResource,
      input.userId,
      ContentAccessLevel.EDIT_CONTENT,
      tx,
    );
    const completedAt = new Date();
    const completed = await tx.contentAttachment.updateMany({
      where: {
        deletedAt: null,
        expiresAt: current.expiresAt,
        id: current.id,
        uploadedAt: null,
        uploadedByUserId: input.userId,
      },
      data: { expiresAt: null, uploadedAt: completedAt },
    });
    if (completed.count !== 1) throw new Error(CONTENT_NOT_FOUND_MESSAGE);
    return { attachmentId: current.id, uploadedAt: completedAt };
  });
}

export async function listContentAttachments(input: {
  collectionRecordId?: string | null;
  documentId?: string | null;
  userId?: string | null;
}) {
  const resource = normalizeResource(input);
  await assertResourceAccess(resource, input.userId, ContentAccessLevel.VIEW);
  return prisma.contentAttachment.findMany({
    where: {
      ...resource,
      deletedAt: null,
      uploadedAt: { not: null },
    },
    orderBy: { createdAt: "asc" },
    select: contentAttachmentPublicSelect,
  });
}

export async function getContentAttachmentDownload(input: {
  attachmentId: string;
  userId?: string | null;
}) {
  const attachment = await prisma.contentAttachment.findFirst({
    where: {
      deletedAt: null,
      id: input.attachmentId,
      uploadedAt: { not: null },
    },
  });
  if (!attachment) throw new Error(CONTENT_NOT_FOUND_MESSAGE);
  await assertResourceAccess(
    normalizeResource(attachment),
    input.userId,
    ContentAccessLevel.VIEW,
  );
  return presignPrivateDownload({
    contentDisposition: buildAttachmentContentDisposition(
      attachment.fileName,
      isInlineTaskCommentImage(attachment.contentType),
    ),
    contentType: attachment.contentType,
    key: attachment.storageKey,
  });
}

export async function deleteContentAttachment(input: {
  attachmentId: string;
  userId: string;
}): Promise<void> {
  const attachment = await prisma.contentAttachment.findFirst({
    where: { deletedAt: null, id: input.attachmentId },
  });
  if (!attachment) throw new Error(CONTENT_NOT_FOUND_MESSAGE);
  await prisma.$transaction(async (tx) => {
    const current = await tx.contentAttachment.findFirst({
      where: { deletedAt: null, id: attachment.id },
    });
    if (!current) throw new Error(CONTENT_NOT_FOUND_MESSAGE);
    const resource = normalizeResource(current);
    await lockAttachmentResource(tx, resource);
    await assertResourceAccess(
      resource,
      input.userId,
      ContentAccessLevel.EDIT_CONTENT,
      tx,
    );
    await tx.contentAttachment.updateMany({
      where: { deletedAt: null, id: current.id },
      data: { deletedAt: new Date() },
    });
  });
  try {
    await deletePrivateObject(attachment.storageKey);
  } catch (error) {
    console.error("[CONTENT_ATTACHMENTS] Failed to delete private object:", {
      attachmentId: attachment.id,
      error,
    });
  }
}

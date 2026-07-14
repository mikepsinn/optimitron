import { randomUUID } from "node:crypto";
import type { Prisma } from "@optimitron/db";
import { TaskCommentVisibility } from "@optimitron/db/enums";
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
  taskCommentAttachmentBytesMatchContentType,
  sanitizeTaskCommentAttachmentFileName,
  TASK_COMMENT_ATTACHMENT_MAX_BYTES,
  TASK_COMMENT_ATTACHMENT_MAX_COUNT,
  TASK_COMMENT_ATTACHMENT_MAX_PENDING_BYTES,
  TASK_COMMENT_ATTACHMENT_MAX_PENDING_COUNT,
  TASK_COMMENT_ATTACHMENT_PENDING_TTL_MS,
} from "@/lib/tasks/task-comment-attachment-policy";
import {
  assertUserCanViewTask,
  canUserViewInternalTaskContent,
  TASK_NOT_FOUND_MESSAGE,
} from "@/lib/tasks/task-visibility.server";

export const taskCommentAttachmentPublicSelect = {
  id: true,
  contentType: true,
  fileName: true,
  sizeBytes: true,
} satisfies Prisma.TaskCommentAttachmentSelect;

export type TaskCommentAttachmentPublicRow =
  Prisma.TaskCommentAttachmentGetPayload<{
    select: typeof taskCommentAttachmentPublicSelect;
  }>;

export class TaskCommentAttachmentInputError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
    this.name = "TaskCommentAttachmentInputError";
  }
}

export async function createPendingTaskCommentAttachment(input: {
  checksumSha256: string;
  contentType: string;
  fileName: string;
  sizeBytes: number;
  taskId: string;
  userId: string;
}) {
  await assertUserCanViewTask(input.taskId, input.userId);

  const fileName = sanitizeTaskCommentAttachmentFileName(input.fileName);
  const contentType = normalizeTaskCommentAttachmentContentType(
    fileName,
    input.contentType,
  );
  if (!ALLOWED_TASK_COMMENT_ATTACHMENT_TYPES.has(contentType)) {
    throw new TaskCommentAttachmentInputError(
      "This file type is not supported.",
    );
  }
  if (
    !Number.isInteger(input.sizeBytes) ||
    input.sizeBytes < 1 ||
    input.sizeBytes > TASK_COMMENT_ATTACHMENT_MAX_BYTES
  ) {
    throw new TaskCommentAttachmentInputError(
      `Files must be ${TASK_COMMENT_ATTACHMENT_MAX_BYTES} bytes or smaller.`,
      413,
    );
  }
  if (!/^[A-Za-z0-9+/]{43}=$/u.test(input.checksumSha256)) {
    throw new TaskCommentAttachmentInputError("The file checksum is invalid.");
  }

  const attachmentId = randomUUID();
  const storageKey = `task-comment-attachments/${attachmentId}`;
  const expiresAt = new Date(
    Date.now() + TASK_COMMENT_ATTACHMENT_PENDING_TTL_MS,
  );
  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext('task-comment-attachment-quota'), hashtext(${input.userId}))`;
    const where = {
      commentId: null,
      deletedAt: null,
      expiresAt: { gt: now },
      uploadedByUserId: input.userId,
    } as const;
    const [pendingCount, pendingBytes] = await Promise.all([
      tx.taskCommentAttachment.count({ where }),
      tx.taskCommentAttachment.aggregate({
        where,
        _sum: { sizeBytes: true },
      }),
    ]);
    if (
      pendingCount >= TASK_COMMENT_ATTACHMENT_MAX_PENDING_COUNT ||
      (pendingBytes._sum.sizeBytes ?? 0) + input.sizeBytes >
        TASK_COMMENT_ATTACHMENT_MAX_PENDING_BYTES
    ) {
      throw new TaskCommentAttachmentInputError(
        "Finish or wait for existing uploads before adding more files.",
        429,
      );
    }
    await tx.taskCommentAttachment.create({
      data: {
        checksumSha256: input.checksumSha256,
        contentType,
        expiresAt,
        fileName,
        id: attachmentId,
        sizeBytes: input.sizeBytes,
        storageKey,
        taskId: input.taskId,
        uploadedByUserId: input.userId,
      },
    });
  });

  let presigned;
  try {
    presigned = await presignPrivateUpload({
      checksumSha256: input.checksumSha256,
      contentLength: input.sizeBytes,
      contentType,
      key: storageKey,
    });
  } catch (error) {
    await prisma.taskCommentAttachment.update({
      where: { id: attachmentId },
      data: { deletedAt: new Date() },
    });
    throw error;
  }

  return {
    attachmentId,
    contentType,
    expiresAt,
    ...presigned,
  };
}

export async function verifyPendingTaskCommentAttachments(input: {
  attachmentIds: string[];
  taskId: string;
  userId: string;
}): Promise<string[]> {
  const attachmentIds = [...new Set(input.attachmentIds.map((id) => id.trim()))]
    .filter(Boolean)
    .sort();
  if (attachmentIds.length === 0) return [];
  if (attachmentIds.length > TASK_COMMENT_ATTACHMENT_MAX_COUNT) {
    throw new TaskCommentAttachmentInputError(
      `A comment can have at most ${TASK_COMMENT_ATTACHMENT_MAX_COUNT} files.`,
    );
  }

  const attachments = await prisma.taskCommentAttachment.findMany({
    where: { id: { in: attachmentIds } },
    select: {
      commentId: true,
      contentType: true,
      deletedAt: true,
      expiresAt: true,
      id: true,
      sizeBytes: true,
      storageKey: true,
      taskId: true,
      uploadedByUserId: true,
    },
  });
  const now = Date.now();
  const usable =
    attachments.length === attachmentIds.length &&
    attachments.every(
      (attachment) =>
        attachment.commentId == null &&
        attachment.deletedAt == null &&
        attachment.expiresAt != null &&
        attachment.expiresAt.getTime() > now &&
        attachment.taskId === input.taskId &&
        attachment.uploadedByUserId === input.userId,
    );
  if (!usable) {
    throw new TaskCommentAttachmentInputError(
      "One or more attachments are unavailable.",
    );
  }

  try {
    await Promise.all(
      attachments.map(async (attachment) => {
        const metadata = await headPrivateObject(attachment.storageKey);
        const prefix = await readPrivateObjectPrefix(attachment.storageKey);
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
      }),
    );
  } catch {
    throw new TaskCommentAttachmentInputError(
      "One or more files did not finish uploading. Try again.",
    );
  }

  return attachmentIds;
}

export async function deleteTaskCommentAttachmentObjects(
  storageKeys: readonly string[],
) {
  await Promise.all(
    [...new Set(storageKeys)].map((storageKey) =>
      deletePrivateObject(storageKey),
    ),
  );
}

export async function getTaskCommentAttachmentDownload(input: {
  attachmentId: string;
  userId?: string | null;
}) {
  const attachment = await prisma.taskCommentAttachment.findFirst({
    where: {
      commentId: { not: null },
      deletedAt: null,
      id: input.attachmentId,
    },
    select: {
      comment: {
        select: {
          deletedAt: true,
          hiddenByCurator: true,
          taskId: true,
          visibility: true,
        },
      },
      contentType: true,
      fileName: true,
      storageKey: true,
      taskId: true,
    },
  });
  const comment = attachment?.comment;
  if (
    !attachment ||
    !comment ||
    comment.deletedAt != null ||
    comment.hiddenByCurator ||
    comment.taskId !== attachment.taskId
  ) {
    throw new Error(TASK_NOT_FOUND_MESSAGE);
  }

  await assertUserCanViewTask(attachment.taskId, input.userId);
  if (
    comment.visibility === TaskCommentVisibility.INTERNAL &&
    !(await canUserViewInternalTaskContent(attachment.taskId, input.userId))
  ) {
    throw new Error(TASK_NOT_FOUND_MESSAGE);
  }

  return presignPrivateDownload({
    contentDisposition: buildAttachmentContentDisposition(
      attachment.fileName,
      isInlineTaskCommentImage(attachment.contentType),
    ),
    contentType: attachment.contentType,
    key: attachment.storageKey,
  });
}

export async function cleanupExpiredTaskCommentAttachments(
  limit = 500,
): Promise<{ deleted: number; failed: number }> {
  const now = new Date();
  const expired = await prisma.taskCommentAttachment.findMany({
    where: {
      OR: [
        { deletedAt: { not: null } },
        { commentId: null, expiresAt: { lt: now } },
        { task: { deletedAt: { not: null } } },
        {
          comment: {
            is: {
              OR: [{ deletedAt: { not: null } }, { hiddenByCurator: true }],
            },
          },
        },
      ],
    },
    orderBy: { updatedAt: "asc" },
    select: { id: true, storageKey: true },
    take: Math.min(Math.max(limit, 1), 500),
  });

  let deleted = 0;
  let failed = 0;
  for (const attachment of expired) {
    try {
      await prisma.taskCommentAttachment.updateMany({
        where: { deletedAt: null, id: attachment.id },
        data: { deletedAt: now },
      });
      await deletePrivateObject(attachment.storageKey);
      const result = await prisma.taskCommentAttachment.deleteMany({
        where: { id: attachment.id },
      });
      deleted += result.count;
    } catch {
      failed += 1;
    }
  }
  return { deleted, failed };
}

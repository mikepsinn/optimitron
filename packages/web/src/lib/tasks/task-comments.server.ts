/**
 * Task comment server helpers. All operations are transactional so cached
 * counters (voteScore, upvoteCount, downvoteCount, replyCount) never drift.
 */

import { Prisma } from "@optimitron/db";
import { prisma } from "@/lib/prisma";
import {
  TaskCommentAttachmentInputError,
  deleteTaskCommentAttachmentObjects,
  taskCommentAttachmentPublicSelect,
  type TaskCommentAttachmentPublicRow,
  verifyPendingTaskCommentAttachments,
} from "@/lib/tasks/task-comment-attachments.server";
import {
  assertUserCanViewTask,
  canUserViewInternalTaskContent,
  TASK_NOT_FOUND_MESSAGE,
} from "@/lib/tasks/task-visibility.server";
import { userDisplaySelect } from "@/lib/user-display";

const MAX_MESSAGE_LENGTH = 20_000;
const MIN_MESSAGE_LENGTH = 1;

export type CommentSortKey = "new" | "top";

export interface TaskCommentRow {
  id: string;
  taskId: string;
  parentCommentId: string | null;
  authorUserId: string | null;
  message: string;
  mediaUrl: string | null;
  attachments: TaskCommentAttachmentPublicRow[];
  mentionedUserIds: string[];
  upvoteCount: number;
  downvoteCount: number;
  voteScore: number;
  replyCount: number;
  hotScore: number;
  path: string;
  citationsJson: unknown;
  editedAt: Date | null;
  deletedAt: Date | null;
  hiddenByCurator: boolean;
  createdAt: Date;
  updatedAt: Date;
  authorUser: {
    id: string;
    email: string | null;
    person: {
      id: string;
      handle: string | null;
      displayName: string;
      image: string | null;
    } | null;
  } | null;
  viewerVote?: 1 | -1 | 0;
}

export interface TaskActivityRow {
  id: string;
  type: string;
  userId: string;
  createdAt: Date;
  metadata: unknown;
  user: {
    id: string;
    email: string | null;
    person: {
      id: string;
      handle: string | null;
      displayName: string;
      image: string | null;
    } | null;
  };
}

/** Parse @mentions out of a markdown body. Returns lowercase usernames. */
function parseMentions(message: string): string[] {
  const matches = message.match(/(?:^|\s)@([a-zA-Z0-9_]{2,32})/g) ?? [];
  return [...new Set(matches.map((m) => m.trim().slice(1).toLowerCase()))];
}

/** Resolve mentioned handles to user IDs via Person.handle. */
async function resolveMentionedUserIds(handles: string[]): Promise<string[]> {
  if (handles.length === 0) return [];
  const persons = await prisma.person.findMany({
    where: { handle: { in: handles, mode: "insensitive" } },
    select: { user: { select: { id: true } } },
  });
  return persons.flatMap((p) => (p.user ? [p.user.id] : []));
}

/**
 * Post a new comment or reply.
 * Transactionally inserts the row, computes the materialized path, and
 * increments the parent's replyCount if applicable.
 */
export async function postComment(input: {
  taskId: string;
  authorUserId: string;
  parentCommentId?: string | null;
  message: string;
  mediaUrl?: string | null;
  attachmentIds?: string[];
  enforceParentVisibility?: boolean;
  citationsJson?: Prisma.InputJsonValue | null;
}): Promise<TaskCommentRow> {
  const trimmed = input.message.trim();
  if (input.parentCommentId && input.enforceParentVisibility) {
    const parent = await prisma.taskComment.findFirst({
      where: {
        deletedAt: null,
        id: input.parentCommentId,
        taskId: input.taskId,
      },
      select: { visibility: true },
    });
    if (
      !parent ||
      (parent.visibility === "INTERNAL" &&
        !(await canUserViewInternalTaskContent(
          input.taskId,
          input.authorUserId,
        )))
    ) {
      throw new Error(TASK_NOT_FOUND_MESSAGE);
    }
  }
  const attachmentIds = await verifyPendingTaskCommentAttachments({
    attachmentIds: input.attachmentIds ?? [],
    taskId: input.taskId,
    userId: input.authorUserId,
  });
  if (
    trimmed.length < MIN_MESSAGE_LENGTH &&
    attachmentIds.length === 0 &&
    !input.mediaUrl
  ) {
    throw new Error("Comment message or attachment is required");
  }
  if (trimmed.length > MAX_MESSAGE_LENGTH) {
    throw new Error(`Comment exceeds ${MAX_MESSAGE_LENGTH} character limit`);
  }

  const mentionedUsernames = parseMentions(trimmed);
  const mentionedUserIds = await resolveMentionedUserIds(mentionedUsernames);

  const result = await prisma.$transaction(async (tx) => {
    // Compute the materialized path: parent.path + "/" + newId (we don't know the new id yet, so use a placeholder and update after insert).
    let parentPath = "";
    let parentVisibility: "PUBLIC" | "INTERNAL" | undefined;
    if (input.parentCommentId) {
      const parent = await tx.taskComment.findUnique({
        where: { id: input.parentCommentId },
        select: {
          path: true,
          taskId: true,
          deletedAt: true,
          visibility: true,
        },
      });
      if (!parent || parent.deletedAt != null) {
        throw new Error("Parent comment not found");
      }
      if (parent.taskId !== input.taskId) {
        throw new Error("Parent comment is on a different task");
      }
      parentPath = parent.path;
      parentVisibility = parent.visibility;
    }

    const comment = await tx.taskComment.create({
      data: {
        taskId: input.taskId,
        parentCommentId: input.parentCommentId ?? null,
        authorUserId: input.authorUserId,
        message: trimmed,
        mediaUrl: input.mediaUrl ?? null,
        visibility: parentVisibility,
        mentionedUserIds,
        citationsJson: input.citationsJson ?? Prisma.JsonNull,
        path: "", // set in next step
      },
      include: {
        authorUser: {
          select: userDisplaySelect,
        },
        attachments: {
          where: { deletedAt: null },
          select: taskCommentAttachmentPublicSelect,
        },
      },
    });

    if (attachmentIds.length > 0) {
      const linked = await tx.taskCommentAttachment.updateMany({
        where: {
          commentId: null,
          deletedAt: null,
          expiresAt: { gt: new Date() },
          id: { in: attachmentIds },
          taskId: input.taskId,
          uploadedByUserId: input.authorUserId,
        },
        data: {
          commentId: comment.id,
          expiresAt: null,
          uploadedAt: new Date(),
        },
      });
      if (linked.count !== attachmentIds.length) {
        throw new TaskCommentAttachmentInputError(
          "One or more attachments are unavailable.",
        );
      }
    }

    // Materialize the path now that we have the ID
    const newPath = parentPath
      ? `${parentPath}/${comment.id}`
      : `/${comment.id}`;
    const finalized = await tx.taskComment.update({
      where: { id: comment.id },
      data: { path: newPath },
      include: {
        authorUser: {
          select: userDisplaySelect,
        },
        attachments: {
          where: { deletedAt: null },
          select: taskCommentAttachmentPublicSelect,
        },
      },
    });

    // Increment parent's replyCount + version if this is a reply
    if (input.parentCommentId) {
      await tx.taskComment.update({
        where: { id: input.parentCommentId },
        data: {
          replyCount: { increment: 1 },
          version: { increment: 1 },
        },
      });
    }

    return finalized;
  });

  return result as TaskCommentRow;
}

/**
 * Upsert a vote (+1 / -1 / 0 for remove). Recomputes cached counters
 * on the comment in the same transaction.
 */
export async function voteComment(input: {
  commentId: string;
  userId: string;
  value: 1 | -1 | 0;
  ipHash?: string | null;
  userAgentHash?: string | null;
}): Promise<{
  voteScore: number;
  upvoteCount: number;
  downvoteCount: number;
  userVote: 1 | -1 | 0;
}> {
  // Voting requires the same task access as reading the feed — otherwise a
  // signed-in user could interact with (and confirm the existence of)
  // comments on private tasks.
  const target = await prisma.taskComment.findUnique({
    where: { id: input.commentId },
    select: { taskId: true, visibility: true },
  });
  if (!target) {
    throw new Error("Comment not found");
  }
  await assertUserCanViewTask(target.taskId, input.userId);
  if (
    target.visibility === "INTERNAL" &&
    !(await canUserViewInternalTaskContent(target.taskId, input.userId))
  ) {
    throw new Error("Comment not found");
  }

  return prisma.$transaction(async (tx) => {
    const existing = await tx.taskCommentVote.findUnique({
      where: {
        commentId_userId: { commentId: input.commentId, userId: input.userId },
      },
    });

    if (input.value === 0) {
      // Remove vote
      if (existing) {
        await tx.taskCommentVote.delete({
          where: { id: existing.id },
        });
      }
    } else if (existing) {
      if (existing.value === input.value) {
        // Toggle off
        await tx.taskCommentVote.delete({ where: { id: existing.id } });
      } else {
        // Flip direction
        await tx.taskCommentVote.update({
          where: { id: existing.id },
          data: {
            value: input.value,
            ipHash: input.ipHash ?? existing.ipHash,
            userAgentHash: input.userAgentHash ?? existing.userAgentHash,
          },
        });
      }
    } else {
      await tx.taskCommentVote.create({
        data: {
          commentId: input.commentId,
          userId: input.userId,
          value: input.value,
          ipHash: input.ipHash ?? null,
          userAgentHash: input.userAgentHash ?? null,
        },
      });
    }

    // Recompute cached counts atomically
    const [upvoteCount, downvoteCount] = await Promise.all([
      tx.taskCommentVote.count({
        where: { commentId: input.commentId, value: 1 },
      }),
      tx.taskCommentVote.count({
        where: { commentId: input.commentId, value: -1 },
      }),
    ]);
    const voteScore = upvoteCount - downvoteCount;

    const updated = await tx.taskComment.update({
      where: { id: input.commentId },
      data: {
        upvoteCount,
        downvoteCount,
        voteScore,
        version: { increment: 1 },
      },
    });

    // Determine the viewer's effective vote after the op
    const afterVote = await tx.taskCommentVote.findUnique({
      where: {
        commentId_userId: { commentId: input.commentId, userId: input.userId },
      },
    });

    return {
      voteScore: updated.voteScore,
      upvoteCount: updated.upvoteCount,
      downvoteCount: updated.downvoteCount,
      userVote: (afterVote?.value ?? 0) as 1 | -1 | 0,
    };
  });
}

/**
 * Delete a comment. Authors soft-delete (sets deletedAt so the row renders as
 * [deleted] and threads stay intact). Moderators hard-delete the row plus every
 * descendant in the thread via the materialized-path prefix.
 */
export async function deleteComment(input: {
  commentId: string;
  userId: string;
  asModerator?: boolean;
}): Promise<void> {
  const comment = await prisma.taskComment.findUnique({
    where: { id: input.commentId },
    select: {
      authorUserId: true,
      deletedAt: true,
      path: true,
      parentCommentId: true,
    },
  });
  if (!comment) throw new Error("Comment not found");

  const isAuthor = comment.authorUserId === input.userId;
  if (!isAuthor && !input.asModerator) {
    throw new Error("Not authorized to delete this comment");
  }

  if (input.asModerator) {
    // Revoke attachment access in the database before contacting object
    // storage. Moderation must still succeed during an R2 outage.
    const prefix = comment.path || `/${input.commentId}`;
    const attachments = await prisma.taskCommentAttachment.findMany({
      where: {
        comment: { path: { startsWith: prefix } },
      },
      select: { id: true, storageKey: true },
    });
    const now = new Date();
    await prisma.$transaction(async (tx) => {
      if (attachments.length > 0) {
        await tx.taskCommentAttachment.updateMany({
          where: { id: { in: attachments.map((attachment) => attachment.id) } },
          data: { commentId: null, deletedAt: now, expiresAt: now },
        });
      }
      await tx.taskComment.deleteMany({
        where: { path: { startsWith: prefix } },
      });
      if (comment.parentCommentId) {
        await tx.taskComment.update({
          where: { id: comment.parentCommentId },
          data: { replyCount: { decrement: 1 }, version: { increment: 1 } },
        });
      }
    });
    if (attachments.length > 0) {
      try {
        await deleteTaskCommentAttachmentObjects(
          attachments.map((attachment) => attachment.storageKey),
        );
        await prisma.taskCommentAttachment.deleteMany({
          where: { id: { in: attachments.map((attachment) => attachment.id) } },
        });
      } catch (error) {
        console.error(
          "[TASKS] Failed to purge moderated comment attachments:",
          error,
        );
      }
    }
    return;
  }

  // Author soft-delete path.
  if (comment.deletedAt) return; // already soft-deleted
  const now = new Date();
  const attachments = await prisma.taskCommentAttachment.findMany({
    where: { commentId: input.commentId, deletedAt: null },
    select: { id: true, storageKey: true },
  });
  await prisma.$transaction(async (tx) => {
    if (attachments.length > 0) {
      await tx.taskCommentAttachment.updateMany({
        where: { id: { in: attachments.map((attachment) => attachment.id) } },
        data: { deletedAt: now },
      });
    }
    await tx.taskComment.update({
      where: { id: input.commentId },
      data: {
        deletedAt: now,
        version: { increment: 1 },
      },
    });
  });
  if (attachments.length > 0) {
    try {
      await deleteTaskCommentAttachmentObjects(
        attachments.map((attachment) => attachment.storageKey),
      );
      await prisma.taskCommentAttachment.deleteMany({
        where: { id: { in: attachments.map((attachment) => attachment.id) } },
      });
    } catch (error) {
      console.error(
        "[TASKS] Failed to purge deleted comment attachments:",
        error,
      );
    }
  }
}

/**
 * Fetch comments for a task feed with cursor pagination.
 * Includes the viewer's existing votes on each comment.
 */
export async function getTaskCommentFeed(input: {
  taskId: string;
  sort?: CommentSortKey;
  cursor?: Date | null;
  limit?: number;
  currentUserId?: string | null;
}): Promise<{
  comments: TaskCommentRow[];
  nextCursor: Date | null;
  total: number;
}> {
  // Same predicate as /tasks/[id]: a task whose page 404s for this viewer
  // must 404 its comment feed too (private tasks stay indistinguishable
  // from missing ones — never a 401/403).
  await assertUserCanViewTask(input.taskId, input.currentUserId);
  const canSeeInternal = await canUserViewInternalTaskContent(
    input.taskId,
    input.currentUserId,
  );

  const sort = input.sort ?? "new";
  const limit = Math.min(Math.max(input.limit ?? 50, 1), 100);

  const baseWhere: Prisma.TaskCommentWhereInput = {
    taskId: input.taskId,
    deletedAt: null,
    ...(canSeeInternal ? {} : { visibility: "PUBLIC" }),
  };
  const where: Prisma.TaskCommentWhereInput = {
    ...baseWhere,
    ...(input.cursor ? { createdAt: { lt: input.cursor } } : {}),
  };

  const orderBy: Prisma.TaskCommentOrderByWithRelationInput[] =
    sort === "top"
      ? [{ voteScore: "desc" }, { createdAt: "desc" }]
      : [{ createdAt: "desc" }];

  const [rows, total] = await Promise.all([
    prisma.taskComment.findMany({
      where,
      orderBy,
      take: limit + 1,
      include: {
        authorUser: {
          select: userDisplaySelect,
        },
        attachments: {
          where: { deletedAt: null },
          select: taskCommentAttachmentPublicSelect,
        },
      },
    }),
    prisma.taskComment.count({ where: baseWhere }),
  ]);

  const hasMore = rows.length > limit;
  const sliced = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore
    ? (sliced[sliced.length - 1]?.createdAt ?? null)
    : null;

  // Fetch viewer's votes on these comments if signed in
  let viewerVotes: Map<string, 1 | -1> = new Map();
  if (input.currentUserId && sliced.length > 0) {
    const votes = await prisma.taskCommentVote.findMany({
      where: {
        userId: input.currentUserId,
        commentId: { in: sliced.map((c) => c.id) },
      },
      select: { commentId: true, value: true },
    });
    viewerVotes = new Map(votes.map((v) => [v.commentId, v.value as 1 | -1]));
  }

  const comments: TaskCommentRow[] = sliced.map((row) => ({
    ...row,
    viewerVote: viewerVotes.get(row.id) ?? 0,
  })) as TaskCommentRow[];

  return { comments, nextCursor, total };
}

/**
 * Read recent silent activity events (shares, contacts, claims) for a task.
 * Pulled from the existing polymorphic Activity table — no new writes here.
 */
export async function getTaskActivityTimeline(
  taskId: string,
  limit = 50,
  currentUserId?: string | null,
): Promise<TaskActivityRow[]> {
  // Same visibility gate as the comment feed: activity on a private task is
  // as sensitive as its comments.
  await assertUserCanViewTask(taskId, currentUserId);

  const rows = await prisma.activity.findMany({
    where: {
      entityType: "Task",
      entityId: taskId,
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: {
        select: userDisplaySelect,
      },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    userId: row.userId,
    createdAt: row.createdAt,
    metadata: row.metadata ? safeJsonParse(row.metadata) : null,
    user: row.user,
  }));
}

function safeJsonParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

/** Count comments a user has posted on a given task in a time window. */
export async function countUserCommentsInWindow(
  taskId: string,
  userId: string,
  windowMs: number,
): Promise<number> {
  const since = new Date(Date.now() - windowMs);
  return prisma.taskComment.count({
    where: {
      taskId,
      authorUserId: userId,
      createdAt: { gte: since },
    },
  });
}

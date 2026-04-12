/**
 * Task comment server helpers. All operations are transactional so cached
 * counters (voteScore, upvoteCount, downvoteCount, replyCount) never drift.
 */

import { Prisma } from "@optimitron/db";
import { prisma } from "@/lib/prisma";

const MAX_MESSAGE_LENGTH = 20_000;
const MIN_MESSAGE_LENGTH = 1;

export type CommentSortKey = "new" | "top";

export interface TaskCommentRow {
  id: string;
  taskId: string;
  parentCommentId: string | null;
  authorUserId: string;
  message: string;
  mediaUrl: string | null;
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
    name: string | null;
    username: string | null;
    image: string | null;
    person: { id: string; handle: string | null } | null;
  };
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
    name: string | null;
    username: string | null;
    image: string | null;
    person: { id: string; handle: string | null } | null;
  };
}

/** Parse @mentions out of a markdown body. Returns lowercase usernames. */
function parseMentions(message: string): string[] {
  const matches = message.match(/(?:^|\s)@([a-zA-Z0-9_]{2,32})/g) ?? [];
  return [...new Set(matches.map((m) => m.trim().slice(1).toLowerCase()))];
}

/** Resolve mentioned usernames to user IDs. */
async function resolveMentionedUserIds(usernames: string[]): Promise<string[]> {
  if (usernames.length === 0) return [];
  const users = await prisma.user.findMany({
    where: { username: { in: usernames, mode: "insensitive" } },
    select: { id: true },
  });
  return users.map((u) => u.id);
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
  citationsJson?: Prisma.InputJsonValue | null;
}): Promise<TaskCommentRow> {
  const trimmed = input.message.trim();
  if (trimmed.length < MIN_MESSAGE_LENGTH) {
    throw new Error("Comment message cannot be empty");
  }
  if (trimmed.length > MAX_MESSAGE_LENGTH) {
    throw new Error(`Comment exceeds ${MAX_MESSAGE_LENGTH} character limit`);
  }

  const mentionedUsernames = parseMentions(trimmed);
  const mentionedUserIds = await resolveMentionedUserIds(mentionedUsernames);

  const result = await prisma.$transaction(async (tx) => {
    // Compute the materialized path: parent.path + "/" + newId (we don't know the new id yet, so use a placeholder and update after insert).
    let parentPath = "";
    if (input.parentCommentId) {
      const parent = await tx.taskComment.findUnique({
        where: { id: input.parentCommentId },
        select: { path: true, taskId: true, deletedAt: true },
      });
      if (!parent || parent.deletedAt != null) {
        throw new Error("Parent comment not found");
      }
      if (parent.taskId !== input.taskId) {
        throw new Error("Parent comment is on a different task");
      }
      parentPath = parent.path;
    }

    const comment = await tx.taskComment.create({
      data: {
        taskId: input.taskId,
        parentCommentId: input.parentCommentId ?? null,
        authorUserId: input.authorUserId,
        message: trimmed,
        mediaUrl: input.mediaUrl ?? null,
        mentionedUserIds,
        citationsJson: input.citationsJson ?? Prisma.JsonNull,
        path: "", // set in next step
      },
      include: {
        authorUser: {
          select: { id: true, name: true, username: true, image: true, person: { select: { id: true, handle: true } } },
        },
      },
    });

    // Materialize the path now that we have the ID
    const newPath = parentPath ? `${parentPath}/${comment.id}` : `/${comment.id}`;
    const finalized = await tx.taskComment.update({
      where: { id: comment.id },
      data: { path: newPath },
      include: {
        authorUser: {
          select: { id: true, name: true, username: true, image: true, person: { select: { id: true, handle: true } } },
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
  return prisma.$transaction(async (tx) => {
    const existing = await tx.taskCommentVote.findUnique({
      where: { commentId_userId: { commentId: input.commentId, userId: input.userId } },
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
      tx.taskCommentVote.count({ where: { commentId: input.commentId, value: 1 } }),
      tx.taskCommentVote.count({ where: { commentId: input.commentId, value: -1 } }),
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
      where: { commentId_userId: { commentId: input.commentId, userId: input.userId } },
    });

    return {
      voteScore: updated.voteScore,
      upvoteCount: updated.upvoteCount,
      downvoteCount: updated.downvoteCount,
      userVote: (afterVote?.value ?? 0) as 1 | -1 | 0,
    };
  });
}

/** Soft-delete a comment. */
export async function deleteComment(input: {
  commentId: string;
  userId: string;
  asModerator?: boolean;
  moderationReason?: string | null;
}): Promise<void> {
  const comment = await prisma.taskComment.findUnique({
    where: { id: input.commentId },
    select: { authorUserId: true, deletedAt: true },
  });
  if (!comment) throw new Error("Comment not found");
  if (comment.deletedAt) return; // already deleted

  const isAuthor = comment.authorUserId === input.userId;
  if (!isAuthor && !input.asModerator) {
    throw new Error("Not authorized to delete this comment");
  }

  const now = new Date();
  await prisma.taskComment.update({
    where: { id: input.commentId },
    data: {
      deletedAt: now,
      version: { increment: 1 },
      ...(input.asModerator
        ? {
            moderatedByUserId: input.userId,
            moderatedAt: now,
            moderationReason: input.moderationReason ?? null,
            hiddenByCurator: true,
          }
        : {}),
    },
  });
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
}> {
  const sort = input.sort ?? "new";
  const limit = Math.min(Math.max(input.limit ?? 50, 1), 100);

  const where: Prisma.TaskCommentWhereInput = {
    taskId: input.taskId,
    deletedAt: null,
    ...(input.cursor ? { createdAt: { lt: input.cursor } } : {}),
  };

  const orderBy: Prisma.TaskCommentOrderByWithRelationInput[] =
    sort === "top"
      ? [{ voteScore: "desc" }, { createdAt: "desc" }]
      : [{ createdAt: "desc" }];

  const rows = await prisma.taskComment.findMany({
    where,
    orderBy,
    take: limit + 1,
    include: {
      authorUser: {
        select: { id: true, name: true, username: true, image: true, person: { select: { id: true, handle: true } } },
      },
    },
  });

  const hasMore = rows.length > limit;
  const sliced = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? sliced[sliced.length - 1]?.createdAt ?? null : null;

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

  return { comments, nextCursor };
}

/**
 * Read recent silent activity events (shares, contacts, claims) for a task.
 * Pulled from the existing polymorphic Activity table — no new writes here.
 */
export async function getTaskActivityTimeline(
  taskId: string,
  limit = 50,
): Promise<TaskActivityRow[]> {
  const rows = await prisma.activity.findMany({
    where: {
      entityType: "Task",
      entityId: taskId,
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: {
        select: { id: true, name: true, username: true, image: true, person: { select: { id: true, handle: true } } },
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

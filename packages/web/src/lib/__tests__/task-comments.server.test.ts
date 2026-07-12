import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  assertUserCanViewTask: vi.fn(),
  prisma: {
    activityFindMany: vi.fn(),
    taskCommentCount: vi.fn(),
    taskCommentFindMany: vi.fn(),
    taskCommentFindUnique: vi.fn(),
    taskCommentUpdate: vi.fn(),
    taskCommentVoteFindMany: vi.fn(),
    transaction: vi.fn(),
  },
  tx: {
    taskCommentDeleteMany: vi.fn(),
    taskCommentUpdate: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: mocks.prisma.transaction,
    activity: {
      findMany: mocks.prisma.activityFindMany,
    },
    taskComment: {
      count: mocks.prisma.taskCommentCount,
      findMany: mocks.prisma.taskCommentFindMany,
      findUnique: mocks.prisma.taskCommentFindUnique,
      update: mocks.prisma.taskCommentUpdate,
    },
    taskCommentVote: {
      findMany: mocks.prisma.taskCommentVoteFindMany,
    },
  },
}));

vi.mock("@/lib/tasks/task-visibility.server", () => ({
  TASK_NOT_FOUND_MESSAGE: "Task not found",
  assertUserCanViewTask: mocks.assertUserCanViewTask,
}));

import {
  deleteComment,
  getTaskActivityTimeline,
  getTaskCommentFeed,
  voteComment,
} from "../tasks/task-comments.server";

function createTxClient() {
  return {
    taskComment: {
      deleteMany: mocks.tx.taskCommentDeleteMany,
      update: mocks.tx.taskCommentUpdate,
    },
  };
}

function resetAllMocks() {
  for (const group of [mocks.prisma, mocks.tx]) {
    for (const fn of Object.values(group)) {
      fn.mockReset();
    }
  }
  mocks.assertUserCanViewTask.mockReset();
  // Default: caller may view the task. Denial tests override per-case.
  mocks.assertUserCanViewTask.mockResolvedValue(undefined);
}

describe("deleteComment", () => {
  beforeEach(() => {
    resetAllMocks();
    mocks.prisma.transaction.mockImplementation(
      async (cb: (tx: ReturnType<typeof createTxClient>) => unknown) =>
        cb(createTxClient()),
    );
  });

  describe("moderator hard delete", () => {
    it("removes the target and every descendant by path prefix", async () => {
      mocks.prisma.taskCommentFindUnique.mockResolvedValue({
        authorUserId: "author_1",
        deletedAt: null,
        path: "/root_1",
        parentCommentId: null,
      });
      mocks.tx.taskCommentDeleteMany.mockResolvedValue({ count: 3 });

      await deleteComment({
        commentId: "root_1",
        userId: "admin_1",
        asModerator: true,
      });

      expect(mocks.tx.taskCommentDeleteMany).toHaveBeenCalledWith({
        where: { path: { startsWith: "/root_1" } },
      });
      expect(mocks.tx.taskCommentUpdate).not.toHaveBeenCalled();
    });

    it("decrements the parent's replyCount when deleting a reply", async () => {
      mocks.prisma.taskCommentFindUnique.mockResolvedValue({
        authorUserId: "author_2",
        deletedAt: null,
        path: "/root_1/reply_1",
        parentCommentId: "root_1",
      });
      mocks.tx.taskCommentDeleteMany.mockResolvedValue({ count: 1 });

      await deleteComment({
        commentId: "reply_1",
        userId: "admin_1",
        asModerator: true,
      });

      expect(mocks.tx.taskCommentDeleteMany).toHaveBeenCalledWith({
        where: { path: { startsWith: "/root_1/reply_1" } },
      });
      expect(mocks.tx.taskCommentUpdate).toHaveBeenCalledWith({
        where: { id: "root_1" },
        data: { replyCount: { decrement: 1 }, version: { increment: 1 } },
      });
    });

    it("hard-deletes even when the comment is already soft-deleted", async () => {
      mocks.prisma.taskCommentFindUnique.mockResolvedValue({
        authorUserId: "author_1",
        deletedAt: new Date("2026-04-01T00:00:00Z"),
        path: "/root_1",
        parentCommentId: null,
      });
      mocks.tx.taskCommentDeleteMany.mockResolvedValue({ count: 1 });

      await deleteComment({
        commentId: "root_1",
        userId: "admin_1",
        asModerator: true,
      });

      expect(mocks.tx.taskCommentDeleteMany).toHaveBeenCalled();
      expect(mocks.prisma.taskCommentUpdate).not.toHaveBeenCalled();
    });

    it("falls back to /{commentId} when the stored path is empty", async () => {
      mocks.prisma.taskCommentFindUnique.mockResolvedValue({
        authorUserId: "author_1",
        deletedAt: null,
        path: "",
        parentCommentId: null,
      });
      mocks.tx.taskCommentDeleteMany.mockResolvedValue({ count: 1 });

      await deleteComment({
        commentId: "orphan_1",
        userId: "admin_1",
        asModerator: true,
      });

      expect(mocks.tx.taskCommentDeleteMany).toHaveBeenCalledWith({
        where: { path: { startsWith: "/orphan_1" } },
      });
    });
  });

  describe("author soft delete", () => {
    it("sets deletedAt and does not run the hard-delete transaction", async () => {
      mocks.prisma.taskCommentFindUnique.mockResolvedValue({
        authorUserId: "author_1",
        deletedAt: null,
        path: "/root_1",
        parentCommentId: null,
      });
      mocks.prisma.taskCommentUpdate.mockResolvedValue({ id: "root_1" });

      await deleteComment({
        commentId: "root_1",
        userId: "author_1",
      });

      expect(mocks.prisma.taskCommentUpdate).toHaveBeenCalledWith({
        where: { id: "root_1" },
        data: expect.objectContaining({
          deletedAt: expect.any(Date),
          version: { increment: 1 },
        }),
      });
      expect(mocks.prisma.transaction).not.toHaveBeenCalled();
      expect(mocks.tx.taskCommentDeleteMany).not.toHaveBeenCalled();
    });

    it("is a no-op when the comment is already soft-deleted", async () => {
      mocks.prisma.taskCommentFindUnique.mockResolvedValue({
        authorUserId: "author_1",
        deletedAt: new Date("2026-04-01T00:00:00Z"),
        path: "/root_1",
        parentCommentId: null,
      });

      await deleteComment({
        commentId: "root_1",
        userId: "author_1",
      });

      expect(mocks.prisma.taskCommentUpdate).not.toHaveBeenCalled();
      expect(mocks.prisma.transaction).not.toHaveBeenCalled();
    });

    it("rejects when a non-author tries to delete without moderator privileges", async () => {
      mocks.prisma.taskCommentFindUnique.mockResolvedValue({
        authorUserId: "author_1",
        deletedAt: null,
        path: "/root_1",
        parentCommentId: null,
      });

      await expect(
        deleteComment({
          commentId: "root_1",
          userId: "stranger_1",
        }),
      ).rejects.toThrow("Not authorized to delete this comment");

      expect(mocks.prisma.taskCommentUpdate).not.toHaveBeenCalled();
      expect(mocks.prisma.transaction).not.toHaveBeenCalled();
    });

    it("throws when the comment does not exist", async () => {
      mocks.prisma.taskCommentFindUnique.mockResolvedValue(null);

      await expect(
        deleteComment({
          commentId: "missing",
          userId: "author_1",
        }),
      ).rejects.toThrow("Comment not found");
    });
  });
});

describe("getTaskCommentFeed visibility gate", () => {
  beforeEach(() => {
    resetAllMocks();
    mocks.prisma.taskCommentFindMany.mockResolvedValue([]);
    mocks.prisma.taskCommentCount.mockResolvedValue(0);
    mocks.prisma.taskCommentVoteFindMany.mockResolvedValue([]);
  });

  it("rejects with Task not found when the viewer cannot see the task", async () => {
    mocks.assertUserCanViewTask.mockRejectedValue(new Error("Task not found"));

    await expect(
      getTaskCommentFeed({ taskId: "private_task", currentUserId: null }),
    ).rejects.toThrow("Task not found");

    expect(mocks.assertUserCanViewTask).toHaveBeenCalledWith(
      "private_task",
      null,
    );
    // Nothing leaks: no comment query runs when the gate denies.
    expect(mocks.prisma.taskCommentFindMany).not.toHaveBeenCalled();
    expect(mocks.prisma.taskCommentCount).not.toHaveBeenCalled();
  });

  it("returns the feed when the gate passes for the owner", async () => {
    const row = {
      id: "c1",
      createdAt: new Date("2026-07-01T00:00:00Z"),
      authorUser: null,
    };
    mocks.prisma.taskCommentFindMany.mockResolvedValue([row]);
    mocks.prisma.taskCommentCount.mockResolvedValue(1);
    mocks.prisma.taskCommentVoteFindMany.mockResolvedValue([]);

    const result = await getTaskCommentFeed({
      taskId: "private_task",
      currentUserId: "owner_1",
    });

    expect(mocks.assertUserCanViewTask).toHaveBeenCalledWith(
      "private_task",
      "owner_1",
    );
    expect(result.total).toBe(1);
    expect(result.comments).toHaveLength(1);
  });

  it("returns the feed for an anonymous viewer on a public task", async () => {
    const result = await getTaskCommentFeed({
      taskId: "public_task",
      currentUserId: null,
    });

    expect(mocks.assertUserCanViewTask).toHaveBeenCalledWith(
      "public_task",
      null,
    );
    expect(result.comments).toEqual([]);
    expect(result.total).toBe(0);
  });
});

describe("getTaskActivityTimeline visibility gate", () => {
  beforeEach(() => {
    resetAllMocks();
    mocks.prisma.activityFindMany.mockResolvedValue([]);
  });

  it("rejects for viewers who cannot see the task and skips the query", async () => {
    mocks.assertUserCanViewTask.mockRejectedValue(new Error("Task not found"));

    await expect(
      getTaskActivityTimeline("private_task", 50, null),
    ).rejects.toThrow("Task not found");

    expect(mocks.prisma.activityFindMany).not.toHaveBeenCalled();
  });

  it("passes the caller identity through to the gate", async () => {
    await getTaskActivityTimeline("task_1", 50, "user_1");

    expect(mocks.assertUserCanViewTask).toHaveBeenCalledWith(
      "task_1",
      "user_1",
    );
  });
});

describe("voteComment visibility gate", () => {
  beforeEach(() => {
    resetAllMocks();
  });

  it("rejects when the comment's task is not visible to the voter", async () => {
    mocks.prisma.taskCommentFindUnique.mockResolvedValue({
      taskId: "private_task",
    });
    mocks.assertUserCanViewTask.mockRejectedValue(new Error("Task not found"));

    await expect(
      voteComment({ commentId: "c1", userId: "stranger_1", value: 1 }),
    ).rejects.toThrow("Task not found");

    expect(mocks.prisma.transaction).not.toHaveBeenCalled();
  });

  it("rejects when the comment does not exist", async () => {
    mocks.prisma.taskCommentFindUnique.mockResolvedValue(null);

    await expect(
      voteComment({ commentId: "missing", userId: "user_1", value: 1 }),
    ).rejects.toThrow("Comment not found");

    expect(mocks.assertUserCanViewTask).not.toHaveBeenCalled();
    expect(mocks.prisma.transaction).not.toHaveBeenCalled();
  });
});

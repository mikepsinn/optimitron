import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  prisma: {
    taskCommentFindUnique: vi.fn(),
    taskCommentUpdate: vi.fn(),
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
    taskComment: {
      findUnique: mocks.prisma.taskCommentFindUnique,
      update: mocks.prisma.taskCommentUpdate,
    },
  },
}));

import { deleteComment } from "../tasks/task-comments.server";

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

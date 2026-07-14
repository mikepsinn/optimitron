import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  assertUserCanViewTask: vi.fn(),
  canUserViewInternalTaskContent: vi.fn(),
  deletePrivateObject: vi.fn(),
  headPrivateObject: vi.fn(),
  readPrivateObjectPrefix: vi.fn(),
  presignPrivateDownload: vi.fn(),
  presignPrivateUpload: vi.fn(),
  prisma: {
    create: vi.fn(),
    count: vi.fn(),
    deleteMany: vi.fn(),
    aggregate: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    transaction: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
}));

vi.mock("@/lib/object-storage.server", () => ({
  deletePrivateObject: mocks.deletePrivateObject,
  headPrivateObject: mocks.headPrivateObject,
  readPrivateObjectPrefix: mocks.readPrivateObjectPrefix,
  presignPrivateDownload: mocks.presignPrivateDownload,
  presignPrivateUpload: mocks.presignPrivateUpload,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: mocks.prisma.transaction,
    taskCommentAttachment: {
      aggregate: mocks.prisma.aggregate,
      count: mocks.prisma.count,
      create: mocks.prisma.create,
      deleteMany: mocks.prisma.deleteMany,
      findFirst: mocks.prisma.findFirst,
      findMany: mocks.prisma.findMany,
      update: mocks.prisma.update,
      updateMany: mocks.prisma.updateMany,
    },
  },
}));

vi.mock("@/lib/tasks/task-visibility.server", () => ({
  TASK_NOT_FOUND_MESSAGE: "Task not found",
  assertUserCanViewTask: mocks.assertUserCanViewTask,
  canUserViewInternalTaskContent: mocks.canUserViewInternalTaskContent,
}));

import {
  cleanupExpiredTaskCommentAttachments,
  createPendingTaskCommentAttachment,
  getTaskCommentAttachmentDownload,
  TaskCommentAttachmentInputError,
  verifyPendingTaskCommentAttachments,
} from "../tasks/task-comment-attachments.server";

beforeEach(() => {
  for (const mock of [
    mocks.assertUserCanViewTask,
    mocks.canUserViewInternalTaskContent,
    mocks.deletePrivateObject,
    mocks.headPrivateObject,
    mocks.readPrivateObjectPrefix,
    mocks.presignPrivateDownload,
    mocks.presignPrivateUpload,
    ...Object.values(mocks.prisma),
  ]) {
    mock.mockReset();
  }
  mocks.assertUserCanViewTask.mockResolvedValue(undefined);
  mocks.canUserViewInternalTaskContent.mockResolvedValue(false);
  mocks.prisma.aggregate.mockResolvedValue({ _sum: { sizeBytes: 0 } });
  mocks.prisma.count.mockResolvedValue(0);
  mocks.prisma.transaction.mockImplementation((callback) =>
    callback({
      taskCommentAttachment: {
        aggregate: mocks.prisma.aggregate,
        count: mocks.prisma.count,
        create: mocks.prisma.create,
      },
    }),
  );
  mocks.readPrivateObjectPrefix.mockResolvedValue(
    Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  );
});

describe("createPendingTaskCommentAttachment", () => {
  it("authorizes the task and returns no permanent object URL or storage key", async () => {
    mocks.presignPrivateUpload.mockResolvedValue({
      expiresInSeconds: 300,
      uploadUrl: "https://private-upload.example/signed",
    });
    mocks.prisma.create.mockResolvedValue({ id: "unused" });

    const result = await createPendingTaskCommentAttachment({
      checksumSha256: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
      contentType: "image/png",
      fileName: "private screenshot.png",
      sizeBytes: 1234,
      taskId: "task_1",
      userId: "user_1",
    });

    expect(mocks.assertUserCanViewTask).toHaveBeenCalledWith(
      "task_1",
      "user_1",
    );
    expect(result).not.toHaveProperty("publicUrl");
    expect(result).not.toHaveProperty("storageKey");
    const storageKey = mocks.prisma.create.mock.calls[0]?.[0]?.data.storageKey;
    expect(storageKey).toMatch(/^task-comment-attachments\/[a-f0-9-]+$/u);
    expect(storageKey).not.toContain("private screenshot");
  });

  it("rejects unsupported active content before creating a row", async () => {
    await expect(
      createPendingTaskCommentAttachment({
        checksumSha256: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
        contentType: "image/svg+xml",
        fileName: "payload.svg",
        sizeBytes: 100,
        taskId: "task_1",
        userId: "user_1",
      }),
    ).rejects.toBeInstanceOf(TaskCommentAttachmentInputError);

    expect(mocks.presignPrivateUpload).not.toHaveBeenCalled();
    expect(mocks.prisma.create).not.toHaveBeenCalled();
  });

  it("caps unfinished uploads before signing another object", async () => {
    mocks.prisma.count.mockResolvedValue(10);

    await expect(
      createPendingTaskCommentAttachment({
        checksumSha256: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
        contentType: "image/png",
        fileName: "screenshot.png",
        sizeBytes: 100,
        taskId: "task_1",
        userId: "user_1",
      }),
    ).rejects.toMatchObject({ status: 429 });

    expect(mocks.prisma.create).not.toHaveBeenCalled();
    expect(mocks.presignPrivateUpload).not.toHaveBeenCalled();
  });
});

describe("verifyPendingTaskCommentAttachments", () => {
  const pending = {
    commentId: null,
    contentType: "image/png",
    deletedAt: null,
    expiresAt: new Date(Date.now() + 60_000),
    id: "attachment_1",
    sizeBytes: 1234,
    storageKey: "task-comment-attachments/attachment_1",
    taskId: "task_1",
    uploadedByUserId: "user_1",
  };

  it("rejects an attachment owned by another user without touching storage", async () => {
    mocks.prisma.findMany.mockResolvedValue([
      { ...pending, uploadedByUserId: "other_user" },
    ]);

    await expect(
      verifyPendingTaskCommentAttachments({
        attachmentIds: ["attachment_1"],
        taskId: "task_1",
        userId: "user_1",
      }),
    ).rejects.toThrow("unavailable");

    expect(mocks.headPrivateObject).not.toHaveBeenCalled();
  });

  it("requires the stored size and media type to match the signed upload", async () => {
    mocks.prisma.findMany.mockResolvedValue([pending]);
    mocks.headPrivateObject.mockResolvedValue({
      contentLength: 999,
      contentType: "image/png",
    });

    await expect(
      verifyPendingTaskCommentAttachments({
        attachmentIds: ["attachment_1"],
        taskId: "task_1",
        userId: "user_1",
      }),
    ).rejects.toThrow("did not finish uploading");
  });

  it("returns deterministic IDs only after storage verification", async () => {
    mocks.prisma.findMany.mockResolvedValue([pending]);
    mocks.headPrivateObject.mockResolvedValue({
      contentLength: 1234,
      contentType: "image/png",
    });

    await expect(
      verifyPendingTaskCommentAttachments({
        attachmentIds: ["attachment_1", "attachment_1"],
        taskId: "task_1",
        userId: "user_1",
      }),
    ).resolves.toEqual(["attachment_1"]);
  });

  it("rejects bytes that do not match the declared file type", async () => {
    mocks.prisma.findMany.mockResolvedValue([pending]);
    mocks.headPrivateObject.mockResolvedValue({
      contentLength: 1234,
      contentType: "image/png",
    });
    mocks.readPrivateObjectPrefix.mockResolvedValue(
      new TextEncoder().encode("not a png"),
    );

    await expect(
      verifyPendingTaskCommentAttachments({
        attachmentIds: ["attachment_1"],
        taskId: "task_1",
        userId: "user_1",
      }),
    ).rejects.toThrow("did not finish uploading");
  });
});

describe("getTaskCommentAttachmentDownload", () => {
  const publicAttachment = {
    comment: {
      deletedAt: null,
      hiddenByCurator: false,
      taskId: "task_1",
      visibility: "PUBLIC",
    },
    contentType: "application/pdf",
    fileName: "results.pdf",
    storageKey: "task-comment-attachments/attachment_1",
    taskId: "task_1",
  };

  it("does not mint a signed URL when task access is denied", async () => {
    mocks.prisma.findFirst.mockResolvedValue(publicAttachment);
    mocks.assertUserCanViewTask.mockRejectedValue(new Error("Task not found"));

    await expect(
      getTaskCommentAttachmentDownload({
        attachmentId: "attachment_1",
        userId: "stranger_1",
      }),
    ).rejects.toThrow("Task not found");

    expect(mocks.presignPrivateDownload).not.toHaveBeenCalled();
  });

  it("does not expose an internal comment file to a public-task viewer", async () => {
    mocks.prisma.findFirst.mockResolvedValue({
      ...publicAttachment,
      comment: { ...publicAttachment.comment, visibility: "INTERNAL" },
    });

    await expect(
      getTaskCommentAttachmentDownload({
        attachmentId: "attachment_1",
        userId: "stranger_1",
      }),
    ).rejects.toThrow("Task not found");

    expect(mocks.canUserViewInternalTaskContent).toHaveBeenCalledWith(
      "task_1",
      "stranger_1",
    );
    expect(mocks.presignPrivateDownload).not.toHaveBeenCalled();
  });

  it("returns a one-minute signed download only after authorization", async () => {
    mocks.prisma.findFirst.mockResolvedValue(publicAttachment);
    mocks.presignPrivateDownload.mockResolvedValue({
      downloadUrl: "https://private-download.example/signed",
      expiresInSeconds: 60,
    });

    await expect(
      getTaskCommentAttachmentDownload({
        attachmentId: "attachment_1",
        userId: "owner_1",
      }),
    ).resolves.toEqual({
      downloadUrl: "https://private-download.example/signed",
      expiresInSeconds: 60,
    });
    expect(mocks.presignPrivateDownload).toHaveBeenCalledWith(
      expect.objectContaining({
        contentDisposition: expect.stringMatching(/^attachment;/u),
        key: "task-comment-attachments/attachment_1",
      }),
    );
  });
});

describe("cleanupExpiredTaskCommentAttachments", () => {
  it("revokes abandoned files before deleting their objects and rows", async () => {
    mocks.prisma.findMany.mockResolvedValue([
      {
        id: "attachment_1",
        storageKey: "task-comment-attachments/attachment_1",
      },
    ]);
    mocks.prisma.updateMany.mockResolvedValue({ count: 1 });
    mocks.prisma.deleteMany.mockResolvedValue({ count: 1 });

    await expect(cleanupExpiredTaskCommentAttachments()).resolves.toEqual({
      deleted: 1,
      failed: 0,
    });
    expect(mocks.deletePrivateObject).toHaveBeenCalledWith(
      "task-comment-attachments/attachment_1",
    );
    expect(mocks.prisma.updateMany).toHaveBeenCalledWith({
      where: { deletedAt: null, id: "attachment_1" },
      data: { deletedAt: expect.any(Date) },
    });
    expect(mocks.prisma.deleteMany).toHaveBeenCalledWith({
      where: { id: "attachment_1" },
    });
  });
});

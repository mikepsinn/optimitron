import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  claimEmailLog: vi.fn(),
  emailLogUpdate: vi.fn(),
  findMany: vi.fn(),
  findFirst: vi.fn(),
  findUnique: vi.fn(),
  getConfiguredTaskReplyAddress: vi.fn(),
  markEmailLogStatus: vi.fn(),
  sendExternalResendEmail: vi.fn(),
  sendResendEmail: vi.fn(),
  taskCommentCreate: vi.fn(),
  taskCommunicationUpdate: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    taskCommunication: {
      findFirst: mocks.findFirst,
      findMany: mocks.findMany,
      findUnique: mocks.findUnique,
      update: mocks.taskCommunicationUpdate,
    },
    $transaction: mocks.transaction,
    emailLog: {
      update: mocks.emailLogUpdate,
    },
    taskComment: {
      create: mocks.taskCommentCreate,
    },
  },
}));

vi.mock("@/lib/email/email-log.server", () => ({
  claimEmailLog: mocks.claimEmailLog,
  markEmailLogStatus: mocks.markEmailLogStatus,
}));

vi.mock("@/lib/email/resend", () => ({
  sendResendEmail: mocks.sendResendEmail,
  sendExternalResendEmail: mocks.sendExternalResendEmail,
}));

vi.mock("@/lib/email/task-notification", () => ({
  getConfiguredTaskReplyAddress: mocks.getConfiguredTaskReplyAddress,
}));

import {
  buildTaskCommunicationMessageId,
  sendDraftTaskNotification,
  unsubscribeTaskCommunicationByReply,
} from "@/lib/tasks/task-notifications.server";

describe("task notifications", () => {
  beforeEach(() => {
    vi.resetAllMocks();

    mocks.sendResendEmail.mockResolvedValue({
      id: "user-email-id",
      status: "sent",
      unsubscribeUrl: null,
    });
    mocks.sendExternalResendEmail.mockResolvedValue({
      id: "external-id",
      status: "sent",
      unsubscribeUrl: null,
    });
    mocks.getConfiguredTaskReplyAddress.mockReturnValue(
      "reply+task_1@reply.test",
    );
    mocks.taskCommunicationUpdate.mockImplementation((payload) => ({
      ...payload?.where,
      ...payload?.data,
      id: "comm_1",
      status: "SENT",
      recipientEmail: "recipient@example.com",
      taskId: "task_1",
      task: { id: "task_1", title: "Sample task" },
      channel: "EMAIL",
      senderUserId: null,
      taskCommentId: "comment_1",
      providerMessageId: "external-id",
    }));
    mocks.transaction.mockImplementation(async (callback) =>
      callback({
        taskComment: { create: mocks.taskCommentCreate },
        emailLog: { update: mocks.emailLogUpdate },
        taskCommunication: {
          update: mocks.taskCommunicationUpdate,
        },
      } as never),
    );
  });

  function baseDraftRecord() {
    return {
      id: "comm_1",
      taskId: "task_1",
      audience: "RECIPIENT",
      purpose: "ASSIGNMENT",
      channel: "EMAIL",
      status: "DRAFT",
      recipientEmail: "recipient@example.com",
      metadataJson: {
        subject: "Please complete your task",
        text: "Do this thing in 10 minutes.",
      },
      recipientUserId: null,
    };
  }

  it("builds stable message IDs for task communication emails", () => {
    expect(
      buildTaskCommunicationMessageId({
        communicationId: "comm_1",
        taskId: "task_1",
      }),
    ).toBe("<task-task_1-comm-comm_1@updates.warondisease.org>");
  });

  it("sends draft notification and commits communication as sent", async () => {
    mocks.findUnique.mockResolvedValue({
      ...baseDraftRecord(),
      task: { id: "task_1", title: "Sample task" },
    });
    mocks.findMany.mockResolvedValue([]);
    mocks.claimEmailLog.mockResolvedValue({
      duplicate: false,
      emailLogId: "log_1",
    });
    mocks.taskCommentCreate.mockResolvedValue({ id: "comment_1" });
    mocks.emailLogUpdate.mockResolvedValue({ id: "log_1" });

    const result = await sendDraftTaskNotification({
      communicationId: "comm_1",
      senderUserId: "user_1",
    });

    expect(mocks.sendExternalResendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: undefined,
        html: '<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#111827;"><p>Do this thing in 10 minutes.</p></div>',
        subject: "Please complete your task",
        text: "Do this thing in 10 minutes.",
        to: "recipient@example.com",
        headers: {
          "Message-ID": "<task-task_1-comm-comm_1@updates.warondisease.org>",
        },
        replyTo: "reply+task_1@reply.test",
        unsubscribeUrl: null,
      }),
    );
    expect(result).toEqual({
      communication: expect.objectContaining({
        id: "comm_1",
        status: "SENT",
      }),
      emailLogId: "log_1",
      providerMessageId: "external-id",
      status: "sent",
    });
  });

  it("threads follow-up emails after the previous task communication", async () => {
    mocks.findUnique.mockResolvedValue({
      ...baseDraftRecord(),
      task: { id: "task_1", title: "Sample task" },
    });
    mocks.findMany.mockResolvedValue([]);
    mocks.findFirst.mockResolvedValue({
      metadataJson: {
        messageId: "<task-task_1-comm-prior@updates.warondisease.org>",
      },
    });
    mocks.claimEmailLog.mockResolvedValue({
      duplicate: false,
      emailLogId: "log_1",
    });
    mocks.taskCommentCreate.mockResolvedValue({ id: "comment_1" });
    mocks.emailLogUpdate.mockResolvedValue({ id: "log_1" });

    await sendDraftTaskNotification({
      communicationId: "comm_1",
      senderUserId: "user_1",
    });

    expect(mocks.sendExternalResendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: {
          "Message-ID": "<task-task_1-comm-comm_1@updates.warondisease.org>",
          "In-Reply-To": "<task-task_1-comm-prior@updates.warondisease.org>",
          References: "<task-task_1-comm-prior@updates.warondisease.org>",
        },
      }),
    );
    expect(mocks.taskCommunicationUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          metadataJson: expect.objectContaining({
            inReplyTo: "<task-task_1-comm-prior@updates.warondisease.org>",
            messageId: "<task-task_1-comm-comm_1@updates.warondisease.org>",
            references: ["<task-task_1-comm-prior@updates.warondisease.org>"],
          }),
        }),
      }),
    );
  });

  it("returns suppressed when external opt-out exists", async () => {
    mocks.findUnique.mockResolvedValue({
      ...baseDraftRecord(),
      task: { id: "task_1", title: "Sample task" },
    });
    mocks.findMany.mockResolvedValue([
      {
        id: "prior_1",
        metadataJson: { optOut: true },
        errorMessage:
          "Recipient previously unsubscribed from this task communication purpose.",
      },
    ]);

    const result = await sendDraftTaskNotification({
      communicationId: "comm_1",
      senderUserId: "user_1",
    });

    expect(result).toEqual({
      status: "suppressed",
      reason: "external_opt_out",
    });
    expect(mocks.sendExternalResendEmail).not.toHaveBeenCalled();
  });

  it("returns duplicate when email log claim collides", async () => {
    mocks.findUnique.mockResolvedValue({
      ...baseDraftRecord(),
      task: { id: "task_1", title: "Sample task" },
    });
    mocks.findMany.mockResolvedValue([]);
    mocks.claimEmailLog.mockResolvedValue({
      duplicate: true,
      emailLogId: null,
    });

    const result = await sendDraftTaskNotification({
      communicationId: "comm_1",
      senderUserId: "user_1",
    });

    expect(result).toEqual({
      status: "duplicate",
    });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("returns missing message when no stored subject/text", async () => {
    mocks.findUnique.mockResolvedValue({
      ...baseDraftRecord(),
      metadataJson: {},
      task: { id: "task_1", title: "Sample task" },
    });

    const result = await sendDraftTaskNotification({
      communicationId: "comm_1",
      senderUserId: "user_1",
    });

    expect(result).toEqual({
      status: "missing_message",
      communication: expect.any(Object),
    });
  });

  it("returns missing recipient email when email is absent", async () => {
    mocks.findUnique.mockResolvedValue({
      ...baseDraftRecord(),
      recipientEmail: null,
      task: { id: "task_1", title: "Sample task" },
    });

    const result = await sendDraftTaskNotification({
      communicationId: "comm_1",
      senderUserId: "user_1",
    });

    expect(result).toEqual({
      status: "missing_recipient_email",
      communication: expect.any(Object),
    });
  });

  it("passes bcc recipients to external resend send", async () => {
    mocks.findUnique.mockResolvedValue({
      ...baseDraftRecord(),
      metadataJson: {
        subject: "Please complete your task",
        text: "Do this thing in 10 minutes.",
        bccEmails: ["admin1@example.com", "admin2@example.com"],
      },
      task: { id: "task_1", title: "Sample task" },
    });
    mocks.findMany.mockResolvedValue([]);
    mocks.claimEmailLog.mockResolvedValue({
      duplicate: false,
      emailLogId: "log_1",
    });
    mocks.taskCommentCreate.mockResolvedValue({ id: "comment_1" });
    mocks.emailLogUpdate.mockResolvedValue({ id: "log_1" });

    const result = await sendDraftTaskNotification({
      communicationId: "comm_1",
      senderUserId: "user_1",
    });

    expect(mocks.sendExternalResendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        bcc: ["admin1@example.com", "admin2@example.com"],
        replyTo: "reply+task_1@reply.test",
        to: "recipient@example.com",
      }),
    );
    expect(result).toEqual({
      communication: expect.objectContaining({
        id: "comm_1",
        status: "SENT",
      }),
      emailLogId: "log_1",
      providerMessageId: "external-id",
      status: "sent",
    });
  });

  it("passes the stored skip-signature flag to the resend send", async () => {
    mocks.findUnique.mockResolvedValue({
      ...baseDraftRecord(),
      metadataJson: {
        subject: "Please complete your task",
        text: "Do this thing in 10 minutes.",
        skipWishoniaSignature: true,
      },
      task: { id: "task_1", title: "Sample task" },
    });
    mocks.findMany.mockResolvedValue([]);
    mocks.claimEmailLog.mockResolvedValue({
      duplicate: false,
      emailLogId: "log_1",
    });
    mocks.taskCommentCreate.mockResolvedValue({ id: "comment_1" });
    mocks.emailLogUpdate.mockResolvedValue({ id: "log_1" });

    await sendDraftTaskNotification({
      communicationId: "comm_1",
      senderUserId: "user_1",
    });

    expect(mocks.sendExternalResendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        skipWishoniaSignature: true,
      }),
    );
  });

  it("passes reply-to routing to user-scoped task emails when configured", async () => {
    mocks.findUnique.mockResolvedValue({
      ...baseDraftRecord(),
      recipientUserId: "user_1",
      task: { id: "task_1", title: "Sample task" },
    });
    mocks.findMany.mockResolvedValue([]);
    mocks.claimEmailLog.mockResolvedValue({
      duplicate: false,
      emailLogId: "log_1",
    });
    mocks.taskCommentCreate.mockResolvedValue({ id: "comment_1" });
    mocks.emailLogUpdate.mockResolvedValue({ id: "log_1" });

    const result = await sendDraftTaskNotification({
      communicationId: "comm_1",
    });

    expect(mocks.sendResendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        replyTo: "reply+task_1@reply.test",
        to: "recipient@example.com",
        userId: "user_1",
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        status: "sent",
      }),
    );
  });

  it("omits reply-to routing when inbound replies are not configured", async () => {
    mocks.getConfiguredTaskReplyAddress.mockReturnValue(null);
    mocks.findUnique.mockResolvedValue({
      ...baseDraftRecord(),
      task: { id: "task_1", title: "Sample task" },
    });
    mocks.findMany.mockResolvedValue([]);
    mocks.claimEmailLog.mockResolvedValue({
      duplicate: false,
      emailLogId: "log_1",
    });
    mocks.taskCommentCreate.mockResolvedValue({ id: "comment_1" });
    mocks.emailLogUpdate.mockResolvedValue({ id: "log_1" });

    await sendDraftTaskNotification({
      communicationId: "comm_1",
    });

    expect(mocks.sendExternalResendEmail).toHaveBeenCalledWith(
      expect.not.objectContaining({
        replyTo: expect.any(String),
      }),
    );
  });

  it("marks the latest matching external communication opted out when a recipient replies unsubscribe", async () => {
    mocks.findFirst.mockResolvedValue({
      id: "comm_unsub",
      metadataJson: { unsubscribeUrl: "https://warondisease.org/unsub" },
    });

    const result = await unsubscribeTaskCommunicationByReply({
      recipientEmail: "Recipient@Example.com",
      taskId: "task_1",
    });

    expect(result).toEqual({
      status: "unsubscribed",
      taskCommunicationId: "comm_unsub",
    });
    expect(mocks.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          recipientEmail: "recipient@example.com",
          taskId: "task_1",
          unsubscribeToken: { not: null },
        }),
      }),
    );
    expect(mocks.taskCommunicationUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "comm_unsub" },
        data: expect.objectContaining({
          errorMessage: "Recipient unsubscribed by email reply.",
          metadataJson: expect.objectContaining({
            optOut: true,
            optOutVia: "reply",
          }),
          status: "CANCELLED",
        }),
      }),
    );
  });
});

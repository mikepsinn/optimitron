import {
  EmailLogStatus,
  TaskCommentKind,
  TaskCommentSource,
  TaskCommunicationStatus,
} from "@optimitron/db/enums";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  notifyTaskCommentRecipients: vi.fn(),
  sendExternalResendEmail: vi.fn(),
  sendResendEmail: vi.fn(),
}));

interface StoredCommunication {
  id: string;
  deletedAt: Date | null;
  emailLogId: string | null;
  errorMessage: string | null;
  metadataJson: Record<string, unknown> | null;
  providerMessageId: string | null;
  recipientEmail: string | null;
  recipientUserId: string | null;
  senderUserId: string | null;
  status: string;
  taskCommentId: string | null;
  taskId: string;
  [key: string]: unknown;
}

interface StoredComment {
  id: string;
  kind: string;
  message: string;
  source: string;
  taskId: string;
  [key: string]: unknown;
}

const db = vi.hoisted(() => {
  const communications: StoredCommunication[] = [];
  const comments: StoredComment[] = [];
  const emailLogs: Record<string, unknown>[] = [];
  const task = {
    id: "task_mcp_assignment",
    title: "Ask Test Foundation to review the treaty",
    description: "Confirm whether Test Foundation can help recruit jurors.",
    deletedAt: null,
    // Public + active so the private/draft outbound guard permits emailing
    // the external foundation contact in this round-trip test.
    isPublic: true,
    status: "ACTIVE",
    createdByUserId: "user_creator",
    createdByUser: { id: "user_creator", email: "creator@example.org" },
    assigneeOrganization: {
      id: "org_test_foundation",
      contactEmail: "foundation@example.org",
      members: [],
      name: "Test Foundation",
    },
    assigneePerson: null,
    communicationEndpoints: [],
  };
  const prismaMock = {
    emailLog: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        emailLogs.push(data);
        return data;
      }),
      update: vi.fn(
        async ({
          data,
          where,
        }: {
          data: Record<string, unknown>;
          where: { id: string };
        }) => {
          const row = emailLogs.find((item) => item.id === where.id);
          if (row) Object.assign(row, data);
          return row ?? { id: where.id, ...data };
        },
      ),
    },
    task: {
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) =>
        where.id === task.id ? task : null,
      ),
    },
    taskComment: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const row = {
          id: `comment_${comments.length + 1}`,
          ...data,
        } as StoredComment;
        comments.push(row);
        return row;
      }),
    },
    taskCommunication: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const row = {
          id: `communication_${communications.length + 1}`,
          deletedAt: null,
          emailLogId: null,
          errorMessage: null,
          providerMessageId: null,
          taskCommentId: null,
          ...data,
        } as StoredCommunication;
        communications.push(row);
        return row;
      }),
      findFirst: vi.fn(async ({ where }: { where: Record<string, unknown> }) => {
        if (typeof where.providerMessageId === "string") {
          return (
            communications.find(
              (item) =>
                item.providerMessageId === where.providerMessageId &&
                !item.deletedAt,
            ) ?? null
          );
        }
        return null;
      }),
      findMany: vi.fn(async () => []),
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
        const row = communications.find((item) => item.id === where.id);
        return row ? { ...row, task: { id: task.id, title: task.title } } : null;
      }),
      update: vi.fn(
        async ({
          data,
          where,
        }: {
          data: Record<string, unknown>;
          where: { id: string };
        }) => {
          const row = communications.find((item) => item.id === where.id);
          if (!row) throw new Error(`Missing communication ${where.id}`);
          Object.assign(row, data);
          return row;
        },
      ),
    },
    user: {
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) =>
        where.id === "user_creator"
          ? {
              id: "user_creator",
              email: "creator@example.org",
              person: {
                id: "person_creator",
                displayName: "Mike",
                handle: "mike",
                image: null,
              },
            }
          : null,
      ),
    },
  };

  return { comments, communications, emailLogs, prismaMock, task };
});

vi.mock("@/lib/env", () => ({
  clientEnv: {},
  serverEnv: {
    DATABASE_URL: "postgres://test/test",
    NEXTAUTH_SECRET: "test-secret",
    NODE_ENV: "test",
    REPLY_EMAIL_DOMAIN: "updates.warondisease.org",
    RESEND_API_KEY: "resend_test_key",
    RESEND_WEBHOOK_SECRET: "webhook_secret",
  },
}));

vi.mock("@/lib/email/resend", () => ({
  sendExternalResendEmail: mocks.sendExternalResendEmail,
  sendResendEmail: mocks.sendResendEmail,
}));

vi.mock("@/lib/tasks/task-comment-notifications.server", () => ({
  notifyTaskCommentRecipients: mocks.notifyTaskCommentRecipients,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: async (
      callback: (tx: Record<string, unknown>) => Promise<unknown>,
    ) =>
      callback({
        emailLog: {
          update: db.prismaMock.emailLog.update,
        },
        taskComment: {
          create: db.prismaMock.taskComment.create,
        },
        taskCommunication: {
          create: db.prismaMock.taskCommunication.create,
          update: db.prismaMock.taskCommunication.update,
        },
      }),
    emailLog: {
      create: db.prismaMock.emailLog.create,
      update: db.prismaMock.emailLog.update,
    },
    task: {
      findUnique: db.prismaMock.task.findUnique,
    },
    taskComment: {
      create: db.prismaMock.taskComment.create,
    },
    taskCommunication: {
      create: db.prismaMock.taskCommunication.create,
      findFirst: db.prismaMock.taskCommunication.findFirst,
      findMany: db.prismaMock.taskCommunication.findMany,
      findUnique: db.prismaMock.taskCommunication.findUnique,
      update: db.prismaMock.taskCommunication.update,
    },
    user: {
      findUnique: db.prismaMock.user.findUnique,
    },
  },
}));

import { processInboundReply } from "@/lib/email/inbound-reply";
import { notifyTaskAssigneeOfAssignment } from "@/lib/tasks/task-assignment-notifications.server";

describe("MCP task assignment email round trip", () => {
  beforeEach(() => {
    db.communications.length = 0;
    db.comments.length = 0;
    db.emailLogs.length = 0;
    for (const fn of Object.values(mocks)) fn.mockReset();
    for (const group of Object.values(db.prismaMock)) {
      for (const fn of Object.values(group)) fn.mockClear();
    }
    mocks.sendExternalResendEmail.mockResolvedValue({
      id: "email_assignment_1",
      status: "sent",
      unsubscribeUrl: null,
    });
    mocks.sendResendEmail.mockResolvedValue({
      id: "email_user_1",
      status: "sent",
      unsubscribeUrl: null,
    });
    mocks.notifyTaskCommentRecipients.mockResolvedValue({ sentCount: 1 });
  });

  it("sends an assignee email with Reply-To, then stores an authorized reply as a task comment", async () => {
    const sendResult = await notifyTaskAssigneeOfAssignment({
      senderUserId: "user_creator",
      taskId: db.task.id,
    });

    expect(sendResult.status).toBe("sent");
    expect(mocks.sendExternalResendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "Mike via International Campaign to End War and Disease <hello@updates.warondisease.org>",
        replyTo: "reply+task_mcp_assignment@updates.warondisease.org",
        to: "foundation@example.org",
      }),
    );
    expect(db.emailLogs[0]).toMatchObject({
      status: EmailLogStatus.SENT,
      toAddress: "foundation@example.org",
    });
    expect(db.communications[0]).toMatchObject({
      providerMessageId: "email_assignment_1",
      status: TaskCommunicationStatus.SENT,
    });

    const inboundResult = await processInboundReply({
      from: "Test Foundation <foundation@example.org>",
      to: "reply+task_mcp_assignment@updates.warondisease.org",
      subject: "Re: Ask Test Foundation to review the treaty",
      text: "Completed.\n\nOn Sun, May 10, 2026 at 1:00 PM, Mike wrote:\nQuoted text",
      html: null,
      providerMessageId: "received_reply_1",
      inReplyTo: "<email_assignment_1@example.org>",
    });

    expect(inboundResult.status).toBe("created");
    expect(db.comments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: TaskCommentKind.INBOUND_MESSAGE,
          message: "Completed.",
          source: TaskCommentSource.EMAIL_REPLY,
          taskId: db.task.id,
        }),
      ]),
    );
    expect(db.communications.at(-1)).toMatchObject({
      direction: "INBOUND",
      providerMessageId: "received_reply_1",
      recipientEmail: "reply+task_mcp_assignment@updates.warondisease.org",
      status: "RECEIVED",
    });
    expect(mocks.notifyTaskCommentRecipients).toHaveBeenCalledWith(
      expect.objectContaining({
        authorOrganizationId: "org_test_foundation",
        message: "Completed.",
        taskId: db.task.id,
      }),
    );
  });
});

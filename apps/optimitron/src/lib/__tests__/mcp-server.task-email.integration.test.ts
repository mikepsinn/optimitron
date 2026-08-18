import { TaskCommunicationStatus } from "@optimitron/db/enums";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  proposeOutboundMessage: vi.fn(),
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

const db = vi.hoisted(() => {
  const communications: StoredCommunication[] = [];
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
    task: {
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) =>
        where.id === task.id ? task : null,
      ),
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

  return { communications, prismaMock, task };
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

vi.mock("@/lib/email/outbound-message-approval.server", () => ({
  proposeOutboundMessage: mocks.proposeOutboundMessage,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    task: {
      findUnique: db.prismaMock.task.findUnique,
    },
    taskCommunication: {
      create: db.prismaMock.taskCommunication.create,
      update: db.prismaMock.taskCommunication.update,
    },
    user: {
      findUnique: db.prismaMock.user.findUnique,
    },
  },
}));

import { notifyTaskAssigneeOfAssignment } from "@/lib/tasks/task-assignment-notifications.server";

describe("MCP task assignment email", () => {
  beforeEach(() => {
    db.communications.length = 0;
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
    mocks.proposeOutboundMessage.mockImplementation(
      async (input: { communicationId: string }) => ({
        id: `ear_${input.communicationId}`,
      }),
    );
  });

  it("persists a draft and queues approval without touching the provider", async () => {
    const proposal = await notifyTaskAssigneeOfAssignment({
      senderUserId: "user_creator",
      taskId: db.task.id,
    });

    // Assignment drafts and queues; nothing has reached the foundation yet.
    expect(proposal.status).toBe("pending_approval");
    expect(mocks.sendExternalResendEmail).not.toHaveBeenCalled();
    expect(db.communications[0]?.status).toBe(TaskCommunicationStatus.DRAFT);
  });
});

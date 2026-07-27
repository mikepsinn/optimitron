import {
  EmailLogStatus,
  TaskCommunicationStatus,
} from "@optimitron/db/enums";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  emailLogCreate: vi.fn(),
  emailLogFindUnique: vi.fn(),
  emailLogUpdateMany: vi.fn(),
  queryRaw: vi.fn(),
  taskCommunicationCount: vi.fn(),
  taskCommunicationFindFirst: vi.fn(),
  taskCommunicationUpdateMany: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: mocks.transaction,
    emailLog: { updateMany: mocks.emailLogUpdateMany },
    taskCommunication: { count: mocks.taskCommunicationCount },
  },
}));

import {
  RECIPIENT_DAILY_WINDOW_MS,
  recipientWithinRateLimits,
  reserveRecipientRateLimitSlot,
} from "./task-recipient-rate-limit.server";

interface FakeCommunication {
  deletedAt: null;
  emailLogId: string | null;
  id: string;
  metadataJson: { dedupeKey: string };
  purpose: "INVITATION";
  recipientEmail: string;
  sentAt: Date | null;
  status: TaskCommunicationStatus;
  step: number;
  taskId: string;
  templateId: null;
}

interface FakeEmailLog {
  dedupeKey: string | null;
  id: string;
  sentAt: Date;
  status: EmailLogStatus;
  templateId: string | null;
  toAddress: string;
  userId: string | null;
}

const NOW = new Date("2026-07-27T12:00:00.000Z");
let communications: FakeCommunication[];
let emailLogs: Map<string, FakeEmailLog>;
let advisoryLockTail: Promise<void>;

function draft(id: string, email = "reviewer@example.org"): FakeCommunication {
  return {
    deletedAt: null,
    emailLogId: null,
    id,
    metadataJson: { dedupeKey: `review:${id}` },
    purpose: "INVITATION",
    recipientEmail: email,
    sentAt: null,
    status: TaskCommunicationStatus.DRAFT,
    step: 0,
    taskId: `task_${id}`,
    templateId: null,
  };
}

function reservationInput(communication: FakeCommunication) {
  return {
    communicationId: communication.id,
    emailLogId: `approved-task-email:${communication.id}`,
    now: NOW,
    recipientEmail: communication.recipientEmail,
    recipientUserId: null,
    subject: "Please review",
    taskId: communication.taskId,
  };
}

describe("task recipient rate limits", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    communications = [];
    emailLogs = new Map();
    advisoryLockTail = Promise.resolve();

    mocks.taskCommunicationFindFirst.mockImplementation(
      ({ where }: { where: { id: string; taskId: string } }) =>
        Promise.resolve(
          communications.find(
            (communication) =>
              communication.id === where.id &&
              communication.taskId === where.taskId,
          ) ?? null,
        ),
    );
    mocks.emailLogFindUnique.mockImplementation(
      ({ where }: { where: { id: string } }) =>
        Promise.resolve(emailLogs.get(where.id) ?? null),
    );
    mocks.emailLogCreate.mockImplementation(
      ({ data }: { data: FakeEmailLog }) => {
        const userTemplateCollision = [...emailLogs.values()].some(
          (emailLog) =>
            data.userId !== null &&
            emailLog.userId === data.userId &&
            emailLog.templateId === data.templateId,
        );
        if (userTemplateCollision) {
          throw new Error("EmailLog user/template uniqueness collision");
        }
        emailLogs.set(data.id, {
          dedupeKey: data.dedupeKey,
          id: data.id,
          sentAt: data.sentAt,
          status: data.status,
          templateId: data.templateId,
          toAddress: data.toAddress,
          userId: data.userId,
        });
        return Promise.resolve(data);
      },
    );
    mocks.taskCommunicationUpdateMany.mockImplementation(
      ({ data, where }: { data: { emailLogId: string }; where: { id: string } }) => {
        const communication = communications.find(
          (candidate) =>
            candidate.id === where.id &&
            candidate.status === TaskCommunicationStatus.DRAFT &&
            candidate.emailLogId === null,
        );
        if (!communication) return Promise.resolve({ count: 0 });
        communication.emailLogId = data.emailLogId;
        return Promise.resolve({ count: 1 });
      },
    );
    mocks.taskCommunicationCount.mockImplementation(
      ({ where }: {
        where: {
          id?: { not: string };
          OR: Array<{
            sentAt?: { gte: Date };
          }>;
          recipientEmail: { equals: string };
        };
      }) => {
        const cutoff = where.OR[0]!.sentAt!.gte;
        const count = communications.filter((communication) => {
          if (communication.id === where.id?.not) return false;
          if (
            communication.recipientEmail.trim().toLowerCase() !==
            where.recipientEmail.equals
          ) {
            return false;
          }
          if (
            communication.status === TaskCommunicationStatus.SENT &&
            communication.sentAt &&
            communication.sentAt >= cutoff
          ) {
            return true;
          }
          const emailLog = communication.emailLogId
            ? emailLogs.get(communication.emailLogId)
            : null;
          return Boolean(
            communication.status === TaskCommunicationStatus.DRAFT &&
              emailLog &&
              emailLog.status !== EmailLogStatus.FAILED &&
              emailLog.sentAt >= cutoff,
          );
        }).length;
        return Promise.resolve(count);
      },
    );
    mocks.transaction.mockImplementation(
      async (
        callback: (transaction: {
          $executeRaw: (...args: unknown[]) => Promise<number>;
          emailLog: {
            create: typeof mocks.emailLogCreate;
            findUnique: typeof mocks.emailLogFindUnique;
          };
          taskCommunication: {
            count: typeof mocks.taskCommunicationCount;
            findFirst: typeof mocks.taskCommunicationFindFirst;
            updateMany: typeof mocks.taskCommunicationUpdateMany;
          };
        }) => Promise<unknown>,
      ) => {
        let releaseLock: (() => void) | undefined;
        const transaction = {
          $executeRaw: async (...args: unknown[]) => {
            mocks.queryRaw(...args);
            const priorLock = advisoryLockTail;
            advisoryLockTail = new Promise<void>((resolve) => {
              releaseLock = resolve;
            });
            await priorLock;
            return 1;
          },
          emailLog: {
            create: mocks.emailLogCreate,
            findUnique: mocks.emailLogFindUnique,
          },
          taskCommunication: {
            count: mocks.taskCommunicationCount,
            findFirst: mocks.taskCommunicationFindFirst,
            updateMany: mocks.taskCommunicationUpdateMany,
          },
        };
        try {
          return await callback(transaction);
        } finally {
          releaseLock?.();
        }
      },
    );
  });

  it("lets only one concurrent invitation reserve the daily slot for a normalized email", async () => {
    const first = draft("comm_1", " Reviewer@Example.org ");
    const second = draft("comm_2", "reviewer@example.org");
    communications.push(first, second);

    const results = await Promise.all([
      reserveRecipientRateLimitSlot(reservationInput(first)),
      reserveRecipientRateLimitSlot(reservationInput(second)),
    ]);

    expect(results.map((result) => result.status).sort()).toEqual([
      "rate_limited",
      "reserved",
    ]);
    expect(mocks.queryRaw).toHaveBeenCalledTimes(2);
    expect(emailLogs.size).toBe(1);
    expect(
      communications.filter((communication) => communication.emailLogId),
    ).toHaveLength(1);
  });

  it("counts five older sends against the rolling monthly cap", async () => {
    communications = Array.from({ length: 5 }, (_, index) => ({
      ...draft(`sent_${index}`),
      sentAt: new Date(
        NOW.getTime() - RECIPIENT_DAILY_WINDOW_MS - (index + 1) * 60_000,
      ),
      status: TaskCommunicationStatus.SENT,
    }));

    await expect(
      recipientWithinRateLimits("REVIEWER@example.org", NOW),
    ).resolves.toBe(false);
  });

  it("excludes a queued communication from its own idempotent retry check", async () => {
    const communication = draft("comm_retry");
    communication.emailLogId = "approved-task-email:comm_retry";
    communications.push(communication);
    emailLogs.set(communication.emailLogId, {
      dedupeKey: "task-notification:comm_retry",
      id: communication.emailLogId,
      sentAt: NOW,
      status: EmailLogStatus.QUEUED,
      templateId:
        "task_notification:invitation:step_0:communication_comm_retry",
      toAddress: communication.recipientEmail,
      userId: null,
    });

    await expect(
      recipientWithinRateLimits(communication.recipientEmail, NOW, {
        excludeCommunicationId: communication.id,
      }),
    ).resolves.toBe(true);
  });

  it("rechecks other live sends when a held invitation retries", async () => {
    const held = draft("comm_held");
    held.emailLogId = "approved-task-email:comm_held";
    communications.push(
      held,
      {
        ...draft("comm_newer"),
        sentAt: new Date(NOW.getTime() - 60 * 60 * 1_000),
        status: TaskCommunicationStatus.SENT,
      },
    );
    emailLogs.set(held.emailLogId, {
      dedupeKey: "task-notification:comm_held",
      id: held.emailLogId,
      sentAt: new Date(NOW.getTime() - 2 * RECIPIENT_DAILY_WINDOW_MS),
      status: EmailLogStatus.QUEUED,
      templateId:
        "task_notification:invitation:step_0:communication_comm_held",
      toAddress: held.recipientEmail,
      userId: null,
    });

    await expect(
      reserveRecipientRateLimitSlot(reservationInput(held)),
    ).resolves.toEqual({ status: "rate_limited" });
    expect(mocks.emailLogCreate).not.toHaveBeenCalled();
  });

  it("uses a per-communication template for a signed-in reviewer's later invitation", async () => {
    const prior = {
      ...draft("comm_prior"),
      emailLogId: "approved-task-email:comm_prior",
      sentAt: new Date(NOW.getTime() - 2 * RECIPIENT_DAILY_WINDOW_MS),
      status: TaskCommunicationStatus.SENT,
    };
    const next = draft("comm_signed_in");
    communications.push(prior, next);
    emailLogs.set(prior.emailLogId, {
      dedupeKey: "task-notification:comm_prior",
      id: prior.emailLogId,
      sentAt: prior.sentAt!,
      status: EmailLogStatus.SENT,
      templateId: "task_notification:invitation:step_0",
      toAddress: prior.recipientEmail,
      userId: "user_reviewer",
    });

    await expect(
      reserveRecipientRateLimitSlot({
        ...reservationInput(next),
        recipientUserId: "user_reviewer",
      }),
    ).resolves.toEqual({ status: "reserved" });

    expect(emailLogs.get("approved-task-email:comm_signed_in")).toMatchObject({
      dedupeKey: "task-notification:comm_signed_in",
      templateId:
        "task_notification:invitation:step_0:communication_comm_signed_in",
      userId: "user_reviewer",
    });
  });
});

import { EmailLogStatus, Prisma } from "@optimitron/db";
import { beforeEach, describe, expect, it, vi } from "vitest";

interface StoredUser {
  createdAt: Date;
  deletedAt: Date | null;
  email: string;
  id: string;
  name: string | null;
  newsletterSubscribed: boolean;
  referralCode: string;
  referralEmailSequenceLastSentAt: Date | null;
  referralEmailSequenceStep: number;
  username: string | null;
}

interface StoredEmailLog {
  createdAt: Date;
  errorMessage: string | null;
  id: string;
  sentAt: Date;
  status: (typeof EmailLogStatus)[keyof typeof EmailLogStatus];
  subject: string;
  templateId: string | null;
  toAddress: string;
  userId: string;
}

type WorkingState = {
  emailLogs: StoredEmailLog[];
  nextEmailLogId: number;
  referralCounts: Map<string, number>;
  users: StoredUser[];
};

const state = vi.hoisted(() => ({
  emailLogs: [] as StoredEmailLog[],
  nextEmailLogId: 1,
  referralCounts: new Map<string, number>(),
  users: [] as StoredUser[],
}));

const mocks = vi.hoisted(() => ({
  buildUserReferralUrl: vi.fn(),
  getReferralCountsByUserIds: vi.fn(),
  isResendConfigured: vi.fn(),
  sendResendEmail: vi.fn(),
  transaction: vi.fn(),
  emailLogFindUnique: vi.fn(),
  emailLogUpdate: vi.fn(),
  emailLogUpdateMany: vi.fn(),
  userFindMany: vi.fn(),
  userUpdate: vi.fn(),
  userUpdateMany: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  serverEnv: {
    REFERRAL_EMAIL_BATCH_SIZE: "50",
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: mocks.transaction,
    emailLog: {
      findUnique: mocks.emailLogFindUnique,
      update: mocks.emailLogUpdate,
      updateMany: mocks.emailLogUpdateMany,
    },
    user: {
      findMany: mocks.userFindMany,
      update: mocks.userUpdate,
      updateMany: mocks.userUpdateMany,
    },
  },
}));

vi.mock("@/lib/referral.server", () => ({
  getReferralCountsByUserIds: mocks.getReferralCountsByUserIds,
}));

vi.mock("@/lib/resend", () => ({
  isResendConfigured: mocks.isResendConfigured,
  sendResendEmail: mocks.sendResendEmail,
}));

vi.mock("@/lib/url", () => ({
  buildUserReferralUrl: mocks.buildUserReferralUrl,
}));

import {
  processDueReferralSequenceEmails,
  sendWelcomeReferralEmailForUser,
} from "../referral-email.server";
import { REFERRAL_EMAIL_SEQUENCE_LENGTH } from "../referral-email-sequence";

function cloneUser(user: StoredUser): StoredUser {
  return {
    ...user,
    createdAt: new Date(user.createdAt),
    referralEmailSequenceLastSentAt: user.referralEmailSequenceLastSentAt
      ? new Date(user.referralEmailSequenceLastSentAt)
      : null,
  };
}

function cloneEmailLog(emailLog: StoredEmailLog): StoredEmailLog {
  return {
    ...emailLog,
    createdAt: new Date(emailLog.createdAt),
    sentAt: new Date(emailLog.sentAt),
  };
}

function snapshotState(source: typeof state): WorkingState {
  return {
    emailLogs: source.emailLogs.map(cloneEmailLog),
    nextEmailLogId: source.nextEmailLogId,
    referralCounts: new Map(source.referralCounts),
    users: source.users.map(cloneUser),
  };
}

function commitState(target: typeof state, nextState: WorkingState) {
  target.users.splice(0, target.users.length, ...nextState.users.map(cloneUser));
  target.emailLogs.splice(0, target.emailLogs.length, ...nextState.emailLogs.map(cloneEmailLog));
  target.referralCounts.clear();
  for (const [userId, count] of nextState.referralCounts.entries()) {
    target.referralCounts.set(userId, count);
  }
  target.nextEmailLogId = nextState.nextEmailLogId;
}

function resetState() {
  state.users.splice(0, state.users.length);
  state.emailLogs.splice(0, state.emailLogs.length);
  state.referralCounts.clear();
  state.nextEmailLogId = 1;
}

function createUser(overrides: Partial<StoredUser> = {}): StoredUser {
  return {
    createdAt: new Date("2026-03-10T00:00:00.000Z"),
    deletedAt: null,
    email: "user@example.com",
    id: "user_1",
    name: "Test User",
    newsletterSubscribed: true,
    referralCode: "REFCODE1",
    referralEmailSequenceLastSentAt: null,
    referralEmailSequenceStep: 0,
    username: "test-user",
    ...overrides,
  };
}

function createEmailLog(overrides: Partial<StoredEmailLog> = {}): StoredEmailLog {
  return {
    createdAt: new Date("2026-03-11T12:00:00.000Z"),
    errorMessage: null,
    id: "emaillog_1",
    sentAt: new Date("2026-03-11T12:00:00.000Z"),
    status: EmailLogStatus.SENT,
    subject: "Example subject",
    templateId: "referral_sequence_1",
    toAddress: "user@example.com",
    userId: "user_1",
    ...overrides,
  };
}

function applyUserUpdate(
  users: StoredUser[],
  where: { id: string; referralEmailSequenceStep?: number },
  data: Partial<Pick<StoredUser, "referralEmailSequenceLastSentAt" | "referralEmailSequenceStep">>,
) {
  const user = users.find((candidate) => candidate.id === where.id);
  if (!user) {
    return { count: 0 };
  }

  if (
    where.referralEmailSequenceStep !== undefined &&
    user.referralEmailSequenceStep !== where.referralEmailSequenceStep
  ) {
    return { count: 0 };
  }

  if (data.referralEmailSequenceStep !== undefined) {
    user.referralEmailSequenceStep = data.referralEmailSequenceStep;
  }

  if (Object.hasOwn(data, "referralEmailSequenceLastSentAt")) {
    user.referralEmailSequenceLastSentAt = data.referralEmailSequenceLastSentAt ?? null;
  }

  return { count: 1 };
}

function createUniqueConstraintError() {
  return new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
    clientVersion: "test",
    code: "P2002",
  });
}

describe("referral email server", () => {
  beforeEach(() => {
    resetState();
    mocks.buildUserReferralUrl.mockReset();
    mocks.getReferralCountsByUserIds.mockReset();
    mocks.isResendConfigured.mockReset();
    mocks.sendResendEmail.mockReset();
    mocks.transaction.mockReset();
    mocks.emailLogFindUnique.mockReset();
    mocks.emailLogUpdate.mockReset();
    mocks.emailLogUpdateMany.mockReset();
    mocks.userFindMany.mockReset();
    mocks.userUpdate.mockReset();
    mocks.userUpdateMany.mockReset();

    mocks.isResendConfigured.mockReturnValue(true);
    mocks.sendResendEmail.mockResolvedValue({ id: "email_1", status: "sent" });
    mocks.buildUserReferralUrl.mockImplementation((user: { id: string }) => {
      return `https://example.com/u/${user.id}`;
    });
    mocks.getReferralCountsByUserIds.mockImplementation(async (userIds: string[]) => {
      return new Map(userIds.map((userId) => [userId, state.referralCounts.get(userId) ?? 0]));
    });
    mocks.userFindMany.mockImplementation(async ({ take }: { take: number }) => {
      return state.users
        .filter(
          (user) =>
            user.deletedAt === null &&
            user.referralEmailSequenceStep < REFERRAL_EMAIL_SEQUENCE_LENGTH,
        )
        .slice(0, take)
        .map(cloneUser);
    });
    mocks.userUpdate.mockImplementation(
      async ({
        data,
        where,
      }: {
        data: Partial<Pick<StoredUser, "referralEmailSequenceLastSentAt" | "referralEmailSequenceStep">>;
        where: { id: string };
      }) => {
        const result = applyUserUpdate(state.users, where, data);
        if (result.count === 0) {
          throw new Error(`Missing user ${where.id}`);
        }

        return cloneUser(state.users.find((user) => user.id === where.id)!);
      },
    );
    mocks.userUpdateMany.mockImplementation(
      async ({
        data,
        where,
      }: {
        data: Partial<Pick<StoredUser, "referralEmailSequenceLastSentAt" | "referralEmailSequenceStep">>;
        where: { id: string; referralEmailSequenceStep?: number };
      }) => {
        return applyUserUpdate(state.users, where, data);
      },
    );
    mocks.emailLogFindUnique.mockImplementation(
      async ({
        select,
        where,
      }: {
        select?: { sentAt?: boolean };
        where: { userId_templateId: { templateId: string; userId: string } };
      }) => {
        const emailLog = state.emailLogs.find(
          (candidate) =>
            candidate.userId === where.userId_templateId.userId &&
            candidate.templateId === where.userId_templateId.templateId,
        );
        if (!emailLog) {
          return null;
        }

        if (select?.sentAt) {
          return { sentAt: new Date(emailLog.sentAt) };
        }

        return cloneEmailLog(emailLog);
      },
    );
    mocks.emailLogUpdate.mockImplementation(
      async ({
        data,
        where,
      }: {
        data: { errorMessage?: string | null; status?: StoredEmailLog["status"] };
        where: { id: string };
      }) => {
        const emailLog = state.emailLogs.find((candidate) => candidate.id === where.id);
        if (!emailLog) {
          throw new Error(`Missing email log ${where.id}`);
        }

        if (Object.hasOwn(data, "errorMessage")) {
          emailLog.errorMessage = data.errorMessage ?? null;
        }
        if (data.status) {
          emailLog.status = data.status;
        }

        return cloneEmailLog(emailLog);
      },
    );
    mocks.emailLogUpdateMany.mockImplementation(
      async ({
        data,
        where,
      }: {
        data: { errorMessage?: string | null; status?: StoredEmailLog["status"] };
        where: { status?: StoredEmailLog["status"]; templateId?: string; userId?: string };
      }) => {
        let count = 0;

        for (const emailLog of state.emailLogs) {
          if (where.userId && emailLog.userId !== where.userId) {
            continue;
          }
          if (where.templateId && emailLog.templateId !== where.templateId) {
            continue;
          }
          if (where.status && emailLog.status !== where.status) {
            continue;
          }

          if (Object.hasOwn(data, "errorMessage")) {
            emailLog.errorMessage = data.errorMessage ?? null;
          }
          if (data.status) {
            emailLog.status = data.status;
          }
          count += 1;
        }

        return { count };
      },
    );
    mocks.transaction.mockImplementation(async (callback: (tx: object) => Promise<unknown>) => {
      const workingState = snapshotState(state);
      const tx = {
        emailLog: {
          create: async ({
            data,
          }: {
            data: {
              sentAt: Date;
              status: StoredEmailLog["status"];
              subject: string;
              templateId: string | null;
              toAddress: string;
              userId: string;
            };
          }) => {
            const duplicate = workingState.emailLogs.find(
              (emailLog) =>
                emailLog.userId === data.userId && emailLog.templateId === data.templateId,
            );
            if (duplicate) {
              throw createUniqueConstraintError();
            }

            const emailLog: StoredEmailLog = {
              createdAt: new Date(data.sentAt),
              errorMessage: null,
              id: `emaillog_${workingState.nextEmailLogId++}`,
              sentAt: new Date(data.sentAt),
              status: data.status,
              subject: data.subject,
              templateId: data.templateId,
              toAddress: data.toAddress,
              userId: data.userId,
            };
            workingState.emailLogs.push(emailLog);
            return cloneEmailLog(emailLog);
          },
        },
        user: {
          updateMany: async ({
            data,
            where,
          }: {
            data: Partial<
              Pick<StoredUser, "referralEmailSequenceLastSentAt" | "referralEmailSequenceStep">
            >;
            where: { id: string; referralEmailSequenceStep?: number };
          }) => {
            return applyUserUpdate(workingState.users, where, data);
          },
        },
      };

      const result = await callback(tx);
      commitState(state, workingState);
      return result;
    });
  });

  it("claims the welcome email in EmailLog and advances the user after a successful send", async () => {
    const now = new Date("2026-03-10T12:00:00.000Z");
    const user = createUser();
    state.users.push(cloneUser(user));

    await expect(sendWelcomeReferralEmailForUser(user, now)).resolves.toEqual({
      id: "email_1",
      status: "sent",
    });

    expect(mocks.sendResendEmail).toHaveBeenCalledOnce();
    expect(state.users[0]).toEqual(
      expect.objectContaining({
        referralEmailSequenceLastSentAt: now,
        referralEmailSequenceStep: 1,
      }),
    );
    expect(state.emailLogs).toEqual([
      expect.objectContaining({
        sentAt: now,
        status: EmailLogStatus.SENT,
        templateId: "referral_sequence_0",
        userId: "user_1",
      }),
    ]);
  });

  it("does not resend the same follow-up on a later six-hour cron poll", async () => {
    state.users.push(
      createUser({
        createdAt: new Date("2026-03-10T00:00:00.000Z"),
        referralEmailSequenceLastSentAt: new Date("2026-03-10T12:00:00.000Z"),
        referralEmailSequenceStep: 1,
      }),
    );

    const firstRun = await processDueReferralSequenceEmails(new Date("2026-03-11T12:00:00.000Z"));
    const secondRun = await processDueReferralSequenceEmails(new Date("2026-03-11T18:00:00.000Z"));

    expect(firstRun).toEqual({
      completed: 0,
      disabled: false,
      failures: 0,
      scanned: 1,
      sent: 1,
    });
    expect(secondRun).toEqual({
      completed: 0,
      disabled: false,
      failures: 0,
      scanned: 1,
      sent: 0,
    });
    expect(mocks.sendResendEmail).toHaveBeenCalledTimes(1);
    expect(state.emailLogs).toHaveLength(1);
    expect(state.emailLogs[0]).toEqual(
      expect.objectContaining({
        status: EmailLogStatus.SENT,
        templateId: "referral_sequence_1",
      }),
    );
    expect(state.users[0]).toEqual(
      expect.objectContaining({
        referralEmailSequenceStep: 2,
        referralEmailSequenceLastSentAt: new Date("2026-03-11T12:00:00.000Z"),
      }),
    );
  });

  it("uses the existing EmailLog claim to suppress a resend when the user step is stale", async () => {
    const originalSentAt = new Date("2026-03-11T12:00:00.000Z");
    state.users.push(
      createUser({
        referralEmailSequenceLastSentAt: new Date("2026-03-10T12:00:00.000Z"),
        referralEmailSequenceStep: 1,
      }),
    );
    state.emailLogs.push(
      createEmailLog({
        sentAt: originalSentAt,
        status: EmailLogStatus.SENT,
        subject: "150,000 people died today. You texted nobody",
        templateId: "referral_sequence_1",
      }),
    );

    await expect(
      processDueReferralSequenceEmails(new Date("2026-03-11T18:00:00.000Z")),
    ).resolves.toEqual({
      completed: 0,
      disabled: false,
      failures: 0,
      scanned: 1,
      sent: 0,
    });

    expect(mocks.sendResendEmail).not.toHaveBeenCalled();
    expect(state.users[0]).toEqual(
      expect.objectContaining({
        referralEmailSequenceStep: 2,
        referralEmailSequenceLastSentAt: originalSentAt,
      }),
    );
    expect(state.emailLogs).toHaveLength(1);
  });

  it("marks the log failed and keeps the user advanced after a send failure", async () => {
    const dueAt = new Date("2026-03-11T12:00:00.000Z");
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    state.users.push(
      createUser({
        referralEmailSequenceLastSentAt: new Date("2026-03-10T12:00:00.000Z"),
        referralEmailSequenceStep: 1,
      }),
    );
    mocks.sendResendEmail.mockRejectedValueOnce(new Error("resend unavailable"));

    const failedRun = await processDueReferralSequenceEmails(dueAt);
    const retryRun = await processDueReferralSequenceEmails(new Date("2026-03-11T18:00:00.000Z"));

    expect(failedRun).toEqual({
      completed: 0,
      disabled: false,
      failures: 1,
      scanned: 1,
      sent: 0,
    });
    expect(retryRun).toEqual({
      completed: 0,
      disabled: false,
      failures: 0,
      scanned: 1,
      sent: 0,
    });
    expect(mocks.sendResendEmail).toHaveBeenCalledTimes(1);
    expect(state.users[0]).toEqual(
      expect.objectContaining({
        referralEmailSequenceStep: 2,
        referralEmailSequenceLastSentAt: dueAt,
      }),
    );
    expect(state.emailLogs[0]).toEqual(
      expect.objectContaining({
        errorMessage: "resend unavailable",
        status: EmailLogStatus.FAILED,
        templateId: "referral_sequence_1",
      }),
    );

    consoleErrorSpy.mockRestore();
  });
});

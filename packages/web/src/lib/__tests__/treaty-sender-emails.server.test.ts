import { beforeEach, describe, expect, it, vi } from "vitest";
import { EmailLogStatus, Prisma } from "@optimitron/db";

const mocks = vi.hoisted(() => ({
  emailLogCreate: vi.fn(),
  emailLogUpdate: vi.fn(),
  getBaseUrl: vi.fn(),
  buildUnsubscribeUrl: vi.fn(),
  referendumVoteFindMany: vi.fn(),
  referralInvitationCount: vi.fn(),
  referralInvitationFindMany: vi.fn(),
  referralInvitationFindUnique: vi.fn(),
  sendResendEmail: vi.fn(),
  transaction: vi.fn(),
  userFindMany: vi.fn(),
  userFindUnique: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: mocks.transaction,
    emailLog: {
      create: mocks.emailLogCreate,
      update: mocks.emailLogUpdate,
    },
    referralInvitation: {
      count: mocks.referralInvitationCount,
      findMany: mocks.referralInvitationFindMany,
      findUnique: mocks.referralInvitationFindUnique,
    },
    referendumVote: {
      findMany: mocks.referendumVoteFindMany,
    },
    user: {
      findMany: mocks.userFindMany,
      findUnique: mocks.userFindUnique,
    },
  },
}));

vi.mock("@/lib/resend", () => ({
  sendResendEmail: mocks.sendResendEmail,
}));

vi.mock("@/lib/url", () => ({
  getBaseUrl: mocks.getBaseUrl,
}));

vi.mock("@/lib/email/unsub-url", () => ({
  buildUnsubscribeUrl: mocks.buildUnsubscribeUrl,
}));

import {
  processDueTreatyMonthlyScorecardEmails,
  processDueTreatyNeverSharedReengagementEmails,
  sendTreatyMonthlyScorecardEmailForUser,
  sendTreatyNeverSharedReengagementEmailForVote,
  sendTreatyRecipientVotedEmailForInvitation,
  sendTreatySenderReminderEmailForInvitation,
  sendTreatyVoteConfirmedEmailForUser,
} from "@/lib/treaty-sender-emails.server";

describe("treaty sender emails", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.getBaseUrl.mockReturnValue("https://warondisease.org");
    mocks.buildUnsubscribeUrl.mockReturnValue("https://warondisease.org/unsubscribe");
    mocks.emailLogCreate.mockResolvedValue({ id: "email_log_1" });
    mocks.emailLogUpdate.mockResolvedValue({ id: "email_log_1" });
    mocks.referendumVoteFindMany.mockResolvedValue([]);
    mocks.referralInvitationFindMany.mockResolvedValue([]);
    mocks.userFindMany.mockResolvedValue([]);
    mocks.sendResendEmail.mockResolvedValue({
      id: "resend_1",
      status: "sent",
      unsubscribeUrl: "https://warondisease.org/unsubscribe",
    });
    mocks.transaction.mockImplementation((items: Array<Promise<unknown>>) => Promise.all(items));
  });

  it("sends the vote-confirmed email with EmailLog dedupe metadata", async () => {
    mocks.userFindUnique.mockResolvedValue({
      email: "voter@example.com",
      id: "user_1",
    });

    const result = await sendTreatyVoteConfirmedEmailForUser({
      referendumId: "referendum_1",
      userId: "user_1",
      now: new Date("2026-04-25T00:00:00.000Z"),
    });

    expect(result).toEqual({
      emailLogId: expect.any(String),
      providerMessageId: "resend_1",
      status: "sent",
    });
    expect(mocks.emailLogCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        status: EmailLogStatus.QUEUED,
        subject: "Vote counted. Here's what it's worth.",
        templateId: "treaty_vote_confirmed:referendum_1",
        toAddress: "voter@example.com",
        userId: "user_1",
      }),
    });
    expect(mocks.sendResendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        scope: "referral_sequence",
        subject: "Vote counted. Here's what it's worth.",
        text: expect.stringContaining("divided across a majority of humans on Earth."),
        to: "voter@example.com",
        userId: "user_1",
      }),
    );
    expect(mocks.emailLogUpdate).toHaveBeenCalledWith({
      where: { id: expect.any(String) },
      data: {
        errorMessage: null,
        providerMessageId: "resend_1",
        status: EmailLogStatus.SENT,
      },
    });
  });

  it("does not send a duplicate vote-confirmed email", async () => {
    mocks.userFindUnique.mockResolvedValue({
      email: "voter@example.com",
      id: "user_1",
    });
    mocks.emailLogCreate.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("duplicate", {
        clientVersion: "test",
        code: "P2002",
      }),
    );

    const result = await sendTreatyVoteConfirmedEmailForUser({
      referendumId: "referendum_1",
      userId: "user_1",
    });

    expect(result).toEqual({ status: "duplicate" });
    expect(mocks.sendResendEmail).not.toHaveBeenCalled();
  });

  it("sends the recipient-voted email with current confirmed and pending totals", async () => {
    mocks.referralInvitationFindUnique.mockResolvedValue({
      id: "invite_1",
      messageFormat: "TASK_NOTIFICATION",
      recipientName: "Jake",
      referrerUserId: "referrer_1",
      referrer: {
        email: "sender@example.com",
        id: "referrer_1",
      },
    });
    mocks.referralInvitationCount
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1);

    const result = await sendTreatyRecipientVotedEmailForInvitation({
      invitationId: "invite_1",
    });

    expect(result.status).toBe("sent");
    expect(mocks.referralInvitationCount).toHaveBeenNthCalledWith(1, {
      where: {
        convertedAt: { not: null },
        deletedAt: null,
        referrerUserId: "referrer_1",
      },
    });
    expect(mocks.referralInvitationCount).toHaveBeenNthCalledWith(2, {
      where: {
        convertedAt: null,
        deletedAt: null,
        referrerUserId: "referrer_1",
        status: { in: ["PENDING", "COPIED", "SENT"] },
      },
    });
    expect(mocks.sendResendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: "Jake completed their task.",
        text: expect.stringContaining("Confirmed: **5.4 lives**"),
        to: "sender@example.com",
        userId: "referrer_1",
      }),
    );
    expect(mocks.sendResendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining("Pending: **2.7 lives**"),
      }),
    );
  });

  it("sends the first sender reminder with current invitation totals", async () => {
    mocks.referralInvitationFindUnique.mockResolvedValue({
      id: "invite_1",
      referrerUserId: "referrer_1",
      referrer: {
        email: "sender@example.com",
        id: "referrer_1",
      },
    });
    mocks.referralInvitationCount
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1);

    const result = await sendTreatySenderReminderEmailForInvitation({
      invitationId: "invite_1",
      reminderStep: 1,
      now: new Date("2026-04-25T00:00:00.000Z"),
    });

    expect(result.status).toBe("sent");
    expect(mocks.referralInvitationCount).toHaveBeenNthCalledWith(1, {
      where: {
        deletedAt: null,
        referrerUserId: "referrer_1",
        status: { in: ["COPIED", "SENT", "CONVERTED"] },
      },
    });
    expect(mocks.referralInvitationCount).toHaveBeenNthCalledWith(2, {
      where: {
        convertedAt: { not: null },
        deletedAt: null,
        referrerUserId: "referrer_1",
      },
    });
    expect(mocks.referralInvitationCount).toHaveBeenNthCalledWith(3, {
      where: {
        convertedAt: null,
        deletedAt: null,
        referrerUserId: "referrer_1",
        status: { in: ["COPIED", "SENT"] },
      },
    });
    expect(mocks.emailLogCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        sendContext: expect.objectContaining({
          invitationId: "invite_1",
          kind: "treaty_sender_reminder",
          reminderStep: 1,
        }),
        subject: "One more?",
        templateId: "treaty_sender_reminder:invite_1:1",
        toAddress: "sender@example.com",
        userId: "referrer_1",
      }),
    });
    expect(mocks.sendResendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: "One more?",
        text: expect.stringContaining("[BUTTON: Assign one more Earth optimization task → https://warondisease.org/send]"),
        to: "sender@example.com",
        userId: "referrer_1",
      }),
    );
    expect(mocks.sendResendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining("Your Inverse Kills Score: **5.4 confirmed, 2.7 pending.**"),
      }),
    );
  });

  it("sends the never-shared re-engagement email with EmailLog dedupe metadata", async () => {
    mocks.userFindUnique.mockResolvedValue({
      email: "voter@example.com",
      id: "user_1",
    });

    const result = await sendTreatyNeverSharedReengagementEmailForVote({
      referendumId: "referendum_1",
      userId: "user_1",
      now: new Date("2026-04-25T00:00:00.000Z"),
    });

    expect(result.status).toBe("sent");
    expect(mocks.emailLogCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        sendContext: {
          kind: "treaty_never_shared_reengagement",
          referendumId: "referendum_1",
        },
        subject: "You voted but didn't tell anyone",
        templateId: "treaty_never_shared_reengagement:referendum_1",
        toAddress: "voter@example.com",
        userId: "user_1",
      }),
    });
    expect(mocks.sendResendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: "You voted but didn't tell anyone",
        text: expect.stringContaining("[BUTTON: Assign one task → https://warondisease.org/send]"),
        to: "voter@example.com",
        userId: "user_1",
      }),
    );
  });

  it("processes due never-shared treaty voters who have no invitations", async () => {
    const now = new Date("2026-04-25T12:00:00.000Z");
    mocks.referendumVoteFindMany.mockResolvedValue([
      {
        id: "vote_1",
        referendumId: "referendum_1",
        userId: "user_1",
      },
    ]);
    mocks.userFindUnique.mockResolvedValue({
      email: "voter@example.com",
      id: "user_1",
    });

    const result = await processDueTreatyNeverSharedReengagementEmails(now, 25);

    expect(result).toEqual({
      failures: 0,
      scanned: 1,
      sent: 1,
      skipped: 0,
    });
    expect(mocks.referendumVoteFindMany).toHaveBeenCalledWith({
      where: {
        answer: "YES",
        createdAt: { lte: new Date("2026-04-24T12:00:00.000Z") },
        deletedAt: null,
        referendum: {
          deletedAt: null,
          slug: "one-percent-treaty",
        },
        user: {
          emailLogs: {
            none: {
              templateId: { startsWith: "treaty_never_shared_reengagement:" },
            },
          },
          sentReferralInvitations: {
            none: {
              deletedAt: null,
            },
          },
        },
      },
      orderBy: [{ createdAt: "asc" }],
      select: {
        id: true,
        referendumId: true,
        userId: true,
      },
      take: 25,
    });
  });

  it("sends the monthly scorecard email with direct invitation totals", async () => {
    mocks.userFindUnique.mockResolvedValue({
      email: "sender@example.com",
      id: "user_1",
    });
    mocks.referralInvitationCount
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1);
    mocks.referralInvitationFindMany.mockResolvedValue([
      { recipientName: "Maria" },
    ]);

    const result = await sendTreatyMonthlyScorecardEmailForUser({
      periodKey: "2026-04",
      userId: "user_1",
      now: new Date("2026-04-25T00:00:00.000Z"),
    });

    expect(result.status).toBe("sent");
    expect(mocks.referralInvitationCount).toHaveBeenNthCalledWith(1, {
      where: {
        deletedAt: null,
        referrerUserId: "user_1",
        status: { in: ["COPIED", "SENT", "CONVERTED"] },
      },
    });
    expect(mocks.referralInvitationCount).toHaveBeenNthCalledWith(2, {
      where: {
        convertedAt: { not: null },
        deletedAt: null,
        referrerUserId: "user_1",
      },
    });
    expect(mocks.referralInvitationCount).toHaveBeenNthCalledWith(3, {
      where: {
        convertedAt: null,
        deletedAt: null,
        referrerUserId: "user_1",
        status: { in: ["COPIED", "SENT"] },
      },
    });
    expect(mocks.referralInvitationFindMany).toHaveBeenCalledWith({
      where: {
        convertedAt: null,
        deletedAt: null,
        referrerUserId: "user_1",
        status: { in: ["COPIED", "SENT"] },
      },
      orderBy: [{ createdAt: "asc" }],
      select: { recipientName: true },
      take: 5,
    });
    expect(mocks.emailLogCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        sendContext: expect.objectContaining({
          kind: "treaty_monthly_scorecard",
          periodKey: "2026-04",
          sentCount: 3,
          votedCount: 2,
        }),
        subject: "Your Inverse Kills Score: 5.4 lives",
        templateId: "treaty_monthly_scorecard:2026-04",
        toAddress: "sender@example.com",
        userId: "user_1",
      }),
    });
    expect(mocks.sendResendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: "Your Inverse Kills Score: 5.4 lives",
        text: expect.stringContaining("**Pending:** 2.7 lives, waiting on Maria"),
        to: "sender@example.com",
        userId: "user_1",
      }),
    );
  });

  it("processes monthly scorecards once per user per month", async () => {
    const now = new Date("2026-04-25T12:00:00.000Z");
    mocks.userFindMany.mockResolvedValue([{ id: "user_1" }]);
    mocks.userFindUnique.mockResolvedValue({
      email: "sender@example.com",
      id: "user_1",
    });
    mocks.referralInvitationCount
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);
    mocks.referralInvitationFindMany.mockResolvedValue([]);

    const result = await processDueTreatyMonthlyScorecardEmails(now, 25);

    expect(result).toEqual({
      failures: 0,
      scanned: 1,
      sent: 1,
      skipped: 0,
    });
    expect(mocks.userFindMany).toHaveBeenCalledWith({
      where: {
        deletedAt: null,
        emailLogs: {
          none: {
            templateId: "treaty_monthly_scorecard:2026-04",
          },
        },
        sentReferralInvitations: {
          some: {
            deletedAt: null,
            status: { in: ["COPIED", "SENT", "CONVERTED"] },
          },
        },
      },
      orderBy: [{ createdAt: "asc" }],
      select: { id: true },
      take: 25,
    });
  });
});

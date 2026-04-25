import { beforeEach, describe, expect, it, vi } from "vitest";
import { EmailLogStatus, Prisma } from "@optimitron/db";

const mocks = vi.hoisted(() => ({
  emailLogCreate: vi.fn(),
  emailLogUpdate: vi.fn(),
  getBaseUrl: vi.fn(),
  buildUnsubscribeUrl: vi.fn(),
  referralInvitationCount: vi.fn(),
  referralInvitationFindUnique: vi.fn(),
  sendResendEmail: vi.fn(),
  transaction: vi.fn(),
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
      findUnique: mocks.referralInvitationFindUnique,
    },
    user: {
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
  sendTreatyRecipientVotedEmailForInvitation,
  sendTreatyVoteConfirmedEmailForUser,
} from "@/lib/treaty-sender-emails.server";

describe("treaty sender emails", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.getBaseUrl.mockReturnValue("https://warondisease.org");
    mocks.buildUnsubscribeUrl.mockReturnValue("https://warondisease.org/unsubscribe");
    mocks.emailLogCreate.mockResolvedValue({ id: "email_log_1" });
    mocks.emailLogUpdate.mockResolvedValue({ id: "email_log_1" });
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
});

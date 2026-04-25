import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  nanoid: vi.fn(),
  personUpsert: vi.fn(),
  referralCreate: vi.fn(),
  referralCount: vi.fn(),
  referralFindFirst: vi.fn(),
  referralFindUnique: vi.fn(),
  referralUpdate: vi.fn(),
  referendumFindFirst: vi.fn(),
  sendExternalResendEmail: vi.fn(),
  userFindUnique: vi.fn(),
}));

vi.mock("nanoid", () => ({
  nanoid: mocks.nanoid,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    person: { upsert: mocks.personUpsert },
    referralInvitation: {
      count: mocks.referralCount,
      create: mocks.referralCreate,
      findFirst: mocks.referralFindFirst,
      findUnique: mocks.referralFindUnique,
      update: mocks.referralUpdate,
    },
    referendum: { findFirst: mocks.referendumFindFirst },
    user: { findUnique: mocks.userFindUnique },
  },
}));

vi.mock("@/lib/resend", () => ({
  sendExternalResendEmail: mocks.sendExternalResendEmail,
}));

import {
  convertReferralInvitationForVote,
  createReferralInvitation,
  sendReferralInvitationEmail,
} from "@/lib/referral-invitations.server";

describe("referral invitation server helpers", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.nanoid.mockReturnValue("token_123");
    mocks.userFindUnique.mockResolvedValue({ email: "sender@example.com" });
    mocks.referralCount.mockResolvedValue(0);
    mocks.referendumFindFirst.mockResolvedValue({ id: "referendum_1" });
    mocks.referralFindUnique.mockResolvedValue(null);
    mocks.personUpsert.mockResolvedValue({ id: "person_1" });
    mocks.referralCreate.mockImplementation(async ({ data }) => ({
      id: "invite_1",
      ...data,
    }));
    mocks.sendExternalResendEmail.mockResolvedValue({ id: "resend_1", status: "sent" });
  });

  it("creates a named invitation and links an emailed recipient to Person", async () => {
    const invitation = await createReferralInvitation({
      referrerUserId: "user_1",
      recipientName: "Jake Smith",
      recipientEmail: "JAKE@example.com",
      messageFormat: "TASK_NOTIFICATION",
    });

    expect(mocks.personUpsert).toHaveBeenCalledWith({
      where: { email: "jake@example.com" },
      update: {
        deletedAt: null,
        displayName: "Jake Smith",
      },
      create: {
        displayName: "Jake Smith",
        email: "jake@example.com",
      },
      select: { id: true },
    });
    expect(mocks.referralCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        inviteToken: "token_123",
        recipientUnsubscribeToken: "token_123",
        recipientEmail: "jake@example.com",
        recipientName: "Jake Smith",
        recipientPersonId: "person_1",
        referendumId: "referendum_1",
        referrerUserId: "user_1",
      }),
    });
    expect(invitation.inviteToken).toBe("token_123");
  });

  it("rejects inviting yourself by email", async () => {
    await expect(
      createReferralInvitation({
        referrerUserId: "user_1",
        recipientName: "Sender",
        recipientEmail: "sender@example.com",
      }),
    ).rejects.toThrow("Recipient email cannot be your own email.");
  });

  it("rate limits excessive invitation creation", async () => {
    mocks.referralCount.mockResolvedValue(50);

    await expect(
      createReferralInvitation({
        referrerUserId: "user_1",
        recipientName: "Jake",
      }),
    ).rejects.toThrow("Referral invitation rate limit exceeded.");
  });

  it("converts a matching invitation for a verified vote", async () => {
    mocks.referralFindFirst.mockResolvedValue({
      id: "invite_1",
      referrerUserId: "referrer_1",
      referendumId: "referendum_1",
      convertedVoteId: null,
      status: "SENT",
    });
    mocks.referralUpdate.mockResolvedValue({
      id: "invite_1",
      convertedVoteId: "vote_1",
      status: "CONVERTED",
    });

    const converted = await convertReferralInvitationForVote({
      inviteToken: "token_123",
      voterUserId: "voter_1",
      referendumId: "referendum_1",
      voteId: "vote_1",
    });

    expect(converted).toEqual({
      id: "invite_1",
      convertedVoteId: "vote_1",
      status: "CONVERTED",
    });
    expect(mocks.referralUpdate).toHaveBeenCalledWith({
      where: { id: "invite_1" },
      data: expect.objectContaining({
        convertedVoteId: "vote_1",
        nextRecipientEmailAt: null,
        nextSenderNudgeAt: null,
        status: "CONVERTED",
      }),
    });
  });

  it("persists edited message text when sending an invitation email", async () => {
    const now = new Date("2026-04-25T12:00:00.000Z");
    mocks.referralFindFirst.mockResolvedValue({
      convertedAt: null,
      id: "invite_1",
      inviteToken: "invite_token",
      messageFormat: "TASK_NOTIFICATION",
      recipientEmail: "jake@example.com",
      recipientEmailStep: 0,
      recipientName: "Jake",
      recipientUnsubscribeToken: "unsubscribe_token",
      recipientUnsubscribedAt: null,
      referrer: {
        id: "user_1",
        name: "Ada",
        person: null,
        referralCode: "ada123",
        username: "ada",
      },
      status: "PENDING",
    });
    mocks.referralUpdate.mockResolvedValue({
      id: "invite_1",
      messageText: "edited message",
      status: "SENT",
    });

    const result = await sendReferralInvitationEmail({
      invitationId: "invite_1",
      messageText: " edited message ",
      now,
      referrerUserId: "user_1",
    });

    expect(result).toEqual({
      status: "sent",
      invitation: {
        id: "invite_1",
        messageText: "edited message",
        status: "SENT",
      },
      providerMessageId: "resend_1",
    });
    expect(mocks.sendExternalResendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: "[OVERDUE] Task assigned to you: End War and Disease",
        to: "jake@example.com",
      }),
    );
    expect(mocks.referralUpdate).toHaveBeenCalledWith({
      where: { id: "invite_1" },
      data: expect.objectContaining({
        messageText: "edited message",
        recipientEmailProviderMessageId: "resend_1",
        recipientEmailStep: 1,
        status: "SENT",
      }),
    });
  });
});

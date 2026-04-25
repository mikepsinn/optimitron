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

import {
  convertReferralInvitationForVote,
  createReferralInvitation,
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
});

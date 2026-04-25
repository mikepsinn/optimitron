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
  taskCreate: vi.fn(),
  taskFindFirst: vi.fn(),
  taskUpdateMany: vi.fn(),
  transaction: vi.fn(),
  sendExternalResendEmail: vi.fn(),
  userFindUnique: vi.fn(),
}));

vi.mock("nanoid", () => ({
  nanoid: mocks.nanoid,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: mocks.transaction,
    person: { upsert: mocks.personUpsert },
    referralInvitation: {
      count: mocks.referralCount,
      create: mocks.referralCreate,
      findFirst: mocks.referralFindFirst,
      findUnique: mocks.referralFindUnique,
      update: mocks.referralUpdate,
    },
    referendum: { findFirst: mocks.referendumFindFirst },
    task: {
      create: mocks.taskCreate,
      findFirst: mocks.taskFindFirst,
      updateMany: mocks.taskUpdateMany,
    },
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
    mocks.userFindUnique.mockResolvedValue({
      email: "sender@example.com",
      id: "user_1",
      image: null,
      name: "Ada",
      person: null,
      referralCode: "ada123",
      username: "ada",
    });
    mocks.referralCount.mockResolvedValue(0);
    mocks.referendumFindFirst.mockResolvedValue({ id: "referendum_1" });
    mocks.referralFindUnique.mockResolvedValue(null);
    mocks.personUpsert.mockResolvedValue({ id: "person_1" });
    mocks.taskCreate.mockResolvedValue({ id: "task_1" });
    mocks.referralCreate.mockImplementation(async ({ data }) => ({
      id: "invite_1",
      ...data,
    }));
    mocks.transaction.mockImplementation(async (callback) =>
      callback({
        person: { upsert: mocks.personUpsert },
        referralInvitation: {
          create: mocks.referralCreate,
          update: mocks.referralUpdate,
        },
        task: {
          create: mocks.taskCreate,
          updateMany: mocks.taskUpdateMany,
        },
      }),
    );
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
        taskId: "task_1",
      }),
    });
    expect(mocks.taskCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        assigneePersonId: "person_1",
        category: "OUTREACH",
        claimPolicy: "ASSIGNED_ONLY",
        contactLabel: "Complete treaty vote",
        isPublic: false,
        ownerUserId: "user_1",
        status: "ACTIVE",
        taskKey: "program:one-percent-treaty:referral-invitation:token_123",
        title: "Invite Jake to vote on the 1% Treaty",
      }),
      select: { id: true },
    });
    expect(invitation.inviteToken).toBe("token_123");
  });

  it("creates a private task for copy-only invitations without creating an email-less Person", async () => {
    const invitation = await createReferralInvitation({
      referrerUserId: "user_1",
      recipientName: "Maria",
      contactMethod: "COPY",
    });

    expect(mocks.personUpsert).not.toHaveBeenCalled();
    expect(mocks.taskCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        assigneeAffiliationSnapshot: "Maria",
        assigneePersonId: null,
        isPublic: false,
        ownerUserId: "user_1",
        title: "Invite Maria to vote on the 1% Treaty",
      }),
      select: { id: true },
    });
    expect(invitation.taskId).toBe("task_1");
  });

  it("links an invitation to an existing accessible task when supplied", async () => {
    mocks.taskFindFirst.mockResolvedValue({ id: "task_existing" });

    await createReferralInvitation({
      referrerUserId: "user_1",
      recipientName: "Jake",
      taskId: "task_existing",
    });

    expect(mocks.taskFindFirst).toHaveBeenCalledWith({
      where: {
        id: "task_existing",
        deletedAt: null,
        OR: [
          { ownerUserId: "user_1" },
          { isPublic: true },
        ],
      },
      select: { id: true },
    });
    expect(mocks.taskCreate).not.toHaveBeenCalled();
    expect(mocks.referralCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        taskId: "task_existing",
      }),
    });
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
      recipientName: "Jake",
      status: "SENT",
      taskId: "task_1",
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
    expect(mocks.taskUpdateMany).toHaveBeenCalledWith({
      where: {
        id: "task_1",
        deletedAt: null,
        status: { not: "VERIFIED" },
      },
      data: expect.objectContaining({
        actualEffortSeconds: 30,
        completionEvidence: "Jake verified a vote through referral invitation invite_1.",
        status: "VERIFIED",
        verifiedByUserId: "voter_1",
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

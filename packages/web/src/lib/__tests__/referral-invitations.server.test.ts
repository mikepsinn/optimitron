import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  nanoid: vi.fn(),
  personUpsert: vi.fn(),
  referralCreate: vi.fn(),
  referralCount: vi.fn(),
  referralFindMany: vi.fn(),
  referralFindFirst: vi.fn(),
  referralFindUnique: vi.fn(),
  referralUpdate: vi.fn(),
  referendumFindFirst: vi.fn(),
  taskCreate: vi.fn(),
  taskFindFirst: vi.fn(),
  taskUpdateMany: vi.fn(),
  taskCommunicationEndpointFindFirst: vi.fn(),
  taskCommunicationEndpointCreate: vi.fn(),
  taskCommunicationEndpointUpdate: vi.fn(),
  taskCommunicationEndpointUpdateMany: vi.fn(),
  taskCommunicationCreate: vi.fn(),
  taskCommunicationFindFirst: vi.fn(),
  taskCommunicationFindMany: vi.fn(),
  taskCommunicationFindUnique: vi.fn(),
  taskCommunicationUpdate: vi.fn(),
  taskCommentCreate: vi.fn(),
  emailLogCreate: vi.fn(),
  emailLogUpdate: vi.fn(),
  transaction: vi.fn(),
  sendExternalResendEmail: vi.fn(),
  sendTreatySenderReminderEmailForInvitation: vi.fn(),
  shareAttemptCreate: vi.fn(),
  userFindUnique: vi.fn(),
  userUpdateMany: vi.fn(),
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
      findMany: mocks.referralFindMany,
      findUnique: mocks.referralFindUnique,
      update: mocks.referralUpdate,
    },
    referendum: { findFirst: mocks.referendumFindFirst },
    shareAttempt: { create: mocks.shareAttemptCreate },
    emailLog: {
      create: mocks.emailLogCreate,
      update: mocks.emailLogUpdate,
    },
    task: {
      create: mocks.taskCreate,
      findFirst: mocks.taskFindFirst,
      updateMany: mocks.taskUpdateMany,
    },
    taskCommunicationEndpoint: {
      findFirst: mocks.taskCommunicationEndpointFindFirst,
      create: mocks.taskCommunicationEndpointCreate,
      update: mocks.taskCommunicationEndpointUpdate,
      updateMany: mocks.taskCommunicationEndpointUpdateMany,
    },
    taskCommunication: {
      create: mocks.taskCommunicationCreate,
      findFirst: mocks.taskCommunicationFindFirst,
      findMany: mocks.taskCommunicationFindMany,
      findUnique: mocks.taskCommunicationFindUnique,
      update: mocks.taskCommunicationUpdate,
    },
    taskComment: {
      create: mocks.taskCommentCreate,
    },
    user: {
      findUnique: mocks.userFindUnique,
      updateMany: mocks.userUpdateMany,
    },
  },
}));

vi.mock("@/lib/email/resend", () => ({
  sendExternalResendEmail: mocks.sendExternalResendEmail,
}));

vi.mock("@/lib/email/treaty-sender-emails.server", () => ({
  sendTreatySenderReminderEmailForInvitation:
    mocks.sendTreatySenderReminderEmailForInvitation,
}));

import {
  processDueReferralInvitationRecipientEmails,
  processDueReferralInvitationSenderEmails,
  sendReferralInvitationEmail,
} from "@/lib/email/referral-invitation-emails.server";
import {
  convertReferralInvitationForVote,
  createReferralInvitation,
  markReferralInvitationCopied,
} from "@/lib/referral-invitations.server";

function nowDate() {
  return new Date("2026-04-25T12:00:00.000Z");
}

describe("referral invitation server helpers", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    let latestCommunication: Record<string, unknown> | null = null;
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
    mocks.referralFindMany.mockResolvedValue([]);
    mocks.referralCreate.mockImplementation(async ({ data }) => ({
      id: "invite_1",
      ...data,
    }));
    mocks.taskCommunicationEndpointFindFirst.mockResolvedValue(null);
    mocks.taskCommunicationEndpointCreate.mockResolvedValue({ id: "endpoint_1" });
    mocks.taskCommunicationEndpointUpdate.mockResolvedValue({ id: "endpoint_1" });
    mocks.taskCommunicationEndpointUpdateMany.mockResolvedValue({ count: 0 });
    mocks.taskCommunicationFindFirst.mockResolvedValue(null);
    mocks.taskCommunicationFindMany.mockResolvedValue([]);
    mocks.taskCommunicationCreate.mockImplementation(async ({ data }) => {
      latestCommunication = {
        id: "communication_1",
        createdAt: nowDate(),
        deletedAt: null,
        task: { id: data.taskId, title: "Invite Jake to vote on the 1% Treaty" },
        ...data,
      };
      return latestCommunication;
    });
    mocks.taskCommunicationUpdate.mockImplementation(async ({ data, where }) => {
      latestCommunication = {
        ...(latestCommunication ?? {
          channel: "EMAIL",
          createdAt: nowDate(),
          deletedAt: null,
          recipientEmail: "jake@example.com",
          status: "DRAFT",
          taskId: "task_1",
        }),
        id: where.id,
        ...data,
      };
      return latestCommunication;
    });
    mocks.taskCommunicationFindUnique.mockImplementation(async () =>
    latestCommunication ?? {
      id: 'communication_1',
      audience: 'RECIPIENT',
      channel: 'EMAIL',
      deletedAt: null,
      idempotencyKey: null,
      metadataJson: {
        html: '<p>Hello</p>',
        subject: '[OVERDUE] Task assigned to you: End War and Disease',
        text: '[BUTTON: COMPLETE TASK -> https://optimitron.test/r/ada123?invite=invite_token&sa=token_123]',
        unsubscribeUrl: 'https://optimitron.test/api/referral-invitations/unsubscribe',
      },
      purpose: 'INVITATION',
      recipientEmail: 'jake@example.com',
      recipientUserId: null,
      status: 'DRAFT',
      step: 1,
      task: { id: 'task_1', title: 'Invite Jake to vote on the 1% Treaty' },
      taskId: 'task_1',
      templateId: null,
    },
  );
    mocks.taskCommentCreate.mockResolvedValue({ id: "comment_1" });
    mocks.emailLogCreate.mockResolvedValue({ id: "email_log_1" });
    mocks.emailLogUpdate.mockResolvedValue({ id: "email_log_1" });
    mocks.transaction.mockImplementation(async (callback) =>
      callback({
        emailLog: {
          create: mocks.emailLogCreate,
          update: mocks.emailLogUpdate,
        },
        person: { upsert: mocks.personUpsert },
        referralInvitation: {
          create: mocks.referralCreate,
          findUnique: mocks.referralFindUnique,
          update: mocks.referralUpdate,
        },
        shareAttempt: { create: mocks.shareAttemptCreate },
        taskComment: { create: mocks.taskCommentCreate },
        taskCommunication: {
          create: mocks.taskCommunicationCreate,
          findFirst: mocks.taskCommunicationFindFirst,
          findMany: mocks.taskCommunicationFindMany,
          findUnique: mocks.taskCommunicationFindUnique,
          update: mocks.taskCommunicationUpdate,
        },
        task: {
          create: mocks.taskCreate,
          updateMany: mocks.taskUpdateMany,
        },
        taskCommunicationEndpoint: {
          findFirst: mocks.taskCommunicationEndpointFindFirst,
          create: mocks.taskCommunicationEndpointCreate,
          update: mocks.taskCommunicationEndpointUpdate,
          updateMany: mocks.taskCommunicationEndpointUpdateMany,
        },
        user: { updateMany: mocks.userUpdateMany },
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
        isPublic: false,
        ownerUserId: "user_1",
        status: "ACTIVE",
        taskKey: "program:one-percent-treaty:referral-invitation:token_123",
        title: "Invite Jake to vote on the 1% Treaty",
      }),
      select: { id: true },
    });
    expect(mocks.taskCommunicationEndpointCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        isPrimary: true,
        label: "Complete treaty vote",
        taskId: "task_1",
      }),
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
      recipientPersonId: "person_1",
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
        nextSenderReminderAt: null,
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
    expect(mocks.userUpdateMany).toHaveBeenCalledWith({
      where: {
        id: "voter_1",
        personId: null,
      },
      data: {
        personId: "person_1",
      },
    });
  });

  it("does not re-convert an already converted invitation", async () => {
    mocks.referralFindFirst.mockResolvedValue({
      id: "invite_1",
      referrerUserId: "referrer_1",
      referendumId: "referendum_1",
      convertedVoteId: "original_vote",
      recipientPersonId: "person_1",
      recipientName: "Jake",
      status: "CONVERTED",
      taskId: "task_1",
    });

    const converted = await convertReferralInvitationForVote({
      inviteToken: "token_123",
      voterUserId: "second_voter",
      referendumId: "referendum_1",
      voteId: "second_vote",
    });

    expect(converted).toEqual({
      id: "invite_1",
      referrerUserId: "referrer_1",
      referendumId: "referendum_1",
      convertedVoteId: "original_vote",
      recipientPersonId: "person_1",
      recipientName: "Jake",
      status: "CONVERTED",
      taskId: "task_1",
    });
    expect(mocks.referralUpdate).not.toHaveBeenCalled();
    expect(mocks.taskUpdateMany).not.toHaveBeenCalled();
  });

  it("records copied invitation text as a ShareAttempt and keeps copied status bounded", async () => {
    const now = new Date("2026-04-25T12:00:00.000Z");
    mocks.referralFindFirst.mockResolvedValue({
      id: "invite_1",
      inviteToken: "invite_token",
      messageFormat: "TASK_NOTIFICATION",
      recipientName: "Jake",
      referrer: {
        email: "sender@example.com",
        id: "user_1",
        image: null,
        name: "Ada",
        person: null,
        referralCode: "ada123",
        username: "ada",
      },
      status: "PENDING",
      taskId: "task_1",
    });
    mocks.referralFindUnique.mockResolvedValue({
      id: "invite_1",
      shareAttemptId: "share_1",
      status: "COPIED",
    });

    const invitation = await markReferralInvitationCopied({
      invitationId: "invite_1",
      messageText: "final copied message",
      now,
      referrerUserId: "user_1",
      shareAttemptId: "share_1",
      wasEdited: true,
    });

    expect(invitation).toEqual({
      id: "invite_1",
      shareAttemptId: "share_1",
      status: "COPIED",
    });
    expect(mocks.shareAttemptCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        id: "share_1",
        channel: "copy-message",
        renderedHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        renderedMessage: "final copied message",
        source: "IN_APP",
        surface: "referral_invitation_composer",
        taskId: "task_1",
        templateHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        templateId: "referral_invitation:task_notification",
        userId: "user_1",
        wasEdited: true,
      }),
    });
    expect(mocks.referralUpdate).toHaveBeenCalledWith({
      where: { id: "invite_1" },
      data: expect.objectContaining({
        copiedAt: now,
        messageText: "final copied message",
        shareAttemptId: "share_1",
        status: "COPIED",
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
      taskId: "task_1",
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
      communicationId: "communication_1",
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
        text: expect.stringContaining("sa=token_123"),
        to: "jake@example.com",
      }),
    );
    expect(mocks.shareAttemptCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        id: "token_123",
        channel: "email",
        renderedHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        renderedMessage: expect.stringContaining("sa=token_123"),
        source: "EMAIL",
        surface: "referral_invitation_email",
        taskId: "task_1",
        templateHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        templateId: "referral_invitation:task_notification:recipient_step_1",
        userId: "user_1",
        wasEdited: false,
      }),
    });
    expect(mocks.referralUpdate).toHaveBeenCalledWith({
      where: { id: "invite_1" },
      data: expect.objectContaining({
        messageText: "edited message",
        recipientEmailProviderMessageId: "resend_1",
        recipientEmailStep: 1,
        shareAttemptId: "token_123",
        status: "SENT",
      }),
    });
  });

  it("preserves the stored message format throughout recipient reminders", async () => {
    const now = new Date("2026-04-25T12:00:00.000Z");
    mocks.referralFindFirst.mockResolvedValue({
      convertedAt: null,
      id: "invite_1",
      inviteToken: "invite_token",
      messageFormat: "SINCERE",
      recipientEmail: "jake@example.com",
      recipientEmailStep: 1,
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
      status: "SENT",
      taskId: "task_1",
    });
    mocks.referralUpdate.mockResolvedValue({
      id: "invite_1",
      recipientEmailStep: 2,
      status: "SENT",
    });

    const result = await sendReferralInvitationEmail({
      invitationId: "invite_1",
      now,
      referrerUserId: "user_1",
    });

    expect(result.status).toBe("sent");
    expect(mocks.sendExternalResendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: "Ada is still hoping you don't die",
        text: expect.stringContaining("Three days ago, Ada asked you"),
      }),
    );
    expect(mocks.referralUpdate).toHaveBeenCalledWith({
      where: { id: "invite_1" },
      data: expect.objectContaining({
        nextRecipientEmailAt: new Date("2026-05-02T12:00:00.000Z"),
        recipientEmailStep: 2,
        status: "SENT",
      }),
    });
  });

  it("does not send recipient emails past the four-email hard cap", async () => {
    mocks.referralFindFirst.mockResolvedValue({
      convertedAt: null,
      id: "invite_1",
      inviteToken: "invite_token",
      messageFormat: "TASK_NOTIFICATION",
      recipientEmail: "jake@example.com",
      recipientEmailStep: 4,
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
      status: "SENT",
      taskId: "task_1",
    });

    const result = await sendReferralInvitationEmail({
      invitationId: "invite_1",
      referrerUserId: "user_1",
    });

    expect(result).toEqual({ status: "maxed" });
    expect(mocks.sendExternalResendEmail).not.toHaveBeenCalled();
    expect(mocks.referralUpdate).not.toHaveBeenCalled();
  });

  it("does not send recipient emails for declined invitations", async () => {
    mocks.referralFindFirst.mockResolvedValue({
      convertedAt: null,
      id: "invite_1",
      inviteToken: "invite_token",
      messageFormat: "TASK_NOTIFICATION",
      recipientEmail: "jake@example.com",
      recipientEmailStep: 1,
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
      status: "DECLINED",
      taskId: "task_1",
    });

    const result = await sendReferralInvitationEmail({
      invitationId: "invite_1",
      referrerUserId: "user_1",
    });

    expect(result).toEqual({ status: "inactive" });
    expect(mocks.sendExternalResendEmail).not.toHaveBeenCalled();
    expect(mocks.referralUpdate).not.toHaveBeenCalled();
  });

  it("does not send recipient emails for cancelled invitations", async () => {
    mocks.referralFindFirst.mockResolvedValue({
      convertedAt: null,
      id: "invite_1",
      inviteToken: "invite_token",
      messageFormat: "TASK_NOTIFICATION",
      recipientEmail: "jake@example.com",
      recipientEmailStep: 1,
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
      status: "CANCELLED",
      taskId: "task_1",
    });

    const result = await sendReferralInvitationEmail({
      invitationId: "invite_1",
      referrerUserId: "user_1",
    });

    expect(result).toEqual({ status: "inactive" });
    expect(mocks.sendExternalResendEmail).not.toHaveBeenCalled();
    expect(mocks.referralUpdate).not.toHaveBeenCalled();
  });

  it("does not send recipient emails for converted invitations", async () => {
    mocks.referralFindFirst.mockResolvedValue({
      convertedAt: new Date("2026-04-25T12:00:00.000Z"),
      id: "invite_1",
      inviteToken: "invite_token",
      messageFormat: "TASK_NOTIFICATION",
      recipientEmail: "jake@example.com",
      recipientEmailStep: 1,
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
      status: "CONVERTED",
      taskId: "task_1",
    });

    const result = await sendReferralInvitationEmail({
      invitationId: "invite_1",
      referrerUserId: "user_1",
    });

    expect(result).toEqual({ status: "converted" });
    expect(mocks.sendExternalResendEmail).not.toHaveBeenCalled();
    expect(mocks.referralUpdate).not.toHaveBeenCalled();
  });

  it("does not send recipient emails after recipient unsubscribe", async () => {
    mocks.referralFindFirst.mockResolvedValue({
      convertedAt: null,
      id: "invite_1",
      inviteToken: "invite_token",
      messageFormat: "TASK_NOTIFICATION",
      recipientEmail: "jake@example.com",
      recipientEmailStep: 1,
      recipientName: "Jake",
      recipientUnsubscribeToken: "unsubscribe_token",
      recipientUnsubscribedAt: new Date("2026-04-25T12:00:00.000Z"),
      referrer: {
        id: "user_1",
        name: "Ada",
        person: null,
        referralCode: "ada123",
        username: "ada",
      },
      status: "SENT",
      taskId: "task_1",
    });

    const result = await sendReferralInvitationEmail({
      invitationId: "invite_1",
      referrerUserId: "user_1",
    });

    expect(result).toEqual({ status: "unsubscribed" });
    expect(mocks.sendExternalResendEmail).not.toHaveBeenCalled();
    expect(mocks.referralUpdate).not.toHaveBeenCalled();
  });

  it("processes only eligible due recipient reminders", async () => {
    const now = new Date("2026-04-25T12:00:00.000Z");
    mocks.referralFindMany.mockResolvedValue([{ id: "invite_1" }]);
    mocks.referralFindFirst.mockResolvedValue({
      convertedAt: null,
      id: "invite_1",
      inviteToken: "invite_token",
      messageFormat: "TASK_NOTIFICATION",
      recipientEmail: "jake@example.com",
      recipientEmailStep: 1,
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
      status: "SENT",
      taskId: "task_1",
    });
    mocks.referralUpdate.mockResolvedValue({
      id: "invite_1",
      status: "SENT",
    });

    const result = await processDueReferralInvitationRecipientEmails(now);

    expect(result).toEqual({
      failures: 0,
      scanned: 1,
      sent: 1,
      skipped: 0,
    });
    expect(mocks.referralFindMany).toHaveBeenCalledWith({
      where: {
        convertedAt: null,
        deletedAt: null,
        nextRecipientEmailAt: { lte: now },
        recipientEmail: { not: null },
        recipientEmailStep: { lt: 4 },
        recipientUnsubscribedAt: null,
        status: "SENT",
      },
      orderBy: [{ nextRecipientEmailAt: "asc" }],
      select: { id: true },
      take: 50,
    });
  });

  it("processes due sender reminders and schedules the second reminder", async () => {
    const now = new Date("2026-04-25T12:00:00.000Z");
    mocks.referralFindMany.mockResolvedValue([
      {
        id: "invite_1",
        senderReminderStep: 0,
      },
    ]);
    mocks.sendTreatySenderReminderEmailForInvitation.mockResolvedValue({
      status: "sent",
    });
    mocks.referralUpdate.mockResolvedValue({ id: "invite_1" });

    const result = await processDueReferralInvitationSenderEmails(now);

    expect(result).toEqual({
      failures: 0,
      scanned: 1,
      sent: 1,
      skipped: 0,
    });
    expect(mocks.referralFindMany).toHaveBeenCalledWith({
      where: {
        convertedAt: null,
        deletedAt: null,
        nextSenderReminderAt: { lte: now },
        senderReminderOptedInAt: { not: null },
        senderReminderStep: { lt: 2 },
        status: {
          in: ["COPIED", "SENT"],
        },
      },
      orderBy: [{ nextSenderReminderAt: "asc" }],
      select: {
        id: true,
        senderReminderStep: true,
      },
      take: 50,
    });
    expect(mocks.sendTreatySenderReminderEmailForInvitation).toHaveBeenCalledWith({
      invitationId: "invite_1",
      now,
      reminderStep: 1,
    });
    expect(mocks.referralUpdate).toHaveBeenCalledWith({
      where: { id: "invite_1" },
      data: {
        lastSenderReminderAt: now,
        nextSenderReminderAt: new Date("2026-05-02T12:00:00.000Z"),
        senderReminderStep: 1,
      },
    });
  });

  it("clears sender reminder scheduling after the second reminder", async () => {
    const now = new Date("2026-04-25T12:00:00.000Z");
    mocks.referralFindMany.mockResolvedValue([
      {
        id: "invite_1",
        senderReminderStep: 1,
      },
    ]);
    mocks.sendTreatySenderReminderEmailForInvitation.mockResolvedValue({
      status: "sent",
    });
    mocks.referralUpdate.mockResolvedValue({ id: "invite_1" });

    const result = await processDueReferralInvitationSenderEmails(now);

    expect(result).toEqual({
      failures: 0,
      scanned: 1,
      sent: 1,
      skipped: 0,
    });
    expect(mocks.sendTreatySenderReminderEmailForInvitation).toHaveBeenCalledWith({
      invitationId: "invite_1",
      now,
      reminderStep: 2,
    });
    expect(mocks.referralUpdate).toHaveBeenCalledWith({
      where: { id: "invite_1" },
      data: {
        lastSenderReminderAt: now,
        nextSenderReminderAt: null,
        senderReminderStep: 2,
      },
    });
  });

  it("stops sender reminders when the sender email is suppressed", async () => {
    const now = new Date("2026-04-25T12:00:00.000Z");
    mocks.referralFindMany.mockResolvedValue([
      {
        id: "invite_1",
        senderReminderStep: 0,
      },
    ]);
    mocks.sendTreatySenderReminderEmailForInvitation.mockResolvedValue({
      status: "suppressed",
    });
    mocks.referralUpdate.mockResolvedValue({ id: "invite_1" });

    const result = await processDueReferralInvitationSenderEmails(now);

    expect(result).toEqual({
      failures: 0,
      scanned: 1,
      sent: 0,
      skipped: 1,
    });
    expect(mocks.referralUpdate).toHaveBeenCalledWith({
      where: { id: "invite_1" },
      data: {
        lastSenderReminderAt: now,
        nextSenderReminderAt: null,
        senderReminderStep: 2,
      },
    });
  });
});


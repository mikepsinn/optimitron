import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ReferralInvitationContactMethod,
  ReferralInvitationMessageFormat,
  ReferralInvitationStatus,
} from "@optimitron/db/enums";

const mocks = vi.hoisted(() => {
  const tx = {
    person: { upsert: vi.fn() },
    referralInvitation: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    task: { updateMany: vi.fn() },
    taskComment: { create: vi.fn() },
    user: { update: vi.fn(), updateMany: vi.fn() },
  };

  return {
    createReferralInvitationTask: vi.fn(),
    ensureUserTreatyTask: vi.fn(),
    fireTaskTriggersForEvent: vi.fn().mockResolvedValue([]),
    markUserTreatyPhoneCallComplete: vi.fn(),
    markNextHumanAssignmentSubtaskComplete: vi.fn(),
    notifyTaskCommentRecipients: vi.fn(),
    recordShareAttempt: vi.fn(),
    prisma: {
      $transaction: vi.fn(),
      referendum: { findFirst: vi.fn() },
      referralInvitation: {
        count: vi.fn(),
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      task: { findFirst: vi.fn() },
      user: { findUnique: vi.fn() },
    },
    tx,
  };
});

vi.mock("@/lib/prisma", () => ({
  prisma: mocks.prisma,
}));

vi.mock("@/lib/tasks/task-comment-notifications.server", () => ({
  notifyTaskCommentRecipients: mocks.notifyTaskCommentRecipients,
}));

vi.mock("@/lib/tasks/user-treaty-task-progress.server", () => ({
  markNextHumanAssignmentSubtaskComplete:
    mocks.markNextHumanAssignmentSubtaskComplete,
  markUserTreatyPhoneCallComplete: mocks.markUserTreatyPhoneCallComplete,
}));

vi.mock("@/lib/tasks/user-treaty-task.server", () => ({
  ensureUserTreatyTask: mocks.ensureUserTreatyTask,
}));

vi.mock("@/lib/referral-invitation-tasks.server", async (importOriginal) => {
  const actual =
    (await importOriginal()) as typeof import("@/lib/referral-invitation-tasks.server");
  return {
    ...actual,
    createReferralInvitationTask: mocks.createReferralInvitationTask,
  };
});

vi.mock("@/lib/share-attempts.server", () => ({
  recordShareAttempt: mocks.recordShareAttempt,
}));

// Trigger framework is fired alongside the existing path; not relevant
// to these unit tests. Mock as no-op.
vi.mock("@/lib/triggers", () => ({
  fireTaskTrigger: vi.fn().mockResolvedValue({
    result: "filteredOut",
    spawnedTaskIds: [],
    spawnedTaskKeys: [],
  }),
  fireTaskTriggersForEvent: mocks.fireTaskTriggersForEvent,
  buildTriggerContext: (extras: Record<string, unknown> = {}) => extras,
  buildTriggerParams: () => ({}),
}));

import {
  createReferralInvitation,
  convertReferralInvitationForVote,
  markReferralInvitationCopied,
} from "../referral-invitations.server";
import { buildReferralUrl, getBaseUrl } from "@/lib/url";

describe("createReferralInvitation", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.prisma.$transaction.mockImplementation((callback) =>
      callback(mocks.tx),
    );
    mocks.prisma.user.findUnique.mockResolvedValue({
      id: "user_1",
      email: "sender@example.com",
      name: "Sender",
      person: { displayName: "Sender Person" },
      referralCode: "ref_sender",
    });
    mocks.prisma.referralInvitation.count.mockResolvedValue(0);
    mocks.prisma.referralInvitation.findFirst.mockResolvedValue(null);
    mocks.prisma.referralInvitation.findUnique.mockResolvedValue(null);
    mocks.prisma.referendum.findFirst.mockResolvedValue({ id: "referendum_1" });
    mocks.tx.person.upsert.mockResolvedValue({ id: "person_recipient" });
    mocks.ensureUserTreatyTask.mockResolvedValue({ taskId: "training_root" });
    mocks.createReferralInvitationTask.mockResolvedValue("referral_task_1");
    mocks.tx.referralInvitation.create.mockResolvedValue({
      id: "invite_1",
      inviteToken: "invite_token",
      recipientEmail: "recipient@example.com",
      recipientName: "Recipient Human",
      taskId: "referral_task_1",
    });
  });

  it("prepares the onboarding tree before the invitation transaction and does not re-fire referral.sent with partial context", async () => {
    const result = await createReferralInvitation({
      contactMethod: ReferralInvitationContactMethod.EMAIL,
      messageFormat: ReferralInvitationMessageFormat.SINCERE,
      recipientEmail: "recipient@example.com",
      recipientName: "Recipient Human",
      referrerUserId: "user_1",
    });

    expect(result.id).toBe("invite_1");
    expect(mocks.ensureUserTreatyTask).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user_1" }),
    );
    expect(mocks.ensureUserTreatyTask.mock.calls[0]?.[1]).toBeUndefined();
    expect(mocks.ensureUserTreatyTask.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.prisma.$transaction.mock.invocationCallOrder[0]!,
    );
    expect(mocks.createReferralInvitationTask).toHaveBeenCalledWith(
      expect.objectContaining({
        creatorUserId: "user_1",
        parentTaskId: "training_root",
        recipientPersonId: "person_recipient",
      }),
      mocks.tx,
    );
    expect(mocks.fireTaskTriggersForEvent).not.toHaveBeenCalledWith(
      "referral.sent",
      expect.anything(),
      expect.anything(),
    );
  });

  it("does not use a larger transaction timeout for invitation-specific writes", async () => {
    await createReferralInvitation({
      contactMethod: ReferralInvitationContactMethod.COPY,
      messageFormat: ReferralInvitationMessageFormat.TASK_NOTIFICATION,
      recipientName: "Recipient Human",
      referrerUserId: "user_1",
    });

    expect(mocks.prisma.$transaction.mock.calls[0]?.[1]).toBeUndefined();
  });

  it("replaces the general share link with the generated referral link before creating the task", async () => {
    const draftReferralUrl = buildReferralUrl("ref_sender", getBaseUrl());

    await createReferralInvitation({
      contactMethod: ReferralInvitationContactMethod.COPY,
      messageFormat: ReferralInvitationMessageFormat.TASK_NOTIFICATION,
      messageText: `Please vote here: ${draftReferralUrl}`,
      recipientName: "Recipient Human",
      referrerUserId: "user_1",
    });

    const taskInput = mocks.createReferralInvitationTask.mock.calls[0]?.[0];
    expect(taskInput.endpoint.instructions).toMatch(
      new RegExp(
        `^Please vote here: ${draftReferralUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\?invite=[\\w-]+$`,
      ),
    );
    expect(taskInput.endpoint.instructions).not.toContain("\n\n");
  });
});

describe("markReferralInvitationCopied", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.prisma.$transaction.mockImplementation((callback) =>
      callback(mocks.tx),
    );
    mocks.prisma.referralInvitation.findFirst.mockResolvedValue({
      contactMethod: ReferralInvitationContactMethod.OTHER,
      id: "invite_call",
      inviteToken: "token_call",
      messageFormat: ReferralInvitationMessageFormat.SINCERE,
      recipientName: "Call Recipient",
      shareAttemptId: null,
      status: ReferralInvitationStatus.PENDING,
      taskId: "referral_task_call",
      task: { parentTaskId: "training_root" },
      referrer: {
        email: "sender@example.com",
        name: "Sender",
        person: { displayName: "Sender Person" },
        referralCode: "ref_sender",
      },
    });
    mocks.tx.referralInvitation.findUnique.mockResolvedValue({
      id: "invite_call",
    });
    mocks.tx.referralInvitation.update.mockResolvedValue({ id: "invite_call" });
    mocks.tx.taskComment.create.mockResolvedValue({ id: "comment_1" });
    mocks.markNextHumanAssignmentSubtaskComplete.mockResolvedValue(true);
    mocks.markUserTreatyPhoneCallComplete.mockResolvedValue(true);
  });

  it("verifies the phone-call training task when a call/manual outreach is confirmed", async () => {
    await markReferralInvitationCopied({
      contactConfirmed: true,
      invitationId: "invite_call",
      referrerUserId: "user_1",
    });

    expect(mocks.markNextHumanAssignmentSubtaskComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        invitationId: "invite_call",
        recipientName: "Call Recipient",
        userId: "user_1",
      }),
      mocks.tx,
    );
    expect(mocks.markUserTreatyPhoneCallComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        invitationId: "invite_call",
        recipientName: "Call Recipient",
        userId: "user_1",
      }),
      mocks.tx,
    );
  });

  it("records the supplied direct share channel for one-human app shares", async () => {
    await markReferralInvitationCopied({
      invitationId: "invite_call",
      messageText:
        "Please vote here: https://warondisease.org/vote/ref_sender?invite=abc&sa=share_1",
      referrerUserId: "user_1",
      shareAttemptId: "share_1",
      shareChannel: "whatsapp",
    });

    expect(mocks.recordShareAttempt).toHaveBeenCalledWith(
      mocks.tx,
      expect.objectContaining({
        channel: "whatsapp",
        id: "share_1",
        renderedMessage: expect.stringContaining("invite=abc"),
        taskId: "referral_task_call",
      }),
    );
  });
});

describe("convertReferralInvitationForVote", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.prisma.$transaction.mockImplementation((callback) =>
      callback(mocks.tx),
    );
    mocks.notifyTaskCommentRecipients.mockResolvedValue({
      commentId: "comment_1",
      status: "sent",
    });
    mocks.tx.referralInvitation.update.mockResolvedValue({
      id: "invite_1",
      convertedVoteId: "vote_1",
      status: "CONVERTED",
    });
    mocks.tx.referralInvitation.findMany.mockResolvedValue([]);
    mocks.tx.task.updateMany.mockResolvedValue({ count: 1 });
    mocks.tx.taskComment.create.mockResolvedValue({ id: "comment_1" });
    mocks.tx.user.update.mockResolvedValue({ id: "referrer_1" });
    mocks.tx.user.updateMany.mockResolvedValue({ count: 1 });
  });

  it("verifies the invitation task with a status comment and task notification", async () => {
    mocks.prisma.referralInvitation.findFirst.mockResolvedValue({
      id: "invite_1",
      convertedVoteId: null,
      recipientName: "Jane",
      recipientPersonId: "person_jane",
      referendumId: "ref_1",
      referrerUserId: "referrer_1",
      status: "PENDING",
      taskId: "task_1",
    });

    const result = await convertReferralInvitationForVote({
      inviteToken: "token_1",
      referendumId: "ref_1",
      voterUserId: "voter_1",
      voteId: "vote_1",
    });

    expect(result).toEqual({
      id: "invite_1",
      convertedVoteId: "vote_1",
      status: "CONVERTED",
    });
    expect(mocks.tx.task.updateMany).toHaveBeenCalledWith({
      where: {
        id: "task_1",
        deletedAt: null,
        status: { not: "VERIFIED" },
      },
      data: {
        actualEffortSeconds: 30,
        completedAt: expect.any(Date),
        completionEvidence:
          "Jane verified a vote through referral invitation invite_1.",
        status: "VERIFIED",
        verifiedAt: expect.any(Date),
        verifiedByUserId: "voter_1",
      },
    });
    expect(mocks.tx.taskComment.create).toHaveBeenCalledWith({
      data: {
        authorUserId: "voter_1",
        kind: "STATUS_UPDATE",
        message:
          "Jane voted on the 1% Treaty. This referral task is now verified.",
        source: "SYSTEM",
        taskId: "task_1",
      },
      select: { id: true },
    });
    expect(mocks.notifyTaskCommentRecipients).toHaveBeenCalledWith({
      authorUserId: "voter_1",
      commentId: "comment_1",
      message:
        "Jane voted on the 1% Treaty. This referral task is now verified.",
      taskId: "task_1",
    });
  });

  it("increments downstream conversion counts through a three-level referrer chain", async () => {
    mocks.prisma.referralInvitation.findFirst.mockResolvedValue({
      id: "invite_leaf",
      convertedVoteId: null,
      recipientName: "Leaf Voter",
      recipientPersonId: null,
      referendumId: "ref_1",
      referrerUserId: "ancestor_3",
      status: "PENDING",
      taskId: null,
    });
    mocks.tx.referralInvitation.findMany
      .mockResolvedValueOnce([{ referrerUserId: "ancestor_2" }])
      .mockResolvedValueOnce([{ referrerUserId: "ancestor_1" }])
      .mockResolvedValueOnce([]);

    await convertReferralInvitationForVote({
      inviteToken: "token_leaf",
      referendumId: "ref_1",
      voterUserId: "voter_leaf",
      voteId: "vote_leaf",
    });

    expect(mocks.tx.user.update).toHaveBeenCalledTimes(3);
    expect(
      mocks.tx.user.update.mock.calls.map(([input]) => input.where.id),
    ).toEqual(["ancestor_3", "ancestor_2", "ancestor_1"]);
    for (const [input] of mocks.tx.user.update.mock.calls) {
      expect(input.data).toEqual({
        downstreamConversionCount: { increment: 1 },
      });
    }
  });
});

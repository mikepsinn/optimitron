import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ReferralInvitationContactMethod,
  ReferralInvitationMessageFormat,
  ReferralInvitationStatus,
} from "@optimitron/db/enums";

const mocks = vi.hoisted(() => {
  const tx = {
    person: { upsert: vi.fn() },
    referralInvitation: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    task: { updateMany: vi.fn() },
    taskComment: { create: vi.fn() },
    user: { updateMany: vi.fn() },
  };

  return {
    createReferralInvitationTask: vi.fn(),
    ensureUserTreatyTask: vi.fn(),
    fireTaskTriggersForEvent: vi.fn().mockResolvedValue([]),
    markUserTreatyPhoneCallComplete: vi.fn(),
    markNextHumanAssignmentSubtaskComplete: vi.fn(),
    notifyTaskCommentRecipients: vi.fn(),
    prisma: {
      $transaction: vi.fn(),
      referendum: { findFirst: vi.fn() },
      referralInvitation: { count: vi.fn(), findFirst: vi.fn(), findUnique: vi.fn() },
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
  postTaskCommentAndNotify: vi.fn(),
}));

vi.mock("@/lib/tasks/user-treaty-task-progress.server", () => ({
  markNextHumanAssignmentSubtaskComplete: mocks.markNextHumanAssignmentSubtaskComplete,
  markUserTreatyPhoneCallComplete: mocks.markUserTreatyPhoneCallComplete,
}));

vi.mock("@/lib/tasks/user-treaty-task.server", () => ({
  ensureUserTreatyTask: mocks.ensureUserTreatyTask,
}));

vi.mock("@/lib/referral-invitation-tasks.server", async (importOriginal) => {
  const actual = await importOriginal() as typeof import("@/lib/referral-invitation-tasks.server");
  return {
    ...actual,
    createReferralInvitationTask: mocks.createReferralInvitationTask,
  };
});

vi.mock("@/lib/share-attempts.server", () => ({
  recordShareAttempt: vi.fn(),
}));

// Trigger framework is fired alongside the existing path; not relevant
// to these unit tests. Mock as no-op.
vi.mock("@/lib/triggers", () => ({
  fireTaskTrigger: vi.fn().mockResolvedValue({ result: "filteredOut", spawnedTaskIds: [], spawnedTaskKeys: [] }),
  fireTaskTriggersForEvent: mocks.fireTaskTriggersForEvent,
  buildTriggerContext: (extras: Record<string, unknown> = {}) => extras,
  buildTriggerParams: () => ({}),
}));

import {
  createReferralInvitation,
  convertReferralInvitationForVote,
  markReferralInvitationCopied,
} from "../referral-invitations.server";

describe("createReferralInvitation", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.prisma.$transaction.mockImplementation((callback) => callback(mocks.tx));
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

  it("creates the referral task inside the invitation transaction and does not re-fire referral.sent with partial context", async () => {
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
      mocks.tx,
    );
    expect(mocks.createReferralInvitationTask).toHaveBeenCalledWith(
      expect.objectContaining({
        ownerUserId: "user_1",
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
});

describe("markReferralInvitationCopied", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.prisma.$transaction.mockImplementation((callback) => callback(mocks.tx));
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
    mocks.tx.referralInvitation.findUnique.mockResolvedValue({ id: "invite_call" });
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
});

describe("convertReferralInvitationForVote", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.prisma.$transaction.mockImplementation((callback) => callback(mocks.tx));
    mocks.notifyTaskCommentRecipients.mockResolvedValue({
      commentId: "comment_1",
      status: "sent",
    });
    mocks.tx.referralInvitation.update.mockResolvedValue({
      id: "invite_1",
      convertedVoteId: "vote_1",
      status: "CONVERTED",
    });
    mocks.tx.task.updateMany.mockResolvedValue({ count: 1 });
    mocks.tx.taskComment.create.mockResolvedValue({ id: "comment_1" });
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
});

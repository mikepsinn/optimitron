import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const tx = {
    referralInvitation: { update: vi.fn() },
    task: { updateMany: vi.fn() },
    taskComment: { create: vi.fn() },
    user: { updateMany: vi.fn() },
  };

  return {
    notifyTaskCommentRecipients: vi.fn(),
    prisma: {
      $transaction: vi.fn(),
      referralInvitation: { findFirst: vi.fn() },
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
  markNextHumanAssignmentSubtaskComplete: vi.fn(),
}));

vi.mock("@/lib/tasks/user-treaty-task.server", () => ({
  ensureUserTreatyTask: vi.fn(),
}));

vi.mock("@/lib/share-attempts.server", () => ({
  recordShareAttempt: vi.fn(),
}));

import { convertReferralInvitationForVote } from "../referral-invitations.server";

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

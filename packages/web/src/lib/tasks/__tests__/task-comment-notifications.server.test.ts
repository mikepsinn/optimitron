import { beforeEach, describe, expect, it, vi } from "vitest";
import { TaskCommentKind, TaskCommentSource } from "@optimitron/db/enums";

const mocks = vi.hoisted(() => ({
  cooldownAllowed: vi.fn(),
  draftTaskNotification: vi.fn(),
  getTaskEmailReplyInstruction: vi.fn(),
  getTaskAncestors: vi.fn(),
  personFindUnique: vi.fn(),
  resolveTaskRecipients: vi.fn(),
  recipientWithinRateLimits: vi.fn(),
  resolveTaskRecipient: vi.fn(),
  proposeOutboundMessage: vi.fn(),
  taskCommentCreate: vi.fn(),
  taskCommunicationUpdate: vi.fn(),
  taskFindUnique: vi.fn(),
  userFindUnique: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    person: { findUnique: mocks.personFindUnique },
    task: { findUnique: mocks.taskFindUnique },
    taskComment: { create: mocks.taskCommentCreate },
    taskCommunication: { update: mocks.taskCommunicationUpdate },
    user: { findUnique: mocks.userFindUnique },
  },
}));

vi.mock("@/lib/tasks/task-communications.server", () => ({
  checkTaskCommunicationCooldown: mocks.cooldownAllowed,
}));

vi.mock("@/lib/tasks/task-notifications.server", () => ({
  draftTaskNotification: mocks.draftTaskNotification,
}));

vi.mock("@/lib/email/outbound-message-approval.server", () => ({
  proposeOutboundMessage: mocks.proposeOutboundMessage,
}));

vi.mock("@/lib/email/task-notification", () => ({
  getTaskEmailReplyInstruction: mocks.getTaskEmailReplyInstruction,
}));

vi.mock("@/lib/tasks/task-recipient-rate-limit.server", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/tasks/task-recipient-rate-limit.server")
  >("@/lib/tasks/task-recipient-rate-limit.server");
  return {
    ...actual,
    recipientWithinRateLimits: mocks.recipientWithinRateLimits,
  };
});

vi.mock("@/lib/tasks/task-recipients.server", () => ({
  resolveTaskRecipient: mocks.resolveTaskRecipient,
  resolveTaskRecipients: mocks.resolveTaskRecipients,
}));

vi.mock("@/lib/tasks.server", () => ({
  getTaskAncestors: mocks.getTaskAncestors,
}));

import { postTaskCommentAndNotify } from "@/lib/tasks/task-comment-notifications.server";

describe("postTaskCommentAndNotify", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.taskCommentCreate.mockResolvedValue({ id: "comment_1" });
    mocks.resolveTaskRecipient.mockResolvedValue({
      email: "joe@example.com",
      personId: "person_2",
    });
    mocks.resolveTaskRecipients.mockImplementation(async () => {
      const recipient = await mocks.resolveTaskRecipient();
      return recipient ? [recipient] : [];
    });
    mocks.recipientWithinRateLimits.mockResolvedValue(true);
    mocks.cooldownAllowed.mockResolvedValue({ allowed: true });
    mocks.getTaskEmailReplyInstruction.mockReturnValue(
      "Reply to this email to add a comment to the task.",
    );
    mocks.taskFindUnique.mockResolvedValue({
      deletedAt: null,
      description: "Vote on the 1% Treaty.",
      id: "task_1",
      title: "Get Joe to vote on the 1% Treaty",
    });
    mocks.getTaskAncestors.mockResolvedValue([{ id: "p", title: "Treaty" }]);
    mocks.userFindUnique.mockResolvedValue({
      name: "Alice",
      person: { displayName: "Alice the Inviter" },
    });
    mocks.draftTaskNotification.mockResolvedValue({
      id: "comm_1",
      metadataJson: { unsubscribeUrl: "https://warondisease.org/unsub" },
    });
    mocks.proposeOutboundMessage.mockResolvedValue({ id: "ear_1" });
  });

  it("creates the comment and sends the notification on the happy path", async () => {
    const result = await postTaskCommentAndNotify({
      authorUserId: "user_alice",
      message: "Hey Joe, please vote.",
      taskId: "task_1",
    });

    // The comment is created; the email waits for approval.
    expect(result.status).toBe("pending_approval");
    expect(mocks.taskCommentCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        authorUserId: "user_alice",
        kind: TaskCommentKind.COMMENT,
        message: "Hey Joe, please vote.",
        source: TaskCommentSource.WEB,
        taskId: "task_1",
      }),
      select: { id: true },
    });
    expect(mocks.draftTaskNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientEmail: "joe@example.com",
        senderUserId: "user_alice",
        subject: "Get Joe to vote on the 1% Treaty",
        text: expect.stringContaining(
          "Reply to this email to add a comment to the task.",
        ),
      }),
    );
    expect(mocks.proposeOutboundMessage).toHaveBeenCalled();
  });

  it("sends admin monitoring copies as separate reason-labeled emails", async () => {
    mocks.resolveTaskRecipient.mockResolvedValue({
      email: "joe@example.com",
      personId: "person_2",
      isAdmin: false,
    });
    mocks.resolveTaskRecipients.mockResolvedValue([
      {
        email: "joe@example.com",
        personId: "person_2",
        isAdmin: false,
      },
      {
        email: "admin1@example.com",
        isAdmin: true,
        reason:
          "You're getting this admin copy because task email monitoring is turned on.",
        role: "admin_monitor",
        userId: "admin_1",
      },
      {
        email: "admin2@example.com",
        isAdmin: true,
        reason:
          "You're getting this admin copy because task email monitoring is turned on.",
        role: "admin_monitor",
        userId: "admin_2",
      },
    ]);

    const result = await postTaskCommentAndNotify({
      authorUserId: "user_alice",
      message: "Hey Joe, please vote.",
      taskId: "task_1",
    });

    expect(result.status).toBe("pending_approval");
    expect(mocks.draftTaskNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientEmail: "joe@example.com",
        bccEmails: [],
      }),
    );
    expect(mocks.draftTaskNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        audience: "OBSERVER",
        bccEmails: [],
        metadataJson: expect.objectContaining({
          recipientReason:
            "You're getting this admin copy because task email monitoring is turned on.",
          recipientRole: "admin_monitor",
        }),
        recipientEmail: "admin1@example.com",
        text: expect.stringContaining(
          "You're getting this admin copy because task email monitoring is turned on.",
        ),
      }),
    );
    expect(mocks.draftTaskNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        audience: "OBSERVER",
        bccEmails: [],
        metadataJson: expect.objectContaining({
          recipientRole: "admin_monitor",
        }),
        recipientEmail: "admin2@example.com",
      }),
    );
  });

  it("renders the comment body verbatim regardless of author override", async () => {
    mocks.userFindUnique.mockResolvedValue(null);

    await postTaskCommentAndNotify({
      authorNameOverride: "Wishonia",
      message: "Welcome.",
      taskId: "task_1",
    });

    const draftCall = mocks.draftTaskNotification.mock.calls[0]?.[0];
    expect(draftCall.subject).toBe("Get Joe to vote on the 1% Treaty");
    expect(draftCall.text).toContain("Welcome.");
  });

  it("creates the comment but skips notification when no recipient resolves", async () => {
    mocks.resolveTaskRecipient.mockResolvedValue(null);

    const result = await postTaskCommentAndNotify({
      authorUserId: "user_alice",
      message: "no one home",
      taskId: "task_1",
    });

    expect(mocks.taskCommentCreate).toHaveBeenCalled();
    expect(result.status).toBe("skipped");
    expect("reason" in result && result.reason).toBe("no_recipient");
    expect(mocks.draftTaskNotification).not.toHaveBeenCalled();
  });

  it("does not email the author when they are also the recipient", async () => {
    mocks.resolveTaskRecipient.mockResolvedValue({
      email: "alice@example.com",
      userId: "user_alice",
    });

    const result = await postTaskCommentAndNotify({
      authorUserId: "user_alice",
      message: "talking to myself",
      taskId: "task_1",
    });

    expect(mocks.taskCommentCreate).toHaveBeenCalled();
    expect(result.status).toBe("skipped");
    expect("reason" in result && result.reason).toBe("author_is_recipient");
    expect(mocks.draftTaskNotification).not.toHaveBeenCalled();
  });

  it("skips notification when the recipient is rate-limited", async () => {
    mocks.recipientWithinRateLimits.mockResolvedValue(false);

    const result = await postTaskCommentAndNotify({
      authorUserId: "user_alice",
      message: "another nudge",
      taskId: "task_1",
    });

    expect(mocks.taskCommentCreate).toHaveBeenCalled();
    expect(result.status).toBe("skipped");
    expect("reason" in result && result.reason).toBe("rate_limited");
    expect(mocks.draftTaskNotification).not.toHaveBeenCalled();
  });

  it("skips notification when the per-task cooldown is active", async () => {
    mocks.cooldownAllowed.mockResolvedValue({
      allowed: false,
      retryAfter: new Date(),
    });

    const result = await postTaskCommentAndNotify({
      authorUserId: "user_alice",
      message: "cooldown test",
      taskId: "task_1",
    });

    expect(result.status).toBe("skipped");
    expect("reason" in result && result.reason).toBe("cooldown");
  });

  it("substitutes the unsubscribe URL into the rendered metadata before sending", async () => {
    await postTaskCommentAndNotify({
      authorUserId: "user_alice",
      message: "ping",
      taskId: "task_1",
    });

    expect(mocks.taskCommunicationUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "comm_1" },
        data: expect.objectContaining({
          metadataJson: expect.objectContaining({
            html: expect.not.stringContaining("{{UNSUBSCRIBE_URL}}"),
            text: expect.not.stringContaining("{{UNSUBSCRIBE_URL}}"),
          }),
        }),
      }),
    );
  });

  it("returns failed status when queuing the approval throws", async () => {
    mocks.proposeOutboundMessage.mockRejectedValue(new Error("boom"));

    const result = await postTaskCommentAndNotify({
      authorUserId: "user_alice",
      message: "ping",
      taskId: "task_1",
    });

    expect(result.status).toBe("failed");
    expect("reason" in result && result.reason).toBe("boom");
  });
});

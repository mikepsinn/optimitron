import { TaskCommunicationStatus } from "@optimitron/db/enums";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  prepareTaskNotificationForApproval: vi.fn(),
  proposeExternalAction: vi.fn(),
  updateMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { taskCommunication: { updateMany: mocks.updateMany } },
}));

vi.mock("@/lib/tasks/task-notifications.server", () => ({
  prepareTaskNotificationForApproval: mocks.prepareTaskNotificationForApproval,
}));

vi.mock("@/lib/tasks/external-action.server", () => ({
  proposeExternalAction: mocks.proposeExternalAction,
}));

import {
  OUTBOUND_MESSAGE_OPERATION,
  proposeOutboundMessage,
} from "@/lib/email/outbound-message-approval.server";

const ENVELOPE = {
  bcc: ["monitor@example.org"],
  from: "Treaty <team@optimitron.com>",
  headers: { "Message-ID": "<comm_1@example.org>" },
  html: "<p>Please review the treaty.</p>",
  subject: "Review the treaty",
  text: "Please review the treaty.",
  to: ["manager@example.org"] as [string],
};

describe("proposeOutboundMessage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.updateMany.mockResolvedValue({ count: 1 });
    mocks.prepareTaskNotificationForApproval.mockResolvedValue({
      delivery: {
        recipientUserId: "user_recipient",
        scope: "task_notifications",
      },
      emailLogId: "approved-task-email:comm_1",
      envelope: ENVELOPE,
    });
    mocks.proposeExternalAction.mockResolvedValue({ id: "ear_1" });
  });

  it("freezes the exact provider envelope in the caller transaction", async () => {
    const db = { taskCommunication: { updateMany: mocks.updateMany } } as never;
    const now = new Date("2026-07-26T12:00:00.000Z");

    await expect(
      proposeOutboundMessage({
        actorUserId: "user_creator",
        communicationId: "comm_1",
        db,
        from: ENVELOPE.from,
        now,
        taskId: "task_1",
      }),
    ).resolves.toEqual({ id: "ear_1" });

    expect(mocks.prepareTaskNotificationForApproval).toHaveBeenCalledWith({
      communicationId: "comm_1",
      db,
      from: ENVELOPE.from,
      taskId: "task_1",
    });
    expect(mocks.proposeExternalAction).toHaveBeenCalledWith(
      {
        destination: "manager@example.org",
        expiresAt: "2026-07-29T12:00:00.000Z",
        idempotencyKey: "outbound-message:v2:comm_1",
        operation: OUTBOUND_MESSAGE_OPERATION,
        payload: {
          communicationId: "comm_1",
          delivery: {
            recipientUserId: "user_recipient",
            scope: "task_notifications",
          },
          emailLogId: "approved-task-email:comm_1",
          envelope: ENVELOPE,
          version: 2,
        },
        taskId: "task_1",
      },
      "user_creator",
      { db, systemProposal: true },
    );
  });

  it("marks the draft failed when no approval request can be created", async () => {
    const now = new Date("2026-07-26T12:00:00.000Z");
    mocks.prepareTaskNotificationForApproval.mockRejectedValue(
      new Error("draft missing"),
    );

    await expect(
      proposeOutboundMessage({
        communicationId: "comm_1",
        now,
        taskId: "task_1",
      }),
    ).rejects.toThrow("draft missing");

    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: {
        id: "comm_1",
        status: TaskCommunicationStatus.DRAFT,
      },
      data: {
        errorMessage: "approval_request_failed: draft missing",
        failedAt: now,
        status: TaskCommunicationStatus.FAILED,
      },
    });
    expect(mocks.proposeExternalAction).not.toHaveBeenCalled();
  });
});

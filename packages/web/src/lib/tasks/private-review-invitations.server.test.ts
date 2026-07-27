import { TaskClaimPolicy, TaskCommunicationStatus } from "@optimitron/db";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  candidateFindFirst: vi.fn(),
  commentFindFirst: vi.fn(),
  documentRevisionFindFirst: vi.fn(),
  documentReviewBindingMatches: vi.fn(),
  draftTaskNotification: vi.fn(),
  evaluatePrivateReviewOutreachSuppression: vi.fn(),
  externalActionFindUnique: vi.fn(),
  findExternalRecipientSuppression: vi.fn(),
  proposeOutboundMessage: vi.fn(),
  queryRaw: vi.fn(),
  recipientWithinRateLimits: vi.fn(),
  taskCommunicationFindFirst: vi.fn(),
  taskFindFirst: vi.fn(),
  userFindFirst: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: (() => {
    const tx = {
      $queryRaw: mocks.queryRaw,
      documentRevision: { findFirst: mocks.documentRevisionFindFirst },
      externalActionRequest: { findUnique: mocks.externalActionFindUnique },
      task: { findFirst: mocks.taskFindFirst },
      taskCommunication: { findFirst: mocks.taskCommunicationFindFirst },
    };
    return {
      ...tx,
      $transaction: (callback: (transaction: typeof tx) => unknown) =>
        callback(tx),
      taskCandidateMatch: { findFirst: mocks.candidateFindFirst },
      taskComment: { findFirst: mocks.commentFindFirst },
      user: { findFirst: mocks.userFindFirst },
    };
  })(),
}));

vi.mock("@/lib/email/outbound-message-approval.server", () => ({
  proposeOutboundMessage: mocks.proposeOutboundMessage,
}));

vi.mock("@/lib/tasks/document-review-binding.server", () => ({
  documentReviewBindingMatches: mocks.documentReviewBindingMatches,
}));

vi.mock("@/lib/tasks/private-review-outreach-safety.server", () => ({
  evaluatePrivateReviewOutreachSuppression:
    mocks.evaluatePrivateReviewOutreachSuppression,
}));

vi.mock("@/lib/tasks/task-notifications.server", () => ({
  draftTaskNotification: mocks.draftTaskNotification,
}));

vi.mock("@/lib/tasks/task-recipient-rate-limit.server", () => ({
  recipientWithinRateLimits: mocks.recipientWithinRateLimits,
}));

vi.mock("@/lib/tasks/external-recipient-suppression.server", () => ({
  findExternalRecipientSuppression: mocks.findExternalRecipientSuppression,
}));

vi.mock("@/lib/url", () => ({
  getBaseUrl: () => "https://optimitron.test",
}));

import { proposePrivateReviewInvitation } from "./private-review-invitations.server";

const INPUT = {
  batchKey: "batch_12345678",
  kind: "INVITATION" as const,
  recipientPersonId: "person_reviewer",
  revision: {
    contentHash: "hash_123",
    documentId: "doc_1",
    documentRevisionId: "revision_1",
    documentVersion: 1,
  },
  taskId: "task_review",
};

function managerTask() {
  return {
    assigneePerson: {
      displayName: "Ada Reviewer",
      email: "ADA@EXAMPLE.ORG",
      id: "person_reviewer",
      user: null,
    },
    assigneePersonId: "person_reviewer",
    claimPolicy: TaskClaimPolicy.ASSIGNED_ONLY,
    contextJson: {
      documentReview: {
        authorityTaskId: "task_authority",
        checklist: [],
        instructions: "Review this exact revision.",
        requestedAt: "2026-07-27T11:00:00.000Z",
        requestedByUserId: "user_manager",
        required: true,
        schema: "optimitron.review-request.v1",
        target: {
          contentHash: "hash_123",
          documentId: "doc_1",
          revisionId: "revision_1",
          version: 1,
        },
      },
    },
    id: "task_review",
    isPublic: false,
    status: "ACTIVE",
  };
}

describe("private review invitations", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.userFindFirst.mockResolvedValue({
      id: "user_manager",
      person: { displayName: "EOS Manager" },
      personId: "person_manager",
    });
    mocks.documentReviewBindingMatches.mockResolvedValue(true);
    mocks.taskFindFirst.mockResolvedValue(managerTask());
    mocks.documentRevisionFindFirst.mockResolvedValue({ id: "revision_1" });
    mocks.evaluatePrivateReviewOutreachSuppression.mockResolvedValue(null);
    mocks.taskCommunicationFindFirst.mockResolvedValue(null);
    mocks.commentFindFirst.mockResolvedValue(null);
    mocks.candidateFindFirst.mockResolvedValue(null);
    mocks.findExternalRecipientSuppression.mockResolvedValue(null);
    mocks.recipientWithinRateLimits.mockResolvedValue(true);
    mocks.draftTaskNotification.mockResolvedValue({ id: "comm_1" });
    mocks.proposeOutboundMessage.mockResolvedValue({
      id: "request_1",
      payloadHash: "payload_hash_1",
    });
  });

  it("creates a confidential draft and freezes its revision binding", async () => {
    await expect(
      proposePrivateReviewInvitation(INPUT, "user_manager", {
        now: new Date("2026-07-27T12:00:00.000Z"),
      }),
    ).resolves.toEqual({
      communicationId: "comm_1",
      externalActionRequestId: "request_1",
      payloadHash: "payload_hash_1",
      status: "pending_approval",
    });

    expect(mocks.draftTaskNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        metadataJson: expect.objectContaining({
          batchKey: "batch_12345678",
          reviewInvitation: expect.objectContaining({
            revision: INPUT.revision,
            taskId: INPUT.taskId,
          }),
        }),
        recipientEmail: "ada@example.org",
        recipientPersonId: "person_reviewer",
        subject: "Private document review invitation",
        text: expect.not.stringContaining("doc_1"),
      }),
      expect.anything(),
    );
    expect(mocks.proposeOutboundMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        approvalContext: expect.objectContaining({
          batchKey: "batch_12345678",
          revision: INPUT.revision,
          taskId: INPUT.taskId,
        }),
        communicationId: "comm_1",
      }),
    );
  });

  it("rejects a review task whose immutable binding no longer matches", async () => {
    mocks.documentReviewBindingMatches.mockResolvedValue(false);

    await expect(
      proposePrivateReviewInvitation(INPUT, "user_manager"),
    ).rejects.toThrow(
      "Invitation revision must exactly match the task's document review request",
    );
    expect(mocks.draftTaskNotification).not.toHaveBeenCalled();
  });

  it("returns the deterministic existing proposal instead of drafting twice", async () => {
    mocks.taskFindFirst.mockReset();
    mocks.taskFindFirst.mockResolvedValueOnce(managerTask());
    mocks.taskCommunicationFindFirst.mockResolvedValue({
      id: "comm_existing",
      metadataJson: {},
      sentAt: null,
      status: TaskCommunicationStatus.DRAFT,
    });
    mocks.externalActionFindUnique.mockResolvedValue({
      id: "request_existing",
      payloadHash: "payload_existing",
      status: "PENDING",
    });

    await expect(
      proposePrivateReviewInvitation(INPUT, "user_manager"),
    ).resolves.toEqual({
      communicationId: "comm_existing",
      externalActionRequestId: "request_existing",
      payloadHash: "payload_existing",
      status: "existing",
    });
    expect(mocks.draftTaskNotification).not.toHaveBeenCalled();
  });

  it("does not draft when the recipient already replied", async () => {
    mocks.evaluatePrivateReviewOutreachSuppression.mockResolvedValue(
      "recipient_replied",
    );

    await expect(
      proposePrivateReviewInvitation(INPUT, "user_manager"),
    ).resolves.toEqual({
      reason: "recipient_replied",
      status: "suppressed",
    });
    expect(mocks.draftTaskNotification).not.toHaveBeenCalled();
  });

  it("rejects a revision that is not the task's pinned review request", async () => {
    await expect(
      proposePrivateReviewInvitation(
        {
          ...INPUT,
          revision: { ...INPUT.revision, contentHash: "different_hash" },
        },
        "user_manager",
      ),
    ).rejects.toThrow(
      "Invitation revision must exactly match the task's document review request",
    );
    expect(mocks.documentRevisionFindFirst).not.toHaveBeenCalled();
    expect(mocks.draftTaskNotification).not.toHaveBeenCalled();
  });

  it("refuses the only reminder until seven days after the invitation was sent", async () => {
    const now = new Date("2026-07-27T12:00:00.000Z");
    mocks.taskFindFirst.mockReset();
    mocks.taskFindFirst.mockResolvedValueOnce(managerTask());
    mocks.taskCommunicationFindFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: "comm_invitation",
        metadataJson: {},
        sentAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1_000),
        status: TaskCommunicationStatus.SENT,
      });
    mocks.externalActionFindUnique.mockResolvedValue({
      id: "request_invitation",
      payloadHash: "payload_invitation",
      status: "EXECUTED",
    });

    await expect(
      proposePrivateReviewInvitation(
        { ...INPUT, kind: "REMINDER" },
        "user_manager",
        { now },
      ),
    ).rejects.toThrow("Review reminder is not allowed before");
    expect(mocks.draftTaskNotification).not.toHaveBeenCalled();
  });

  it("allows exactly one reminder after seven days and reuses it on replay", async () => {
    const now = new Date("2026-07-27T12:00:00.000Z");
    const reminderInput = {
      ...INPUT,
      batchKey: "reminder_batch_12345678",
      kind: "REMINDER" as const,
    };
    mocks.taskFindFirst.mockReset();
    mocks.taskFindFirst.mockResolvedValue(managerTask());
    mocks.taskCommunicationFindFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: "comm_invitation",
        metadataJson: {},
        sentAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1_000),
        status: TaskCommunicationStatus.SENT,
      })
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: "comm_invitation",
        metadataJson: {},
        sentAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1_000),
        status: TaskCommunicationStatus.SENT,
      });
    mocks.draftTaskNotification.mockResolvedValue({ id: "comm_reminder" });
    mocks.proposeOutboundMessage.mockResolvedValue({
      id: "request_reminder",
      payloadHash: "payload_reminder",
    });

    await expect(
      proposePrivateReviewInvitation(reminderInput, "user_manager", { now }),
    ).resolves.toEqual({
      communicationId: "comm_reminder",
      externalActionRequestId: "request_reminder",
      payloadHash: "payload_reminder",
      status: "pending_approval",
    });
    expect(mocks.draftTaskNotification).toHaveBeenCalledTimes(1);
    expect(mocks.draftTaskNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        purpose: "REMINDER",
        step: 1,
      }),
      expect.anything(),
    );

    mocks.taskCommunicationFindFirst.mockReset();
    mocks.taskCommunicationFindFirst.mockResolvedValue({
      id: "comm_reminder",
      metadataJson: {},
      sentAt: null,
      status: TaskCommunicationStatus.DRAFT,
    });
    mocks.externalActionFindUnique.mockResolvedValue({
      id: "request_reminder",
      payloadHash: "payload_reminder",
      status: "PENDING",
    });
    mocks.taskFindFirst.mockReset();
    mocks.taskFindFirst.mockResolvedValue(managerTask());

    await expect(
      proposePrivateReviewInvitation(
        { ...reminderInput, batchKey: "different_batch_12345678" },
        "user_manager",
        { now: new Date(now.getTime() + 24 * 60 * 60 * 1_000) },
      ),
    ).resolves.toEqual({
      communicationId: "comm_reminder",
      externalActionRequestId: "request_reminder",
      payloadHash: "payload_reminder",
      status: "existing",
    });
    expect(mocks.draftTaskNotification).toHaveBeenCalledTimes(1);
    expect(mocks.proposeOutboundMessage).toHaveBeenCalledTimes(1);
  });
});

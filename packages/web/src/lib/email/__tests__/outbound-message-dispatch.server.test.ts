import {
  ExternalActionRequestStatus,
  TaskCommunicationStatus,
} from "@optimitron/db/enums";
import { sha256CanonicalJson } from "@optimitron/data/parameters";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  externalActionFindFirst: vi.fn(),
  externalActionUpdateMany: vi.fn(),
  evaluatePrivateReviewOutreachSuppression: vi.fn(),
  expireExternalActionRequest: vi.fn(),
  finalizeApprovedExternalAction: vi.fn(),
  sendDraftTaskNotification: vi.fn(),
  privateReviewTaskMatchesApprovalContext: vi.fn(),
  taskCommunicationFindFirst: vi.fn(),
  taskCommunicationUpdateMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    externalActionRequest: {
      findFirst: mocks.externalActionFindFirst,
      updateMany: mocks.externalActionUpdateMany,
    },
    taskCommunication: {
      findFirst: mocks.taskCommunicationFindFirst,
      updateMany: mocks.taskCommunicationUpdateMany,
    },
  },
}));

vi.mock("@/lib/tasks/external-action.server", () => ({
  expireExternalActionRequest: mocks.expireExternalActionRequest,
  finalizeApprovedExternalAction: mocks.finalizeApprovedExternalAction,
}));

vi.mock("@/lib/tasks/task-notifications.server", () => ({
  sendDraftTaskNotification: mocks.sendDraftTaskNotification,
}));

vi.mock("@/lib/tasks/private-review-outreach-safety.server", () => ({
  evaluatePrivateReviewOutreachSuppression:
    mocks.evaluatePrivateReviewOutreachSuppression,
  privateReviewTaskMatchesApprovalContext:
    mocks.privateReviewTaskMatchesApprovalContext,
}));

import { OUTBOUND_MESSAGE_OPERATION } from "@/lib/email/outbound-message-approval.server";
import { dispatchApprovedOutboundMessage } from "@/lib/email/outbound-message-dispatch.server";

const DESTINATION = "assignee@example.org";
const ENVELOPE = {
  bcc: ["monitor@example.org"],
  from: "Treaty <team@optimitron.com>",
  headers: { "Message-ID": "<comm_1@example.org>" },
  html: "<p>Please review the treaty.</p>",
  replyTo: "reply@example.org",
  subject: "New task: review the treaty",
  text: "Please review the treaty.",
  to: [DESTINATION] as [string],
};
const PAYLOAD = {
  communicationId: "comm_1",
  delivery: {
    recipientUserId: "user_recipient",
    scope: "task_notifications" as const,
  },
  emailLogId: "approved-task-email:comm_1",
  envelope: ENVELOPE,
  version: 2 as const,
};

async function approvedHash() {
  return sha256CanonicalJson({
    destination: DESTINATION,
    operation: OUTBOUND_MESSAGE_OPERATION,
    payload: PAYLOAD,
  });
}

async function mockRequest(overrides?: {
  expiresAt?: Date;
  idempotencyKey?: string;
  status?: ExternalActionRequestStatus;
}) {
  const hash = await approvedHash();
  mocks.externalActionFindFirst.mockResolvedValue({
    approvedPayloadHash: hash,
    destination: DESTINATION,
    expiresAt: overrides?.expiresAt ?? new Date(Date.now() + 60_000),
    id: "ear_1",
    idempotencyKey: overrides?.idempotencyKey ?? "outbound-message:v2:comm_1",
    operation: OUTBOUND_MESSAGE_OPERATION,
    payloadHash: hash,
    payloadJson: PAYLOAD,
    status: overrides?.status ?? ExternalActionRequestStatus.APPROVED,
    taskId: "task_1",
  });
}

function mockCommunication(
  status: TaskCommunicationStatus = TaskCommunicationStatus.DRAFT,
) {
  mocks.taskCommunicationFindFirst.mockResolvedValue({
    deletedAt: null,
    emailLogId: status === TaskCommunicationStatus.SENT ? "log_1" : null,
    id: "comm_1",
    providerMessageId:
      status === TaskCommunicationStatus.SENT ? "email_1" : null,
    senderUserId: "user_creator",
    status,
  });
}

describe("dispatchApprovedOutboundMessage", () => {
  beforeEach(() => {
    for (const fn of Object.values(mocks)) fn.mockReset();
    mocks.externalActionUpdateMany.mockResolvedValue({ count: 1 });
    mocks.evaluatePrivateReviewOutreachSuppression.mockResolvedValue(null);
    mocks.privateReviewTaskMatchesApprovalContext.mockResolvedValue(true);
    mocks.taskCommunicationUpdateMany.mockResolvedValue({ count: 1 });
    mocks.sendDraftTaskNotification.mockResolvedValue({
      emailLogId: "approved-task-email:comm_1",
      providerMessageId: "email_1",
      status: "sent",
    });
  });

  it("never dispatches an approval that outlived its window", async () => {
    await mockRequest({ expiresAt: new Date(Date.now() - 60_000) });
    mockCommunication();

    await expect(
      dispatchApprovedOutboundMessage({
        approverUserId: "user_admin",
        externalActionRequestId: "ear_1",
      }),
    ).resolves.toEqual({ status: "expired" });
    expect(mocks.sendDraftTaskNotification).not.toHaveBeenCalled();
    expect(mocks.expireExternalActionRequest).toHaveBeenCalledWith("ear_1");
  });

  it("fails closed when the communication is not in the approved task", async () => {
    await mockRequest();
    mocks.taskCommunicationFindFirst.mockResolvedValue(null);

    await expect(
      dispatchApprovedOutboundMessage({
        approverUserId: "user_admin",
        externalActionRequestId: "ear_1",
      }),
    ).resolves.toEqual({ status: "failed", reason: "draft_not_found" });
    expect(mocks.taskCommunicationFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: "comm_1", taskId: "task_1" }),
      }),
    );
    expect(mocks.sendDraftTaskNotification).not.toHaveBeenCalled();
    expect(mocks.finalizeApprovedExternalAction).toHaveBeenCalledWith(
      expect.objectContaining({ result: "FAILED" }),
    );
  });

  it("is a no-op on a request that already ran", async () => {
    await mockRequest({ status: ExternalActionRequestStatus.EXECUTED });

    await expect(
      dispatchApprovedOutboundMessage({
        approverUserId: "user_admin",
        externalActionRequestId: "ear_1",
      }),
    ).resolves.toEqual({ status: "already_dispatched" });
    expect(mocks.sendDraftTaskNotification).not.toHaveBeenCalled();
  });

  it("refuses a request nobody approved", async () => {
    await mockRequest({ status: ExternalActionRequestStatus.PENDING });

    await expect(
      dispatchApprovedOutboundMessage({
        approverUserId: "user_admin",
        externalActionRequestId: "ear_1",
      }),
    ).resolves.toEqual({ status: "not_approved" });
    expect(mocks.sendDraftTaskNotification).not.toHaveBeenCalled();
  });

  it("dispatches the stored provider envelope and records its receipt", async () => {
    await mockRequest();
    mockCommunication();

    await expect(
      dispatchApprovedOutboundMessage({
        approverUserId: "user_admin",
        externalActionRequestId: "ear_1",
      }),
    ).resolves.toEqual({ status: "sent", providerMessageId: "email_1" });
    expect(mocks.sendDraftTaskNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        approvedDelivery: {
          emailLogId: "approved-task-email:comm_1",
          envelope: ENVELOPE,
          idempotencyKey: "outbound-message:v2:comm_1",
          recipientUserId: "user_recipient",
          scope: "task_notifications",
        },
        authorization: expect.objectContaining({ kind: "approved" }),
        communicationId: "comm_1",
      }),
    );
    expect(mocks.finalizeApprovedExternalAction).toHaveBeenCalledWith(
      expect.objectContaining({ result: "EXECUTED" }),
    );
  });

  it("derives the delivery key from the approved payload, not mutable request metadata", async () => {
    await mockRequest({ idempotencyKey: "tampered-delivery-key" });
    mockCommunication();

    await dispatchApprovedOutboundMessage({
      approverUserId: "user_admin",
      externalActionRequestId: "ear_1",
    });

    expect(mocks.sendDraftTaskNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        approvedDelivery: expect.objectContaining({
          idempotencyKey: "outbound-message:v2:comm_1",
        }),
      }),
    );
  });

  it("leaves ambiguous delivery failures approved and retryable", async () => {
    await mockRequest();
    mockCommunication();
    mocks.sendDraftTaskNotification.mockResolvedValue({
      reason: "transport_error",
      status: "retryable",
    });

    await expect(
      dispatchApprovedOutboundMessage({
        approverUserId: "user_admin",
        externalActionRequestId: "ear_1",
      }),
    ).resolves.toEqual({ status: "retryable", reason: "transport_error" });
    expect(mocks.externalActionUpdateMany).toHaveBeenCalledWith({
      where: { id: "ear_1", status: ExternalActionRequestStatus.APPROVED },
      data: { failureMessage: "retryable:transport_error" },
    });
    expect(mocks.finalizeApprovedExternalAction).not.toHaveBeenCalled();
  });

  it("heals an approved request when its communication is already sent", async () => {
    await mockRequest();
    mockCommunication(TaskCommunicationStatus.SENT);

    await expect(
      dispatchApprovedOutboundMessage({
        approverUserId: "user_admin",
        externalActionRequestId: "ear_1",
      }),
    ).resolves.toEqual({ status: "already_dispatched" });
    expect(mocks.sendDraftTaskNotification).not.toHaveBeenCalled();
    expect(mocks.finalizeApprovedExternalAction).toHaveBeenCalledWith(
      expect.objectContaining({
        receipt: expect.objectContaining({
          emailLogId: "log_1",
          providerMessageId: "email_1",
        }),
        result: "EXECUTED",
      }),
    );
  });

  it("rejects an approved review invitation when its exact task binding changed before dispatch", async () => {
    const reviewPayload = {
      ...PAYLOAD,
      approvalContext: {
        batchKey: "batch_12345678",
        kind: "INVITATION" as const,
        recipientPersonId: "person_1",
        revision: {
          contentHash: "hash_1",
          documentId: "doc_1",
          documentRevisionId: "revision_1",
          documentVersion: 1,
        },
        schema: "optimitron.private-review-invitation.v1" as const,
        taskId: "task_1",
      },
      version: 3 as const,
    };
    const hash = await sha256CanonicalJson({
      destination: DESTINATION,
      operation: OUTBOUND_MESSAGE_OPERATION,
      payload: reviewPayload,
    });
    mocks.externalActionFindFirst.mockResolvedValue({
      approvedPayloadHash: hash,
      destination: DESTINATION,
      expiresAt: new Date(Date.now() + 60_000),
      id: "ear_review",
      operation: OUTBOUND_MESSAGE_OPERATION,
      payloadHash: hash,
      payloadJson: reviewPayload,
      status: ExternalActionRequestStatus.APPROVED,
      taskId: "task_1",
    });
    mocks.taskCommunicationFindFirst.mockResolvedValue({
      deletedAt: null,
      emailLogId: null,
      id: "comm_1",
      metadataJson: { batchKey: "batch_12345678" },
      providerMessageId: null,
      recipientEmail: DESTINATION,
      recipientPersonId: "person_1",
      senderUserId: "user_creator",
      status: TaskCommunicationStatus.DRAFT,
    });
    mocks.privateReviewTaskMatchesApprovalContext.mockResolvedValue(false);

    await expect(
      dispatchApprovedOutboundMessage({
        approverUserId: "user_admin",
        externalActionRequestId: "ear_review",
      }),
    ).resolves.toEqual({
      status: "failed",
      reason: "review_binding_mismatch",
    });
    expect(mocks.sendDraftTaskNotification).not.toHaveBeenCalled();
    expect(mocks.finalizeApprovedExternalAction).toHaveBeenCalledWith(
      expect.objectContaining({
        failureMessage: "private_review_invitation_binding_mismatch",
        result: "FAILED",
      }),
    );
  });

  it("suppresses an approved review invitation when the reviewer replied before dispatch", async () => {
    const reviewPayload = {
      ...PAYLOAD,
      approvalContext: {
        batchKey: "batch_12345678",
        kind: "INVITATION" as const,
        recipientPersonId: "person_1",
        revision: {
          contentHash: "hash_1",
          documentId: "doc_1",
          documentRevisionId: "revision_1",
          documentVersion: 1,
        },
        schema: "optimitron.private-review-invitation.v1" as const,
        taskId: "task_1",
      },
      version: 3 as const,
    };
    const hash = await sha256CanonicalJson({
      destination: DESTINATION,
      operation: OUTBOUND_MESSAGE_OPERATION,
      payload: reviewPayload,
    });
    mocks.externalActionFindFirst.mockResolvedValue({
      approvedPayloadHash: hash,
      destination: DESTINATION,
      expiresAt: new Date(Date.now() + 60_000),
      id: "ear_review",
      operation: OUTBOUND_MESSAGE_OPERATION,
      payloadHash: hash,
      payloadJson: reviewPayload,
      status: ExternalActionRequestStatus.APPROVED,
      taskId: "task_1",
    });
    mocks.taskCommunicationFindFirst.mockResolvedValue({
      deletedAt: null,
      emailLogId: null,
      id: "comm_1",
      metadataJson: { batchKey: "batch_12345678" },
      providerMessageId: null,
      recipientEmail: DESTINATION,
      recipientPersonId: "person_1",
      senderUserId: "user_creator",
      status: TaskCommunicationStatus.DRAFT,
    });
    mocks.evaluatePrivateReviewOutreachSuppression.mockResolvedValue(
      "recipient_replied",
    );

    await expect(
      dispatchApprovedOutboundMessage({
        approverUserId: "user_admin",
        externalActionRequestId: "ear_review",
      }),
    ).resolves.toEqual({
      status: "failed",
      reason: "suppressed:recipient_replied",
    });
    expect(mocks.sendDraftTaskNotification).not.toHaveBeenCalled();
    expect(mocks.taskCommunicationUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: TaskCommunicationStatus.CANCELLED,
        }),
      }),
    );
    expect(mocks.finalizeApprovedExternalAction).toHaveBeenCalledWith(
      expect.objectContaining({
        failureMessage: "suppressed:recipient_replied",
        result: "FAILED",
      }),
    );
  });
});

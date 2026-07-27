import {
  ExternalActionRequestStatus,
  TaskCommunicationStatus,
} from "@optimitron/db/enums";
import { sha256CanonicalJson } from "@optimitron/data/parameters";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  externalActionFindFirst: vi.fn(),
  externalActionUpdateMany: vi.fn(),
  expireExternalActionRequest: vi.fn(),
  finalizeApprovedExternalAction: vi.fn(),
  sendDraftTaskNotification: vi.fn(),
  taskCommunicationFindFirst: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    externalActionRequest: {
      findFirst: mocks.externalActionFindFirst,
      updateMany: mocks.externalActionUpdateMany,
    },
    taskCommunication: { findFirst: mocks.taskCommunicationFindFirst },
  },
}));

vi.mock("@/lib/tasks/external-action.server", () => ({
  expireExternalActionRequest: mocks.expireExternalActionRequest,
  finalizeApprovedExternalAction: mocks.finalizeApprovedExternalAction,
}));

vi.mock("@/lib/tasks/task-notifications.server", () => ({
  sendDraftTaskNotification: mocks.sendDraftTaskNotification,
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
});

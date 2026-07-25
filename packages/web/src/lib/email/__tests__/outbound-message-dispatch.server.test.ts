/**
 * The dispatcher is the last thing between an approval and a stranger's inbox.
 * These cover the three ways it must refuse: the approval expired, the draft
 * changed after approval, and the request already ran.
 */
import { ExternalActionRequestStatus } from "@optimitron/db/enums";
import { sha256CanonicalJson } from "@optimitron/data/parameters";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  externalActionFindFirst: vi.fn(),
  externalActionUpdateMany: vi.fn(),
  expireExternalActionRequest: vi.fn(),
  finalizeApprovedExternalAction: vi.fn(),
  formSubmissionUpdateMany: vi.fn(),
  sendDraftTaskNotification: vi.fn(),
  taskCommunicationFindUnique: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    externalActionRequest: { findFirst: mocks.externalActionFindFirst },
    taskCommunication: { findUnique: mocks.taskCommunicationFindUnique },
  },
}));

vi.mock("@/lib/tasks/external-action.server", () => ({
  expireExternalActionRequest: mocks.expireExternalActionRequest,
  finalizeApprovedExternalAction: mocks.finalizeApprovedExternalAction,
}));

vi.mock("@/lib/tasks/task-notifications.server", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/tasks/task-notifications.server")
  >("@/lib/tasks/task-notifications.server");
  return {
    getStoredMessage: actual.getStoredMessage,
    sendDraftTaskNotification: mocks.sendDraftTaskNotification,
  };
});

import { OUTBOUND_MESSAGE_OPERATION } from "@/lib/email/outbound-message-approval.server";
import { dispatchApprovedOutboundMessage } from "@/lib/email/outbound-message-dispatch.server";

const DESTINATION = "assignee@example.org";
const APPROVED_MESSAGE = {
  html: "<p>Please review the treaty.</p>",
  subject: "New task: review the treaty",
  text: "Please review the treaty.",
};

async function approvedHash(overrides?: Partial<typeof APPROVED_MESSAGE>) {
  const message = { ...APPROVED_MESSAGE, ...overrides };
  return sha256CanonicalJson({
    destination: DESTINATION,
    operation: OUTBOUND_MESSAGE_OPERATION,
    payload: {
      communicationId: "comm_1",
      from: null,
      html: message.html,
      recipientEmail: DESTINATION,
      subject: message.subject,
      text: message.text,
    },
  });
}

function mockRequest(overrides?: {
  expiresAt?: Date;
  status?: ExternalActionRequestStatus;
}) {
  mocks.externalActionFindFirst.mockResolvedValue({
    approvedPayloadHash: null,
    destination: DESTINATION,
    expiresAt: overrides?.expiresAt ?? new Date(Date.now() + 60_000),
    id: "ear_1",
    operation: OUTBOUND_MESSAGE_OPERATION,
    payloadHash: null,
    payloadJson: {
      communicationId: "comm_1",
      from: null,
      html: APPROVED_MESSAGE.html,
      recipientEmail: DESTINATION,
      subject: APPROVED_MESSAGE.subject,
      text: APPROVED_MESSAGE.text,
    },
    status: overrides?.status ?? ExternalActionRequestStatus.APPROVED,
  });
}

function mockDraft(message = APPROVED_MESSAGE) {
  mocks.taskCommunicationFindUnique.mockResolvedValue({
    deletedAt: null,
    id: "comm_1",
    metadataJson: {
      html: message.html,
      subject: message.subject,
      text: message.text,
    },
    recipientEmail: DESTINATION,
    senderUserId: "user_creator",
  });
}

describe("dispatchApprovedOutboundMessage", () => {
  beforeEach(() => {
    for (const fn of Object.values(mocks)) fn.mockReset();
    mocks.sendDraftTaskNotification.mockResolvedValue({
      emailLogId: "log_1",
      providerMessageId: "email_1",
      status: "sent",
    });
  });

  it("never dispatches an approval that outlived its window", async () => {
    // The hash matches; only the clock disqualifies this one.
    const hash = await approvedHash();
    mocks.externalActionFindFirst.mockResolvedValue({
      approvedPayloadHash: hash,
      destination: DESTINATION,
      expiresAt: new Date(Date.now() - 60_000),
      id: "ear_1",
      operation: OUTBOUND_MESSAGE_OPERATION,
      payloadHash: hash,
      payloadJson: {
        communicationId: "comm_1",
        from: null,
        html: APPROVED_MESSAGE.html,
        recipientEmail: DESTINATION,
        subject: APPROVED_MESSAGE.subject,
        text: APPROVED_MESSAGE.text,
      },
      status: ExternalActionRequestStatus.APPROVED,
    });
    mockDraft();

    const result = await dispatchApprovedOutboundMessage({
      externalActionRequestId: "ear_1",
    });

    expect(result).toEqual({ status: "expired" });
    expect(mocks.sendDraftTaskNotification).not.toHaveBeenCalled();
    expect(mocks.expireExternalActionRequest).toHaveBeenCalledWith("ear_1");
  });

  it("refuses a draft edited after the human approved it", async () => {
    const hash = await approvedHash();
    mocks.externalActionFindFirst.mockResolvedValue({
      approvedPayloadHash: hash,
      destination: DESTINATION,
      expiresAt: new Date(Date.now() + 60_000),
      id: "ear_1",
      operation: OUTBOUND_MESSAGE_OPERATION,
      payloadHash: hash,
      payloadJson: {
        communicationId: "comm_1",
        from: null,
        html: APPROVED_MESSAGE.html,
        recipientEmail: DESTINATION,
        subject: APPROVED_MESSAGE.subject,
        text: APPROVED_MESSAGE.text,
      },
      status: ExternalActionRequestStatus.APPROVED,
    });
    mockDraft({
      ...APPROVED_MESSAGE,
      text: "Please review the treaty. Also wire us $5,000.",
    });

    const result = await dispatchApprovedOutboundMessage({
      externalActionRequestId: "ear_1",
    });

    expect(result).toEqual({ status: "failed", reason: "payload_mismatch" });
    expect(mocks.sendDraftTaskNotification).not.toHaveBeenCalled();
    expect(mocks.finalizeApprovedExternalAction).toHaveBeenCalledWith(
      expect.objectContaining({ result: "FAILED" }),
    );
  });

  it("is a no-op on a request that already ran", async () => {
    mockRequest({ status: ExternalActionRequestStatus.EXECUTED });

    await expect(
      dispatchApprovedOutboundMessage({ externalActionRequestId: "ear_1" }),
    ).resolves.toEqual({ status: "already_dispatched" });
    expect(mocks.sendDraftTaskNotification).not.toHaveBeenCalled();
  });

  it("refuses a request nobody approved", async () => {
    mockRequest({ status: ExternalActionRequestStatus.PENDING });

    await expect(
      dispatchApprovedOutboundMessage({ externalActionRequestId: "ear_1" }),
    ).resolves.toEqual({ status: "not_approved" });
    expect(mocks.sendDraftTaskNotification).not.toHaveBeenCalled();
  });

  it("sends and records the receipt when the payload still matches", async () => {
    const hash = await approvedHash();
    mocks.externalActionFindFirst.mockResolvedValue({
      approvedPayloadHash: hash,
      destination: DESTINATION,
      expiresAt: new Date(Date.now() + 60_000),
      id: "ear_1",
      operation: OUTBOUND_MESSAGE_OPERATION,
      payloadHash: hash,
      payloadJson: {
        communicationId: "comm_1",
        from: null,
        html: APPROVED_MESSAGE.html,
        recipientEmail: DESTINATION,
        subject: APPROVED_MESSAGE.subject,
        text: APPROVED_MESSAGE.text,
      },
      status: ExternalActionRequestStatus.APPROVED,
    });
    mockDraft();

    const result = await dispatchApprovedOutboundMessage({
      externalActionRequestId: "ear_1",
    });

    expect(result).toEqual({ status: "sent", providerMessageId: "email_1" });
    expect(mocks.sendDraftTaskNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        authorization: expect.objectContaining({ kind: "approved" }),
        communicationId: "comm_1",
      }),
    );
    expect(mocks.finalizeApprovedExternalAction).toHaveBeenCalledWith(
      expect.objectContaining({ result: "EXECUTED" }),
    );
  });
});

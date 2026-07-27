import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  dispatchApprovedOutboundMessage: vi.fn(),
  externalActionFindMany: vi.fn(),
  externalActionUpdateMany: vi.fn(),
  taskCommunicationFindMany: vi.fn(),
  transaction: vi.fn(),
  userFindFirst: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { $transaction: mocks.transaction },
}));

vi.mock("@/lib/email/outbound-message-dispatch.server", () => ({
  dispatchApprovedOutboundMessage: mocks.dispatchApprovedOutboundMessage,
}));

import {
  approveAndDispatchOutboundMessageBatch,
  approveOutboundMessageBatch,
} from "./outbound-message-batch.server";

const NOW = new Date("2026-07-27T12:00:00.000Z");
const BATCH_KEY = "batch_12345678";
const REQUEST_HASH_1 = "a".repeat(64);
const REQUEST_HASH_2 = "b".repeat(64);

function payload(communicationId: string, taskId: string) {
  return {
    approvalContext: {
      batchKey: BATCH_KEY,
      kind: "INVITATION",
      recipientPersonId: `person_${communicationId}`,
      revision: {
        contentHash: "hash_1",
        documentId: "doc_1",
        documentRevisionId: "revision_1",
        documentVersion: 1,
      },
      schema: "optimitron.private-review-invitation.v1",
      taskId,
    },
    communicationId,
    delivery: { recipientUserId: null, scope: "task_notifications" },
    emailLogId: `log_${communicationId}`,
    envelope: {
      from: "EOS <team@optimitron.com>",
      html: "<p>Review invitation</p>",
      subject: "Private document review invitation",
      text: "Review invitation",
      to: [`${communicationId}@example.org`],
    },
    version: 3,
  };
}

function setupExactBatch() {
  const requests = [
    {
      expiresAt: new Date(NOW.getTime() + 60_000),
      id: "request_1",
      payloadHash: REQUEST_HASH_1,
      payloadJson: payload("comm_1", "task_1"),
      taskId: "task_1",
    },
    {
      expiresAt: new Date(NOW.getTime() + 60_000),
      id: "request_2",
      payloadHash: REQUEST_HASH_2,
      payloadJson: payload("comm_2", "task_2"),
      taskId: "task_2",
    },
  ];
  mocks.externalActionFindMany.mockResolvedValue(requests);
  mocks.taskCommunicationFindMany
    .mockResolvedValueOnce([
      { id: "comm_1", metadataJson: { batchKey: BATCH_KEY }, taskId: "task_1" },
      { id: "comm_2", metadataJson: { batchKey: BATCH_KEY }, taskId: "task_2" },
    ])
    .mockResolvedValueOnce([{ id: "comm_1" }, { id: "comm_2" }]);
  return requests;
}

const INPUT = {
  batchKey: BATCH_KEY,
  requests: [
    {
      expectedPayloadHash: REQUEST_HASH_1,
      externalActionRequestId: "request_1",
    },
    {
      expectedPayloadHash: REQUEST_HASH_2,
      externalActionRequestId: "request_2",
    },
  ],
};

describe("outbound message batch approval", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.userFindFirst.mockResolvedValue({
      id: "user_manager",
      personId: "person_manager",
    });
    mocks.externalActionUpdateMany.mockResolvedValue({ count: 1 });
    mocks.transaction.mockImplementation(async (callback) =>
      callback({
        externalActionRequest: {
          findMany: mocks.externalActionFindMany,
          updateMany: mocks.externalActionUpdateMany,
        },
        taskCommunication: {
          findMany: mocks.taskCommunicationFindMany,
        },
        user: { findFirst: mocks.userFindFirst },
      }),
    );
  });

  it("validates and approves every exact payload in one transaction", async () => {
    setupExactBatch();

    await expect(
      approveOutboundMessageBatch(INPUT, "user_manager", { now: NOW }),
    ).resolves.toEqual({
      batchKey: BATCH_KEY,
      requests: [
        {
          externalActionRequestId: "request_1",
          payloadHash: REQUEST_HASH_1,
        },
        {
          externalActionRequestId: "request_2",
          payloadHash: REQUEST_HASH_2,
        },
      ],
      status: "approved",
    });
    expect(mocks.externalActionUpdateMany).toHaveBeenCalledTimes(2);
    expect(mocks.externalActionUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          approvedByUserId: "user_manager",
          approvedPayloadHash: REQUEST_HASH_1,
          status: "APPROVED",
        }),
      }),
    );
  });

  it("fails before any approval write when one preview hash changed", async () => {
    setupExactBatch();
    const changed = {
      ...INPUT,
      requests: [
        INPUT.requests[0],
        { ...INPUT.requests[1], expectedPayloadHash: "c".repeat(64) },
      ],
    };

    await expect(
      approveOutboundMessageBatch(changed, "user_manager", { now: NOW }),
    ).rejects.toThrow("changed after preview");
    expect(mocks.externalActionUpdateMany).not.toHaveBeenCalled();
  });

  it("refuses a partial approval when the batch contains another draft", async () => {
    setupExactBatch();
    mocks.taskCommunicationFindMany.mockReset();
    mocks.taskCommunicationFindMany
      .mockResolvedValueOnce([
        {
          id: "comm_1",
          metadataJson: { batchKey: BATCH_KEY },
          taskId: "task_1",
        },
        {
          id: "comm_2",
          metadataJson: { batchKey: BATCH_KEY },
          taskId: "task_2",
        },
      ])
      .mockResolvedValueOnce([
        { id: "comm_1" },
        { id: "comm_2" },
        { id: "comm_hidden" },
      ]);

    await expect(
      approveOutboundMessageBatch(INPUT, "user_manager", { now: NOW }),
    ).rejects.toThrow("every pending message in the exact batch");
    expect(mocks.externalActionUpdateMany).not.toHaveBeenCalled();
  });

  it("dispatches independently only after the atomic approval succeeds", async () => {
    setupExactBatch();
    mocks.dispatchApprovedOutboundMessage
      .mockResolvedValueOnce({ status: "sent", providerMessageId: "email_1" })
      .mockResolvedValueOnce({ status: "retryable", reason: "transport" });

    const result = await approveAndDispatchOutboundMessageBatch(
      INPUT,
      "user_manager",
      { now: NOW },
    );

    expect(result.dispatches).toEqual([
      {
        externalActionRequestId: "request_1",
        result: { status: "sent", providerMessageId: "email_1" },
      },
      {
        externalActionRequestId: "request_2",
        result: { status: "retryable", reason: "transport" },
      },
    ]);
  });
});

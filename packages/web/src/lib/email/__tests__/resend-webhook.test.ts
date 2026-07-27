import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  emailLogFindFirst: vi.fn(),
  emailLogUpdate: vi.fn(),
  emailLogUpdateMany: vi.fn(),
  persistExternalSuppression: vi.fn(),
  taskCandidateMatchUpdateMany: vi.fn(),
  taskCommunicationFindMany: vi.fn(),
  unsubscribe: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    emailLog: {
      findFirst: mocks.emailLogFindFirst,
      update: mocks.emailLogUpdate,
      updateMany: mocks.emailLogUpdateMany,
    },
    taskCandidateMatch: { updateMany: mocks.taskCandidateMatchUpdateMany },
    taskCommunication: { findMany: mocks.taskCommunicationFindMany },
  },
}));

vi.mock("@/lib/email/suppression.server", () => ({
  applyUnsubscribe: mocks.unsubscribe,
}));

vi.mock("@/lib/tasks/external-recipient-suppression.server", () => ({
  persistExternalRecipientSuppressionForEmailLog:
    mocks.persistExternalSuppression,
}));

import { EmailLogStatus, TaskCandidateMatchStatus } from "@optimitron/db";
import {
  applyBounceEvent,
  applyComplaintEvent,
  applyDeliveredEvent,
  applyFailedEvent,
  applySuppressedEvent,
  verifyResendSignature,
} from "../resend-webhook";

function signTestPayload(input: {
  id: string;
  ts: string;
  body: string;
  secret: string;
}) {
  const rawSecret = input.secret.startsWith("whsec_")
    ? input.secret.slice(6)
    : input.secret;
  const secretBytes = Buffer.from(rawSecret, "base64");
  const sig = createHmac("sha256", secretBytes)
    .update(`${input.id}.${input.ts}.${input.body}`)
    .digest("base64");
  return `v1,${sig}`;
}

describe("verifyResendSignature", () => {
  // Resend secrets are typically `whsec_<base64>`; we use a known raw base64 here.
  const secret = "whsec_dGVzdC1zZWNyZXQtMTIzNA=="; // "test-secret-1234"
  const rawBody = JSON.stringify({
    type: "email.complained",
    data: { email_id: "abc" },
  });
  const svixId = "msg_01HV000";
  const svixTimestamp = "1700000000";

  it("verifies a correctly signed payload", () => {
    const svixSignature = signTestPayload({
      id: svixId,
      ts: svixTimestamp,
      body: rawBody,
      secret,
    });
    expect(
      verifyResendSignature({
        rawBody,
        svixId,
        svixTimestamp,
        svixSignature,
        secret,
      }),
    ).toBe(true);
  });

  it("rejects when any header is missing", () => {
    const svixSignature = signTestPayload({
      id: svixId,
      ts: svixTimestamp,
      body: rawBody,
      secret,
    });
    expect(
      verifyResendSignature({
        rawBody,
        svixId: null,
        svixTimestamp,
        svixSignature,
        secret,
      }),
    ).toBe(false);
    expect(
      verifyResendSignature({
        rawBody,
        svixId,
        svixTimestamp: null,
        svixSignature,
        secret,
      }),
    ).toBe(false);
    expect(
      verifyResendSignature({
        rawBody,
        svixId,
        svixTimestamp,
        svixSignature: null,
        secret,
      }),
    ).toBe(false);
  });

  it("rejects when the body has been tampered with", () => {
    const svixSignature = signTestPayload({
      id: svixId,
      ts: svixTimestamp,
      body: rawBody,
      secret,
    });
    const tampered = rawBody.replace("complained", "delivered");
    expect(
      verifyResendSignature({
        rawBody: tampered,
        svixId,
        svixTimestamp,
        svixSignature,
        secret,
      }),
    ).toBe(false);
  });

  it("rejects when the secret does not match", () => {
    const svixSignature = signTestPayload({
      id: svixId,
      ts: svixTimestamp,
      body: rawBody,
      secret,
    });
    expect(
      verifyResendSignature({
        rawBody,
        svixId,
        svixTimestamp,
        svixSignature,
        secret: "whsec_d3JvbmctMTIzNA==",
      }),
    ).toBe(false);
  });

  it("accepts a header containing multiple signature entries (one matching)", () => {
    const goodSig = signTestPayload({
      id: svixId,
      ts: svixTimestamp,
      body: rawBody,
      secret,
    });
    const svixSignature = `v1,notReallyAValidOne ${goodSig}`;
    expect(
      verifyResendSignature({
        rawBody,
        svixId,
        svixTimestamp,
        svixSignature,
        secret,
      }),
    ).toBe(true);
  });

  it("rejects an unknown signature version", () => {
    const goodSig = signTestPayload({
      id: svixId,
      ts: svixTimestamp,
      body: rawBody,
      secret,
    });
    const svixSignature = goodSig.replace("v1,", "v2,");
    expect(
      verifyResendSignature({
        rawBody,
        svixId,
        svixTimestamp,
        svixSignature,
        secret,
      }),
    ).toBe(false);
  });
});

describe("resend delivery state webhooks", () => {
  beforeEach(() => {
    for (const mock of Object.values(mocks)) mock.mockReset();
    mocks.emailLogFindFirst.mockResolvedValue({
      id: "email_log_1",
      templateId: "task-assigned",
      userId: "user_1",
    });
    mocks.emailLogUpdateMany.mockResolvedValue({ count: 1 });
    mocks.emailLogUpdate.mockResolvedValue({ id: "email_log_1" });
    mocks.persistExternalSuppression.mockResolvedValue(1);
    mocks.taskCandidateMatchUpdateMany.mockResolvedValue({ count: 1 });
    mocks.taskCommunicationFindMany.mockResolvedValue([]);
  });

  it("only marks transient email logs failed for failed events", async () => {
    await applyFailedEvent({
      type: "email.failed",
      data: {
        email_id: "resend_1",
        error: { message: "Provider failed." },
      },
    });

    expect(mocks.emailLogUpdateMany).toHaveBeenCalledWith({
      where: {
        id: "email_log_1",
        status: { in: [EmailLogStatus.QUEUED, EmailLogStatus.SENT] },
      },
      data: {
        errorMessage: "Provider failed.",
        status: EmailLogStatus.FAILED,
      },
    });
  });

  it("only marks transient email logs failed for suppressed events", async () => {
    await applySuppressedEvent({
      type: "email.suppressed",
      data: {
        email_id: "resend_1",
        reason: "Recipient is suppressed.",
      },
    });

    expect(mocks.emailLogUpdateMany).toHaveBeenCalledWith({
      where: {
        id: "email_log_1",
        status: { in: [EmailLogStatus.QUEUED, EmailLogStatus.SENT] },
      },
      data: {
        errorMessage: "Recipient is suppressed.",
        status: EmailLogStatus.FAILED,
      },
    });
    expect(mocks.persistExternalSuppression).toHaveBeenCalledWith({
      emailLogId: "email_log_1",
      reason: "provider_suppressed",
    });
  });

  it("persists a complaint for a Person-only recipient", async () => {
    mocks.emailLogFindFirst.mockResolvedValue({
      id: "email_log_1",
      templateId: "private-review",
      userId: null,
    });

    await applyComplaintEvent({
      type: "email.complained",
      data: { email_id: "resend_1" },
    });

    expect(mocks.unsubscribe).not.toHaveBeenCalled();
    expect(mocks.persistExternalSuppression).toHaveBeenCalledWith({
      emailLogId: "email_log_1",
      reason: "complaint",
    });
  });

  it("persists a hard bounce for a Person-only recipient", async () => {
    mocks.emailLogFindFirst.mockResolvedValue({
      id: "email_log_1",
      templateId: "private-review",
      userId: null,
    });

    await applyBounceEvent({
      type: "email.bounced",
      data: {
        bounce: { message: "Mailbox does not exist", type: "hard" },
        email_id: "resend_1",
      },
    });

    expect(mocks.persistExternalSuppression).toHaveBeenCalledWith({
      emailLogId: "email_log_1",
      reason: "hard_bounce",
    });
  });

  it("marks a suggested Person candidate contacted only after delivery", async () => {
    mocks.taskCommunicationFindMany.mockResolvedValue([
      {
        recipientPersonId: "person_1",
        task: {
          contextJson: {
            documentReview: {
              authorityTaskId: "task_authority",
              checklist: [],
              instructions: "Review the pinned revision.",
              requestedAt: "2026-07-27T11:00:00.000Z",
              requestedByUserId: "manager_user",
              required: true,
              schema: "optimitron.review-request.v1",
              target: {
                contentHash: "hash_1",
                documentId: "document_1",
                revisionId: "revision_1",
                version: 1,
              },
            },
          },
        },
        taskId: "review_task",
      },
    ]);

    await applyDeliveredEvent({
      type: "email.delivered",
      data: { email_id: "resend_1" },
    });

    expect(mocks.taskCandidateMatchUpdateMany).toHaveBeenCalledWith({
      where: {
        candidatePersonId: "person_1",
        deletedAt: null,
        status: TaskCandidateMatchStatus.SUGGESTED,
        taskId: "task_authority",
      },
      data: { status: TaskCandidateMatchStatus.CONTACTED },
    });
  });
});

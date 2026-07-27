import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  candidateFindFirst: vi.fn(),
  commentFindFirst: vi.fn(),
  documentRevisionFindFirst: vi.fn(),
  documentReviewBindingMatches: vi.fn(),
  findExternalRecipientSuppression: vi.fn(),
  recipientWithinRateLimits: vi.fn(),
  taskFindFirst: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    documentRevision: { findFirst: mocks.documentRevisionFindFirst },
    task: { findFirst: mocks.taskFindFirst },
    taskCandidateMatch: { findFirst: mocks.candidateFindFirst },
    taskComment: { findFirst: mocks.commentFindFirst },
  },
}));

vi.mock("@/lib/tasks/external-recipient-suppression.server", () => ({
  findExternalRecipientSuppression: mocks.findExternalRecipientSuppression,
}));

vi.mock("@/lib/tasks/document-review-binding.server", () => ({
  documentReviewBindingMatches: mocks.documentReviewBindingMatches,
}));

vi.mock("@/lib/tasks/task-recipient-rate-limit.server", () => ({
  recipientWithinRateLimits: mocks.recipientWithinRateLimits,
}));

import {
  evaluatePrivateReviewOutreachSuppression,
  privateReviewTaskMatchesApprovalContext,
} from "./private-review-outreach-safety.server";

const INPUT = {
  now: new Date("2026-07-27T12:00:00.000Z"),
  recipientEmail: "reviewer@example.org",
  recipientPersonId: "person_1",
  taskId: "task_1",
};

describe("private review outreach safety", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.taskFindFirst.mockResolvedValue({
      executionAttempts: [],
      status: "ACTIVE",
    });
    mocks.commentFindFirst.mockResolvedValue(null);
    mocks.candidateFindFirst.mockResolvedValue(null);
    mocks.findExternalRecipientSuppression.mockResolvedValue(null);
    mocks.recipientWithinRateLimits.mockResolvedValue(true);
    mocks.documentRevisionFindFirst.mockResolvedValue({
      document: { currentRevisionId: "revision_1", version: 1 },
      id: "revision_1",
    });
    mocks.documentReviewBindingMatches.mockResolvedValue(true);
  });

  it("allows an active unanswered review below recipient limits", async () => {
    await expect(
      evaluatePrivateReviewOutreachSuppression(INPUT),
    ).resolves.toBeNull();
  });

  it.each([
    ["completed attempt", "review_completed", "task"],
    ["email reply", "recipient_replied", "reply"],
    ["declined candidate", "recipient_declined", "declined"],
    ["hard bounce", "hard_bounce", "suppression"],
    ["recipient rate limit", "recipient_rate_limited", "rate"],
  ] as const)("suppresses after %s", async (_label, expected, state) => {
    if (state === "task") {
      mocks.taskFindFirst.mockResolvedValue({
        executionAttempts: [{ id: "attempt_1" }],
        status: "ACTIVE",
      });
    } else if (state === "reply") {
      mocks.commentFindFirst.mockResolvedValue({ id: "comment_1" });
    } else if (state === "declined") {
      mocks.candidateFindFirst.mockResolvedValue({ id: "candidate_1" });
    } else if (state === "suppression") {
      mocks.findExternalRecipientSuppression.mockResolvedValue({
        communicationId: "comm_1",
        reason: "hard_bounce",
      });
    } else {
      mocks.recipientWithinRateLimits.mockResolvedValue(false);
    }

    await expect(evaluatePrivateReviewOutreachSuppression(INPUT)).resolves.toBe(
      expected,
    );
  });

  it("revalidates the live task and exact revision binding before dispatch", async () => {
    mocks.taskFindFirst.mockResolvedValue({
      assigneePersonId: "person_1",
      claimPolicy: "ASSIGNED_ONLY",
      contextJson: {
        documentReview: {
          authorityTaskId: "task_authority",
          checklist: [],
          instructions: "Review this revision.",
          requestedAt: "2026-07-27T11:00:00.000Z",
          requestedByUserId: "user_manager",
          required: true,
          schema: "optimitron.review-request.v1",
          target: {
            contentHash: "hash_1",
            documentId: "doc_1",
            revisionId: "revision_1",
            version: 1,
          },
        },
      },
      isPublic: false,
      status: "ACTIVE",
    });

    await expect(
      privateReviewTaskMatchesApprovalContext({
        batchKey: "batch_12345678",
        kind: "INVITATION",
        recipientPersonId: "person_1",
        revision: {
          contentHash: "hash_1",
          documentId: "doc_1",
          documentRevisionId: "revision_1",
          documentVersion: 1,
        },
        schema: "optimitron.private-review-invitation.v1",
        taskId: "task_1",
      }),
    ).resolves.toBe(true);
  });

  it("rejects dispatch after the canonical document advances", async () => {
    mocks.taskFindFirst.mockResolvedValue({
      assigneePersonId: "person_1",
      claimPolicy: "ASSIGNED_ONLY",
      contextJson: {
        documentReview: {
          authorityTaskId: "task_authority",
          checklist: [],
          instructions: "Review this revision.",
          requestedAt: "2026-07-27T11:00:00.000Z",
          requestedByUserId: "user_manager",
          required: true,
          schema: "optimitron.review-request.v1",
          target: {
            contentHash: "hash_1",
            documentId: "doc_1",
            revisionId: "revision_1",
            version: 1,
          },
        },
      },
      isPublic: false,
      status: "ACTIVE",
    });
    mocks.documentRevisionFindFirst.mockResolvedValue({
      document: { currentRevisionId: "revision_2", version: 2 },
      id: "revision_1",
    });

    await expect(
      privateReviewTaskMatchesApprovalContext({
        batchKey: "batch_12345678",
        kind: "INVITATION",
        recipientPersonId: "person_1",
        revision: {
          contentHash: "hash_1",
          documentId: "doc_1",
          documentRevisionId: "revision_1",
          documentVersion: 1,
        },
        schema: "optimitron.private-review-invitation.v1",
        taskId: "task_1",
      }),
    ).resolves.toBe(false);
  });

  it("rejects dispatch when the review binding changed after approval", async () => {
    mocks.taskFindFirst.mockResolvedValue({
      assigneePersonId: "person_1",
      claimPolicy: "ASSIGNED_ONLY",
      contextJson: {
        documentReview: {
          authorityTaskId: "task_authority",
          checklist: [],
          instructions: "Review this revision.",
          requestedAt: "2026-07-27T11:00:00.000Z",
          requestedByUserId: "user_manager",
          required: true,
          schema: "optimitron.review-request.v1",
          target: {
            contentHash: "hash_1",
            documentId: "doc_1",
            revisionId: "revision_1",
            version: 1,
          },
        },
      },
      isPublic: false,
      status: "ACTIVE",
    });
    mocks.documentReviewBindingMatches.mockResolvedValue(false);

    await expect(
      privateReviewTaskMatchesApprovalContext({
        batchKey: "batch_12345678",
        kind: "INVITATION",
        recipientPersonId: "person_1",
        revision: {
          contentHash: "hash_1",
          documentId: "doc_1",
          documentRevisionId: "revision_1",
          documentVersion: 1,
        },
        schema: "optimitron.private-review-invitation.v1",
        taskId: "task_1",
      }),
    ).resolves.toBe(false);
  });
});

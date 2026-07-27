import { TaskStatus, TaskVerificationResult } from "@optimitron/db/enums";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  assertDocumentAccess: vi.fn(),
  configureContributionReceiptBindingInTransaction: vi.fn(),
  lockContentResources: vi.fn(),
  sha256CanonicalJson: vi.fn(async (_value: unknown) => "test_hash"),
  prisma: {
    documentRevisionFindFirst: vi.fn(),
    taskFindFirst: vi.fn(),
    taskFindMany: vi.fn(),
    taskFindUnique: vi.fn(),
    transaction: vi.fn(),
    userFindFirst: vi.fn(),
  },
  tx: {
    documentCreate: vi.fn(),
    documentFindFirst: vi.fn(),
    documentRevisionCreate: vi.fn(),
    documentRevisionFindFirst: vi.fn(),
    documentUpdate: vi.fn(),
    documentUpdateMany: vi.fn(),
    personFindFirst: vi.fn(),
    queryRaw: vi.fn(),
    taskCreate: vi.fn(),
    taskExecutionArtifactCreate: vi.fn(),
    taskExecutionAttemptCreate: vi.fn(),
    taskExecutionAttemptFindFirst: vi.fn(),
    taskExecutionAttemptFindMany: vi.fn(),
    taskFindFirst: vi.fn(),
    taskFindMany: vi.fn(),
    taskUpdateMany: vi.fn(),
    taskVerificationCreate: vi.fn(),
    userFindFirst: vi.fn(),
  },
}));

function transactionClient() {
  return {
    $queryRaw: mocks.tx.queryRaw,
    document: {
      create: mocks.tx.documentCreate,
      findFirst: mocks.tx.documentFindFirst,
      update: mocks.tx.documentUpdate,
      updateMany: mocks.tx.documentUpdateMany,
    },
    documentRevision: {
      create: mocks.tx.documentRevisionCreate,
      findFirst: mocks.tx.documentRevisionFindFirst,
    },
    person: { findFirst: mocks.tx.personFindFirst },
    task: {
      create: mocks.tx.taskCreate,
      findFirst: mocks.tx.taskFindFirst,
      findMany: mocks.tx.taskFindMany,
      updateMany: mocks.tx.taskUpdateMany,
    },
    taskExecutionArtifact: {
      create: mocks.tx.taskExecutionArtifactCreate,
    },
    taskExecutionAttempt: {
      create: mocks.tx.taskExecutionAttemptCreate,
      findFirst: mocks.tx.taskExecutionAttemptFindFirst,
      findMany: mocks.tx.taskExecutionAttemptFindMany,
    },
    taskVerification: { create: mocks.tx.taskVerificationCreate },
    user: { findFirst: mocks.tx.userFindFirst },
  };
}

vi.mock("@/lib/content-access.server", () => ({
  assertDocumentAccess: mocks.assertDocumentAccess,
  lockContentResources: mocks.lockContentResources,
}));

vi.mock("@/lib/task-funding/contribution-receipts.server", () => ({
  configureContributionReceiptBindingInTransaction:
    mocks.configureContributionReceiptBindingInTransaction,
}));

vi.mock("@optimitron/data/parameters", () => ({
  sha256CanonicalJson: mocks.sha256CanonicalJson,
}));

vi.mock("@/lib/tasks/task-visibility.server", () => ({
  getTaskAccessWhere: vi.fn(() => ({})),
  getTaskClientAccessWhere: vi.fn(() => ({})),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: mocks.prisma.transaction,
    documentRevision: {
      findFirst: mocks.prisma.documentRevisionFindFirst,
    },
    task: {
      findFirst: mocks.prisma.taskFindFirst,
      findMany: mocks.prisma.taskFindMany,
      findUnique: mocks.prisma.taskFindUnique,
    },
    user: { findFirst: mocks.prisma.userFindFirst },
  },
}));

import {
  adoptDocumentRevision,
  applyDocumentProposal,
  getDocumentReviewPanelData,
  hasAssignedDocumentReviewRevisionAccess,
  requestDocumentReview,
  submitDocumentReview,
} from "./document-review.server";

const TARGET = {
  contentHash: "target_hash",
  documentId: "document_1",
  revisionId: "revision_1",
  version: 1,
};

const REQUEST = {
  authorityTaskId: "authority_task",
  checklist: [
    { criterion: "Check every cited source", id: "sources", required: true },
  ],
  instructions: "Review the pinned revision.",
  requestedAt: "2026-07-27T12:00:00.000Z",
  requestedByUserId: "manager_user",
  required: true,
  schema: "optimitron.review-request.v1" as const,
  target: TARGET,
};

const AUTHORITY_TASK = {
  category: "GOVERNANCE",
  id: "authority_task",
  isPublic: false,
  jurisdictionId: null,
  ownerOrganizationId: "organization_1",
};

function exactRevision(overrides: Record<string, unknown> = {}) {
  return {
    body: "Pinned body",
    contentHash: TARGET.contentHash,
    createdByUser: { personId: "author_person" },
    createdByUserId: "author_user",
    document: {
      currentRevisionId: TARGET.revisionId,
      id: TARGET.documentId,
      version: TARGET.version,
    },
    documentId: TARGET.documentId,
    id: TARGET.revisionId,
    title: "Pinned document",
    version: TARGET.version,
    ...overrides,
  };
}

function reviewTask(input: {
  proposalDocument?: typeof TARGET;
  reviewerPersonId: string;
  response?: "APPROVE" | "CHANGES_REQUESTED";
  reviewTaskId: string;
  selfReviewed?: boolean;
}) {
  const response = input.response
    ? {
        checklistResponses: [{ criterionId: "sources", result: "PASS" }],
        explanation: "Reviewed completely.",
        ...(input.proposalDocument
          ? { proposalDocument: input.proposalDocument }
          : {}),
        reviewTaskId: input.reviewTaskId,
        reviewerUserId: `${input.reviewTaskId}_user`,
        schema: "optimitron.review-response.v1",
        submittedAt: "2026-07-27T13:00:00.000Z",
        target: TARGET,
        verdict: input.response,
      }
    : null;
  return {
    applicationPolicy: "CLOSED",
    assigneePerson: {
      displayName: "Reviewer",
      email: "reviewer@example.test",
      id: input.reviewerPersonId,
    },
    assigneePersonId: input.reviewerPersonId,
    claimPolicy: "ASSIGNED_ONLY",
    contextJson: {
      documentReview: REQUEST,
      documentReviewBindingHash: "test_hash",
      documentReviewRequestHash: "test_hash",
    },
    createdByUserId: "manager_user",
    executionMode: "HUMAN_ONLY",
    executionAttempts: response
      ? [
          {
            artifacts: [
              {
                id: `${input.reviewTaskId}_artifact`,
                metadataJson: { kind: "document-review-response" },
                structuredResultJson: response,
                submittedByUserId: response.reviewerUserId,
              },
            ],
            executorPersonId: input.reviewerPersonId,
            executorUserId: response.reviewerUserId,
            status: "COMPLETED",
            verifications: [
              {
                id: `${input.reviewTaskId}_verification`,
                result: TaskVerificationResult.ACCEPTED,
                reviewerUserId: "delivery_verifier",
                selfReviewed: input.selfReviewed ?? false,
              },
            ],
          },
        ]
      : [],
    id: input.reviewTaskId,
    isPublic: false,
    jurisdictionId: null,
    ownerOrganizationId: "organization_1",
    parentTaskId: "authority_task",
    status: TaskStatus.ACTIVE,
    taskKey: `document-review:authority_task:manager_user:${input.reviewTaskId}`,
  };
}

beforeEach(() => {
  for (const group of [mocks.prisma, mocks.tx]) {
    for (const mock of Object.values(group)) mock.mockReset();
  }
  mocks.assertDocumentAccess.mockReset();
  mocks.lockContentResources.mockReset();
  mocks.configureContributionReceiptBindingInTransaction.mockReset();
  mocks.configureContributionReceiptBindingInTransaction.mockResolvedValue({});
  mocks.sha256CanonicalJson.mockClear();
  mocks.sha256CanonicalJson.mockImplementation(async () => "test_hash");
  mocks.prisma.transaction.mockImplementation(
    async (callback: (tx: ReturnType<typeof transactionClient>) => unknown) =>
      callback(transactionClient()),
  );
  mocks.prisma.taskFindUnique.mockResolvedValue(null);
  mocks.tx.documentFindFirst.mockResolvedValue({ id: TARGET.documentId });
  mocks.tx.taskUpdateMany.mockResolvedValue({ count: 1 });
});

describe("requestDocumentReview", () => {
  it("rejects assigning the requester as reviewer", async () => {
    mocks.tx.userFindFirst.mockResolvedValue({
      id: "manager_user",
      personId: "manager_person",
    });
    mocks.tx.taskFindFirst
      .mockResolvedValueOnce(AUTHORITY_TASK)
      .mockResolvedValueOnce(null);
    mocks.tx.documentRevisionFindFirst.mockResolvedValue(exactRevision());
    mocks.tx.personFindFirst.mockResolvedValue({
      displayName: "Manager",
      email: "manager@example.test",
      id: "manager_person",
      user: { id: "manager_user" },
    });

    await expect(
      requestDocumentReview(
        "authority_task",
        {
          checklist: REQUEST.checklist,
          documentRevisionId: TARGET.revisionId,
          instructions: REQUEST.instructions,
          reviewerPersonId: "manager_person",
        },
        "manager_user",
        { idempotencyKey: "request_1" },
      ),
    ).rejects.toMatchObject({ status: 400 });
    expect(mocks.tx.taskCreate).not.toHaveBeenCalled();
  });

  it("rejects the document author even when a different manager requests the review", async () => {
    mocks.tx.userFindFirst.mockResolvedValue({
      id: "manager_user",
      personId: "manager_person",
    });
    mocks.tx.taskFindFirst
      .mockResolvedValueOnce(AUTHORITY_TASK)
      .mockResolvedValueOnce(null);
    mocks.tx.documentRevisionFindFirst.mockResolvedValue(exactRevision());
    mocks.tx.personFindFirst.mockResolvedValue({
      displayName: "Document author",
      email: "author@example.test",
      id: "author_person",
      user: { id: "author_user" },
    });

    await expect(
      requestDocumentReview(
        "authority_task",
        {
          checklist: REQUEST.checklist,
          documentRevisionId: TARGET.revisionId,
          instructions: REQUEST.instructions,
          reviewerPersonId: "author_person",
        },
        "manager_user",
        { idempotencyKey: "author_review" },
      ),
    ).rejects.toMatchObject({ status: 400 });
    expect(mocks.tx.taskCreate).not.toHaveBeenCalled();
  });

  it("creates one private assigned child task pinned to the exact revision", async () => {
    mocks.tx.userFindFirst.mockResolvedValue({
      id: "manager_user",
      personId: "manager_person",
    });
    mocks.tx.taskFindFirst
      .mockResolvedValueOnce(AUTHORITY_TASK)
      .mockResolvedValueOnce(null);
    mocks.tx.documentRevisionFindFirst
      .mockResolvedValueOnce(exactRevision())
      .mockResolvedValueOnce({ id: TARGET.revisionId });
    mocks.tx.personFindFirst.mockResolvedValue({
      displayName: "Independent reviewer",
      email: "reviewer@example.test",
      id: "reviewer_person",
      user: null,
    });
    mocks.tx.taskCreate.mockResolvedValue({ id: "review_task" });

    const result = await requestDocumentReview(
      "authority_task",
      {
        checklist: REQUEST.checklist,
        documentRevisionId: TARGET.revisionId,
        instructions: REQUEST.instructions,
        reviewerPersonId: "reviewer_person",
      },
      "manager_user",
      { idempotencyKey: "request_1", now: new Date(REQUEST.requestedAt) },
    );

    expect(result).toMatchObject({
      request: { schema: "optimitron.review-request.v1", target: TARGET },
      reviewTaskId: "review_task",
    });
    expect(mocks.tx.taskCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        assigneePersonId: "reviewer_person",
        claimPolicy: "ASSIGNED_ONLY",
        isPublic: false,
        parentTaskId: "authority_task",
      }),
      select: { id: true },
    });
  });

  it("replays the same request but rejects reuse of its idempotency key for different input", async () => {
    const existingReview = reviewTask({
      reviewerPersonId: "reviewer_person",
      reviewTaskId: "review_task",
    });
    mocks.sha256CanonicalJson.mockImplementation(async (value) => {
      const record = value as Record<string, unknown>;
      if ("idempotencyKey" in record) return "request_key_hash";
      if ("input" in record) {
        const input = record.input as Record<string, unknown>;
        return input.instructions === REQUEST.instructions
          ? "original_request_hash"
          : "different_request_hash";
      }
      return "test_hash";
    });
    existingReview.contextJson.documentReviewRequestHash =
      "original_request_hash";
    mocks.prisma.taskFindUnique.mockResolvedValue({ id: "review_task" });
    mocks.tx.userFindFirst.mockResolvedValue({
      id: "manager_user",
      personId: "manager_person",
    });
    mocks.tx.taskFindFirst.mockImplementation(({ where }) =>
      Promise.resolve(
        JSON.stringify(where).includes("document-review:")
          ? existingReview
          : AUTHORITY_TASK,
      ),
    );
    mocks.tx.documentRevisionFindFirst.mockResolvedValue(exactRevision());

    const input = {
      checklist: REQUEST.checklist,
      documentRevisionId: TARGET.revisionId,
      instructions: REQUEST.instructions,
      reviewerPersonId: "reviewer_person",
    };
    await expect(
      requestDocumentReview("authority_task", input, "manager_user", {
        idempotencyKey: "request_1",
      }),
    ).resolves.toMatchObject({
      request: REQUEST,
      reviewTaskId: "review_task",
    });
    expect(mocks.tx.taskCreate).not.toHaveBeenCalled();

    await expect(
      requestDocumentReview(
        "authority_task",
        { ...input, instructions: "Review a different issue." },
        "manager_user",
        { idempotencyKey: "request_1" },
      ),
    ).rejects.toMatchObject({
      message: "Idempotency-Key was already used for a different review",
      status: 409,
    });
    expect(mocks.tx.taskCreate).not.toHaveBeenCalled();
  });
});

describe("submitDocumentReview", () => {
  it("rejects a response after the canonical revision changes", async () => {
    const assignedReview = reviewTask({
      reviewerPersonId: "reviewer_person",
      reviewTaskId: "review_task",
    });
    mocks.tx.userFindFirst.mockImplementation(({ where }) =>
      Promise.resolve(
        where.id === "reviewer_user"
          ? { id: "reviewer_user", personId: "reviewer_person" }
          : { id: "manager_user", personId: "manager_person" },
      ),
    );
    mocks.tx.taskFindFirst
      .mockResolvedValueOnce(assignedReview)
      .mockResolvedValueOnce(AUTHORITY_TASK)
      .mockResolvedValueOnce(assignedReview)
      .mockResolvedValueOnce(AUTHORITY_TASK);
    mocks.tx.documentRevisionFindFirst.mockResolvedValue(
      exactRevision({
        document: {
          currentRevisionId: "revision_2",
          id: TARGET.documentId,
          version: 2,
        },
      }),
    );

    await expect(
      submitDocumentReview(
        "review_task",
        {
          checklistResponses: [{ criterionId: "sources", result: "PASS" }],
          explanation: "This is now stale.",
          verdict: "APPROVE",
        },
        "reviewer_user",
      ),
    ).rejects.toMatchObject({ status: 409 });
    expect(mocks.tx.taskExecutionAttemptCreate).not.toHaveBeenCalled();
  });

  it("records the substantive verdict separately from pending delivery verification", async () => {
    const assignedReview = reviewTask({
      reviewerPersonId: "reviewer_person",
      reviewTaskId: "review_task",
    });
    mocks.tx.userFindFirst.mockImplementation(({ where }) =>
      Promise.resolve(
        where.id === "reviewer_user"
          ? { id: "reviewer_user", personId: "reviewer_person" }
          : { id: "manager_user", personId: "manager_person" },
      ),
    );
    mocks.tx.taskFindFirst
      .mockResolvedValueOnce(assignedReview)
      .mockResolvedValueOnce(AUTHORITY_TASK)
      .mockResolvedValueOnce(assignedReview)
      .mockResolvedValueOnce(AUTHORITY_TASK);
    mocks.tx.documentRevisionFindFirst.mockResolvedValue(exactRevision());
    mocks.tx.taskExecutionAttemptFindFirst.mockResolvedValue(null);
    mocks.tx.taskExecutionAttemptCreate.mockResolvedValue({ id: "attempt_1" });
    mocks.tx.taskExecutionArtifactCreate.mockResolvedValue({
      contentHash: "response_hash",
      id: "artifact_1",
    });
    mocks.tx.taskVerificationCreate.mockResolvedValue({
      id: "verification_1",
      result: TaskVerificationResult.PENDING,
    });

    const result = await submitDocumentReview(
      "review_task",
      {
        checklistResponses: [{ criterionId: "sources", result: "FAIL" }],
        explanation: "The cited source does not support the operative clause.",
        verdict: "REJECT",
      },
      "reviewer_user",
      { now: new Date("2026-07-27T13:00:00.000Z") },
    );

    expect(result.response.verdict).toBe("REJECT");
    expect(result.verification.result).toBe(TaskVerificationResult.PENDING);
    expect(mocks.tx.taskVerificationCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        result: TaskVerificationResult.PENDING,
      }),
      select: { id: true, result: true },
    });
  });
});

describe("review access and adoption", () => {
  it("applies an accepted proposal as a new canonical revision with provenance", async () => {
    const proposalPin = {
      contentHash: "proposal_hash",
      documentId: "proposal_document",
      revisionId: "proposal_revision",
      version: 1,
    };
    const proposedReview = reviewTask({
      response: "CHANGES_REQUESTED",
      reviewerPersonId: "reviewer_person",
      reviewTaskId: "review_1",
    });
    (
      proposedReview.executionAttempts[0].artifacts[0]
        .structuredResultJson as Record<string, unknown>
    ).proposalDocument = proposalPin;
    mocks.tx.userFindFirst.mockResolvedValue({
      id: "manager_user",
      personId: "manager_person",
    });
    mocks.tx.taskFindFirst
      .mockResolvedValueOnce(AUTHORITY_TASK)
      .mockResolvedValueOnce(proposedReview)
      .mockResolvedValueOnce(AUTHORITY_TASK);
    mocks.tx.documentRevisionFindFirst
      .mockResolvedValueOnce(exactRevision())
      .mockResolvedValueOnce(exactRevision())
      .mockResolvedValueOnce({
        body: "Proposed body",
        contentHash: proposalPin.contentHash,
        createdByUser: { personId: "reviewer_person" },
        createdByUserId: "review_1_user",
        document: {
          currentRevisionId: proposalPin.revisionId,
          id: proposalPin.documentId,
          version: 1,
        },
        documentId: proposalPin.documentId,
        id: proposalPin.revisionId,
        title: "Proposed title",
        version: 1,
      });
    mocks.tx.documentRevisionCreate.mockResolvedValue({
      id: "canonical_revision_2",
    });
    mocks.tx.documentUpdateMany.mockResolvedValue({ count: 1 });
    mocks.tx.taskExecutionAttemptCreate.mockResolvedValue({
      id: "application_attempt",
    });
    mocks.tx.taskExecutionArtifactCreate.mockResolvedValue({
      contentHash: "application_hash",
      id: "application_artifact",
    });

    const result = await applyDocumentProposal(
      "authority_task",
      { expectedDocumentVersion: 1, reviewTaskId: "review_1" },
      "manager_user",
      { now: new Date("2026-07-27T14:00:00.000Z") },
    );

    expect(result.application).toMatchObject({
      baseDocument: TARGET,
      reviewArtifactId: "review_1_artifact",
      resultingDocument: {
        documentId: TARGET.documentId,
        revisionId: "canonical_revision_2",
        version: 2,
      },
      schema: "optimitron.document-proposal-application.v1",
      sourceProposalDocument: proposalPin,
    });
    expect(mocks.tx.documentUpdateMany).toHaveBeenCalledWith({
      data: expect.objectContaining({
        currentRevisionId: "canonical_revision_2",
        version: 2,
      }),
      where: expect.objectContaining({
        currentRevisionId: TARGET.revisionId,
        version: 1,
      }),
    });
    expect(mocks.tx.taskUpdateMany).toHaveBeenCalledWith({
      data: { status: TaskStatus.STALE },
      where: expect.objectContaining({ deletedAt: null }),
    });
  });

  it("grants document-reader access to only the assigned person's exact pin", async () => {
    mocks.tx.userFindFirst.mockImplementation(({ where }) =>
      Promise.resolve(
        where.id === "reviewer_user"
          ? { id: "reviewer_user", personId: "reviewer_person" }
          : { id: "manager_user", personId: "manager_person" },
      ),
    );
    mocks.tx.taskFindMany.mockResolvedValue([
      reviewTask({
        reviewerPersonId: "reviewer_person",
        reviewTaskId: "review_task",
      }),
    ]);
    mocks.tx.taskFindFirst.mockResolvedValue(AUTHORITY_TASK);
    mocks.tx.documentRevisionFindFirst.mockResolvedValue(exactRevision());

    await expect(
      hasAssignedDocumentReviewRevisionAccess({
        documentId: TARGET.documentId,
        revisionId: TARGET.revisionId,
        userId: "reviewer_user",
      }),
    ).resolves.toBe(true);
    expect(mocks.tx.taskFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ AND: expect.any(Array) }),
      }),
    );

    mocks.tx.taskFindMany.mockResolvedValue([]);
    await expect(
      hasAssignedDocumentReviewRevisionAccess({
        documentId: TARGET.documentId,
        revisionId: "later_revision",
        userId: "reviewer_user",
      }),
    ).resolves.toBe(false);
  });

  it("rejects a schema-shaped review task when its requester lacks live authority", async () => {
    mocks.tx.userFindFirst.mockImplementation(({ where }) =>
      Promise.resolve(
        where.id === "reviewer_user"
          ? { id: "reviewer_user", personId: "reviewer_person" }
          : { id: "manager_user", personId: "manager_person" },
      ),
    );
    mocks.tx.taskFindMany.mockResolvedValue([
      reviewTask({
        reviewerPersonId: "reviewer_person",
        reviewTaskId: "forged_review",
      }),
    ]);
    mocks.tx.taskFindFirst.mockResolvedValue(null);
    mocks.tx.documentRevisionFindFirst.mockResolvedValue(exactRevision());

    await expect(
      hasAssignedDocumentReviewRevisionAccess({
        documentId: TARGET.documentId,
        revisionId: TARGET.revisionId,
        userId: "reviewer_user",
      }),
    ).resolves.toBe(false);
  });

  it("returns only the assigned review and its pinned body to a reviewer", async () => {
    mocks.tx.userFindFirst.mockImplementation(({ where }) =>
      Promise.resolve(
        where.id === "reviewer_user"
          ? { id: "reviewer_user", personId: "reviewer_person" }
          : { id: "manager_user", personId: "manager_person" },
      ),
    );
    mocks.tx.taskFindFirst
      .mockResolvedValueOnce(
        reviewTask({
          reviewerPersonId: "reviewer_person",
          reviewTaskId: "review_task",
        }),
      )
      .mockResolvedValueOnce(AUTHORITY_TASK);
    mocks.tx.documentRevisionFindFirst.mockResolvedValue(exactRevision());

    const panel = await getDocumentReviewPanelData(
      "review_task",
      "reviewer_user",
    );

    expect(panel).toMatchObject({
      mode: "REVIEWER",
      review: {
        request: REQUEST,
        state: "AWAITING_RESPONSE",
        target: { body: "Pinned body", ...TARGET },
      },
    });
    expect(mocks.tx.taskFindMany).not.toHaveBeenCalled();
  });

  it("returns a proposal body only when it belongs to the review task and reviewer", async () => {
    const proposal = {
      contentHash: "proposal_hash",
      documentId: "proposal_document",
      revisionId: "proposal_revision",
      version: 1,
    };
    mocks.tx.userFindFirst.mockImplementation(({ where }) =>
      Promise.resolve(
        where.id === "reviewer_user"
          ? { id: "reviewer_user", personId: "reviewer_person" }
          : { id: "manager_user", personId: "manager_person" },
      ),
    );
    mocks.tx.taskFindFirst
      .mockResolvedValueOnce(
        reviewTask({
          proposalDocument: proposal,
          response: "CHANGES_REQUESTED",
          reviewerPersonId: "reviewer_person",
          reviewTaskId: "review_task",
        }),
      )
      .mockResolvedValueOnce(AUTHORITY_TASK);
    mocks.tx.documentRevisionFindFirst
      .mockResolvedValueOnce(exactRevision())
      .mockResolvedValueOnce(exactRevision())
      .mockResolvedValueOnce({
        body: "Pinned body with a precise correction.",
        contentHash: proposal.contentHash,
        title: "Proposed document",
      });

    const panel = await getDocumentReviewPanelData(
      "review_task",
      "reviewer_user",
    );

    expect(panel).toMatchObject({
      mode: "REVIEWER",
      review: {
        proposal: {
          ...proposal,
          body: "Pinned body with a precise correction.",
          title: "Proposed document",
        },
      },
    });
    expect(mocks.tx.documentRevisionFindFirst).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          createdByUserId: "review_task_user",
          document: expect.objectContaining({
            createdByUserId: "review_task_user",
            taskId: "review_task",
          }),
          id: proposal.revisionId,
        }),
      }),
    );
  });

  it("does not present a self-reviewed delivery as approved", async () => {
    mocks.tx.userFindFirst.mockImplementation(({ where }) =>
      Promise.resolve(
        where.id === "reviewer_user"
          ? { id: "reviewer_user", personId: "reviewer_person" }
          : { id: "manager_user", personId: "manager_person" },
      ),
    );
    mocks.tx.taskFindFirst
      .mockResolvedValueOnce(
        reviewTask({
          response: "APPROVE",
          reviewerPersonId: "reviewer_person",
          reviewTaskId: "review_task",
          selfReviewed: true,
        }),
      )
      .mockResolvedValueOnce(AUTHORITY_TASK);
    mocks.tx.documentRevisionFindFirst.mockResolvedValue(exactRevision());

    const panel = await getDocumentReviewPanelData(
      "review_task",
      "reviewer_user",
    );

    expect(panel).toMatchObject({
      mode: "REVIEWER",
      review: { state: "DELIVERY_REJECTED" },
    });
  });

  it("shows only authentic completed adoption decisions to a manager", async () => {
    const authenticDecision = {
      acceptedReviewArtifactIds: [],
      adoptedDocument: TARGET,
      authorityTaskId: "authority_task",
      decidedAt: "2026-07-27T14:00:00.000Z",
      decidedByUserId: "manager_user",
      schema: "optimitron.document-decision.v1" as const,
      waivers: [],
    };
    const forgedDecision = {
      ...authenticDecision,
      decidedAt: "2026-07-27T14:01:00.000Z",
    };
    mocks.tx.userFindFirst.mockResolvedValue({
      id: "manager_user",
      personId: "manager_person",
    });
    mocks.tx.taskFindFirst
      .mockResolvedValueOnce({
        ...AUTHORITY_TASK,
        contextJson: null,
        executionAttempts: [
          {
            artifacts: [
              {
                contentHash: "test_hash",
                id: "authentic_decision_artifact",
                metadataJson: { kind: "document-decision" },
                structuredResultJson: authenticDecision,
                submittedByUserId: "manager_user",
              },
            ],
            executorKind: "USER",
            executorUserId: "manager_user",
            metadata: { kind: "document-decision" },
            status: "COMPLETED",
          },
          {
            artifacts: [
              {
                contentHash: "test_hash",
                id: "forged_decision_artifact",
                metadataJson: { kind: "document-decision" },
                structuredResultJson: forgedDecision,
                submittedByUserId: "manager_user",
              },
            ],
            executorKind: "USER",
            executorUserId: "manager_user",
            metadata: { kind: "document-decision" },
            status: "QUEUED",
          },
        ],
      })
      .mockResolvedValueOnce({ id: "authority_task" });
    mocks.tx.taskFindMany.mockResolvedValue([]);

    const panel = await getDocumentReviewPanelData(
      "authority_task",
      "manager_user",
    );

    expect(panel).toMatchObject({
      decisions: [
        {
          artifactId: "authentic_decision_artifact",
          decision: authenticDecision,
        },
      ],
      mode: "MANAGER",
    });
    expect(panel).not.toMatchObject({
      decisions: expect.arrayContaining([
        expect.objectContaining({ artifactId: "forged_decision_artifact" }),
      ]),
    });
  });

  it("requires a reasoned waiver for every unresolved required review", async () => {
    mocks.tx.userFindFirst.mockResolvedValue({
      id: "manager_user",
      personId: "manager_person",
    });
    mocks.tx.taskFindFirst.mockResolvedValue(AUTHORITY_TASK);
    mocks.tx.documentRevisionFindFirst.mockResolvedValue(exactRevision());
    mocks.tx.taskFindMany.mockResolvedValue([
      reviewTask({
        response: "APPROVE",
        reviewerPersonId: "reviewer_1",
        reviewTaskId: "review_1",
      }),
      reviewTask({
        response: "CHANGES_REQUESTED",
        reviewerPersonId: "reviewer_2",
        reviewTaskId: "review_2",
      }),
    ]);

    await expect(
      adoptDocumentRevision(
        "authority_task",
        { documentRevisionId: TARGET.revisionId, waivers: [] },
        "manager_user",
        { idempotencyKey: "decision_1" },
      ),
    ).rejects.toEqual(expect.objectContaining({ status: 409 }));
  });

  it("does not count a schema-shaped generic artifact as a review approval", async () => {
    const forged = reviewTask({
      response: "APPROVE",
      reviewerPersonId: "reviewer_1",
      reviewTaskId: "review_1",
    });
    forged.executionAttempts[0].artifacts[0].metadataJson = {
      kind: "generic-task-artifact",
    };
    mocks.tx.userFindFirst.mockResolvedValue({
      id: "manager_user",
      personId: "manager_person",
    });
    mocks.tx.taskFindFirst.mockResolvedValue(AUTHORITY_TASK);
    mocks.tx.documentRevisionFindFirst.mockResolvedValue(exactRevision());
    mocks.tx.taskFindMany.mockResolvedValue([forged]);

    await expect(
      adoptDocumentRevision(
        "authority_task",
        { documentRevisionId: TARGET.revisionId, waivers: [] },
        "manager_user",
        { idempotencyKey: "forged_decision" },
      ),
    ).rejects.toEqual(expect.objectContaining({ status: 409 }));
    expect(mocks.tx.taskExecutionArtifactCreate).not.toHaveBeenCalled();
  });

  it("does not count a self-reviewed delivery verification as substantive approval", async () => {
    mocks.tx.userFindFirst.mockResolvedValue({
      id: "manager_user",
      personId: "manager_person",
    });
    mocks.tx.taskFindFirst.mockResolvedValue(AUTHORITY_TASK);
    mocks.tx.documentRevisionFindFirst.mockResolvedValue(exactRevision());
    mocks.tx.taskFindMany.mockResolvedValue([
      reviewTask({
        response: "APPROVE",
        reviewerPersonId: "reviewer_1",
        reviewTaskId: "review_1",
        selfReviewed: true,
      }),
    ]);

    await expect(
      adoptDocumentRevision(
        "authority_task",
        { documentRevisionId: TARGET.revisionId, waivers: [] },
        "manager_user",
        { idempotencyKey: "self_reviewed_decision" },
      ),
    ).rejects.toMatchObject({
      message: expect.stringContaining(
        "Required reviews need approval or a reasoned waiver",
      ),
      status: 409,
    });
    expect(mocks.tx.taskExecutionAttemptCreate).not.toHaveBeenCalled();
    expect(mocks.tx.taskExecutionArtifactCreate).not.toHaveBeenCalled();
  });

  it("records accepted approvals and permanent waiver reasons in the decision", async () => {
    mocks.tx.userFindFirst.mockResolvedValue({
      id: "manager_user",
      personId: "manager_person",
    });
    mocks.tx.taskFindFirst.mockResolvedValue({
      ...AUTHORITY_TASK,
      contextJson: {
        requiresDocumentDecision: {
          schema: "optimitron.requires-document-decision.v1",
        },
      },
    });
    mocks.tx.documentRevisionFindFirst.mockResolvedValue(exactRevision());
    mocks.tx.taskFindMany.mockResolvedValue([
      reviewTask({
        response: "APPROVE",
        reviewerPersonId: "reviewer_1",
        reviewTaskId: "review_1",
      }),
      reviewTask({
        response: "CHANGES_REQUESTED",
        reviewerPersonId: "reviewer_2",
        reviewTaskId: "review_2",
      }),
    ]);
    mocks.tx.taskExecutionAttemptFindMany.mockResolvedValue([]);
    mocks.tx.taskExecutionAttemptCreate.mockResolvedValue({
      id: "decision_attempt",
    });
    mocks.tx.taskExecutionArtifactCreate.mockResolvedValue({
      contentHash: "decision_hash",
      id: "decision_artifact",
    });

    const result = await adoptDocumentRevision(
      "authority_task",
      {
        documentRevisionId: TARGET.revisionId,
        useAsFundingTerms: true,
        waivers: [
          {
            reason:
              "The requested changes were considered and rejected with reasons.",
            reviewTaskId: "review_2",
          },
        ],
      },
      "manager_user",
      {
        idempotencyKey: "decision_1",
        now: new Date("2026-07-27T14:00:00.000Z"),
      },
    );

    expect(result.decision).toMatchObject({
      acceptedReviewArtifactIds: ["review_1_artifact"],
      adoptedDocument: TARGET,
      schema: "optimitron.document-decision.v1",
      waivers: [{ reviewTaskId: "review_2" }],
    });
    expect(mocks.tx.taskUpdateMany).toHaveBeenCalledWith({
      data: expect.objectContaining({
        status: TaskStatus.VERIFIED,
        verifiedByUserId: "manager_user",
      }),
      where: expect.objectContaining({
        id: "authority_task",
        status: { not: TaskStatus.VERIFIED },
      }),
    });
    expect(
      mocks.configureContributionReceiptBindingInTransaction,
    ).toHaveBeenCalledWith(
      {
        governingDocumentRevisionIds: [TARGET.revisionId],
        taskId: "authority_task",
        termsDocumentRevisionId: TARGET.revisionId,
      },
      "manager_user",
      expect.any(Object),
      { clientAccessBoundary: undefined },
    );
  });

  it("replays the same adoption decision but rejects conflicting idempotency input", async () => {
    const approval = reviewTask({
      response: "APPROVE",
      reviewerPersonId: "reviewer_1",
      reviewTaskId: "review_1",
    });
    const decision = {
      acceptedReviewArtifactIds: ["review_1_artifact"],
      adoptedDocument: TARGET,
      authorityTaskId: "authority_task",
      decidedAt: "2026-07-27T14:00:00.000Z",
      decidedByUserId: "manager_user",
      schema: "optimitron.document-decision.v1",
      waivers: [],
    };
    mocks.sha256CanonicalJson.mockImplementation(async (value) => {
      const record = value as Record<string, unknown>;
      if ("adoptedDocument" in record && "useAsFundingTerms" in record) {
        return record.useAsFundingTerms
          ? "different_decision_request_hash"
          : "decision_request_hash";
      }
      return "test_hash";
    });
    mocks.tx.userFindFirst.mockResolvedValue({
      id: "manager_user",
      personId: "manager_person",
    });
    mocks.tx.taskFindFirst.mockResolvedValue(AUTHORITY_TASK);
    mocks.tx.documentRevisionFindFirst.mockResolvedValue(exactRevision());
    mocks.tx.taskFindMany.mockResolvedValue([approval]);
    mocks.tx.taskExecutionAttemptFindMany.mockResolvedValue([
      {
        artifacts: [
          {
            contentHash: "test_hash",
            id: "decision_artifact",
            metadataJson: { kind: "document-decision" },
            structuredResultJson: decision,
            submittedByUserId: "manager_user",
          },
        ],
        executorKind: "USER",
        executorUserId: "manager_user",
        metadata: {
          idempotencyKey: "decision_1",
          kind: "document-decision",
          requestHash: "decision_request_hash",
        },
        status: "COMPLETED",
      },
    ]);

    await expect(
      adoptDocumentRevision(
        "authority_task",
        { documentRevisionId: TARGET.revisionId, waivers: [] },
        "manager_user",
        { idempotencyKey: "decision_1" },
      ),
    ).resolves.toEqual({
      artifact: { id: "decision_artifact" },
      decision,
    });
    expect(mocks.tx.taskExecutionAttemptCreate).not.toHaveBeenCalled();
    expect(mocks.tx.taskExecutionArtifactCreate).not.toHaveBeenCalled();

    await expect(
      adoptDocumentRevision(
        "authority_task",
        {
          documentRevisionId: TARGET.revisionId,
          useAsFundingTerms: true,
          waivers: [],
        },
        "manager_user",
        { idempotencyKey: "decision_1" },
      ),
    ).rejects.toMatchObject({
      message: "Idempotency-Key was already used for another decision",
      status: 409,
    });
    expect(
      mocks.configureContributionReceiptBindingInTransaction,
    ).not.toHaveBeenCalled();
    expect(mocks.tx.taskExecutionAttemptCreate).not.toHaveBeenCalled();
    expect(mocks.tx.taskExecutionArtifactCreate).not.toHaveBeenCalled();
  });

  it("ignores a schema-shaped decision artifact without authentic provenance", async () => {
    const approval = reviewTask({
      response: "APPROVE",
      reviewerPersonId: "reviewer_1",
      reviewTaskId: "review_1",
    });
    const forgedDecision = {
      acceptedReviewArtifactIds: ["review_1_artifact"],
      adoptedDocument: TARGET,
      authorityTaskId: "authority_task",
      decidedAt: "2026-07-27T14:00:00.000Z",
      decidedByUserId: "manager_user",
      schema: "optimitron.document-decision.v1",
      waivers: [],
    };
    mocks.tx.userFindFirst.mockResolvedValue({
      id: "manager_user",
      personId: "manager_person",
    });
    mocks.tx.taskFindFirst.mockResolvedValue(AUTHORITY_TASK);
    mocks.tx.documentRevisionFindFirst.mockResolvedValue(exactRevision());
    mocks.tx.taskFindMany.mockResolvedValue([approval]);
    mocks.tx.taskExecutionAttemptFindMany.mockResolvedValue([
      {
        artifacts: [
          {
            contentHash: "forged_hash",
            id: "forged_decision_artifact",
            metadataJson: { kind: "document-decision" },
            structuredResultJson: forgedDecision,
            submittedByUserId: "attacker_user",
          },
        ],
        executorKind: "USER",
        executorUserId: "attacker_user",
        metadata: {
          idempotencyKey: "forged_decision",
          kind: "document-decision",
          requestHash: "forged_request_hash",
        },
      },
    ]);
    mocks.tx.taskExecutionAttemptCreate.mockResolvedValue({
      id: "new_decision_attempt",
    });
    mocks.tx.taskExecutionArtifactCreate.mockResolvedValue({
      contentHash: "test_hash",
      id: "new_decision_artifact",
    });

    await expect(
      adoptDocumentRevision(
        "authority_task",
        { documentRevisionId: TARGET.revisionId, waivers: [] },
        "manager_user",
        { idempotencyKey: "real_decision" },
      ),
    ).resolves.toMatchObject({
      artifact: { id: "new_decision_artifact" },
    });
    expect(mocks.tx.taskExecutionAttemptCreate).toHaveBeenCalledTimes(1);
    expect(mocks.tx.taskExecutionArtifactCreate).toHaveBeenCalledTimes(1);
  });

  it("allows a required review to be bypassed only by preserving the manager's reason", async () => {
    mocks.tx.userFindFirst.mockResolvedValue({
      id: "manager_user",
      personId: "manager_person",
    });
    mocks.tx.taskFindFirst.mockResolvedValue(AUTHORITY_TASK);
    mocks.tx.documentRevisionFindFirst.mockResolvedValue(exactRevision());
    mocks.tx.taskFindMany.mockResolvedValue([
      reviewTask({
        response: "CHANGES_REQUESTED",
        reviewerPersonId: "reviewer_1",
        reviewTaskId: "review_1",
      }),
    ]);
    mocks.tx.taskExecutionAttemptFindMany.mockResolvedValue([]);
    mocks.tx.taskExecutionAttemptCreate.mockResolvedValue({
      id: "decision_attempt",
    });
    mocks.tx.taskExecutionArtifactCreate.mockResolvedValue({
      contentHash: "decision_hash",
      id: "decision_artifact",
    });

    const result = await adoptDocumentRevision(
      "authority_task",
      {
        documentRevisionId: TARGET.revisionId,
        waivers: [
          {
            reason:
              "The manager accepts this disclosed risk for the recorded deadline.",
            reviewTaskId: "review_1",
          },
        ],
      },
      "manager_user",
      { idempotencyKey: "decision_waived" },
    );

    expect(result.decision.acceptedReviewArtifactIds).toEqual([]);
    expect(result.decision.waivers).toEqual([
      expect.objectContaining({ reviewTaskId: "review_1" }),
    ]);
  });
});

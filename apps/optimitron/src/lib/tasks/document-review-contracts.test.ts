import { describe, expect, it } from "vitest";
import {
  assertReviewResponseMatchesRequest,
  CreateDocumentProposalInputSchema,
  DecideDocumentRevisionInputSchema,
  DOCUMENT_REVIEW_TASK_KEY_PREFIX,
  DocumentProposalV1Schema,
  InternalDocumentDecisionV1Schema,
  RequestDocumentReviewInputSchema,
  ReviewRequestV1Schema,
  ReviewResponseV1Schema,
} from "./document-review-contracts";

const target = {
  contentHash: "content_hash_1",
  documentId: "document_1",
  revisionId: "revision_1",
  version: 1,
};

const request = ReviewRequestV1Schema.parse({
  authorityTaskId: "authority_task",
  instructions: "Review this exact revision and explain the verdict.",
  requestedAt: "2026-07-29T12:00:00.000Z",
  requestedByUserId: "manager_user",
  schema: "optimitron.review-request.v1",
  target,
});

describe("document governance contracts", () => {
  it("uses one review task-key prefix and rejects caller-selected executors", () => {
    expect(DOCUMENT_REVIEW_TASK_KEY_PREFIX).toBe("document-review:");
    expect(() =>
      CreateDocumentProposalInputSchema.parse({
        agentExecutorId: "untrusted_agent",
        baseDocumentRevisionId: target.revisionId,
        body: "Proposed body",
        sourceCommentIds: ["comment_1"],
        summary: "Applied the comment.",
        title: "Proposed title",
      }),
    ).toThrow();
  });

  it("derives review task titles instead of accepting caller-selected titles", () => {
    expect(() =>
      RequestDocumentReviewInputSchema.parse({
        documentRevisionId: target.revisionId,
        instructions: "Review this exact revision.",
        reviewerPersonId: "reviewer_person",
        title: "Caller-selected title",
      }),
    ).toThrow();
  });

  it("binds one immutable source-comment snapshot set to the proposal base", () => {
    const sourceComment = {
      commentId: "comment_1",
      contentHash: "comment_hash",
      taskId: "authority_task",
    };
    const value = {
      authorityTaskId: "authority_task",
      base: target,
      proposal: {
        contentHash: "proposal_hash",
        documentId: "proposal_document",
        revisionId: "proposal_revision",
        version: 1,
      },
      proposedAt: "2026-07-29T13:00:00.000Z",
      proposedByPersonId: "agent_oauth_person",
      proposedByUserId: "agent_oauth_user",
      schema: "optimitron.document-proposal.v1",
      sourceComments: [sourceComment],
      summary: "Applied the comment.",
    };
    expect(DocumentProposalV1Schema.parse(value).base).toEqual(target);
    expect(() =>
      DocumentProposalV1Schema.parse({
        ...value,
        sourceComments: [sourceComment, sourceComment],
      }),
    ).toThrow("Source comments must be unique");
  });

  it("binds the formal verdict to the exact request and rationale comment", () => {
    const response = ReviewResponseV1Schema.parse({
      comment: { contentHash: "comment_hash", id: "comment_1" },
      explanation: "The revision is supported as written.",
      reviewerPersonId: "reviewer_person",
      reviewerUserId: "reviewer_user",
      reviewTaskId: "review_task",
      schema: "optimitron.review-response.v1",
      submittedAt: "2026-07-29T13:00:00.000Z",
      target,
      verdict: "APPROVE",
    });
    expect(() =>
      assertReviewResponseMatchesRequest(response, request, "review_task"),
    ).not.toThrow();
    expect(() =>
      assertReviewResponseMatchesRequest(
        { ...response, target: { ...target, contentHash: "changed" } },
        request,
        "review_task",
      ),
    ).toThrow("does not match");
  });

  it("allows one-click ADOPT input but requires a reason for REJECT", () => {
    expect(
      DecideDocumentRevisionInputSchema.parse({
        action: "ADOPT",
        documentRevisionId: target.revisionId,
        reviewArtifactId: "review_artifact",
      }),
    ).toEqual({
      action: "ADOPT",
      documentRevisionId: target.revisionId,
      reviewArtifactId: "review_artifact",
    });
    expect(() =>
      DecideDocumentRevisionInputSchema.parse({
        action: "REJECT",
        documentRevisionId: target.revisionId,
        reviewArtifactId: "review_artifact",
      }),
    ).toThrow();
  });

  it("allows ADOPT only with an APPROVE review in the persisted artifact", () => {
    const base = {
      authorityTaskId: "authority_task",
      decidedAt: "2026-07-29T14:00:00.000Z",
      decidedByPersonId: "manager_person",
      decidedByUserId: "manager_user",
      reason: null,
      review: {
        artifactId: "review_artifact",
        contentHash: "review_hash",
        reviewerPersonId: "reviewer_person",
        verdict: "APPROVE",
      },
      schema: "optimitron.internal-document-decision.v1",
      scope: "INTERNAL",
      target,
    };
    expect(
      InternalDocumentDecisionV1Schema.parse({ action: "ADOPT", ...base })
        .action,
    ).toBe("ADOPT");
    expect(() =>
      InternalDocumentDecisionV1Schema.parse({
        action: "ADOPT",
        ...base,
        review: { ...base.review, verdict: "REJECT" },
      }),
    ).toThrow();
  });
});

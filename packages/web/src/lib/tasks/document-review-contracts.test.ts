import { describe, expect, it } from "vitest";
import {
  ApplyDocumentProposalInputSchema,
  assertReviewResponseMatchesRequest,
  DocumentDecisionV1Schema,
  DocumentProposalApplicationV1Schema,
  ReviewRequestV1Schema,
  ReviewResponseV1Schema,
  readReviewRequest,
} from "./document-review-contracts";

const TARGET = {
  contentHash: "content_hash_1",
  documentId: "document_1",
  revisionId: "revision_1",
  version: 1,
};

const REQUEST = ReviewRequestV1Schema.parse({
  authorityTaskId: "authority_task",
  checklist: [
    { criterion: "Check the cited sources", id: "sources", required: true },
    { criterion: "Suggest clearer wording", id: "clarity", required: false },
  ],
  instructions: "Review this exact revision and explain the verdict.",
  requestedAt: "2026-07-27T12:00:00.000Z",
  requestedByUserId: "manager_user",
  required: true,
  schema: "optimitron.review-request.v1",
  target: TARGET,
});

function response(overrides: Record<string, unknown> = {}) {
  return ReviewResponseV1Schema.parse({
    checklistResponses: [{ criterionId: "sources", result: "PASS" }],
    explanation: "The sources support the text as written.",
    reviewTaskId: "review_task",
    reviewerUserId: "reviewer_user",
    schema: "optimitron.review-response.v1",
    submittedAt: "2026-07-27T13:00:00.000Z",
    target: TARGET,
    verdict: "APPROVE",
    ...overrides,
  });
}

describe("generic document-review contracts", () => {
  it("reads only the versioned documentReview context slot", () => {
    expect(
      readReviewRequest({ documentReview: REQUEST, unrelated: "preserved" }),
    ).toEqual(REQUEST);
    expect(readReviewRequest({ documentReview: { version: 0 } })).toBeNull();
  });

  it("rejects duplicate checklist IDs at request creation", () => {
    expect(() =>
      ReviewRequestV1Schema.parse({
        ...REQUEST,
        checklist: [REQUEST.checklist[0], REQUEST.checklist[0]],
      }),
    ).toThrow("Duplicate review criterion");
  });

  it("rejects an approval containing a failed criterion", () => {
    expect(() =>
      response({
        checklistResponses: [{ criterionId: "sources", result: "FAIL" }],
      }),
    ).toThrow("approval cannot include a failed criterion");
  });

  it("binds the response to the exact requested revision", () => {
    expect(() =>
      assertReviewResponseMatchesRequest(
        response({ target: { ...TARGET, contentHash: "different" } }),
        REQUEST,
      ),
    ).toThrow("does not match the requested revision");
  });

  it("requires required criteria only for approval and rejects unknown IDs", () => {
    expect(() =>
      assertReviewResponseMatchesRequest(
        response({ checklistResponses: [] }),
        REQUEST,
      ),
    ).toThrow("Required approval criterion did not pass: sources");

    expect(() =>
      assertReviewResponseMatchesRequest(
        response({
          checklistResponses: [
            { criterionId: "sources", result: "NOT_APPLICABLE" },
          ],
        }),
        REQUEST,
      ),
    ).toThrow("Required approval criterion did not pass: sources");

    expect(() =>
      assertReviewResponseMatchesRequest(
        response({
          checklistResponses: [],
          explanation: "The cited source needs to be replaced.",
          verdict: "CHANGES_REQUESTED",
        }),
        REQUEST,
      ),
    ).not.toThrow();

    expect(() =>
      assertReviewResponseMatchesRequest(
        response({
          checklistResponses: [
            { criterionId: "sources", result: "PASS" },
            { criterionId: "invented", result: "PASS" },
          ],
        }),
        REQUEST,
      ),
    ).toThrow("Unknown review criterion: invented");
  });

  it("keeps reasoned waivers unique and substantive", () => {
    const base = {
      acceptedReviewArtifactIds: ["artifact_1"],
      adoptedDocument: TARGET,
      authorityTaskId: "authority_task",
      decidedAt: "2026-07-27T14:00:00.000Z",
      decidedByUserId: "manager_user",
      schema: "optimitron.document-decision.v1" as const,
    };
    expect(() =>
      DocumentDecisionV1Schema.parse({
        ...base,
        waivers: [{ reason: "too short", reviewTaskId: "review_task" }],
      }),
    ).toThrow();
    expect(() =>
      DocumentDecisionV1Schema.parse({
        ...base,
        waivers: [
          {
            reason: "The reviewer declined after disclosing a conflict.",
            reviewTaskId: "review_task",
          },
          {
            reason: "The response did not arrive before the filing deadline.",
            reviewTaskId: "review_task",
          },
        ],
      }),
    ).toThrow("only be waived once");
  });

  it("accepts exactly the reviewer and generic proposal application forms", () => {
    expect(
      ApplyDocumentProposalInputSchema.parse({
        expectedDocumentVersion: 1,
        reviewTaskId: "review_task",
      }),
    ).toEqual({ expectedDocumentVersion: 1, reviewTaskId: "review_task" });

    const genericInput = {
      baseDocumentRevisionId: TARGET.revisionId,
      expectedDocumentVersion: 1,
      proposalDocumentRevisionId: "proposal_revision",
      sourceCommentIds: ["comment_1", "comment_2"],
      summary: "Applied the two requested clarifications.",
    };
    expect(ApplyDocumentProposalInputSchema.parse(genericInput)).toEqual(
      genericInput,
    );

    expect(() =>
      ApplyDocumentProposalInputSchema.parse({ expectedDocumentVersion: 1 }),
    ).toThrow();
    expect(() =>
      ApplyDocumentProposalInputSchema.parse({
        ...genericInput,
        expectedDocumentVersion: 1,
        reviewTaskId: "review_task",
      }),
    ).toThrow();
    expect(() =>
      ApplyDocumentProposalInputSchema.parse({
        ...genericInput,
        sourceCommentIds: ["comment_1", "comment_1"],
      }),
    ).toThrow("Source comment IDs must be unique");
    expect(() =>
      ApplyDocumentProposalInputSchema.parse({
        ...genericInput,
        proposalArtifactId: "obsolete_proposal_artifact",
      }),
    ).toThrow();
    expect(() =>
      ApplyDocumentProposalInputSchema.parse({
        expectedDocumentVersion: 1,
        reviewTaskId: "review_task",
        summary: "Reviewer inputs cannot carry generic proposal fields.",
      }),
    ).toThrow();
  });

  it("requires immutable identity and timestamps for source-comment snapshots", () => {
    const sourceComment = {
      authorNameSnapshot: "Independent reviewer",
      authorOrganizationId: null,
      authorPersonId: "reviewer_person",
      authorUserId: null,
      commentId: "comment_1",
      contentHash: "comment_hash",
      createdAt: "2026-07-27T13:00:00.000Z",
      editedAt: null,
      taskId: "authority_task",
    };
    const application = {
      appliedAt: "2026-07-27T14:00:00.000Z",
      appliedByUserId: "manager_user",
      baseDocument: TARGET,
      proposalCreatorUserId: "manager_user",
      resultingDocument: { ...TARGET, revisionId: "revision_2", version: 2 },
      schema: "optimitron.document-proposal-application.v1",
      sourceComments: [sourceComment],
      sourceProposalDocument: {
        contentHash: "proposal_hash",
        documentId: "proposal_document",
        revisionId: "proposal_revision",
        version: 1,
      },
      summary: "Applied the requested clarification.",
    };

    const parsed = DocumentProposalApplicationV1Schema.parse(application);
    if (!("sourceComments" in parsed)) {
      throw new Error("Expected generic proposal application provenance");
    }
    expect(parsed.sourceComments).toEqual([sourceComment]);

    for (const requiredKey of [
      "authorNameSnapshot",
      "authorOrganizationId",
      "authorPersonId",
      "authorUserId",
      "createdAt",
      "editedAt",
    ] as const) {
      const incompleteComment: Record<string, unknown> = { ...sourceComment };
      delete incompleteComment[requiredKey];
      expect(() =>
        DocumentProposalApplicationV1Schema.parse({
          ...application,
          sourceComments: [incompleteComment],
        }),
      ).toThrow();
    }

    expect(() =>
      DocumentProposalApplicationV1Schema.parse({
        ...application,
        sourceComments: [{ ...sourceComment, message: "Unhashed duplicate" }],
      }),
    ).toThrow();
  });
});

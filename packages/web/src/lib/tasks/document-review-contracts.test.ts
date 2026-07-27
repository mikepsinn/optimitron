import { describe, expect, it } from "vitest";
import {
  assertReviewResponseMatchesRequest,
  DocumentDecisionV1Schema,
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

  it("requires every required checklist response and rejects unknown IDs", () => {
    expect(() =>
      assertReviewResponseMatchesRequest(
        response({ checklistResponses: [] }),
        REQUEST,
      ),
    ).toThrow("Required review criterion not answered: sources");

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
});

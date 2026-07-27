import { describe, expect, it } from "vitest";
import type { DocumentReviewPanelReview } from "@/lib/tasks/document-review.server";
import { deriveDocumentAdoptionReadiness } from "./document-review-readiness";

function review(
  state: DocumentReviewPanelReview["state"],
  overrides: Partial<DocumentReviewPanelReview> = {},
): DocumentReviewPanelReview {
  return {
    completed: false,
    proposal: null,
    request: {
      authorityTaskId: "authority-task",
      checklist: [],
      instructions: "Check the exact text.",
      requestedAt: "2026-01-01T00:00:00.000Z",
      requestedByUserId: "manager-user",
      required: true,
      schema: "optimitron.review-request.v1",
      target: {
        contentHash: "hash",
        documentId: "document",
        revisionId: "revision",
        version: 1,
      },
    },
    required: true,
    response: null,
    reviewer: { displayName: "Avery Chen", email: null, id: "person" },
    reviewTaskId: "review-task",
    state,
    target: {
      body: "Text",
      contentHash: "hash",
      documentId: "document",
      revisionId: "revision",
      stale: state === "STALE",
      title: "Agreement",
      version: 1,
    },
    verification: null,
    ...overrides,
  };
}

describe("deriveDocumentAdoptionReadiness", () => {
  it("requires at least one review", () => {
    expect(
      deriveDocumentAdoptionReadiness({
        adopted: false,
        reviews: [],
        waiverReasons: {},
      }),
    ).toMatchObject({ canAdopt: false, status: "NO_REVIEWS" });
  });

  it("reports each unresolved required review", () => {
    const result = deriveDocumentAdoptionReadiness({
      adopted: false,
      reviews: [
        review("AWAITING_RESPONSE"),
        review("CHANGES_REQUESTED", {
          reviewTaskId: "second-review",
          reviewer: {
            displayName: "Jordan Okafor",
            email: null,
            id: "person-2",
          },
        }),
        review("REJECTED", {
          required: false,
          reviewTaskId: "advisory-review",
        }),
      ],
      waiverReasons: {},
    });

    expect(result).toMatchObject({
      blockerCount: 2,
      canAdopt: false,
      status: "BLOCKED",
    });
    expect(result.blockers.map((blocker) => blocker.kind)).toEqual([
      "AWAITING_RESPONSE",
      "CHANGES_REQUESTED",
    ]);
  });

  it("becomes ready only when required reviews are approved or waived", () => {
    const result = deriveDocumentAdoptionReadiness({
      adopted: false,
      reviews: [
        review("APPROVED"),
        review("REJECTED", {
          reviewTaskId: "waived-review",
          reviewer: {
            displayName: "Jordan Okafor",
            email: null,
            id: "person-2",
          },
        }),
      ],
      waiverReasons: {
        "waived-review": "The reviewer identified a conflict after submission.",
      },
    });

    expect(result).toMatchObject({
      canAdopt: true,
      status: "READY",
      waiverCount: 1,
    });
  });

  it("never enables another adoption of an adopted version", () => {
    expect(
      deriveDocumentAdoptionReadiness({
        adopted: true,
        reviews: [review("APPROVED")],
        waiverReasons: {},
      }),
    ).toMatchObject({ canAdopt: false, status: "ADOPTED" });
  });
});

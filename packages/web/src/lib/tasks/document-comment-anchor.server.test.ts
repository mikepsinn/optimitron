import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getDocumentReviewPanelData: vi.fn(),
}));

vi.mock("@/lib/tasks/document-review.server", () => ({
  getDocumentReviewPanelData: mocks.getDocumentReviewPanelData,
}));

import { readDocumentCommentAnchor } from "@/lib/tasks/document-comment-anchor";
import {
  buildDocumentCommentCitationsJson,
  DocumentCommentAnchorError,
} from "@/lib/tasks/document-comment-anchor.server";

const target = {
  contentHash: "revision-hash",
  documentId: "document-1",
  revisionId: "revision-2",
  version: 2,
};

const review = {
  completed: false,
  proposal: null,
  request: {
    authorityTaskId: "authority-task",
    checklist: [],
    instructions: "Review the pinned text.",
    requestedAt: "2026-07-27T12:00:00.000Z",
    requestedByUserId: "manager-user",
    required: true,
    schema: "optimitron.review-request.v1",
    target,
  },
  response: null,
  reviewTaskId: "review-task",
  required: true,
  reviewer: {
    displayName: "Reviewer",
    email: "reviewer@example.com",
    id: "reviewer-person",
  },
  state: "AWAITING_RESPONSE",
  target: {
    ...target,
    body: "First line\nReview this clause.\nLast line",
    stale: false,
    title: "Founding agreement",
  },
  verification: null,
};

beforeEach(() => {
  mocks.getDocumentReviewPanelData.mockReset();
  mocks.getDocumentReviewPanelData.mockResolvedValue({
    authorityTaskId: "authority-task",
    canSubmit: true,
    mode: "REVIEWER",
    review,
  });
});

describe("document comment anchors", () => {
  it("binds an exact selection to the server-authorized revision and preserves citations", async () => {
    const boundary = {
      allowPersonalPrivate: true,
      organizationIds: ["organization-1"],
    };
    const citationsJson = await buildDocumentCommentCitationsJson({
      clientAccessBoundary: boundary,
      existingCitationsJson: {
        citations: [{ title: "Existing source", url: "https://example.com" }],
      },
      rawAnchor: {
        endOffset: 22,
        exact: "Review this",
        field: "BODY",
        revisionId: "revision-2",
        startOffset: 11,
      },
      taskId: "review-task",
      userId: "reviewer-user",
    });

    expect(mocks.getDocumentReviewPanelData).toHaveBeenCalledWith(
      "review-task",
      "reviewer-user",
      { clientAccessBoundary: boundary },
    );
    expect(citationsJson).toMatchObject({
      citations: [{ title: "Existing source", url: "https://example.com" }],
      documentAnchor: {
        schema: "optimitron.document-comment-anchor.v1",
        selector: {
          endLine: 2,
          endOffset: 22,
          exact: "Review this",
          field: "BODY",
          startLine: 2,
          startOffset: 11,
        },
        target,
      },
    });
    expect(readDocumentCommentAnchor(citationsJson)).toMatchObject({ target });
  });

  it("rejects unknown input fields instead of persisting caller metadata", async () => {
    await expect(
      buildDocumentCommentCitationsJson({
        rawAnchor: {
          endOffset: 22,
          exact: "Review this",
          field: "BODY",
          revisionId: "revision-2",
          startOffset: 11,
          untrusted: "metadata",
        },
        taskId: "review-task",
        userId: "reviewer-user",
      }),
    ).rejects.toBeInstanceOf(DocumentCommentAnchorError);
    expect(mocks.getDocumentReviewPanelData).not.toHaveBeenCalled();
  });

  it("rejects offsets or text that do not match the pinned body", async () => {
    await expect(
      buildDocumentCommentCitationsJson({
        rawAnchor: {
          endOffset: 22,
          exact: "Review that",
          field: "BODY",
          revisionId: "revision-2",
          startOffset: 11,
        },
        taskId: "review-task",
        userId: "reviewer-user",
      }),
    ).rejects.toThrow(
      "The selected text does not match the pinned document revision.",
    );
  });

  it("rejects a different revision and a task without valid review provenance", async () => {
    await expect(
      buildDocumentCommentCitationsJson({
        rawAnchor: {
          endOffset: 22,
          exact: "Review this",
          field: "BODY",
          revisionId: "revision-3",
          startOffset: 11,
        },
        taskId: "review-task",
        userId: "reviewer-user",
      }),
    ).rejects.toThrow("does not match a validated revision");

    mocks.getDocumentReviewPanelData.mockResolvedValueOnce(null);
    await expect(
      buildDocumentCommentCitationsJson({
        rawAnchor: {
          endOffset: 22,
          exact: "Review this",
          field: "BODY",
          revisionId: "revision-2",
          startOffset: 11,
        },
        taskId: "ordinary-task",
        userId: "reviewer-user",
      }),
    ).rejects.toThrow("require an exact-version review task");
  });

  it("allows the review service's provenance-validated proposal revision", async () => {
    const proposal = {
      body: "Proposed new clause.",
      contentHash: "proposal-hash",
      documentId: "proposal-document",
      revisionId: "proposal-revision",
      title: "Proposed founding agreement",
      version: 1,
    };
    mocks.getDocumentReviewPanelData.mockResolvedValueOnce({
      authorityTaskId: "authority-task",
      canSubmit: false,
      mode: "REVIEWER",
      review: { ...review, proposal },
    });

    const citationsJson = await buildDocumentCommentCitationsJson({
      rawAnchor: {
        endOffset: 8,
        exact: "Proposed",
        field: "BODY",
        revisionId: "proposal-revision",
        startOffset: 0,
      },
      taskId: "review-task",
      userId: "reviewer-user",
    });

    expect(readDocumentCommentAnchor(citationsJson)).toMatchObject({
      selector: { exact: "Proposed", startLine: 1 },
      target: {
        contentHash: "proposal-hash",
        documentId: "proposal-document",
        revisionId: "proposal-revision",
        version: 1,
      },
    });
  });
});

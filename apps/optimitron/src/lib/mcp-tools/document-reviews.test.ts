import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAssignedDocumentReview: vi.fn(),
}));

vi.mock("../tasks/document-review.server", () => ({
  getAssignedDocumentReview: mocks.getAssignedDocumentReview,
}));

import { handleDocumentReviewToolCall } from "./document-reviews";

function responseBody(
  response: Awaited<ReturnType<typeof handleDocumentReviewToolCall>>,
) {
  return JSON.parse(response.content[0]?.text ?? "{}") as Record<
    string,
    unknown
  >;
}

beforeEach(() => {
  mocks.getAssignedDocumentReview.mockReset();
  mocks.getAssignedDocumentReview.mockResolvedValue({
    canSubmit: true,
    reviewTaskId: "review_task_1",
    target: { body: "Pinned body", revisionId: "revision_1" },
  });
});

describe("MCP document review tools", () => {
  it("reads an assigned exact revision without requiring an idempotency key", async () => {
    const clientAccessBoundary = {
      allowPersonalPrivate: false,
      organizationIds: ["organization_1"],
    };
    const response = await handleDocumentReviewToolCall({
      args: { reviewTaskId: "review_task_1" },
      clientAccessBoundary,
      name: "getDocumentReview",
      userId: "reviewer_user_1",
    });

    expect(response.isError).not.toBe(true);
    expect(responseBody(response)).toMatchObject({
      canSubmit: true,
      reviewTaskId: "review_task_1",
      target: { body: "Pinned body", revisionId: "revision_1" },
    });
    expect(mocks.getAssignedDocumentReview).toHaveBeenCalledWith(
      "review_task_1",
      "reviewer_user_1",
      { clientAccessBoundary },
    );
  });

  it("still requires idempotency for review writes", async () => {
    const response = await handleDocumentReviewToolCall({
      args: { reviewTaskId: "review_task_1" },
      name: "submitDocumentReview",
      userId: "reviewer_user_1",
    });

    expect(response.isError).toBe(true);
    expect(responseBody(response)).toEqual({
      error: "idempotencyKey is required",
    });
    expect(mocks.getAssignedDocumentReview).not.toHaveBeenCalled();
  });
});

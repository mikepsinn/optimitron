import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireTaskRequestAuth: vi.fn(),
}));

vi.mock("@/lib/auth-utils", () => ({
  requireTaskRequestAuth: mocks.requireTaskRequestAuth,
}));

import { runDocumentReviewRead } from "./http";

beforeEach(() => {
  mocks.requireTaskRequestAuth.mockReset();
  mocks.requireTaskRequestAuth.mockResolvedValue({
    clientAccessBoundary: {
      allowPersonalPrivate: false,
      organizationIds: ["organization_1"],
    },
    userId: "reviewer_user_1",
  });
});

describe("document review HTTP reads", () => {
  it("passes authenticated review-task and client-boundary context without an idempotency key", async () => {
    const operation = vi.fn().mockResolvedValue({
      reviewTaskId: "review_task_1",
      target: { revisionId: "revision_1" },
    });
    const request = new Request(
      "https://optimitron.test/api/tasks/review_task_1/document-reviews",
    );
    const response = await runDocumentReviewRead(
      request,
      { params: Promise.resolve({ id: "review_task_1" }) },
      operation,
      "Failed to load document review.",
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(await response.json()).toMatchObject({
      reviewTaskId: "review_task_1",
      target: { revisionId: "revision_1" },
    });
    expect(operation).toHaveBeenCalledWith("review_task_1", "reviewer_user_1", {
      clientAccessBoundary: {
        allowPersonalPrivate: false,
        organizationIds: ["organization_1"],
      },
    });
  });
});

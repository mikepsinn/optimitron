import {
  TaskApplicationPolicy,
  TaskClaimPolicy,
  TaskExecutionMode,
} from "@optimitron/db";
import { describe, expect, it } from "vitest";
import type { ReviewRequestV1 } from "./document-review-contracts";
import {
  DOCUMENT_REVIEW_BINDING_HASH_KEY,
  documentReviewBindingMatches,
  hashDocumentReviewBinding,
} from "./document-review-binding.server";

const request: ReviewRequestV1 = {
  authorityTaskId: "authority_task",
  instructions: "Review this exact revision.",
  requestedAt: "2026-07-29T12:00:00.000Z",
  requestedByUserId: "manager_user",
  schema: "optimitron.review-request.v1",
  target: {
    contentHash: "content_hash_1",
    documentId: "document_1",
    revisionId: "revision_1",
    version: 1,
  },
};

const task = {
  applicationPolicy: TaskApplicationPolicy.CLOSED,
  assigneePersonId: "reviewer_person",
  claimPolicy: TaskClaimPolicy.ASSIGNED_ONLY,
  createdByUserId: "manager_user",
  executionMode: TaskExecutionMode.HUMAN_ONLY,
  isPublic: false,
  jurisdictionId: null,
  ownerOrganizationId: null,
  parentTaskId: "authority_task",
  taskKey: "document-review:authority_task:manager_user:key",
};

describe("document review task binding", () => {
  it("detects revision, assignee, and execution-policy drift", async () => {
    const bindingHash = await hashDocumentReviewBinding(task, request);
    const bound = {
      ...task,
      contextJson: { [DOCUMENT_REVIEW_BINDING_HASH_KEY]: bindingHash },
    };
    await expect(documentReviewBindingMatches(bound, request)).resolves.toBe(
      true,
    );
    await expect(
      documentReviewBindingMatches(
        { ...bound, assigneePersonId: "another_person" },
        request,
      ),
    ).resolves.toBe(false);
    await expect(
      documentReviewBindingMatches(bound, {
        ...request,
        target: { ...request.target, version: 2 },
      }),
    ).resolves.toBe(false);
    await expect(
      documentReviewBindingMatches(
        { ...bound, executionMode: TaskExecutionMode.HUMAN_OR_AGENT },
        request,
      ),
    ).resolves.toBe(false);
  });
});

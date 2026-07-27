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
  checklist: [],
  instructions: "Review this exact revision.",
  requestedAt: "2026-07-27T12:00:00.000Z",
  requestedByUserId: "manager_user",
  required: true,
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
  ownerOrganizationId: "organization_1",
  parentTaskId: "authority_task",
  taskKey: "document-review:authority_task:manager_user:key",
};

describe("document review binding", () => {
  it("detects changes to the exact revision or task assignment", async () => {
    const bindingHash = await hashDocumentReviewBinding(task, request);
    const boundTask = {
      ...task,
      contextJson: { [DOCUMENT_REVIEW_BINDING_HASH_KEY]: bindingHash },
    };

    await expect(
      documentReviewBindingMatches(boundTask, request),
    ).resolves.toBe(true);
    await expect(
      documentReviewBindingMatches(boundTask, {
        ...request,
        target: { ...request.target, revisionId: "revision_2", version: 2 },
      }),
    ).resolves.toBe(false);
    await expect(
      documentReviewBindingMatches(
        { ...boundTask, assigneePersonId: "another_person" },
        request,
      ),
    ).resolves.toBe(false);
  });
});

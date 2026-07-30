import {
  TaskApplicationPolicy,
  TaskClaimPolicy,
  TaskExecutionMode,
} from "@optimitron/db";
import { sha256CanonicalJson } from "@optimitron/data/parameters";
import type { ReviewRequestV1 } from "@/lib/tasks/document-review-contracts";

export const DOCUMENT_REVIEW_BINDING_HASH_KEY =
  "documentReviewBindingHash" as const;

export interface DocumentReviewBindingTask {
  applicationPolicy: TaskApplicationPolicy;
  assigneePersonId: string | null;
  claimPolicy: TaskClaimPolicy;
  createdByUserId: string;
  executionMode: TaskExecutionMode;
  isPublic: boolean;
  jurisdictionId: string | null;
  ownerOrganizationId: string | null;
  parentTaskId: string | null;
  taskKey: string | null;
}

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord | null {
  return value != null && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;
}

export function buildDocumentReviewBinding(
  task: DocumentReviewBindingTask,
  request: ReviewRequestV1,
) {
  return {
    applicationPolicy: task.applicationPolicy,
    assigneePersonId: task.assigneePersonId,
    claimPolicy: task.claimPolicy,
    createdByUserId: task.createdByUserId,
    executionMode: task.executionMode,
    isPublic: task.isPublic,
    jurisdictionId: task.jurisdictionId,
    ownerOrganizationId: task.ownerOrganizationId,
    parentTaskId: task.parentTaskId,
    request,
    taskKey: task.taskKey,
  };
}

export function hashDocumentReviewBinding(
  task: DocumentReviewBindingTask,
  request: ReviewRequestV1,
) {
  return sha256CanonicalJson(buildDocumentReviewBinding(task, request));
}

export async function documentReviewBindingMatches(
  task: DocumentReviewBindingTask & { contextJson: unknown },
  request: ReviewRequestV1,
) {
  const storedHash = asRecord(task.contextJson)?.[
    DOCUMENT_REVIEW_BINDING_HASH_KEY
  ];
  return (
    typeof storedHash === "string" &&
    storedHash === (await hashDocumentReviewBinding(task, request))
  );
}

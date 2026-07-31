import {
  TaskExecutionAttemptStatus,
  TaskStatus,
  type Prisma,
} from "@optimitron/db";
import {
  DOCUMENT_PROPOSAL_APPLICATION_ARTIFACT_KIND,
  DOCUMENT_PROPOSAL_ARTIFACT_KIND,
  DOCUMENT_REVIEW_CONTEXT_KEY,
  DOCUMENT_REVIEW_TASK_KEY_PREFIX,
  INTERNAL_DOCUMENT_DECISION_ARTIFACT_KIND,
} from "@/lib/tasks/document-review-contracts";

function governanceArtifactReferenceWhere(input: {
  authorityTaskId?: string | null;
  documentId: string;
  kind: string;
  resultPath: string[];
}): Prisma.TaskExecutionArtifactWhereInput {
  return {
    metadataJson: { equals: input.kind, path: ["kind"] },
    structuredResultJson: {
      equals: input.documentId,
      path: input.resultPath,
    },
    taskExecutionAttempt: {
      metadata: { equals: input.kind, path: ["kind"] },
      status: TaskExecutionAttemptStatus.COMPLETED,
      ...(input.authorityTaskId ? { taskId: input.authorityTaskId } : {}),
    },
  };
}

export async function hasDocumentGovernanceHistory(
  tx: Prisma.TransactionClient,
  documentId: string,
  authorityTaskId?: string | null,
): Promise<boolean> {
  if (authorityTaskId) {
    const reviewTask = await tx.task.findFirst({
      where: {
        contextJson: {
          equals: documentId,
          path: [DOCUMENT_REVIEW_CONTEXT_KEY, "target", "documentId"],
        },
        parentTaskId: authorityTaskId,
        taskKey: {
          startsWith: `${DOCUMENT_REVIEW_TASK_KEY_PREFIX}${authorityTaskId}:`,
        },
      },
      select: { id: true },
    });
    if (reviewTask) return true;
  }

  const artifact = await tx.taskExecutionArtifact.findFirst({
    where: {
      OR: [
        governanceArtifactReferenceWhere({
          authorityTaskId,
          documentId,
          kind: DOCUMENT_PROPOSAL_ARTIFACT_KIND,
          resultPath: ["base", "documentId"],
        }),
        governanceArtifactReferenceWhere({
          authorityTaskId,
          documentId,
          kind: DOCUMENT_PROPOSAL_ARTIFACT_KIND,
          resultPath: ["proposal", "documentId"],
        }),
        governanceArtifactReferenceWhere({
          authorityTaskId,
          documentId,
          kind: DOCUMENT_PROPOSAL_APPLICATION_ARTIFACT_KIND,
          resultPath: ["resultingDocument", "documentId"],
        }),
        governanceArtifactReferenceWhere({
          authorityTaskId,
          documentId,
          kind: DOCUMENT_PROPOSAL_APPLICATION_ARTIFACT_KIND,
          resultPath: ["sourceProposalDocument", "documentId"],
        }),
        governanceArtifactReferenceWhere({
          authorityTaskId,
          documentId,
          kind: INTERNAL_DOCUMENT_DECISION_ARTIFACT_KIND,
          resultPath: ["target", "documentId"],
        }),
      ],
    },
    select: { id: true },
  });
  return artifact != null;
}

/** Atomically closes every live review pinned anywhere in this document's history. */
export function invalidateDocumentReviewsForDocument(
  tx: Prisma.TransactionClient,
  documentId: string,
) {
  return tx.task.updateMany({
    where: {
      AND: [
        {
          contextJson: {
            equals: "optimitron.review-request.v1",
            path: [DOCUMENT_REVIEW_CONTEXT_KEY, "schema"],
          },
        },
        {
          contextJson: {
            equals: documentId,
            path: [DOCUMENT_REVIEW_CONTEXT_KEY, "target", "documentId"],
          },
        },
      ],
      deletedAt: null,
      status: {
        in: [TaskStatus.DRAFT, TaskStatus.ACTIVE, TaskStatus.VERIFIED],
      },
      taskKey: { startsWith: DOCUMENT_REVIEW_TASK_KEY_PREFIX },
    },
    data: { status: TaskStatus.STALE },
  });
}

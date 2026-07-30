import { TaskStatus, type Prisma } from "@optimitron/db";
import { DOCUMENT_REVIEW_CONTEXT_KEY } from "@/lib/tasks/document-review-contracts";

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
    },
    data: { status: TaskStatus.STALE },
  });
}

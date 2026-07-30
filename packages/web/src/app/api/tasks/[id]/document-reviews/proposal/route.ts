import { applyDocumentProposal } from "@/lib/tasks/document-review.server";
import { runDocumentReviewOperation } from "../http";

export const runtime = "nodejs";

export function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return runDocumentReviewOperation(
    request,
    context,
    applyDocumentProposal,
    "Failed to apply document proposal.",
  );
}

import { decideDocumentRevision } from "@/lib/tasks/document-review.server";
import { runDocumentReviewOperation } from "../http";

export const runtime = "nodejs";

export function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return runDocumentReviewOperation(
    request,
    context,
    decideDocumentRevision,
    "Failed to decide document revision.",
  );
}

import {
  getAssignedDocumentReview,
  requestDocumentReview,
} from "@/lib/tasks/document-review.server";
import { runDocumentReviewOperation, runDocumentReviewRead } from "./http";

export const runtime = "nodejs";

export function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return runDocumentReviewRead(
    request,
    context,
    getAssignedDocumentReview,
    "Failed to load document review.",
  );
}

export function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return runDocumentReviewOperation(
    request,
    context,
    requestDocumentReview,
    "Failed to request document review.",
  );
}

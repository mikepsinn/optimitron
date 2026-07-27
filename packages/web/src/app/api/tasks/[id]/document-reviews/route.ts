import { requireTaskRequestAuth } from "@/lib/auth-utils";
import { noStoreJson } from "@/lib/content-http.server";
import {
  getDocumentReviewPanelData,
  requestDocumentReview,
} from "@/lib/tasks/document-review.server";
import { decodeTaskRouteId } from "@/lib/tasks/task-route-id";
import { documentReviewErrorResponse } from "./http";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { clientAccessBoundary, userId } =
      await requireTaskRequestAuth(request);
    const { id: routeId } = await context.params;
    const id = decodeTaskRouteId(routeId);
    const panel = await getDocumentReviewPanelData(id, userId, {
      clientAccessBoundary,
    });
    if (!panel) {
      return noStoreJson(
        {
          code: "DOCUMENT_REVIEW_NOT_FOUND",
          error: "Document review not found",
        },
        { status: 404 },
      );
    }
    return noStoreJson({ panel });
  } catch (error) {
    return documentReviewErrorResponse(
      error,
      "Failed to load document reviews.",
    );
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { clientAccessBoundary, userId } =
      await requireTaskRequestAuth(request);
    const { id: routeId } = await context.params;
    const id = decodeTaskRouteId(routeId);
    const idempotencyKey = request.headers.get("Idempotency-Key") ?? "";
    const result = await requestDocumentReview(
      id,
      await request.json().catch(() => null),
      userId,
      { clientAccessBoundary, idempotencyKey },
    );
    return noStoreJson(result, { status: 201 });
  } catch (error) {
    return documentReviewErrorResponse(
      error,
      "Failed to request document review.",
    );
  }
}

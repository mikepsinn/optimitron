import { requireTaskRequestAuth } from "@/lib/auth-utils";
import { noStoreJson } from "@/lib/content-http.server";
import { adoptDocumentRevision } from "@/lib/tasks/document-review.server";
import { decodeTaskRouteId } from "@/lib/tasks/task-route-id";
import { documentReviewErrorResponse } from "../http";

export const runtime = "nodejs";

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
    const result = await adoptDocumentRevision(
      id,
      await request.json().catch(() => null),
      userId,
      { clientAccessBoundary, idempotencyKey },
    );
    return noStoreJson(result, { status: 201 });
  } catch (error) {
    return documentReviewErrorResponse(
      error,
      "Failed to adopt document revision.",
    );
  }
}

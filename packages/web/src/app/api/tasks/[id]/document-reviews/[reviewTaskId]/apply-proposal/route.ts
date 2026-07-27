import { requireTaskRequestAuth } from "@/lib/auth-utils";
import { noStoreJson } from "@/lib/content-http.server";
import { applyDocumentProposal } from "@/lib/tasks/document-review.server";
import { decodeTaskRouteId } from "@/lib/tasks/task-route-id";
import { documentReviewErrorResponse } from "../../http";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string; reviewTaskId: string }> },
) {
  try {
    const { clientAccessBoundary, userId } =
      await requireTaskRequestAuth(request);
    const { id: routeId, reviewTaskId } = await context.params;
    const id = decodeTaskRouteId(routeId);
    const rawBody = await request.json().catch(() => null);
    const body =
      rawBody != null && typeof rawBody === "object" && !Array.isArray(rawBody)
        ? (rawBody as Record<string, unknown>)
        : {};
    const result = await applyDocumentProposal(
      id,
      { ...body, reviewTaskId },
      userId,
      { clientAccessBoundary },
    );
    return noStoreJson(result, { status: 201 });
  } catch (error) {
    return documentReviewErrorResponse(
      error,
      "Failed to apply document proposal.",
    );
  }
}

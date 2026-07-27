import { requireTaskRequestAuth } from "@/lib/auth-utils";
import { noStoreJson } from "@/lib/content-http.server";
import { getDocumentReviewPanelData } from "@/lib/tasks/document-review.server";
import { approveAndDispatchOutboundMessageBatch } from "@/lib/tasks/outbound-message-batch.server";
import { decodeTaskRouteId } from "@/lib/tasks/task-route-id";
import { reviewInvitationErrorResponse } from "../http";

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
    const panel = await getDocumentReviewPanelData(id, userId, {
      clientAccessBoundary,
    });
    if (panel?.mode !== "MANAGER") {
      return noStoreJson(
        { error: "Review invitation batch not found." },
        { status: 404 },
      );
    }
    const result = await approveAndDispatchOutboundMessageBatch(
      await request.json(),
      userId,
      { clientAccessBoundary },
    );
    return noStoreJson(result);
  } catch (error) {
    return reviewInvitationErrorResponse(
      error,
      "Failed to approve the review invitation batch.",
    );
  }
}

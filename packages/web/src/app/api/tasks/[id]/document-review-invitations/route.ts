import { requireTaskRequestAuth } from "@/lib/auth-utils";
import { noStoreJson } from "@/lib/content-http.server";
import { getDocumentReviewPanelData } from "@/lib/tasks/document-review.server";
import { proposePrivateReviewInvitation } from "@/lib/tasks/private-review-invitations.server";
import { decodeTaskRouteId } from "@/lib/tasks/task-route-id";
import { reviewInvitationErrorResponse } from "./http";

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
    const body = (await request.json()) as Record<string, unknown>;
    const panel = await getDocumentReviewPanelData(id, userId, {
      clientAccessBoundary,
    });
    if (
      panel?.mode !== "MANAGER" ||
      !panel.reviews.some((review) => review.reviewTaskId === body.taskId)
    ) {
      return noStoreJson(
        { error: "Review invitation not found." },
        { status: 404 },
      );
    }
    const result = await proposePrivateReviewInvitation(body, userId, {
      clientAccessBoundary,
    });
    return noStoreJson(result, {
      status: result.status === "existing" ? 200 : 201,
    });
  } catch (error) {
    return reviewInvitationErrorResponse(
      error,
      "Failed to prepare the review invitation.",
    );
  }
}

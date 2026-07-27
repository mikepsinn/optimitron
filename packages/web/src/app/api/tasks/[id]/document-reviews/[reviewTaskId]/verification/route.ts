import { requireTaskRequestAuth } from "@/lib/auth-utils";
import { noStoreJson } from "@/lib/content-http.server";
import { getDocumentReviewPanelData } from "@/lib/tasks/document-review.server";
import { verifyTaskExecution } from "@/lib/tasks/execution-lifecycle.server";
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
    const body = (await request.json()) as { taskVerificationId?: unknown };
    const panel = await getDocumentReviewPanelData(id, userId, {
      clientAccessBoundary,
    });
    const review =
      panel?.mode === "MANAGER"
        ? panel.reviews.find((item) => item.reviewTaskId === reviewTaskId)
        : null;
    if (
      panel?.mode !== "MANAGER" ||
      !review ||
      review.verification?.id !== body.taskVerificationId
    ) {
      return noStoreJson(
        {
          code: "DOCUMENT_REVIEW_NOT_FOUND",
          error: "Document review not found",
        },
        { status: 404 },
      );
    }

    const result = await verifyTaskExecution(body, userId, {
      allowDocumentReview: true,
    });
    return noStoreJson(result);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Task verification not found"
    ) {
      return noStoreJson(
        {
          code: "DOCUMENT_REVIEW_NOT_FOUND",
          error: "Document review not found",
        },
        { status: 404 },
      );
    }
    return documentReviewErrorResponse(
      error,
      "Failed to verify document review delivery.",
    );
  }
}

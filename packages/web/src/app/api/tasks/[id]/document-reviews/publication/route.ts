import { z } from "zod";
import { requireTaskRequestAuth } from "@/lib/auth-utils";
import { noStoreJson } from "@/lib/content-http.server";
import { publishDocumentRevisionAsReferendum } from "@/lib/referendums/document-publication.server";
import { getDocumentReviewPanelData } from "@/lib/tasks/document-review.server";
import { decodeTaskRouteId } from "@/lib/tasks/task-route-id";

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
      !panel.decisions.some(
        ({ artifactId }) => artifactId === body.decisionArtifactId,
      )
    ) {
      return noStoreJson(
        { error: "Document decision not found." },
        { status: 404 },
      );
    }
    const result = await publishDocumentRevisionAsReferendum(body, userId, {
      clientAccessBoundary,
    });
    return noStoreJson(result, { status: result.created ? 201 : 200 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return noStoreJson(
        { error: "Authentication required." },
        { status: 401 },
      );
    }
    if (error instanceof z.ZodError) {
      return noStoreJson(
        { error: error.issues[0]?.message ?? "Invalid referendum snapshot." },
        { status: 400 },
      );
    }
    if (error instanceof Error) {
      return noStoreJson({ error: error.message }, { status: 409 });
    }
    console.error("[DOCUMENT_PUBLICATION] Request failed:", error);
    return noStoreJson(
      { error: "Failed to publish the referendum." },
      { status: 500 },
    );
  }
}

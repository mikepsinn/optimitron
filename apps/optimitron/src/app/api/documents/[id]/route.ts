/**
 * GET  /api/documents/[id] - read one document revision and its history.
 * POST /api/documents/[id] - append a revision using optimistic concurrency.
 */

import {
  getTaskRequestIdentity,
  requireTaskRequestAuth,
} from "@/lib/auth-utils";
import { contentErrorResponse, noStoreJson } from "@/lib/content-http.server";
import {
  getDocumentForViewer,
  toDocumentDto,
  updateDocument,
} from "@/lib/documents.server";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const identity = await getTaskRequestIdentity(request);

    const result = await getDocumentForViewer(id, identity.userId, {
      clientAccessBoundary: identity.clientAccessBoundary,
    });
    if (!result) {
      return noStoreJson(
        { code: "CONTENT_NOT_FOUND", error: "Content not found." },
        { status: 404 },
      );
    }

    return noStoreJson({
      document: toDocumentDto(result),
      versions: result.versions,
      viewerCanEdit: result.viewerCanEdit,
    });
  } catch (error) {
    const response = contentErrorResponse(error);
    if (response) return response;
    console.error("[DOCUMENTS] Failed to fetch document:", error);
    return noStoreJson({ error: "Failed to fetch document." }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const identity = await requireTaskRequestAuth(request);

    const { id } = await context.params;
    const body = (await request.json().catch(() => null)) as {
      title?: unknown;
      body?: unknown;
      expectedVersion?: unknown;
      organizationId?: unknown;
      parentDocumentId?: unknown;
      taskId?: unknown;
      visibility?: unknown;
    } | null;

    const title = typeof body?.title === "string" ? body.title : null;
    const markdown = typeof body?.body === "string" ? body.body : null;
    const expectedVersion =
      typeof body?.expectedVersion === "number" ? body.expectedVersion : NaN;
    const visibility =
      body?.visibility === "PUBLIC" || body?.visibility === "PRIVATE"
        ? body.visibility
        : null;

    const updated = await updateDocument(
      {
        documentId: id,
        editorUserId: identity.userId,
        title,
        body: markdown,
        expectedVersion,
        organizationId:
          typeof body?.organizationId === "string" ||
          body?.organizationId === null
            ? body.organizationId
            : undefined,
        parentDocumentId:
          typeof body?.parentDocumentId === "string" ||
          body?.parentDocumentId === null
            ? body.parentDocumentId
            : undefined,
        taskId:
          typeof body?.taskId === "string" || body?.taskId === null
            ? body.taskId
            : undefined,
        visibility,
      },
      { clientAccessBoundary: identity.clientAccessBoundary },
    );

    return noStoreJson({ document: toDocumentDto(updated) });
  } catch (error) {
    const response = contentErrorResponse(error);
    if (response) return response;
    console.error("[DOCUMENTS] Failed to update document:", error);
    return noStoreJson(
      { error: "Failed to update document." },
      { status: 500 },
    );
  }
}

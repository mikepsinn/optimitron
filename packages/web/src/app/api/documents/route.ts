import { ContentVisibility } from "@optimitron/db/enums";
import {
  getTaskRequestIdentity,
  requireTaskRequestAuth,
} from "@/lib/auth-utils";
import {
  contentErrorResponse,
  noStoreJson,
  parseOptionalPositiveInteger,
} from "@/lib/content-http.server";
import {
  createDocument,
  listDocumentsForViewer,
  toDocumentDto,
} from "@/lib/documents.server";

export const runtime = "nodejs";

function optionalString(value: unknown): string | null | undefined {
  if (value === null) return null;
  return typeof value === "string" ? value : undefined;
}

export async function GET(request: Request) {
  try {
    const identity = await getTaskRequestIdentity(request);
    const url = new URL(request.url);
    const documents = await listDocumentsForViewer({
      clientAccessBoundary: identity.clientAccessBoundary,
      userId: identity.userId,
      taskId: url.searchParams.get("taskId"),
      limit: parseOptionalPositiveInteger(
        url.searchParams.get("limit"),
        "limit",
      ),
    });
    return noStoreJson({ documents });
  } catch (error) {
    const response = contentErrorResponse(error);
    if (response) return response;
    console.error("[DOCUMENTS] Failed to list documents:", error);
    return noStoreJson(
      { code: "INTERNAL_ERROR", error: "Failed to list documents." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const identity = await requireTaskRequestAuth(request);
    const body = (await request.json()) as Record<string, unknown>;
    const idempotencyKey =
      request.headers.get("Idempotency-Key") ??
      optionalString(body.idempotencyKey);
    if (!idempotencyKey) throw new Error("Idempotency-Key is required");
    const document = await createDocument(
      {
        body: typeof body.body === "string" ? body.body : "",
        createdByUserId: identity.userId,
        idempotencyKey,
        jurisdictionId: optionalString(body.jurisdictionId),
        organizationId: optionalString(body.organizationId),
        parentDocumentId: optionalString(body.parentDocumentId),
        taskId: optionalString(body.taskId),
        title: typeof body.title === "string" ? body.title : "",
        visibility:
          body.visibility === ContentVisibility.PUBLIC
            ? ContentVisibility.PUBLIC
            : ContentVisibility.PRIVATE,
      },
      { clientAccessBoundary: identity.clientAccessBoundary },
    );
    return noStoreJson({ document: toDocumentDto(document) }, { status: 201 });
  } catch (error) {
    const response = contentErrorResponse(error);
    if (response) return response;
    console.error("[DOCUMENTS] Failed to create document:", error);
    return noStoreJson(
      { code: "INTERNAL_ERROR", error: "Failed to create document." },
      { status: 500 },
    );
  }
}

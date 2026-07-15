import { ContentVisibility } from "@optimitron/db/enums";
import { getCurrentUser } from "@/lib/auth-utils";
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
import { McpScope } from "@/lib/mcp-scopes";

export const runtime = "nodejs";

const CONTENT_SCOPES = [McpScope.TASKS_PERSONAL, McpScope.TASKS_ADMIN];

function optionalString(value: unknown): string | null | undefined {
  if (value === null) return null;
  return typeof value === "string" ? value : undefined;
}

export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser(request, CONTENT_SCOPES);
    const url = new URL(request.url);
    const documents = await listDocumentsForViewer({
      userId: currentUser?.id ?? null,
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
    const currentUser = await getCurrentUser(request, CONTENT_SCOPES);
    if (!currentUser) throw new Error("Unauthorized");
    const body = (await request.json()) as Record<string, unknown>;
    const idempotencyKey =
      request.headers.get("Idempotency-Key") ??
      optionalString(body.idempotencyKey);
    if (!idempotencyKey) throw new Error("Idempotency-Key is required");
    const document = await createDocument({
      body: typeof body.body === "string" ? body.body : "",
      createdByUserId: currentUser.id,
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
    });
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

import { z } from "zod";
import { getCurrentUser } from "@/lib/auth-utils";
import {
  collectionFilterSchema,
  collectionRelationInputSchema,
  collectionSortSchema,
  createCollectionRecord,
  queryCollectionRecords,
} from "@/lib/collections.server";
import {
  contentErrorResponse,
  noStoreJson,
  parseOptionalPositiveInteger,
} from "@/lib/content-http.server";
import { McpScope } from "@/lib/mcp-scopes";

export const runtime = "nodejs";

const CONTENT_SCOPES = [McpScope.TASKS_PERSONAL, McpScope.TASKS_ADMIN];

const createRecordSchema = z.object({
  documentId: z.string().nullable().optional(),
  idempotencyKey: z.string().nullable().optional(),
  organizationId: z.string().nullable().optional(),
  personId: z.string().nullable().optional(),
  relations: z.array(collectionRelationInputSchema).optional(),
  taskId: z.string().nullable().optional(),
  values: z.record(z.unknown()),
});

function parseJsonParameter<T>(
  value: string | null,
  schema: z.ZodType<T>,
  name: string,
): T | undefined {
  if (!value) return undefined;
  try {
    return schema.parse(JSON.parse(value));
  } catch (error) {
    if (error instanceof z.ZodError) throw error;
    throw new Error(`${name} must be valid JSON`);
  }
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const currentUser = await getCurrentUser(request, CONTENT_SCOPES);
    const { id } = await context.params;
    const url = new URL(request.url);
    const result = await queryCollectionRecords({
      collectionId: id,
      cursor: url.searchParams.get("cursor"),
      filters: parseJsonParameter(
        url.searchParams.get("filters"),
        z.array(collectionFilterSchema),
        "filters",
      ),
      limit: parseOptionalPositiveInteger(
        url.searchParams.get("limit"),
        "limit",
      ),
      query: url.searchParams.get("q"),
      sorts: parseJsonParameter(
        url.searchParams.get("sorts"),
        z.array(collectionSortSchema),
        "sorts",
      ),
      userId: currentUser?.id ?? null,
    });
    return noStoreJson(result);
  } catch (error) {
    const response = contentErrorResponse(error);
    if (response) return response;
    console.error("[COLLECTIONS] Failed to query records:", error);
    return noStoreJson(
      { code: "INTERNAL_ERROR", error: "Failed to query records." },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const currentUser = await getCurrentUser(request, CONTENT_SCOPES);
    if (!currentUser) throw new Error("Unauthorized");
    const [{ id }, input] = await Promise.all([
      context.params,
      request.json().then((body) => createRecordSchema.parse(body)),
    ]);
    const idempotencyKey =
      request.headers.get("Idempotency-Key") ?? input.idempotencyKey;
    if (!idempotencyKey) throw new Error("Idempotency-Key is required");
    const record = await createCollectionRecord({
      ...input,
      collectionId: id,
      createdByUserId: currentUser.id,
      idempotencyKey,
    });
    return noStoreJson({ record }, { status: 201 });
  } catch (error) {
    const response = contentErrorResponse(error);
    if (response) return response;
    console.error("[COLLECTIONS] Failed to create record:", error);
    return noStoreJson(
      { code: "INTERNAL_ERROR", error: "Failed to create record." },
      { status: 500 },
    );
  }
}

import { ContentVisibility } from "@optimitron/db/enums";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth-utils";
import {
  collectionFieldInputSchema,
  createCollection,
  listCollectionsForViewer,
  toCollectionDto,
} from "@/lib/collections.server";
import {
  contentErrorResponse,
  noStoreJson,
  parseOptionalPositiveInteger,
} from "@/lib/content-http.server";
import { McpScope } from "@/lib/mcp-scopes";

export const runtime = "nodejs";

const CONTENT_SCOPES = [McpScope.TASKS_PERSONAL, McpScope.TASKS_ADMIN];

const createCollectionSchema = z.object({
  description: z.string().nullable().optional(),
  fields: z.array(collectionFieldInputSchema).optional(),
  idempotencyKey: z.string().nullable().optional(),
  jurisdictionId: z.string().nullable().optional(),
  name: z.string(),
  organizationId: z.string().nullable().optional(),
  visibility: z.nativeEnum(ContentVisibility).optional(),
});

export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser(request, CONTENT_SCOPES);
    const url = new URL(request.url);
    const collections = await listCollectionsForViewer({
      userId: currentUser?.id ?? null,
      limit: parseOptionalPositiveInteger(
        url.searchParams.get("limit"),
        "limit",
      ),
    });
    return noStoreJson({ collections });
  } catch (error) {
    const response = contentErrorResponse(error);
    if (response) return response;
    console.error("[COLLECTIONS] Failed to list collections:", error);
    return noStoreJson(
      { code: "INTERNAL_ERROR", error: "Failed to list collections." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser(request, CONTENT_SCOPES);
    if (!currentUser) throw new Error("Unauthorized");
    const input = createCollectionSchema.parse(await request.json());
    const idempotencyKey =
      request.headers.get("Idempotency-Key") ?? input.idempotencyKey;
    if (!idempotencyKey) throw new Error("Idempotency-Key is required");
    const collection = await createCollection({
      ...input,
      createdByUserId: currentUser.id,
      idempotencyKey,
    });
    return noStoreJson(
      { collection: toCollectionDto(collection) },
      { status: 201 },
    );
  } catch (error) {
    const response = contentErrorResponse(error);
    if (response) return response;
    console.error("[COLLECTIONS] Failed to create collection:", error);
    return noStoreJson(
      { code: "INTERNAL_ERROR", error: "Failed to create collection." },
      { status: 500 },
    );
  }
}

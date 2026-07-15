import { ContentVisibility } from "@optimitron/db/enums";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth-utils";
import {
  collectionFieldInputSchema,
  getCollectionForViewer,
  toCollectionDto,
  updateCollection,
} from "@/lib/collections.server";
import { contentErrorResponse, noStoreJson } from "@/lib/content-http.server";
import { McpScope } from "@/lib/mcp-scopes";

export const runtime = "nodejs";

const CONTENT_SCOPES = [McpScope.TASKS_PERSONAL, McpScope.TASKS_ADMIN];

const updateCollectionSchema = z.object({
  description: z.string().nullable().optional(),
  expectedVersion: z.number().int().positive(),
  fields: z.array(collectionFieldInputSchema).optional(),
  name: z.string().nullable().optional(),
  organizationId: z.string().nullable().optional(),
  visibility: z.nativeEnum(ContentVisibility).nullable().optional(),
});

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const currentUser = await getCurrentUser(request, CONTENT_SCOPES);
    const { id } = await context.params;
    const collection = await getCollectionForViewer(
      id,
      currentUser?.id ?? null,
    );
    if (!collection) throw new Error("Collection not found");
    return noStoreJson({ collection: toCollectionDto(collection) });
  } catch (error) {
    const response = contentErrorResponse(error);
    if (response) return response;
    console.error("[COLLECTIONS] Failed to fetch collection:", error);
    return noStoreJson(
      { code: "INTERNAL_ERROR", error: "Failed to fetch collection." },
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
      request.json().then((body) => updateCollectionSchema.parse(body)),
    ]);
    const collection = await updateCollection({
      ...input,
      collectionId: id,
      editorUserId: currentUser.id,
    });
    return noStoreJson({ collection: toCollectionDto(collection) });
  } catch (error) {
    const response = contentErrorResponse(error);
    if (response) return response;
    console.error("[COLLECTIONS] Failed to update collection:", error);
    return noStoreJson(
      { code: "INTERNAL_ERROR", error: "Failed to update collection." },
      { status: 500 },
    );
  }
}

import { z } from "zod";
import { getCurrentUser } from "@/lib/auth-utils";
import {
  collectionRelationInputSchema,
  getCollectionRecordForViewer,
  updateCollectionRecord,
} from "@/lib/collections.server";
import {
  contentErrorResponse,
  noStoreJson,
} from "@/lib/content-http.server";
import { McpScope } from "@/lib/mcp-scopes";

export const runtime = "nodejs";

const CONTENT_SCOPES = [McpScope.TASKS_PERSONAL, McpScope.TASKS_ADMIN];

const updateRecordSchema = z.object({
  documentId: z.string().nullable().optional(),
  expectedVersion: z.number().int().positive(),
  organizationId: z.string().nullable().optional(),
  personId: z.string().nullable().optional(),
  relations: z.array(collectionRelationInputSchema).optional(),
  taskId: z.string().nullable().optional(),
  values: z.record(z.unknown()).optional(),
});

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string; recordId: string }> },
) {
  try {
    const currentUser = await getCurrentUser(request, CONTENT_SCOPES);
    const { id, recordId } = await context.params;
    const record = await getCollectionRecordForViewer(
      recordId,
      currentUser?.id ?? null,
    );
    if (!record || record.collectionId !== id) {
      throw new Error("Collection not found");
    }
    return noStoreJson({ record });
  } catch (error) {
    const response = contentErrorResponse(error);
    if (response) return response;
    console.error("[COLLECTIONS] Failed to fetch record:", error);
    return noStoreJson(
      { code: "INTERNAL_ERROR", error: "Failed to fetch record." },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string; recordId: string }> },
) {
  try {
    const currentUser = await getCurrentUser(request, CONTENT_SCOPES);
    if (!currentUser) throw new Error("Unauthorized");
    const [{ id, recordId }, input] = await Promise.all([
      context.params,
      request.json().then((body) => updateRecordSchema.parse(body)),
    ]);
    const current = await getCollectionRecordForViewer(recordId, currentUser.id);
    if (!current || current.collectionId !== id) {
      throw new Error("Collection not found");
    }
    const record = await updateCollectionRecord({
      ...input,
      editorUserId: currentUser.id,
      recordId,
    });
    return noStoreJson({ record });
  } catch (error) {
    const response = contentErrorResponse(error);
    if (response) return response;
    console.error("[COLLECTIONS] Failed to update record:", error);
    return noStoreJson(
      { code: "INTERNAL_ERROR", error: "Failed to update record." },
      { status: 500 },
    );
  }
}

import { z } from "zod";
import { getCurrentUser } from "@/lib/auth-utils";
import {
  collectionRecordBatchOperationSchema,
  upsertCollectionRecordsBatch,
} from "@/lib/collections.server";
import { contentErrorResponse, noStoreJson } from "@/lib/content-http.server";
import { McpScope } from "@/lib/mcp-scopes";

export const runtime = "nodejs";

const CONTENT_SCOPES = [McpScope.TASKS_PERSONAL, McpScope.TASKS_ADMIN];
const requestSchema = z.object({
  operations: z.array(collectionRecordBatchOperationSchema).min(1).max(100),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const currentUser = await getCurrentUser(request, CONTENT_SCOPES);
    if (!currentUser) throw new Error("Unauthorized");
    const [{ id }, input] = await Promise.all([
      context.params,
      request.json().then((body) => requestSchema.parse(body)),
    ]);
    const results = await upsertCollectionRecordsBatch({
      collectionId: id,
      editorUserId: currentUser.id,
      operations: input.operations,
    });
    return noStoreJson({ results });
  } catch (error) {
    const response = contentErrorResponse(error);
    if (response) return response;
    console.error("[COLLECTIONS] Failed to apply record batch:", error);
    return noStoreJson(
      { code: "INTERNAL_ERROR", error: "Failed to apply record batch." },
      { status: 500 },
    );
  }
}

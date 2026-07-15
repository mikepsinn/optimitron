import { z } from "zod";
import { getCurrentUser } from "@/lib/auth-utils";
import {
  collectionFilterSchema,
  collectionSortSchema,
  saveCollectionView,
} from "@/lib/collections.server";
import {
  contentErrorResponse,
  noStoreJson,
} from "@/lib/content-http.server";
import { McpScope } from "@/lib/mcp-scopes";

export const runtime = "nodejs";

const CONTENT_SCOPES = [McpScope.TASKS_PERSONAL, McpScope.TASKS_ADMIN];

const viewSchema = z.object({
  expectedVersion: z.number().int().positive().optional(),
  filters: z.array(collectionFilterSchema).optional(),
  isDefault: z.boolean().optional(),
  name: z.string(),
  sorts: z.array(collectionSortSchema).optional(),
  viewId: z.string().optional(),
  visibleFieldIds: z.array(z.string()).optional(),
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
      request.json().then((body) => viewSchema.parse(body)),
    ]);
    const view = await saveCollectionView({
      ...input,
      collectionId: id,
      editorUserId: currentUser.id,
    });
    return noStoreJson({ view }, { status: input.viewId ? 200 : 201 });
  } catch (error) {
    const response = contentErrorResponse(error);
    if (response) return response;
    console.error("[COLLECTIONS] Failed to save view:", error);
    return noStoreJson(
      { code: "INTERNAL_ERROR", error: "Failed to save view." },
      { status: 500 },
    );
  }
}

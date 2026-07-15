import { z } from "zod";
import { getCurrentUser } from "@/lib/auth-utils";
import { exportContent } from "@/lib/content-export.server";
import { contentErrorResponse, noStoreJson } from "@/lib/content-http.server";
import { McpScope } from "@/lib/mcp-scopes";

export const runtime = "nodejs";

const requestSchema = z.object({
  cursor: z.string().trim().min(1).nullable().optional(),
  limit: z.coerce.number().int().positive().max(500).nullable().optional(),
  resourceId: z.string().trim().min(1),
  resourceType: z.enum(["document", "collection"]),
});

export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser(request, [
      McpScope.TASKS_PERSONAL,
      McpScope.TASKS_ADMIN,
    ]);
    const url = new URL(request.url);
    const input = requestSchema.parse({
      cursor: url.searchParams.get("cursor"),
      limit: url.searchParams.get("limit"),
      resourceId: url.searchParams.get("resourceId"),
      resourceType: url.searchParams.get("resourceType"),
    });
    return noStoreJson(
      await exportContent({
        cursor: input.cursor,
        limit: input.limit,
        resource: { type: input.resourceType, id: input.resourceId },
        userId: currentUser?.id ?? null,
      }),
    );
  } catch (error) {
    const response = contentErrorResponse(error);
    if (response) return response;
    console.error("[CONTENT] Failed to export content:", error);
    return noStoreJson(
      { code: "INTERNAL_ERROR", error: "Failed to export content." },
      { status: 500 },
    );
  }
}

import { z } from "zod";
import { getCurrentUser } from "@/lib/auth-utils";
import {
  contentErrorResponse,
  noStoreJson,
} from "@/lib/content-http.server";
import { McpScope } from "@/lib/mcp-scopes";
import { importNotionBundle } from "@/lib/notion-import.server";

export const runtime = "nodejs";

const CONTENT_SCOPES = [McpScope.TASKS_PERSONAL, McpScope.TASKS_ADMIN];

const requestSchema = z.object({
  bundle: z.unknown(),
  dryRun: z.boolean().default(true),
});

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser(request, CONTENT_SCOPES);
    if (!currentUser) throw new Error("Unauthorized");
    const input = requestSchema.parse(await request.json());
    return noStoreJson(
      await importNotionBundle({
        actorUserId: currentUser.id,
        bundle: input.bundle,
        dryRun: input.dryRun,
      }),
    );
  } catch (error) {
    const response = contentErrorResponse(error);
    if (response) return response;
    console.error("[NOTION_IMPORT] Import failed:", error);
    return noStoreJson(
      { code: "INTERNAL_ERROR", error: "Notion import failed." },
      { status: 500 },
    );
  }
}

import { getCurrentUser } from "@/lib/auth-utils";
import {
  contentErrorResponse,
  noStoreJson,
  parseOptionalPositiveInteger,
} from "@/lib/content-http.server";
import { searchContent } from "@/lib/content-search.server";
import { McpScope } from "@/lib/mcp-scopes";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser(request, [
      McpScope.TASKS_PERSONAL,
      McpScope.TASKS_ADMIN,
    ]);
    const url = new URL(request.url);
    return noStoreJson(
      await searchContent({
        query: url.searchParams.get("q") ?? "",
        limit: parseOptionalPositiveInteger(
          url.searchParams.get("limit"),
          "limit",
        ),
        userId: currentUser?.id ?? null,
      }),
    );
  } catch (error) {
    const response = contentErrorResponse(error);
    if (response) return response;
    console.error("[CONTENT] Failed to search content:", error);
    return noStoreJson(
      { code: "INTERNAL_ERROR", error: "Failed to search content." },
      { status: 500 },
    );
  }
}

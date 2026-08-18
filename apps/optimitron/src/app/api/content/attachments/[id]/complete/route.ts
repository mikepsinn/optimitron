import { requireAuth } from "@/lib/auth-utils";
import {
  completeContentAttachment,
  ContentAttachmentInputError,
} from "@/lib/content-attachments.server";
import {
  contentErrorResponse,
  noStoreJson,
} from "@/lib/content-http.server";
import { McpScope } from "@/lib/mcp-scopes";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const currentUser = await requireAuth(request, [
      McpScope.TASKS_PERSONAL,
      McpScope.TASKS_ADMIN,
    ]);
    const { id } = await context.params;
    return noStoreJson(
      await completeContentAttachment({
        attachmentId: id,
        userId: currentUser.userId,
      }),
    );
  } catch (error) {
    if (error instanceof ContentAttachmentInputError) {
      return noStoreJson(
        { code: "INVALID_ATTACHMENT", error: error.message },
        { status: error.status },
      );
    }
    const response = contentErrorResponse(error);
    if (response) return response;
    console.error("[CONTENT] Failed to finish private attachment:", error);
    return noStoreJson(
      { code: "INTERNAL_ERROR", error: "Failed to finish file upload." },
      { status: 500 },
    );
  }
}

import { getCurrentUser, requireAuth } from "@/lib/auth-utils";
import {
  deleteContentAttachment,
  getContentAttachmentDownload,
} from "@/lib/content-attachments.server";
import {
  contentErrorResponse,
  noStoreJson,
} from "@/lib/content-http.server";
import { McpScope } from "@/lib/mcp-scopes";
import { PrivateObjectStorageNotConfiguredError } from "@/lib/object-storage.server";

export const runtime = "nodejs";

const CONTENT_SCOPES = [McpScope.TASKS_PERSONAL, McpScope.TASKS_ADMIN];

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const currentUser = await getCurrentUser(request, CONTENT_SCOPES);
    const { id } = await context.params;
    const { downloadUrl } = await getContentAttachmentDownload({
      attachmentId: id,
      userId: currentUser?.id ?? null,
    });
    return new Response(null, {
      status: 307,
      headers: {
        "Cache-Control": "private, no-store",
        Location: String(downloadUrl),
        "Referrer-Policy": "no-referrer",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    const response = contentErrorResponse(error);
    if (response) return response;
    if (error instanceof PrivateObjectStorageNotConfiguredError) {
      return noStoreJson(
        { code: "STORAGE_NOT_CONFIGURED", error: "Private files are not configured." },
        { status: 503 },
      );
    }
    console.error("[CONTENT] Failed to open private attachment:", error);
    return noStoreJson(
      { code: "INTERNAL_ERROR", error: "Failed to open file." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const currentUser = await requireAuth(request, CONTENT_SCOPES);
    const { id } = await context.params;
    await deleteContentAttachment({
      attachmentId: id,
      userId: currentUser.userId,
    });
    return noStoreJson({ deleted: true });
  } catch (error) {
    const response = contentErrorResponse(error);
    if (response) return response;
    console.error("[CONTENT] Failed to delete private attachment:", error);
    return noStoreJson(
      { code: "INTERNAL_ERROR", error: "Failed to delete file." },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-utils";
import { McpScope } from "@/lib/mcp-scopes";
import { PrivateObjectStorageNotConfiguredError } from "@/lib/object-storage.server";
import { getTaskCommentAttachmentDownload } from "@/lib/tasks/task-comment-attachments.server";
import { TASK_NOT_FOUND_MESSAGE } from "@/lib/tasks/task-visibility.server";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const currentUser = await getCurrentUser(request, [
      McpScope.TASKS_PERSONAL,
      McpScope.TASKS_ADMIN,
    ]);
    const { id: attachmentId } = await context.params;
    const { downloadUrl } = await getTaskCommentAttachmentDownload({
      attachmentId,
      userId: currentUser?.id ?? null,
    });
    return NextResponse.redirect(downloadUrl, {
      status: 307,
      headers: {
        "Cache-Control": "private, no-store",
        "Referrer-Policy": "no-referrer",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === TASK_NOT_FOUND_MESSAGE) {
      return NextResponse.json({ error: "File not found." }, { status: 404 });
    }
    if (error instanceof PrivateObjectStorageNotConfiguredError) {
      return NextResponse.json(
        { error: "Private files are not configured." },
        { status: 503 },
      );
    }
    console.error("[TASKS] Failed to open private attachment:", error);
    return NextResponse.json(
      { error: "Failed to open file." },
      { status: 500 },
    );
  }
}

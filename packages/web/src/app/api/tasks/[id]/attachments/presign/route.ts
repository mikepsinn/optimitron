import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-utils";
import { McpScope } from "@/lib/mcp-scopes";
import { PrivateObjectStorageNotConfiguredError } from "@/lib/object-storage.server";
import {
  createPendingTaskCommentAttachment,
  TaskCommentAttachmentInputError,
} from "@/lib/tasks/task-comment-attachments.server";
import { TASK_NOT_FOUND_MESSAGE } from "@/lib/tasks/task-visibility.server";

export const runtime = "nodejs";

const requestSchema = z.object({
  checksumSha256: z.string().regex(/^[A-Za-z0-9+/]{43}=$/u),
  contentType: z.string().max(160).default(""),
  fileName: z.string().min(1).max(512),
  sizeBytes: z.number().int().positive(),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const currentUser = await requireAuth(request, [
      McpScope.TASKS_PERSONAL,
      McpScope.TASKS_ADMIN,
    ]);
    const parsed = requestSchema.safeParse(
      await request.json().catch(() => null),
    );
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid attachment." },
        { status: 400 },
      );
    }

    const { id: taskId } = await context.params;
    const attachment = await createPendingTaskCommentAttachment({
      ...parsed.data,
      taskId,
      userId: currentUser.userId,
    });
    return NextResponse.json(attachment);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      );
    }
    if (error instanceof Error && error.message === TASK_NOT_FOUND_MESSAGE) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }
    if (error instanceof TaskCommentAttachmentInputError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    if (error instanceof PrivateObjectStorageNotConfiguredError) {
      return NextResponse.json(
        { error: "Private file uploads are not configured." },
        { status: 503 },
      );
    }
    console.error(
      "[TASKS] Failed to prepare private attachment upload:",
      error,
    );
    return NextResponse.json(
      { error: "Failed to prepare file upload." },
      { status: 500 },
    );
  }
}

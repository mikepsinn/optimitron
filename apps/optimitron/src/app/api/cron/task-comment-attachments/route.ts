import { NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron";
import { PrivateObjectStorageNotConfiguredError } from "@/lib/object-storage.server";
import { cleanupExpiredTaskCommentAttachments } from "@/lib/tasks/task-comment-attachments.server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await cleanupExpiredTaskCommentAttachments();
    return NextResponse.json({ data: result, success: true });
  } catch (error) {
    if (error instanceof PrivateObjectStorageNotConfiguredError) {
      return NextResponse.json(
        { error: "Private object storage is not configured." },
        { status: 503 },
      );
    }
    console.error("[TASKS] Failed to clean up expired attachments:", error);
    return NextResponse.json(
      { error: "Failed to clean up expired attachments." },
      { status: 500 },
    );
  }
}

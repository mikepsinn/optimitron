/**
 * DELETE /api/tasks/comments/[id] — delete a comment.
 * Authors soft-delete their own (renders as [deleted]).
 * Admins hard-delete the comment plus every reply beneath it.
 */

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-utils";
import { deleteComment } from "@/lib/tasks/task-comments.server";

export const runtime = "nodejs";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { id: commentId } = await context.params;

    await deleteComment({
      commentId,
      userId: currentUser.id,
      asModerator: currentUser.isAdmin ?? false,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete comment.";
    const status = message.includes("Not authorized") ? 403 : 500;
    console.error("[TASKS] Failed to delete comment:", error);
    return NextResponse.json({ error: message }, { status });
  }
}

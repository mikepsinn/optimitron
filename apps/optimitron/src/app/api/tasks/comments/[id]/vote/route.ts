/**
 * POST /api/tasks/comments/[id]/vote — upvote/downvote/unvote a comment.
 */

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-utils";
import { voteComment } from "@/lib/tasks/task-comments.server";
import {
  getClientIp,
  hashRequestValue,
} from "@/lib/tasks/comment-request-helpers";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { id: commentId } = await context.params;
    const body = (await request.json().catch(() => null)) as
      | { value?: unknown }
      | null;

    const rawValue = body?.value;
    if (rawValue !== 1 && rawValue !== -1 && rawValue !== 0) {
      return NextResponse.json(
        { error: "value must be 1, -1, or 0" },
        { status: 400 },
      );
    }

    const ipHash = hashRequestValue(getClientIp(request));
    const userAgentHash = hashRequestValue(request.headers.get("user-agent"));

    const result = await voteComment({
      commentId,
      userId: currentUser.id,
      value: rawValue as 1 | -1 | 0,
      ipHash,
      userAgentHash,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "Task not found" || message === "Comment not found") {
      // Comments on private tasks are indistinguishable from missing ones.
      return NextResponse.json({ error: "Comment not found." }, { status: 404 });
    }
    console.error("[TASKS] Failed to vote on comment:", error);
    return NextResponse.json({ error: "Failed to vote." }, { status: 500 });
  }
}

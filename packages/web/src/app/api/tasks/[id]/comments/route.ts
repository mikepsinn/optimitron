/**
 * GET  /api/tasks/[id]/comments — public, cursor-paginated feed of comments + activities
 * POST /api/tasks/[id]/comments — auth required, rate-limited, background-fires Wishonia reply
 */

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-utils";
import { notifyTaskCommentRecipients } from "@/lib/tasks/task-comment-notifications.server";
import {
  countUserCommentsInWindow,
  getTaskActivityTimeline,
  getTaskCommentFeed,
  postComment,
  type CommentSortKey,
} from "@/lib/tasks/task-comments.server";
import {
  buildCitationsJson,
  generateAndPostWishoniaReply,
  prepareWishoniaReply,
  streamWishoniaReplyText,
} from "@/lib/tasks/wishonia-task-reply.server";

export const runtime = "nodejs";

const MAX_MESSAGE_LENGTH = 20_000;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX_COMMENTS = 5;

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id: taskId } = await context.params;
    const url = new URL(request.url);
    const sortParam = url.searchParams.get("sort");
    const sort: CommentSortKey = sortParam === "top" ? "top" : "new";
    const cursorParam = url.searchParams.get("cursor");
    const cursor = cursorParam ? new Date(cursorParam) : null;
    const limitParam = Number(url.searchParams.get("limit") ?? 50);
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 100) : 50;

    const currentUser = await getCurrentUser();

    const [{ comments, nextCursor }, activityEvents] = await Promise.all([
      getTaskCommentFeed({
        taskId,
        sort,
        cursor: cursor && !Number.isNaN(cursor.getTime()) ? cursor : null,
        limit,
        currentUserId: currentUser?.id ?? null,
      }),
      // Only fetch activities on the first page load (no cursor) — they're
      // not paginated, they're just a supplementary timeline.
      cursor ? Promise.resolve([]) : getTaskActivityTimeline(taskId, 50),
    ]);

    return NextResponse.json({
      comments,
      nextCursor: nextCursor?.toISOString() ?? null,
      activityEvents,
    });
  } catch (error) {
    console.error("[TASKS] Failed to fetch comment feed:", error);
    return NextResponse.json({ error: "Failed to fetch comments." }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { id: taskId } = await context.params;
    const body = (await request.json().catch(() => null)) as
      | {
          message?: unknown;
          parentCommentId?: unknown;
          mediaUrl?: unknown;
        }
      | null;

    const message = typeof body?.message === "string" ? body.message.trim() : "";
    if (message.length < 1) {
      return NextResponse.json({ error: "Message cannot be empty." }, { status: 400 });
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `Message exceeds ${MAX_MESSAGE_LENGTH} character limit.` },
        { status: 400 },
      );
    }

    const parentCommentId =
      typeof body?.parentCommentId === "string" && body.parentCommentId.length > 0
        ? body.parentCommentId
        : null;
    const mediaUrl =
      typeof body?.mediaUrl === "string" && body.mediaUrl.length > 0 ? body.mediaUrl : null;

    // Rate limit: 5 comments per user per task per hour
    const recentCount = await countUserCommentsInWindow(
      taskId,
      currentUser.id,
      RATE_LIMIT_WINDOW_MS,
    );
    if (recentCount >= RATE_LIMIT_MAX_COMMENTS) {
      return NextResponse.json(
        {
          error: `Rate limit exceeded. Max ${RATE_LIMIT_MAX_COMMENTS} comments per task per hour.`,
        },
        { status: 429 },
      );
    }

    const comment = await postComment({
      taskId,
      authorUserId: currentUser.id,
      parentCommentId,
      message,
      mediaUrl,
    });

    void notifyTaskCommentRecipients({
      authorUserId: currentUser.id,
      commentId: comment.id,
      message,
      taskId,
    });

    // If the client asked for NDJSON streaming, return a live stream that
    // emits the user comment, then pipes Wishonia's generation chunks, then
    // a final comment object once posted.
    const acceptHeader = request.headers.get("accept") ?? "";
    if (acceptHeader.includes("application/x-ndjson")) {
      return streamCommentResponse({
        taskId,
        comment,
        userMessage: message,
        userId: currentUser.id,
      });
    }

    // Non-streaming clients (MCP, curl, older browsers): background-fire
    // Wishonia reply so the user's comment returns immediately.
    void generateAndPostWishoniaReply({
      taskId,
      parentCommentId: comment.id,
      userComment: message,
      userCommentAuthorId: currentUser.id,
    });

    return NextResponse.json({ comment });
  } catch (error) {
    console.error("[TASKS] Failed to post comment:", error);
    return NextResponse.json({ error: "Failed to post comment." }, { status: 500 });
  }
}

/**
 * Stream an NDJSON response that emits:
 *   { type: "user", comment }
 *   { type: "wishonia-skip", reason }           (if not eligible)
 *   { type: "wishonia-start", parentCommentId } (if eligible)
 *   { type: "wishonia-chunk", delta } × N
 *   { type: "wishonia-done", comment }
 *
 * Each event is a single JSON object followed by a newline. The client reads
 * the body as a ReadableStream and parses line-by-line.
 */
function streamCommentResponse(args: {
  taskId: string;
  comment: Awaited<ReturnType<typeof postComment>>;
  userMessage: string;
  userId: string;
}): Response {
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: unknown) => {
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      };

      try {
        // 1. Echo the user comment immediately so the client can render it
        send({ type: "user", comment: args.comment });

        // 2. Check Wishonia eligibility
        const prepResult = await prepareWishoniaReply({
          taskId: args.taskId,
          userComment: args.userMessage,
          userCommentAuthorId: args.userId,
        });

        if (prepResult.status === "skip") {
          send({ type: "wishonia-skip", reason: prepResult.reason });
          controller.close();
          return;
        }

        const { prep } = prepResult;

        // 3. Signal that a Wishonia reply is starting (so the client can
        //    render a placeholder attached to this parent)
        send({
          type: "wishonia-start",
          parentCommentId: args.comment.id,
        });

        // 4. Stream Gemini chunks
        let fullText = "";
        try {
          for await (const event of streamWishoniaReplyText(prep)) {
            if (event.type === "chunk") {
              fullText += event.delta;
              send({ type: "wishonia-chunk", delta: event.delta });
            } else {
              fullText = event.fullText;
            }
          }
        } catch (err) {
          console.error("[TASKS] Wishonia stream failed:", err);
          send({
            type: "wishonia-error",
            error: err instanceof Error ? err.message : "Generation failed",
          });
          controller.close();
          return;
        }

        if (!fullText) {
          send({ type: "wishonia-error", error: "Empty response" });
          controller.close();
          return;
        }

        // 5. Persist the reply to the DB and return the canonical row
        const wishoniaComment = await postComment({
          taskId: args.taskId,
          authorUserId: prep.wishoniaUserId,
          parentCommentId: args.comment.id,
          message: fullText,
          citationsJson: buildCitationsJson(prep.citations),
        });

        void notifyTaskCommentRecipients({
          authorUserId: prep.wishoniaUserId,
          commentId: wishoniaComment.id,
          message: fullText,
          taskId: args.taskId,
        });

        send({ type: "wishonia-done", comment: wishoniaComment });
      } catch (err) {
        console.error("[TASKS] Comment stream error:", err);
        try {
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: "error",
                error: err instanceof Error ? err.message : "Stream failed",
              }) + "\n",
            ),
          );
        } catch {
          // controller already closed
        }
      } finally {
        try {
          controller.close();
        } catch {
          // already closed
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}


"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, MessageSquare, Send, Trash2, X } from "lucide-react";
import { Avatar } from "@/components/retroui/Avatar";
import { Button } from "@/components/retroui/Button";
import { Dialog } from "@/components/retroui/Dialog";
import { RichMarkdown } from "@/components/markdown/rich-markdown";
import { API_ROUTES } from "@/lib/api-routes";
import { getPersonHref } from "@/lib/person-href";
import {
  getUserDisplayAvatar,
  getUserDisplayHandle,
  getUserDisplayHref,
  getUserDisplayName,
} from "@/lib/user-display";

interface CommentUser {
  id: string;
  email?: string | null;
  person?: {
    id: string;
    handle: string | null;
    displayName: string;
    image: string | null;
  } | null;
}

interface Citation {
  title: string;
  url: string;
  path?: string | null;
  description?: string | null;
}

interface TaskCommentRow {
  id: string;
  taskId: string;
  parentCommentId: string | null;
  authorUserId: string;
  message: string;
  mediaUrl: string | null;
  upvoteCount: number;
  downvoteCount: number;
  voteScore: number;
  replyCount: number;
  citationsJson: unknown;
  editedAt: string | Date | null;
  deletedAt: string | Date | null;
  hiddenByCurator: boolean;
  path: string;
  createdAt: string | Date;
  authorUser: CommentUser | null;
  viewerVote?: 1 | -1 | 0;
  /** Client-only: true while Wishonia is actively streaming tokens into this row. */
  isStreaming?: boolean;
}

interface TaskActivityRow {
  id: string;
  type: string;
  userId: string;
  createdAt: string | Date;
  metadata: unknown;
  user: CommentUser;
}

interface TaskCommentFeedProps {
  taskId: string;
  initialComments: TaskCommentRow[];
  initialActivities: TaskActivityRow[];
  currentUserId: string | null;
  currentUserIsAdmin: boolean;
  wishoniaUserId: string | null;
  signInHref: string;
}

type SortMode = "new" | "top";

type StreamEvent =
  | { type: "user"; comment: TaskCommentRow }
  | { type: "wishonia-skip"; reason: string }
  | { type: "wishonia-start"; parentCommentId: string }
  | { type: "wishonia-chunk"; delta: string }
  | { type: "wishonia-done"; comment: TaskCommentRow }
  | { type: "wishonia-error"; error: string }
  | { type: "error"; error: string };

const MAX_MESSAGE_LENGTH = 20_000;
const POLL_INTERVAL_MS = 10_000;

export function TaskCommentFeed({
  taskId,
  initialComments,
  initialActivities,
  currentUserId,
  currentUserIsAdmin,
  wishoniaUserId,
  signInHref,
}: TaskCommentFeedProps) {
  const [comments, setComments] = useState<TaskCommentRow[]>(initialComments);
  const [activities] = useState<TaskActivityRow[]>(initialActivities);
  const [sort, setSort] = useState<SortMode>("new");
  const [draft, setDraft] = useState("");
  const [draftMediaUrl, setDraftMediaUrl] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [wishoniaNotice, setWishoniaNotice] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    path: string;
  } | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showWishoniaNotice = useCallback((message: string) => {
    setWishoniaNotice(message);
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = setTimeout(() => setWishoniaNotice(null), 6000);
  }, []);

  useEffect(() => {
    return () => {
      if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    };
  }, []);

  const commentsById = useMemo(() => {
    const map = new Map<string, TaskCommentRow>();
    for (const c of comments) map.set(c.id, c);
    return map;
  }, [comments]);

  // Build threaded tree: top-level comments with replies nested
  const threaded = useMemo(() => {
    const topLevel: TaskCommentRow[] = [];
    const repliesByParent = new Map<string, TaskCommentRow[]>();
    for (const c of comments) {
      if (c.parentCommentId) {
        const arr = repliesByParent.get(c.parentCommentId) ?? [];
        arr.push(c);
        repliesByParent.set(c.parentCommentId, arr);
      } else {
        topLevel.push(c);
      }
    }
    // Sort top-level by chosen sort mode
    topLevel.sort((a, b) => {
      if (sort === "top") {
        if (a.voteScore !== b.voteScore) return b.voteScore - a.voteScore;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    // Sort replies chronologically (oldest first so threads read naturally)
    for (const arr of repliesByParent.values()) {
      arr.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
    return { topLevel, repliesByParent };
  }, [comments, sort]);

  // Merge silent activity events into a chronological sidebar — we render them
  // as subtle one-liners above the comment section.
  const displayActivities = useMemo(() => {
    return [...activities].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [activities]);

  // Polling to pick up Wishonia replies landing in the background
  const fetchLatest = useCallback(async () => {
    try {
      const res = await fetch(API_ROUTES.tasks.comments(taskId, "sort=new&limit=100"));
      if (!res.ok) return;
      const data = (await res.json()) as {
        comments: TaskCommentRow[];
        nextCursor: string | null;
      };
      setComments((prev) => {
        const incoming = new Map(prev.map((c) => [c.id, c] as const));
        for (const c of data.comments) {
          incoming.set(c.id, c);
        }
        return [...incoming.values()];
      });
    } catch (err) {
      console.error("[TaskCommentFeed] Failed to poll:", err);
    }
  }, [taskId]);

  useEffect(() => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    pollTimerRef.current = setInterval(() => {
      if (document.visibilityState === "visible") {
        void fetchLatest();
      }
    }, POLL_INTERVAL_MS);
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [fetchLatest]);

  async function submitComment(
    message: string,
    parentCommentId: string | null,
    mediaUrl: string | null,
  ) {
    setSubmitting(true);
    setPostError(null);

    // Synthetic placeholder id for Wishonia's streaming row. Replaced by the
    // real server-assigned id once the stream emits `wishonia-done`.
    const streamingPlaceholderId = `streaming:${crypto.randomUUID()}`;

    try {
      const res = await fetch(API_ROUTES.tasks.comments(taskId), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/x-ndjson",
        },
        body: JSON.stringify({ message, parentCommentId, mediaUrl }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? `Failed with status ${res.status}`);
      }
      if (!res.body) {
        throw new Error("Empty response body");
      }

      // Clear drafts immediately so the UI responds before the stream completes
      if (parentCommentId) {
        setReplyingTo(null);
        setReplyDraft("");
      } else {
        setDraft("");
        setDraftMediaUrl("");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let wishoniaStarted = false;

      const upsert = (next: TaskCommentRow) => {
        setComments((prev) => {
          const map = new Map(prev.map((c) => [c.id, c] as const));
          map.set(next.id, next);
          return [...map.values()];
        });
      };

      const appendStreamingChunk = (delta: string) => {
        setComments((prev) =>
          prev.map((c) =>
            c.id === streamingPlaceholderId
              ? { ...c, message: c.message + delta }
              : c,
          ),
        );
      };

      const removeStreamingPlaceholder = () => {
        setComments((prev) => prev.filter((c) => c.id !== streamingPlaceholderId));
      };

      const replaceStreamingPlaceholder = (real: TaskCommentRow) => {
        setComments((prev) => {
          const map = new Map(
            prev.filter((c) => c.id !== streamingPlaceholderId).map((c) => [c.id, c] as const),
          );
          map.set(real.id, real);
          return [...map.values()];
        });
      };

      // Process NDJSON stream line-by-line
      for (;;) {
        const { value, done } = await reader.read();
        if (value) {
          buffer += decoder.decode(value, { stream: true });
          let newlineIdx = buffer.indexOf("\n");
          while (newlineIdx !== -1) {
            const line = buffer.slice(0, newlineIdx).trim();
            buffer = buffer.slice(newlineIdx + 1);
            if (line.length > 0) {
              try {
                const event = JSON.parse(line) as StreamEvent;
                handleStreamEvent(event);
              } catch (err) {
                console.error("[TaskCommentFeed] Failed to parse NDJSON line:", line, err);
              }
            }
            newlineIdx = buffer.indexOf("\n");
          }
        }
        if (done) break;
      }

      function handleStreamEvent(event: StreamEvent) {
        switch (event.type) {
          case "user":
            upsert(event.comment);
            break;
          case "wishonia-start": {
            wishoniaStarted = true;
            // Insert an empty streaming placeholder that the chunks fill in
            const placeholder: TaskCommentRow = {
              id: streamingPlaceholderId,
              taskId,
              parentCommentId: event.parentCommentId,
              authorUserId: wishoniaUserId ?? "wishonia",
              message: "",
              mediaUrl: null,
              upvoteCount: 0,
              downvoteCount: 0,
              voteScore: 0,
              replyCount: 0,
              citationsJson: null,
              editedAt: null,
              deletedAt: null,
              hiddenByCurator: false,
              path: "",
              createdAt: new Date().toISOString(),
              authorUser: {
                id: wishoniaUserId ?? "wishonia",
                person: {
                  id: "wishonia-person",
                  handle: "wishonia",
                  displayName: "Wishonia",
                  image: "/sprites/wishonia/smirk-smile.png",
                },
              },
              isStreaming: true,
            };
            setComments((prev) => [...prev, placeholder]);
            break;
          }
          case "wishonia-chunk":
            appendStreamingChunk(event.delta);
            break;
          case "wishonia-done":
            replaceStreamingPlaceholder(event.comment);
            break;
          case "wishonia-skip":
            showWishoniaNotice(
              event.reason === "too-short"
                ? "Wishonia skipped: add a bit more context for a substantive reply."
                : event.reason === "rate-limited"
                  ? "Wishonia has already replied 3 times on this task in the last hour."
                  : event.reason === "disabled"
                    ? "Wishonia auto-reply is disabled."
                    : `Wishonia skipped (${event.reason}).`,
            );
            if (wishoniaStarted) removeStreamingPlaceholder();
            break;
          case "wishonia-error":
            showWishoniaNotice(`Wishonia failed: ${event.error}`);
            if (wishoniaStarted) removeStreamingPlaceholder();
            break;
          case "error":
            console.error("[TaskCommentFeed] Stream error:", event.error);
            break;
        }
      }
    } catch (err) {
      setPostError(err instanceof Error ? err.message : "Failed to post comment");
      // Clean up any streaming placeholder that was inserted before the error
      setComments((prev) => prev.filter((c) => c.id !== streamingPlaceholderId));
    } finally {
      setSubmitting(false);
    }
  }

  async function castVote(commentId: string, nextValue: 1 | -1 | 0) {
    // Optimistic
    const prevComment = commentsById.get(commentId);
    if (!prevComment) return;
    const prevViewerVote = prevComment.viewerVote ?? 0;
    const scoreDelta = nextValue - prevViewerVote;
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? {
              ...c,
              voteScore: c.voteScore + scoreDelta,
              viewerVote: nextValue,
              upvoteCount:
                nextValue === 1
                  ? c.upvoteCount + (prevViewerVote === 1 ? 0 : 1)
                  : prevViewerVote === 1
                    ? c.upvoteCount - 1
                    : c.upvoteCount,
              downvoteCount:
                nextValue === -1
                  ? c.downvoteCount + (prevViewerVote === -1 ? 0 : 1)
                  : prevViewerVote === -1
                    ? c.downvoteCount - 1
                    : c.downvoteCount,
            }
          : c,
      ),
    );
    try {
      const res = await fetch(API_ROUTES.tasks.commentVote(commentId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: nextValue }),
      });
      if (!res.ok) throw new Error("Vote failed");
      const data = (await res.json()) as {
        voteScore: number;
        upvoteCount: number;
        downvoteCount: number;
        userVote: 1 | -1 | 0;
      };
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? {
                ...c,
                voteScore: data.voteScore,
                upvoteCount: data.upvoteCount,
                downvoteCount: data.downvoteCount,
                viewerVote: data.userVote,
              }
            : c,
        ),
      );
    } catch (err) {
      console.error("[TaskCommentFeed] Vote failed:", err);
      // Revert optimistic update by refetching
      void fetchLatest();
    }
  }

  function onDelete(commentId: string) {
    const c = commentsById.get(commentId);
    if (!c) return;
    setDeleteTarget({ id: commentId, path: c.path });
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    try {
      const res = await fetch(API_ROUTES.tasks.comment(target.id), { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      if (currentUserIsAdmin) {
        setComments((prev) =>
          prev.filter(
            (c) => c.id !== target.id && !c.path.startsWith(`${target.path}/`),
          ),
        );
      } else {
        setComments((prev) =>
          prev.map((c) =>
            c.id === target.id ? { ...c, deletedAt: new Date().toISOString() } : c,
          ),
        );
      }
    } catch (err) {
      console.error("[TaskCommentFeed] Delete failed:", err);
    }
  }

  const deleteTargetDescendantCount = useMemo(() => {
    if (!deleteTarget?.path) return 0;
    const prefix = `${deleteTarget.path}/`;
    return comments.filter(
      (c) => c.id !== deleteTarget.id && c.path.startsWith(prefix),
    ).length;
  }, [deleteTarget, comments]);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold uppercase tracking-wide">Status Update</h2>
        <div className="flex gap-1 text-xs font-bold uppercase">
          <button
            type="button"
            onClick={() => setSort("new")}
            className={`border-2 border-foreground px-2 py-1 ${sort === "new" ? "bg-foreground text-background" : "bg-background"}`}
          >
            New
          </button>
          <button
            type="button"
            onClick={() => setSort("top")}
            className={`border-2 border-foreground px-2 py-1 ${sort === "top" ? "bg-foreground text-background" : "bg-background"}`}
          >
            Top
          </button>
        </div>
      </div>

      {currentUserId ? (
        <div className="border-2 border-primary bg-background p-3">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={MAX_MESSAGE_LENGTH}
            placeholder="Share proof of what you did, post a mermaid diagram, argue with the numbers..."
            className="w-full resize-y border-2 border-foreground bg-background p-2 text-sm font-bold focus:outline-none"
            rows={3}
          />
          <input
            type="url"
            value={draftMediaUrl}
            onChange={(e) => setDraftMediaUrl(e.target.value)}
            placeholder="Optional evidence URL (tweet, article, screenshot)"
            className="mt-2 w-full border-2 border-foreground bg-background p-2 text-xs font-bold focus:outline-none"
          />
          <div className="mt-2 flex items-center justify-between text-xs font-bold text-muted-foreground">
            <span>
              Supports markdown, math ($x$), mermaid, chart. {draft.length}/{MAX_MESSAGE_LENGTH}
            </span>
            <Button
              size="sm"
              className="font-bold uppercase"
              disabled={submitting || draft.trim().length === 0}
              onClick={() => {
                void submitComment(draft.trim(), null, draftMediaUrl.trim() || null);
              }}
            >
              <Send className="mr-1 h-3 w-3" />
              Post
            </Button>
          </div>
          {postError ? (
            <p className="mt-2 text-xs font-bold text-brutal-red">{postError}</p>
          ) : null}
          {wishoniaNotice ? (
            <p className="mt-2 text-xs font-bold italic text-muted-foreground">
              {wishoniaNotice}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="flex items-center justify-between border-2 border-primary bg-muted/30 p-3">
          <p className="text-sm font-bold">Sign in to comment, vote, and reply.</p>
          <Button asChild size="sm" className="font-bold uppercase">
            <Link href={signInHref}>Sign In</Link>
          </Button>
        </div>
      )}

      {displayActivities.length > 0 ? (
        <div className="border-2 border-primary/50 bg-background">
          <div className="divide-y divide-foreground/10">
            {displayActivities.slice(0, 10).map((activity) => (
              <ActivityRow key={activity.id} activity={activity} />
            ))}
          </div>
        </div>
      ) : null}

      <div className="space-y-4">
        {threaded.topLevel.map((comment) => (
          <CommentNode
            key={comment.id}
            comment={comment}
            replies={threaded.repliesByParent.get(comment.id) ?? []}
            wishoniaUserId={wishoniaUserId}
            currentUserId={currentUserId}
            currentUserIsAdmin={currentUserIsAdmin}
            replyingTo={replyingTo}
            replyDraft={replyDraft}
            setReplyingTo={setReplyingTo}
            setReplyDraft={setReplyDraft}
            submitting={submitting}
            onVote={(id, value) => void castVote(id, value)}
            onDelete={onDelete}
            onSubmitReply={(parentId, message) =>
              void submitComment(message, parentId, null)
            }
          />
        ))}
      </div>

      <Dialog
        open={deleteTarget != null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <Dialog.Content size="sm">
          <Dialog.Header asChild>
            <div className="flex min-h-12 items-center justify-between border-b-2 bg-primary px-4">
              <h2 className="text-base font-black uppercase text-primary-foreground">
                {currentUserIsAdmin ? "Delete permanently?" : "Delete comment?"}
              </h2>
              <Dialog.Close asChild>
                <button
                  type="button"
                  aria-label="Close"
                  className="cursor-pointer text-primary-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </Dialog.Close>
            </div>
          </Dialog.Header>
          <Dialog.Description className="px-4 py-4 text-sm font-bold">
            {currentUserIsAdmin
              ? deleteTargetDescendantCount > 0
                ? `Removes this comment and ${deleteTargetDescendantCount} ${deleteTargetDescendantCount === 1 ? "reply" : "replies"} beneath it. Gone forever. No placeholder.`
                : "Removes this comment permanently. Gone forever. No placeholder."
              : "Marks this comment as [deleted]. Replies remain visible."}
          </Dialog.Description>
          <Dialog.Footer>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              className="bg-brutal-red text-brutal-red-foreground hover:bg-brutal-red/80"
              onClick={() => void confirmDelete()}
            >
              {currentUserIsAdmin ? "Delete forever" : "Delete"}
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog>
    </section>
  );
}

function CommentNode({
  comment,
  replies,
  wishoniaUserId,
  currentUserId,
  currentUserIsAdmin,
  replyingTo,
  replyDraft,
  setReplyingTo,
  setReplyDraft,
  submitting,
  onVote,
  onDelete,
  onSubmitReply,
  depth = 0,
}: {
  comment: TaskCommentRow;
  replies: TaskCommentRow[];
  wishoniaUserId: string | null;
  currentUserId: string | null;
  currentUserIsAdmin: boolean;
  replyingTo: string | null;
  replyDraft: string;
  setReplyingTo: (id: string | null) => void;
  setReplyDraft: (value: string) => void;
  submitting: boolean;
  onVote: (commentId: string, value: 1 | -1 | 0) => void;
  onDelete: (commentId: string) => void;
  onSubmitReply: (parentId: string, message: string) => void;
  depth?: number;
}) {
  const isDeleted = comment.deletedAt != null || comment.hiddenByCurator;
  const isWishonia = comment.authorUserId === wishoniaUserId;
  const isOwn = comment.authorUserId === currentUserId;
  const canReply = currentUserId != null && !isDeleted;
  const canDelete = currentUserIsAdmin || (isOwn && !isDeleted);
  const handle =
    getUserDisplayHandle(comment.authorUser) ??
    getUserDisplayName(comment.authorUser);
  const avatar = getUserDisplayAvatar(comment.authorUser);
  const personHref = getUserDisplayHref(comment.authorUser);
  const citations = extractCitations(comment.citationsJson);

  return (
    <div className={depth > 0 ? "ml-6 border-l-2 border-primary/40 pl-4" : ""}>
      <article className="border-2 border-primary bg-background p-3">
        <header className="mb-2 flex items-center gap-2">
          {personHref ? (
            <Link href={personHref} className="shrink-0">
              <Avatar className="h-7 w-7 border-2 border-foreground bg-muted">
                <Avatar.Image alt={handle} src={avatar ?? undefined} />
                <Avatar.Fallback className="bg-foreground text-[10px] font-black text-background">
                  {handle.slice(0, 2).toUpperCase()}
                </Avatar.Fallback>
              </Avatar>
            </Link>
          ) : (
            <Avatar className="h-7 w-7 shrink-0 border-2 border-foreground bg-muted">
              <Avatar.Image alt={handle} src={avatar ?? undefined} />
              <Avatar.Fallback className="bg-foreground text-[10px] font-black text-background">
                {handle.slice(0, 2).toUpperCase()}
              </Avatar.Fallback>
            </Avatar>
          )}
          {personHref ? (
            <Link
              href={personHref}
              className="text-sm font-bold underline-offset-4 hover:underline"
            >
              @{handle}
            </Link>
          ) : (
            <span className="text-sm font-bold">@{handle}</span>
          )}
          {isWishonia ? (
            <span className="border-2 border-foreground bg-foreground px-1.5 py-0 text-[10px] font-bold uppercase text-background">
              Wishonia
            </span>
          ) : null}
          <span className="text-xs font-bold text-muted-foreground">
            · {formatRelative(comment.createdAt)}
          </span>
          {comment.editedAt ? (
            <span className="text-xs font-bold text-muted-foreground">· edited</span>
          ) : null}
          {canDelete ? (
            <button
              type="button"
              className="ml-auto text-xs text-muted-foreground hover:text-foreground"
              onClick={() => onDelete(comment.id)}
              aria-label="Delete comment"
              title={currentUserIsAdmin ? "Delete permanently" : "Delete"}
            >
              <Trash2 className="h-3 w-3" />
            </button>
          ) : null}
        </header>

        {isDeleted ? (
          <p className="text-sm font-bold italic text-muted-foreground">[deleted]</p>
        ) : (
          <>
            {comment.isStreaming && comment.message.length === 0 ? (
              <p className="flex items-center gap-2 text-sm font-bold italic text-muted-foreground">
                <span className="inline-flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-foreground [animation-delay:-0.3s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-foreground [animation-delay:-0.15s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-foreground" />
                </span>
                Wishonia is writing...
              </p>
            ) : (
              <div className="relative">
                <RichMarkdown markdown={comment.message} />
                {comment.isStreaming ? (
                  <span
                    aria-hidden
                    className="ml-1 inline-block h-4 w-[2px] animate-pulse bg-foreground align-middle"
                  />
                ) : null}
              </div>
            )}
            {comment.mediaUrl ? (
              <a
                href={comment.mediaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-xs font-bold text-foreground underline underline-offset-4"
              >
                Evidence: {comment.mediaUrl}
              </a>
            ) : null}
            {citations.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-1">
                {citations.map((c, i) => (
                  <a
                    key={`${c.url}-${i}`}
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block border-2 border-foreground bg-muted px-2 py-0.5 text-[10px] font-bold uppercase hover:bg-foreground hover:text-background"
                    title={c.description ?? undefined}
                  >
                    {c.title}
                  </a>
                ))}
              </div>
            ) : null}
          </>
        )}

        <footer className="mt-3 flex items-center gap-2">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onVote(comment.id, comment.viewerVote === 1 ? 0 : 1)}
              disabled={currentUserId == null || isDeleted}
              className={`border-2 border-foreground p-0.5 ${
                comment.viewerVote === 1
                  ? "bg-foreground text-background"
                  : "bg-background text-foreground hover:bg-muted"
              }`}
              aria-label="Upvote"
              title="Upvote"
            >
              <ArrowUp className="h-3 w-3" />
            </button>
            <span className="min-w-4 text-center text-xs font-bold">
              {comment.voteScore}
            </span>
            <button
              type="button"
              onClick={() => onVote(comment.id, comment.viewerVote === -1 ? 0 : -1)}
              disabled={currentUserId == null || isDeleted}
              className={`border-2 border-foreground p-0.5 ${
                comment.viewerVote === -1
                  ? "bg-background text-foreground"
                  : "bg-background text-foreground hover:bg-muted"
              }`}
              aria-label="Downvote"
              title="Downvote"
            >
              <ArrowDown className="h-3 w-3" />
            </button>
          </div>
          {canReply ? (
            <button
              type="button"
              className="flex items-center gap-1 text-xs font-bold uppercase text-muted-foreground hover:text-foreground"
              onClick={() =>
                setReplyingTo(replyingTo === comment.id ? null : comment.id)
              }
            >
              <MessageSquare className="h-3 w-3" />
              Reply
            </button>
          ) : null}
          {comment.replyCount > 0 ? (
            <span className="text-xs font-bold text-muted-foreground">
              {comment.replyCount} {comment.replyCount === 1 ? "reply" : "replies"}
            </span>
          ) : null}
        </footer>

        {replyingTo === comment.id ? (
          <div className="mt-3 border-2 border-foreground bg-muted/20 p-2">
            <textarea
              value={replyDraft}
              onChange={(e) => setReplyDraft(e.target.value)}
              maxLength={MAX_MESSAGE_LENGTH}
              placeholder="Reply..."
              className="w-full resize-y border-2 border-foreground bg-background p-2 text-sm font-bold focus:outline-none"
              rows={3}
            />
            <div className="mt-2 flex justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                className="font-bold uppercase"
                onClick={() => {
                  setReplyingTo(null);
                  setReplyDraft("");
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="font-bold uppercase"
                disabled={submitting || replyDraft.trim().length === 0}
                onClick={() => onSubmitReply(comment.id, replyDraft.trim())}
              >
                Post Reply
              </Button>
            </div>
          </div>
        ) : null}
      </article>

      {replies.length > 0 ? (
        <div className="mt-2 space-y-2">
          {replies.map((reply) => (
            <CommentNode
              key={reply.id}
              comment={reply}
              replies={[]}
              wishoniaUserId={wishoniaUserId}
              currentUserId={currentUserId}
              currentUserIsAdmin={currentUserIsAdmin}
              replyingTo={replyingTo}
              replyDraft={replyDraft}
              setReplyingTo={setReplyingTo}
              setReplyDraft={setReplyDraft}
              submitting={submitting}
              onVote={onVote}
              onDelete={onDelete}
              onSubmitReply={onSubmitReply}
              depth={depth + 1}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ActivityRow({ activity }: { activity: TaskActivityRow }) {
  const handle =
    getUserDisplayHandle(activity.user) ?? getUserDisplayName(activity.user);
  const avatar = getUserDisplayAvatar(activity.user);
  const personHref = getUserDisplayHref(activity.user);
  const label = formatActivityType(activity.type);
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-muted-foreground">
      <Avatar className="h-4 w-4 shrink-0 border border-foreground">
        <Avatar.Image alt={handle} src={avatar ?? undefined} />
        <Avatar.Fallback className="bg-foreground text-[8px] font-black text-background">
          {handle.slice(0, 1).toUpperCase()}
        </Avatar.Fallback>
      </Avatar>
      {personHref ? (
        <Link href={personHref} className="underline-offset-4 hover:underline">
          @{handle}
        </Link>
      ) : (
        <span>@{handle}</span>
      )}
      <span>{label}</span>
      <span className="ml-auto">{formatRelative(activity.createdAt)}</span>
    </div>
  );
}

function formatActivityType(type: string): string {
  switch (type) {
    case "CONTACTED_ASSIGNEE":
      return "contacted the assignee";
    case "VOTED_REFERENDUM":
      return "voted on the referendum";
    case "RECRUITED_VOTER":
      return "recruited a voter";
    case "DEPOSITED_PRIZE":
      return "deposited into the prize";
    default:
      return type.toLowerCase().replace(/_/g, " ");
  }
}

function formatRelative(date: string | Date): string {
  const ms = Date.now() - new Date(date).getTime();
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo`;
  const y = Math.floor(mo / 12);
  return `${y}y`;
}

function extractCitations(citationsJson: unknown): Citation[] {
  if (!citationsJson || typeof citationsJson !== "object") return [];
  const obj = citationsJson as { citations?: unknown };
  if (!Array.isArray(obj.citations)) return [];
  const results: Citation[] = [];
  for (const c of obj.citations) {
    if (c && typeof c === "object") {
      const citation = c as Record<string, unknown>;
      if (typeof citation.title === "string" && typeof citation.url === "string") {
        results.push({
          title: citation.title,
          url: citation.url,
          path: typeof citation.path === "string" ? citation.path : null,
          description:
            typeof citation.description === "string" ? citation.description : null,
        });
      }
    }
  }
  return results;
}

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DocumentRevisionDiff } from "@/components/documents/document-revision-diff";
import { API_ROUTES } from "@/lib/api-routes";
import type { DocumentRevisionDiffLine } from "@/lib/documents/document-revision-diff";
import { readDocumentCommentAnchor } from "@/lib/tasks/document-comment-anchor";
import type { DocumentRevisionPin } from "@/lib/tasks/document-review-contracts";

interface AnnotatedRevision extends DocumentRevisionPin {
  body: string;
}

interface InlineReviewComment {
  authorUser: {
    email: string | null;
    person: { displayName: string } | null;
  } | null;
  citationsJson: unknown;
  createdAt: string;
  id: string;
  message: string;
  parentCommentId: string | null;
  replyCount: number;
  voteScore: number;
}

export interface DocumentReviewLineSelection {
  endOffset: number;
  exact: string;
  field: "BODY";
  key: string;
  revisionId: string;
  startOffset: number;
}

export function getDocumentReviewLineSelection(input: {
  afterRevision: AnnotatedRevision;
  beforeRevision: AnnotatedRevision;
  row: DocumentRevisionDiffLine;
}): DocumentReviewLineSelection | null {
  const { afterRevision, beforeRevision, row } = input;
  if (!row.text.trim() || row.text.length > 20_000) return null;

  if (row.kind === "removed") {
    return {
      endOffset: row.oldEndOffset,
      exact: row.text,
      field: "BODY",
      key: `${beforeRevision.revisionId}:${row.oldStartOffset}:${row.oldEndOffset}`,
      revisionId: beforeRevision.revisionId,
      startOffset: row.oldStartOffset,
    };
  }

  return {
    endOffset: row.newEndOffset,
    exact: row.text,
    field: "BODY",
    key: `${afterRevision.revisionId}:${row.newStartOffset}:${row.newEndOffset}`,
    revisionId: afterRevision.revisionId,
    startOffset: row.newStartOffset,
  };
}

function commentAnchorKey(comment: InlineReviewComment) {
  const anchor = readDocumentCommentAnchor(comment.citationsJson);
  return anchor
    ? `${anchor.target.revisionId}:${anchor.selector.startOffset}:${anchor.selector.endOffset}`
    : null;
}

function formatCommentDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function authorName(comment: InlineReviewComment) {
  return (
    comment.authorUser?.person?.displayName ??
    comment.authorUser?.email ??
    "Reviewer"
  );
}

export function DocumentReviewAnnotatedDiff({
  afterLabel,
  afterRevision,
  beforeLabel,
  beforeRevision,
  reviewTaskId,
}: {
  afterLabel: string;
  afterRevision: AnnotatedRevision;
  beforeLabel: string;
  beforeRevision: AnnotatedRevision;
  reviewTaskId: string;
}) {
  const [comments, setComments] = useState<InlineReviewComment[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [selected, setSelected] = useState<DocumentReviewLineSelection | null>(
    null,
  );

  useEffect(() => {
    const controller = new AbortController();

    async function loadComments() {
      setIsLoading(true);
      setError(null);
      setComments([]);
      let cursor: string | null = null;
      let pageCount = 0;

      try {
        do {
          pageCount += 1;
          const query = new URLSearchParams({
            documentAnchors: "1",
            limit: "100",
            sort: "new",
          });
          if (cursor) query.set("cursor", cursor);
          const response = await fetch(
            API_ROUTES.tasks.comments(reviewTaskId, query.toString()),
            { signal: controller.signal },
          );
          const payload = (await response.json().catch(() => null)) as {
            comments?: InlineReviewComment[];
            error?: string;
            nextCursor?: string | null;
          } | null;
          if (!response.ok || !payload?.comments) {
            throw new Error(payload?.error ?? "Could not load line comments.");
          }
          setComments((current) => {
            const merged = new Map(
              current.map((comment) => [comment.id, comment]),
            );
            for (const comment of payload.comments ?? []) {
              merged.set(comment.id, comment);
            }
            return [...merged.values()];
          });
          cursor = payload.nextCursor ?? null;
        } while (cursor && pageCount < 100);
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load line comments.",
          );
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void loadComments();
    return () => {
      controller.abort();
    };
  }, [reviewTaskId]);

  const commentsByAnchor = useMemo(() => {
    const grouped = new Map<string, InlineReviewComment[]>();
    for (const comment of comments) {
      if (comment.parentCommentId) continue;
      const key = commentAnchorKey(comment);
      if (!key) continue;
      const group = grouped.get(key) ?? [];
      group.push(comment);
      grouped.set(key, group);
    }
    for (const group of grouped.values()) {
      group.sort((left, right) =>
        left.createdAt.localeCompare(right.createdAt),
      );
    }
    return grouped;
  }, [comments]);

  async function submitComment() {
    if (!selected || !draft.trim() || isPosting) return;
    setError(null);
    setIsPosting(true);
    try {
      const response = await fetch(API_ROUTES.tasks.comments(reviewTaskId), {
        body: JSON.stringify({
          documentAnchor: {
            endOffset: selected.endOffset,
            exact: selected.exact,
            field: selected.field,
            revisionId: selected.revisionId,
            startOffset: selected.startOffset,
          },
          message: draft.trim(),
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const payload = (await response.json().catch(() => null)) as {
        comment?: InlineReviewComment;
        error?: string;
      } | null;
      if (!response.ok || !payload?.comment) {
        throw new Error(payload?.error ?? "Could not post the line comment.");
      }
      setComments((current) => {
        const merged = new Map(current.map((comment) => [comment.id, comment]));
        merged.set(payload.comment!.id, payload.comment!);
        return [...merged.values()];
      });
      setDraft("");
      setSelected(null);
    } catch (postError) {
      setError(
        postError instanceof Error
          ? postError.message
          : "Could not post the line comment.",
      );
    } finally {
      setIsPosting(false);
    }
  }

  function selectionFor(row: DocumentRevisionDiffLine) {
    return getDocumentReviewLineSelection({
      afterRevision,
      beforeRevision,
      row,
    });
  }

  return (
    <div>
      <DocumentRevisionDiff
        afterBody={afterRevision.body}
        afterLabel={afterLabel}
        beforeBody={beforeRevision.body}
        beforeLabel={beforeLabel}
        renderLineAction={(row) => {
          const selection = selectionFor(row);
          if (!selection) return null;
          const count = commentsByAnchor.get(selection.key)?.length ?? 0;
          return (
            <button
              aria-label={`Comment on ${row.kind} line ${row.newLineNumber ?? row.oldLineNumber}`}
              className="border border-foreground bg-background px-2 py-1 text-[0.6875rem] font-semibold text-foreground"
              onClick={() => {
                setDraft("");
                setError(null);
                setSelected(selection);
              }}
              type="button"
            >
              <span className="sm:hidden">{count > 0 ? count : "Note"}</span>
              <span className="hidden sm:inline">
                {count > 0
                  ? `${count} comment${count === 1 ? "" : "s"}`
                  : "Comment"}
              </span>
            </button>
          );
        }}
        renderLineNotes={(row) => {
          const selection = selectionFor(row);
          if (!selection) return null;
          const anchoredComments = commentsByAnchor.get(selection.key) ?? [];
          const isSelected = selected?.key === selection.key;
          if (anchoredComments.length === 0 && !isSelected) return null;

          return (
            <div className="space-y-3">
              {anchoredComments.map((comment) => (
                <article
                  className="border-l-2 border-foreground pl-3"
                  key={comment.id}
                >
                  <p className="text-xs font-semibold">
                    {authorName(comment)} ·{" "}
                    {formatCommentDate(comment.createdAt)}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm">
                    {comment.message}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Score {comment.voteScore} · {comment.replyCount}{" "}
                    {comment.replyCount === 1 ? "reply" : "replies"}
                  </p>
                </article>
              ))}
              {isSelected ? (
                <form
                  className="space-y-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void submitComment();
                  }}
                >
                  <label className="grid gap-2 text-sm font-semibold">
                    <span>Comment on this line</span>
                    <textarea
                      className="min-h-24 w-full rounded-none border border-foreground bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-foreground"
                      onChange={(event) => setDraft(event.target.value)}
                      placeholder="What should change here?"
                      required
                      value={draft}
                    />
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="border border-foreground bg-foreground px-3 py-2 text-xs font-semibold text-background disabled:opacity-60"
                      disabled={isPosting || !draft.trim()}
                      type="submit"
                    >
                      {isPosting ? "Posting…" : "Post comment"}
                    </button>
                    <button
                      className="border border-foreground bg-background px-3 py-2 text-xs font-semibold text-foreground"
                      onClick={() => {
                        setDraft("");
                        setSelected(null);
                      }}
                      type="button"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : null}
            </div>
          );
        }}
      />
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <p>
          {isLoading
            ? "Loading line comments…"
            : `${commentsByAnchor.size} commented ${commentsByAnchor.size === 1 ? "line" : "lines"}`}
        </p>
        <Link
          className="font-semibold text-foreground underline underline-offset-4"
          href={`/tasks/${reviewTaskId}#discussion`}
        >
          Replies and votes
        </Link>
      </div>
      {error ? (
        <p className="mt-2 text-sm font-semibold" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

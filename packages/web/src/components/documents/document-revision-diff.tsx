"use client";

import React, { Fragment, type ReactNode, useMemo, useState } from "react";
import {
  buildDocumentRevisionDiff,
  collapseDocumentRevisionDiffRows,
  type DocumentRevisionDiffLine,
} from "@/lib/documents/document-revision-diff";

export interface DocumentRevisionDiffProps {
  afterBody: string;
  afterLabel?: string;
  beforeBody: string;
  beforeLabel?: string;
  contextLines?: number;
  renderLineAction?: (row: DocumentRevisionDiffLine) => ReactNode;
  renderLineNotes?: (row: DocumentRevisionDiffLine) => ReactNode;
}

const lineClassNames: Record<DocumentRevisionDiffLine["kind"], string> = {
  added: "bg-foreground/[0.04]",
  context: "bg-background",
  removed: "bg-foreground/[0.08]",
};

const lineMarkers: Record<DocumentRevisionDiffLine["kind"], string> = {
  added: "+",
  context: " ",
  removed: "-",
};

const INITIAL_RENDERED_ROW_LIMIT = 1_500;

function lineDescription(row: DocumentRevisionDiffLine) {
  if (row.kind === "added") return `Added line ${row.newLineNumber}`;
  if (row.kind === "removed") return `Removed line ${row.oldLineNumber}`;
  return `Unchanged old line ${row.oldLineNumber}, new line ${row.newLineNumber}`;
}

/** Plain-text, mobile-wrapping unified diff with optional per-line controls. */
export function DocumentRevisionDiff({
  afterBody,
  afterLabel = "After",
  beforeBody,
  beforeLabel = "Before",
  contextLines = 3,
  renderLineAction,
  renderLineNotes,
}: DocumentRevisionDiffProps) {
  const diff = useMemo(
    () => buildDocumentRevisionDiff(beforeBody, afterBody),
    [afterBody, beforeBody],
  );
  const visibleRows = useMemo(
    () => collapseDocumentRevisionDiffRows(diff.rows, contextLines),
    [contextLines, diff.rows],
  );
  const [expandedDiff, setExpandedDiff] = useState<typeof diff | null>(null);
  const hasHiddenRows =
    visibleRows.length > INITIAL_RENDERED_ROW_LIMIT && expandedDiff !== diff;
  const renderedRows = hasHiddenRows
    ? visibleRows.slice(0, INITIAL_RENDERED_ROW_LIMIT)
    : visibleRows;

  return (
    <section
      aria-label={`${beforeLabel} to ${afterLabel} line changes`}
      className="border border-foreground bg-background text-foreground"
    >
      <div className="flex flex-col gap-1 border-b border-foreground px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="min-w-0 break-words text-sm font-semibold">
          {beforeLabel} <span aria-hidden="true">→</span> {afterLabel}
        </p>
        <p
          aria-label={`${diff.additions} lines added and ${diff.deletions} lines removed`}
          className="shrink-0 font-mono text-xs"
        >
          +{diff.additions} added · -{diff.deletions} removed
        </p>
      </div>

      <div className="grid grid-cols-1 border-b border-foreground text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground sm:grid-cols-[3.25rem_3.25rem_minmax(0,1fr)]">
        <span className="hidden border-r border-foreground px-1 py-1 text-center sm:block">
          Old
        </span>
        <span className="hidden border-r border-foreground px-1 py-1 text-center sm:block">
          New
        </span>
        <span className="px-2 py-1">Change</span>
      </div>

      {visibleRows.length === 0 ? (
        <p className="px-3 py-4 text-sm text-muted-foreground">
          No line changes.
        </p>
      ) : (
        <div>
          {renderedRows.map((row) => {
            if (row.kind === "collapsed") {
              return (
                <div
                  className="grid grid-cols-1 border-b border-foreground bg-background text-xs text-muted-foreground last:border-b-0 sm:grid-cols-[3.25rem_3.25rem_minmax(0,1fr)]"
                  data-diff-kind="collapsed"
                  key={row.key}
                >
                  <span
                    aria-hidden="true"
                    className="hidden border-r border-foreground px-1 py-2 text-center font-mono sm:block"
                  >
                    …
                  </span>
                  <span
                    aria-hidden="true"
                    className="hidden border-r border-foreground px-1 py-2 text-center font-mono sm:block"
                  >
                    …
                  </span>
                  <span className="px-2 py-2">
                    {row.count} unchanged {row.count === 1 ? "line" : "lines"}
                  </span>
                </div>
              );
            }

            const action = renderLineAction?.(row);
            const notes = renderLineNotes?.(row);
            return (
              <Fragment key={row.key}>
                <div
                  className={`grid grid-cols-1 border-b border-foreground text-xs sm:grid-cols-[3.25rem_3.25rem_minmax(0,1fr)] ${lineClassNames[row.kind]}`}
                  data-diff-kind={row.kind}
                  data-line-key={row.key}
                  data-new-end-offset={row.newEndOffset ?? undefined}
                  data-new-line={row.newLineNumber ?? undefined}
                  data-new-start-offset={row.newStartOffset ?? undefined}
                  data-old-end-offset={row.oldEndOffset ?? undefined}
                  data-old-line={row.oldLineNumber ?? undefined}
                  data-old-start-offset={row.oldStartOffset ?? undefined}
                >
                  <span
                    aria-hidden="true"
                    className="hidden border-r border-foreground px-1 py-2 text-right font-mono tabular-nums text-muted-foreground sm:block"
                  >
                    {row.oldLineNumber}
                  </span>
                  <span
                    aria-hidden="true"
                    className="hidden border-r border-foreground px-1 py-2 text-right font-mono tabular-nums text-muted-foreground sm:block"
                  >
                    {row.newLineNumber}
                  </span>
                  <span className="flex min-w-0 items-start gap-1 px-2 py-2 font-mono">
                    <span className="sr-only">{lineDescription(row)}: </span>
                    <span
                      aria-hidden="true"
                      className="w-6 shrink-0 text-right tabular-nums text-muted-foreground sm:hidden"
                    >
                      {row.kind === "removed"
                        ? row.oldLineNumber
                        : row.newLineNumber}
                    </span>
                    <span
                      aria-hidden="true"
                      className="w-3 shrink-0 select-none"
                    >
                      {lineMarkers[row.kind]}
                    </span>
                    <code className="min-w-0 flex-1 whitespace-pre-wrap [overflow-wrap:anywhere]">
                      {row.text}
                    </code>
                    {action != null ? (
                      <span className="shrink-0 font-sans">{action}</span>
                    ) : null}
                  </span>
                </div>
                {notes != null ? (
                  <div
                    className="border-b border-foreground bg-background px-3 py-3 text-sm sm:pl-[7.5rem]"
                    data-diff-notes-for={row.key}
                  >
                    {notes}
                  </div>
                ) : null}
              </Fragment>
            );
          })}
          {hasHiddenRows ? (
            <div className="border-t border-foreground px-3 py-4 text-sm">
              <p className="text-muted-foreground">
                Showing the first{" "}
                {INITIAL_RENDERED_ROW_LIMIT.toLocaleString("en-US")} of{" "}
                {visibleRows.length.toLocaleString("en-US")} diff rows to keep
                this page responsive.
              </p>
              <button
                className="mt-3 border border-foreground bg-background px-3 py-2 text-sm font-semibold text-foreground"
                onClick={() => setExpandedDiff(diff)}
                type="button"
              >
                Show full diff
              </button>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}

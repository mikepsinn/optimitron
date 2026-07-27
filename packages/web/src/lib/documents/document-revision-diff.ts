import { diffLines } from "diff";

export type DocumentRevisionDiffLineKind = "context" | "added" | "removed";

interface DocumentRevisionDiffLineBase {
  key: string;
  text: string;
}

export interface AddedDocumentRevisionDiffLine
  extends DocumentRevisionDiffLineBase {
  kind: "added";
  oldLineNumber: null;
  oldStartOffset: null;
  oldEndOffset: null;
  newLineNumber: number;
  newStartOffset: number;
  newEndOffset: number;
}

export interface RemovedDocumentRevisionDiffLine
  extends DocumentRevisionDiffLineBase {
  kind: "removed";
  oldLineNumber: number;
  oldStartOffset: number;
  oldEndOffset: number;
  newLineNumber: null;
  newStartOffset: null;
  newEndOffset: null;
}

export interface ContextDocumentRevisionDiffLine
  extends DocumentRevisionDiffLineBase {
  kind: "context";
  oldLineNumber: number;
  oldStartOffset: number;
  oldEndOffset: number;
  newLineNumber: number;
  newStartOffset: number;
  newEndOffset: number;
}

/** A plain-text line in a unified document diff. */
export type DocumentRevisionDiffLine =
  | AddedDocumentRevisionDiffLine
  | RemovedDocumentRevisionDiffLine
  | ContextDocumentRevisionDiffLine;

export interface DocumentRevisionDiffResult {
  additions: number;
  deletions: number;
  rows: DocumentRevisionDiffLine[];
}

export interface CollapsedDocumentRevisionDiffRow {
  key: string;
  kind: "collapsed";
  count: number;
  oldStartLineNumber: number;
  oldEndLineNumber: number;
  newStartLineNumber: number;
  newEndLineNumber: number;
}

export type VisibleDocumentRevisionDiffRow =
  | DocumentRevisionDiffLine
  | CollapsedDocumentRevisionDiffRow;

const DEFAULT_CONTEXT_LINES = 3;

function lineKey(
  kind: DocumentRevisionDiffLineKind,
  oldLineNumber: number | null,
  newLineNumber: number | null,
) {
  return `${kind}:old-${oldLineNumber ?? "none"}:new-${newLineNumber ?? "none"}`;
}

function removeLineEnding(value: string) {
  return value.replace(/\r?\n$/, "");
}

interface LineOffsets {
  endOffset: number;
  startOffset: number;
}

function bodyLineOffsets(body: string): LineOffsets[] {
  if (body.length === 0) return [];

  const offsets: LineOffsets[] = [];
  let startOffset = 0;
  for (let index = 0; index < body.length; index += 1) {
    if (body.charCodeAt(index) !== 10) continue;
    offsets.push({
      endOffset:
        index > startOffset && body.charCodeAt(index - 1) === 13
          ? index - 1
          : index,
      startOffset,
    });
    startOffset = index + 1;
  }

  if (startOffset < body.length) {
    offsets.push({
      endOffset:
        body.charCodeAt(body.length - 1) === 13
          ? body.length - 1
          : body.length,
      startOffset,
    });
  }
  return offsets;
}

function offsetsForLine(offsets: LineOffsets[], lineNumber: number) {
  const result = offsets[lineNumber - 1];
  if (!result) {
    throw new Error(`Diff line ${lineNumber} has no source-body offsets`);
  }
  return result;
}

/**
 * Converts two plain-text bodies into unified diff rows. Row text remains plain
 * text so renderers can rely on React's normal escaping instead of HTML parsing.
 */
export function buildDocumentRevisionDiff(
  beforeBody: string,
  afterBody: string,
): DocumentRevisionDiffResult {
  let oldLineNumber = 1;
  let newLineNumber = 1;
  let additions = 0;
  let deletions = 0;
  const rows: DocumentRevisionDiffLine[] = [];
  const oldOffsets = bodyLineOffsets(beforeBody);
  const newOffsets = bodyLineOffsets(afterBody);

  const changes = diffLines(beforeBody, afterBody, {
    oneChangePerToken: true,
    stripTrailingCr: true,
  });

  for (const change of changes) {
    if (change.added) {
      const offsets = offsetsForLine(newOffsets, newLineNumber);
      rows.push({
        key: lineKey("added", null, newLineNumber),
        kind: "added",
        newEndOffset: offsets.endOffset,
        newLineNumber,
        newStartOffset: offsets.startOffset,
        oldEndOffset: null,
        oldLineNumber: null,
        oldStartOffset: null,
        text: removeLineEnding(change.value),
      });
      additions += 1;
      newLineNumber += 1;
      continue;
    }

    if (change.removed) {
      const offsets = offsetsForLine(oldOffsets, oldLineNumber);
      rows.push({
        key: lineKey("removed", oldLineNumber, null),
        kind: "removed",
        newEndOffset: null,
        newLineNumber: null,
        newStartOffset: null,
        oldEndOffset: offsets.endOffset,
        oldLineNumber,
        oldStartOffset: offsets.startOffset,
        text: removeLineEnding(change.value),
      });
      deletions += 1;
      oldLineNumber += 1;
      continue;
    }

    const oldLineOffsets = offsetsForLine(oldOffsets, oldLineNumber);
    const newLineOffsets = offsetsForLine(newOffsets, newLineNumber);
    rows.push({
      key: lineKey("context", oldLineNumber, newLineNumber),
      kind: "context",
      newEndOffset: newLineOffsets.endOffset,
      newLineNumber,
      newStartOffset: newLineOffsets.startOffset,
      oldEndOffset: oldLineOffsets.endOffset,
      oldLineNumber,
      oldStartOffset: oldLineOffsets.startOffset,
      text: removeLineEnding(change.value),
    });
    oldLineNumber += 1;
    newLineNumber += 1;
  }

  return { additions, deletions, rows };
}

function normalizedContextLines(contextLines: number) {
  if (!Number.isFinite(contextLines)) return DEFAULT_CONTEXT_LINES;
  return Math.max(0, Math.floor(contextLines));
}

/** Collapses only long, contiguous context runs; changed lines are never hidden. */
export function collapseDocumentRevisionDiffRows(
  rows: DocumentRevisionDiffLine[],
  contextLines = DEFAULT_CONTEXT_LINES,
): VisibleDocumentRevisionDiffRow[] {
  const visibleContextLines = normalizedContextLines(contextLines);
  const visibleRows: VisibleDocumentRevisionDiffRow[] = [];

  for (let index = 0; index < rows.length; ) {
    const row = rows[index]!;
    if (row.kind !== "context") {
      visibleRows.push(row);
      index += 1;
      continue;
    }

    const run: ContextDocumentRevisionDiffLine[] = [row];
    let runEnd = index + 1;
    while (runEnd < rows.length) {
      const contextRow = rows[runEnd]!;
      if (contextRow.kind !== "context") break;
      run.push(contextRow);
      runEnd += 1;
    }
    const hiddenCount = run.length - visibleContextLines * 2;
    if (hiddenCount <= 1) {
      visibleRows.push(...run);
      index = runEnd;
      continue;
    }

    const leading =
      visibleContextLines === 0 ? [] : run.slice(0, visibleContextLines);
    const hidden = run.slice(
      visibleContextLines,
      run.length - visibleContextLines,
    );
    const trailing =
      visibleContextLines === 0 ? [] : run.slice(-visibleContextLines);
    const firstHidden = hidden[0]!;
    const lastHidden = hidden[hidden.length - 1]!;

    visibleRows.push(
      ...leading,
      {
        count: hidden.length,
        key: `collapsed:old-${firstHidden.oldLineNumber}-${lastHidden.oldLineNumber}:new-${firstHidden.newLineNumber}-${lastHidden.newLineNumber}`,
        kind: "collapsed",
        newEndLineNumber: lastHidden.newLineNumber,
        newStartLineNumber: firstHidden.newLineNumber,
        oldEndLineNumber: lastHidden.oldLineNumber,
        oldStartLineNumber: firstHidden.oldLineNumber,
      },
      ...trailing,
    );
    index = runEnd;
  }

  return visibleRows;
}

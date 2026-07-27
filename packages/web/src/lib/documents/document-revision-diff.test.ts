import { describe, expect, it } from "vitest";
import {
  buildDocumentRevisionDiff,
  collapseDocumentRevisionDiffRows,
} from "./document-revision-diff";

describe("buildDocumentRevisionDiff", () => {
  it("numbers unified added, removed, and context rows independently", () => {
    const result = buildDocumentRevisionDiff(
      ["alpha", "beta", "gamma", "delta"].join("\n"),
      ["alpha", "beta revised", "gamma", "inserted", "delta"].join("\n"),
    );

    expect(result).toMatchObject({ additions: 2, deletions: 1 });
    expect(
      result.rows.map(
        ({ kind, newLineNumber, oldLineNumber, text }) => ({
          kind,
          newLineNumber,
          oldLineNumber,
          text,
        }),
      ),
    ).toEqual([
      {
        kind: "context",
        newLineNumber: 1,
        oldLineNumber: 1,
        text: "alpha",
      },
      {
        kind: "removed",
        newLineNumber: null,
        oldLineNumber: 2,
        text: "beta",
      },
      {
        kind: "added",
        newLineNumber: 2,
        oldLineNumber: null,
        text: "beta revised",
      },
      {
        kind: "context",
        newLineNumber: 3,
        oldLineNumber: 3,
        text: "gamma",
      },
      {
        kind: "added",
        newLineNumber: 4,
        oldLineNumber: null,
        text: "inserted",
      },
      {
        kind: "context",
        newLineNumber: 5,
        oldLineNumber: 4,
        text: "delta",
      },
    ]);
    expect(result.rows.map((row) => row.key)).toEqual([
      "context:old-1:new-1",
      "removed:old-2:new-none",
      "added:old-none:new-2",
      "context:old-3:new-3",
      "added:old-none:new-4",
      "context:old-4:new-5",
    ]);
  });

  it("does not report Windows line endings as content changes", () => {
    const result = buildDocumentRevisionDiff("alpha\r\nbeta\r\n", "alpha\nbeta\n");

    expect(result).toMatchObject({ additions: 0, deletions: 0 });
    expect(result.rows.map((row) => row.text)).toEqual(["alpha", "beta"]);
    expect(
      result.rows.map(
        ({ newEndOffset, newStartOffset, oldEndOffset, oldStartOffset }) => ({
          newEndOffset,
          newStartOffset,
          oldEndOffset,
          oldStartOffset,
        }),
      ),
    ).toEqual([
      {
        newEndOffset: 5,
        newStartOffset: 0,
        oldEndOffset: 5,
        oldStartOffset: 0,
      },
      {
        newEndOffset: 10,
        newStartOffset: 6,
        oldEndOffset: 11,
        oldStartOffset: 7,
      },
    ]);
  });

  it("reports offsets in the raw body's UTF-16 code units", () => {
    const afterBody = "A😀B\nnext";
    const result = buildDocumentRevisionDiff("", afterBody);

    expect(
      result.rows.map(({ newEndOffset, newStartOffset, text }) => ({
        exact:
          newStartOffset == null || newEndOffset == null
            ? null
            : afterBody.slice(newStartOffset, newEndOffset),
        newEndOffset,
        newStartOffset,
        text,
      })),
    ).toEqual([
      {
        exact: "A😀B",
        newEndOffset: 4,
        newStartOffset: 0,
        text: "A😀B",
      },
      {
        exact: "next",
        newEndOffset: 9,
        newStartOffset: 5,
        text: "next",
      },
    ]);
  });
});

describe("collapseDocumentRevisionDiffRows", () => {
  it("preserves context beside changes while replacing a long middle span", () => {
    const sharedLines = Array.from(
      { length: 8 },
      (_, index) => `shared ${index + 1}`,
    );
    const diff = buildDocumentRevisionDiff(
      ["old start", ...sharedLines, "old end"].join("\n"),
      ["new start", ...sharedLines, "new end"].join("\n"),
    );

    const visibleRows = collapseDocumentRevisionDiffRows(diff.rows, 2);

    expect(visibleRows.map((row) => row.kind)).toEqual([
      "removed",
      "added",
      "context",
      "context",
      "collapsed",
      "context",
      "context",
      "removed",
      "added",
    ]);
    expect(visibleRows[4]).toMatchObject({
      count: 4,
      kind: "collapsed",
      newEndLineNumber: 7,
      newStartLineNumber: 4,
      oldEndLineNumber: 7,
      oldStartLineNumber: 4,
    });
  });
});

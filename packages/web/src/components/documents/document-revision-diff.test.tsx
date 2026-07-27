import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { DocumentRevisionDiffLine } from "@/lib/documents/document-revision-diff";
import { DocumentRevisionDiff } from "./document-revision-diff";

describe("DocumentRevisionDiff", () => {
  it("collapses long context and offers actions only for visible lines", () => {
    const sharedLines = Array.from(
      { length: 8 },
      (_, index) => `shared-${index + 1}`,
    );
    const visibleActionRows: DocumentRevisionDiffLine[] = [];
    const visibleNoteRows: DocumentRevisionDiffLine[] = [];

    const html = renderToStaticMarkup(
      <DocumentRevisionDiff
        afterBody={["new start", ...sharedLines, "new end"].join("\n")}
        afterLabel="Proposal v2"
        beforeBody={["old start", ...sharedLines, "old end"].join("\n")}
        beforeLabel="Original v1"
        contextLines={2}
        renderLineAction={(row) => {
          visibleActionRows.push(row);
          return <button type="button">Comment</button>;
        }}
        renderLineNotes={(row) => {
          visibleNoteRows.push(row);
          return row.kind === "added" ? <p>Anchored note</p> : null;
        }}
      />,
    );

    expect(html).toContain("Original v1");
    expect(html).toContain("Proposal v2");
    expect(html).toContain("+2 added · -2 removed");
    expect(html).toContain("4 unchanged lines");
    expect(html).not.toContain("shared-4");
    expect(html.match(/>Comment<\/button>/g)).toHaveLength(8);
    expect(visibleActionRows.map((row) => row.kind)).toEqual([
      "removed",
      "added",
      "context",
      "context",
      "context",
      "context",
      "removed",
      "added",
    ]);
    expect(new Set(visibleActionRows.map((row) => row.key)).size).toBe(
      visibleActionRows.length,
    );
    expect(visibleNoteRows.map((row) => row.key)).toEqual(
      visibleActionRows.map((row) => row.key),
    );
    expect(html.match(/Anchored note<\/p>/g)).toHaveLength(2);
  });

  it("renders document text as escaped text rather than executable markup", () => {
    const html = renderToStaticMarkup(
      <DocumentRevisionDiff
        afterBody={'<img src="x" onerror="alert(1)">'}
        beforeBody=""
      />,
    );

    expect(html).toContain("&lt;img src=&quot;x&quot; onerror=&quot;alert(1)&quot;&gt;");
    expect(html).not.toContain('<img src="x"');
  });

  it("limits the initial render for an unusually large all-changed diff", () => {
    const beforeBody = Array.from(
      { length: 1_600 },
      (_, index) => `before-${index}`,
    ).join("\n");
    const afterBody = Array.from(
      { length: 1_600 },
      (_, index) => `after-${index}`,
    ).join("\n");

    const html = renderToStaticMarkup(
      <DocumentRevisionDiff afterBody={afterBody} beforeBody={beforeBody} />,
    );

    expect(html).toContain("Showing the first 1,500");
    expect(html).toContain("Show full diff");
    expect(html).not.toContain("after-1599");
  });
});

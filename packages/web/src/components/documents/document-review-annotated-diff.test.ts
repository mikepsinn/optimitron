import { describe, expect, it } from "vitest";
import type { DocumentRevisionDiffLine } from "@/lib/documents/document-revision-diff";
import { getDocumentReviewLineSelection } from "./document-review-annotated-diff";

const beforeRevision = {
  body: "Old line\nShared line",
  contentHash: "before-hash",
  documentId: "document",
  revisionId: "before-revision",
  version: 1,
};
const afterRevision = {
  body: "New line\nShared line",
  contentHash: "after-hash",
  documentId: "proposal",
  revisionId: "after-revision",
  version: 1,
};

describe("getDocumentReviewLineSelection", () => {
  it("anchors removed lines to the reviewed revision", () => {
    const row: DocumentRevisionDiffLine = {
      key: "removed",
      kind: "removed",
      newEndOffset: null,
      newLineNumber: null,
      newStartOffset: null,
      oldEndOffset: 8,
      oldLineNumber: 1,
      oldStartOffset: 0,
      text: "Old line",
    };

    expect(
      getDocumentReviewLineSelection({ afterRevision, beforeRevision, row }),
    ).toMatchObject({
      endOffset: 8,
      exact: "Old line",
      revisionId: "before-revision",
      startOffset: 0,
    });
  });

  it.each(["added", "context"] as const)(
    "anchors %s lines to the proposed revision",
    (kind) => {
      const row = {
        key: kind,
        kind,
        newEndOffset: 8,
        newLineNumber: 1,
        newStartOffset: 0,
        oldEndOffset: kind === "context" ? 8 : null,
        oldLineNumber: kind === "context" ? 1 : null,
        oldStartOffset: kind === "context" ? 0 : null,
        text: "New line",
      } as DocumentRevisionDiffLine;

      expect(
        getDocumentReviewLineSelection({ afterRevision, beforeRevision, row }),
      ).toMatchObject({
        endOffset: 8,
        exact: "New line",
        revisionId: "after-revision",
        startOffset: 0,
      });
    },
  );

  it("does not offer anchors for blank lines", () => {
    const row: DocumentRevisionDiffLine = {
      key: "blank",
      kind: "added",
      newEndOffset: 0,
      newLineNumber: 1,
      newStartOffset: 0,
      oldEndOffset: null,
      oldLineNumber: null,
      oldStartOffset: null,
      text: "",
    };

    expect(
      getDocumentReviewLineSelection({ afterRevision, beforeRevision, row }),
    ).toBeNull();
  });
});

import type { DocumentRevisionPin } from "@/lib/tasks/document-review-contracts";

export const MAX_ANCHORED_TEXT_LENGTH = 20_000;

export interface DocumentCommentAnchorV1 {
  schema: "optimitron.document-comment-anchor.v1";
  selector: {
    endLine: number;
    endOffset: number;
    exact: string;
    field: "BODY";
    startLine: number;
    startOffset: number;
  };
  target: DocumentRevisionPin;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function isNonnegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

export function readDocumentCommentAnchor(
  citationsJson: unknown,
): DocumentCommentAnchorV1 | null {
  if (!isRecord(citationsJson)) return null;
  const anchor = citationsJson.documentAnchor;
  if (
    !isRecord(anchor) ||
    !isRecord(anchor.selector) ||
    !isRecord(anchor.target)
  ) {
    return null;
  }

  const { selector, target } = anchor;
  if (
    anchor.schema !== "optimitron.document-comment-anchor.v1" ||
    selector.field !== "BODY" ||
    !isNonnegativeInteger(selector.startOffset) ||
    !isPositiveInteger(selector.endOffset) ||
    !isPositiveInteger(selector.startLine) ||
    !isPositiveInteger(selector.endLine) ||
    typeof selector.exact !== "string" ||
    selector.exact.length === 0 ||
    selector.exact.length > MAX_ANCHORED_TEXT_LENGTH ||
    !selector.exact.trim() ||
    selector.endOffset <= selector.startOffset ||
    selector.endOffset - selector.startOffset !== selector.exact.length ||
    selector.endLine < selector.startLine ||
    !isNonEmptyString(target.contentHash) ||
    !isNonEmptyString(target.documentId) ||
    !isNonEmptyString(target.revisionId) ||
    !isPositiveInteger(target.version)
  ) {
    return null;
  }

  return anchor as unknown as DocumentCommentAnchorV1;
}

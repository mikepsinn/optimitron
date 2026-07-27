import type { Prisma } from "@optimitron/db";
import {
  DocumentCommentAnchorInputSchema,
  DocumentCommentAnchorV1Schema,
} from "@/lib/tasks/document-comment-anchor-schema";
import { getDocumentReviewPanelData } from "@/lib/tasks/document-review.server";
import type { TaskClientAccessBoundary } from "@/lib/tasks/task-visibility.server";

export class DocumentCommentAnchorError extends Error {
  readonly status = 400;

  constructor(message: string) {
    super(message);
    this.name = "DocumentCommentAnchorError";
  }
}

function asJsonRecord(value: unknown): Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function lineNumberAtOffset(body: string, offset: number): number {
  let line = 1;
  for (let index = 0; index < offset; index += 1) {
    if (body.charCodeAt(index) === 10) line += 1;
  }
  return line;
}

export async function buildDocumentCommentCitationsJson(input: {
  clientAccessBoundary?: TaskClientAccessBoundary;
  existingCitationsJson?: unknown;
  rawAnchor: unknown;
  taskId: string;
  userId: string;
}): Promise<Prisma.InputJsonValue> {
  const parsed = DocumentCommentAnchorInputSchema.safeParse(input.rawAnchor);
  if (!parsed.success) {
    throw new DocumentCommentAnchorError("Invalid document comment anchor.");
  }

  const panel = await getDocumentReviewPanelData(input.taskId, input.userId, {
    clientAccessBoundary: input.clientAccessBoundary,
  });
  const review =
    panel?.mode === "REVIEWER"
      ? panel.review.reviewTaskId === input.taskId
        ? panel.review
        : null
      : (panel?.reviews.find((item) => item.reviewTaskId === input.taskId) ??
        null);
  if (!review) {
    throw new DocumentCommentAnchorError(
      "Inline document comments require an exact-version review task.",
    );
  }

  const anchorInput = parsed.data;
  const anchoredRevision =
    anchorInput.revisionId === review.request.target.revisionId
      ? { body: review.target.body, target: review.request.target }
      : review.proposal?.revisionId === anchorInput.revisionId
        ? {
            body: review.proposal.body,
            target: {
              contentHash: review.proposal.contentHash,
              documentId: review.proposal.documentId,
              revisionId: review.proposal.revisionId,
              version: review.proposal.version,
            },
          }
        : null;
  if (!anchoredRevision) {
    throw new DocumentCommentAnchorError(
      "The comment anchor does not match a validated revision on this review task.",
    );
  }

  const body = anchoredRevision.body;
  if (
    anchorInput.endOffset > body.length ||
    body.slice(anchorInput.startOffset, anchorInput.endOffset) !==
      anchorInput.exact
  ) {
    throw new DocumentCommentAnchorError(
      "The selected text does not match the pinned document revision.",
    );
  }

  const documentAnchor = DocumentCommentAnchorV1Schema.parse({
    schema: "optimitron.document-comment-anchor.v1",
    selector: {
      endLine: lineNumberAtOffset(body, anchorInput.endOffset - 1),
      endOffset: anchorInput.endOffset,
      exact: anchorInput.exact,
      field: anchorInput.field,
      startLine: lineNumberAtOffset(body, anchorInput.startOffset),
      startOffset: anchorInput.startOffset,
    },
    target: anchoredRevision.target,
  });

  return {
    ...asJsonRecord(input.existingCitationsJson),
    documentAnchor,
  } as Prisma.InputJsonValue;
}

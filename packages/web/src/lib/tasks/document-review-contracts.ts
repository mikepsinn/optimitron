import { z } from "zod";

export const DOCUMENT_REVIEW_CONTEXT_KEY = "documentReview" as const;
export const DOCUMENT_REVIEW_TASK_KEY_PREFIX = "document-review:" as const;

export const DocumentRevisionPinSchema = z
  .object({
    contentHash: z.string().trim().min(1).max(256),
    documentId: z.string().trim().min(1),
    revisionId: z.string().trim().min(1),
    version: z.number().int().positive(),
  })
  .strict();

export const ReviewRequestV1Schema = z
  .object({
    authorityTaskId: z.string().trim().min(1),
    instructions: z.string().trim().min(1).max(20_000),
    requestedAt: z.string().datetime(),
    requestedByUserId: z.string().trim().min(1),
    schema: z.literal("optimitron.review-request.v1"),
    target: DocumentRevisionPinSchema,
  })
  .strict();

export const DocumentReviewVerdictSchema = z.enum([
  "APPROVE",
  "CHANGES_REQUESTED",
  "REJECT",
  "ABSTAIN",
]);

export const ReviewResponseV1Schema = z
  .object({
    comment: z
      .object({
        contentHash: z.string().trim().min(1).max(256),
        id: z.string().trim().min(1),
      })
      .strict(),
    explanation: z.string().trim().min(1).max(20_000),
    reviewerPersonId: z.string().trim().min(1),
    reviewerUserId: z.string().trim().min(1),
    reviewTaskId: z.string().trim().min(1),
    schema: z.literal("optimitron.review-response.v1"),
    submittedAt: z.string().datetime(),
    target: DocumentRevisionPinSchema,
    verdict: DocumentReviewVerdictSchema,
  })
  .strict();

export const DocumentProposalSourceCommentV1Schema = z
  .object({
    commentId: z.string().trim().min(1),
    contentHash: z.string().trim().min(1).max(256),
    taskId: z.string().trim().min(1),
  })
  .strict();

export const DocumentProposalV1Schema = z
  .object({
    authorityTaskId: z.string().trim().min(1),
    base: DocumentRevisionPinSchema,
    proposal: DocumentRevisionPinSchema,
    proposedAt: z.string().datetime(),
    proposedByUserId: z.string().trim().min(1),
    schema: z.literal("optimitron.document-proposal.v1"),
    sourceComments: z
      .array(DocumentProposalSourceCommentV1Schema)
      .min(1)
      .max(500)
      .refine(
        (comments) =>
          new Set(comments.map((comment) => comment.commentId)).size ===
          comments.length,
        { message: "Source comments must be unique" },
      ),
    summary: z.string().trim().min(1).max(20_000),
  })
  .strict();

export const DocumentProposalApplicationV1Schema = z
  .object({
    appliedAt: z.string().datetime(),
    appliedByUserId: z.string().trim().min(1),
    authorityTaskId: z.string().trim().min(1),
    base: DocumentRevisionPinSchema,
    proposalArtifact: z
      .object({
        artifactId: z.string().trim().min(1),
        contentHash: z.string().trim().min(1).max(256),
      })
      .strict(),
    resultingDocument: DocumentRevisionPinSchema,
    schema: z.literal("optimitron.document-proposal-application.v1"),
    sourceProposalDocument: DocumentRevisionPinSchema,
  })
  .strict();

const InternalDocumentDecisionReviewSchema = z
  .object({
    artifactId: z.string().trim().min(1),
    contentHash: z.string().trim().min(1).max(256),
    reviewerPersonId: z.string().trim().min(1),
    verdict: DocumentReviewVerdictSchema,
  })
  .strict();

const InternalDocumentDecisionBaseSchema = z
  .object({
    authorityTaskId: z.string().trim().min(1),
    decidedAt: z.string().datetime(),
    decidedByPersonId: z.string().trim().min(1),
    decidedByUserId: z.string().trim().min(1),
    schema: z.literal("optimitron.internal-document-decision.v1"),
    scope: z.literal("INTERNAL"),
    target: DocumentRevisionPinSchema,
  })
  .strict();

export const InternalDocumentDecisionV1Schema = z.discriminatedUnion("action", [
  InternalDocumentDecisionBaseSchema.extend({
    action: z.literal("ADOPT"),
    reason: z.string().trim().min(1).max(20_000).nullable(),
    review: InternalDocumentDecisionReviewSchema.extend({
      verdict: z.literal("APPROVE"),
    }).strict(),
  }).strict(),
  InternalDocumentDecisionBaseSchema.extend({
    action: z.literal("REJECT"),
    reason: z.string().trim().min(1).max(20_000),
    review: InternalDocumentDecisionReviewSchema,
  }).strict(),
]);

export const CreateDocumentProposalInputSchema = z
  .object({
    baseDocumentRevisionId: z.string().trim().min(1),
    body: z
      .string()
      .min(1)
      .max(500_000)
      .refine((value) => value.trim().length > 0, {
        message: "Proposal body cannot be blank",
      }),
    sourceCommentIds: z
      .array(z.string().trim().min(1))
      .min(1)
      .max(500)
      .refine((ids) => new Set(ids).size === ids.length, {
        message: "Source comment IDs must be unique",
      }),
    summary: z.string().trim().min(1).max(20_000),
    title: z.string().trim().min(1).max(300),
  })
  .strict();

export const ApplyDocumentProposalInputSchema = z
  .object({ proposalArtifactId: z.string().trim().min(1) })
  .strict();

export const RequestDocumentReviewInputSchema = z
  .object({
    documentRevisionId: z.string().trim().min(1),
    instructions: z.string().trim().min(1).max(20_000),
    reviewerPersonId: z.string().trim().min(1),
  })
  .strict();

export const SubmitDocumentReviewInputSchema = z
  .object({
    explanation: z.string().trim().min(1).max(20_000),
    verdict: DocumentReviewVerdictSchema,
  })
  .strict();

export const DecideDocumentRevisionInputSchema = z.discriminatedUnion(
  "action",
  [
    z
      .object({
        action: z.literal("ADOPT"),
        documentRevisionId: z.string().trim().min(1),
        reason: z.string().trim().min(1).max(20_000).optional(),
        reviewArtifactId: z.string().trim().min(1),
      })
      .strict(),
    z
      .object({
        action: z.literal("REJECT"),
        documentRevisionId: z.string().trim().min(1),
        reason: z.string().trim().min(1).max(20_000),
        reviewArtifactId: z.string().trim().min(1),
      })
      .strict(),
  ],
);

export type DocumentRevisionPin = z.infer<typeof DocumentRevisionPinSchema>;
export type DocumentProposalSourceCommentV1 = z.infer<
  typeof DocumentProposalSourceCommentV1Schema
>;
export type DocumentProposalV1 = z.infer<typeof DocumentProposalV1Schema>;
export type DocumentProposalApplicationV1 = z.infer<
  typeof DocumentProposalApplicationV1Schema
>;
export type ReviewRequestV1 = z.infer<typeof ReviewRequestV1Schema>;
export type ReviewResponseV1 = z.infer<typeof ReviewResponseV1Schema>;
export type InternalDocumentDecisionV1 = z.infer<
  typeof InternalDocumentDecisionV1Schema
>;

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord | null {
  return value != null && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;
}

export function readReviewRequest(
  contextJson: unknown,
): ReviewRequestV1 | null {
  const parsed = ReviewRequestV1Schema.safeParse(
    asRecord(contextJson)?.[DOCUMENT_REVIEW_CONTEXT_KEY],
  );
  return parsed.success ? parsed.data : null;
}

export function readReviewResponse(value: unknown): ReviewResponseV1 | null {
  const parsed = ReviewResponseV1Schema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function readDocumentProposal(
  value: unknown,
): DocumentProposalV1 | null {
  const parsed = DocumentProposalV1Schema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function readDocumentProposalApplication(
  value: unknown,
): DocumentProposalApplicationV1 | null {
  const parsed = DocumentProposalApplicationV1Schema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function readInternalDocumentDecision(
  value: unknown,
): InternalDocumentDecisionV1 | null {
  const parsed = InternalDocumentDecisionV1Schema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function sameDocumentRevisionPin(
  left: DocumentRevisionPin,
  right: DocumentRevisionPin,
): boolean {
  return (
    left.documentId === right.documentId &&
    left.revisionId === right.revisionId &&
    left.version === right.version &&
    left.contentHash === right.contentHash
  );
}

export function assertReviewResponseMatchesRequest(
  response: ReviewResponseV1,
  request: ReviewRequestV1,
  reviewTaskId: string,
): void {
  if (
    response.reviewTaskId !== reviewTaskId ||
    !sameDocumentRevisionPin(response.target, request.target)
  ) {
    throw new Error("Review response does not match the requested revision");
  }
}

import { z } from "zod";

export const DOCUMENT_REVIEW_CONTEXT_KEY = "documentReview";

export const DocumentRevisionPinSchema = z
  .object({
    contentHash: z.string().trim().min(1).max(256),
    documentId: z.string().trim().min(1),
    revisionId: z.string().trim().min(1),
    version: z.number().int().positive(),
  })
  .strict();

export const DocumentReviewChecklistItemSchema = z
  .object({
    criterion: z.string().trim().min(1).max(2_000),
    id: z.string().trim().min(1).max(100),
    required: z.boolean().default(true),
  })
  .strict();

export const ReviewRequestV1Schema = z
  .object({
    authorityTaskId: z.string().trim().min(1),
    checklist: z.array(DocumentReviewChecklistItemSchema).max(100),
    instructions: z.string().trim().min(1).max(20_000),
    requestedAt: z.string().datetime(),
    requestedByUserId: z.string().trim().min(1),
    required: z.boolean(),
    schema: z.literal("optimitron.review-request.v1"),
    target: DocumentRevisionPinSchema,
  })
  .strict()
  .superRefine((value, context) => {
    const ids = new Set<string>();
    for (const item of value.checklist) {
      if (ids.has(item.id)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate review criterion: ${item.id}`,
          path: ["checklist"],
        });
      }
      ids.add(item.id);
    }
  });

export const ReviewChecklistResponseSchema = z
  .object({
    comment: z.string().trim().min(1).max(10_000).optional(),
    criterionId: z.string().trim().min(1).max(100),
    result: z.enum(["PASS", "FAIL", "NOT_APPLICABLE"]),
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
    checklistResponses: z.array(ReviewChecklistResponseSchema).max(100),
    explanation: z.string().trim().min(1).max(20_000),
    proposalDocument: DocumentRevisionPinSchema.optional(),
    reviewTaskId: z.string().trim().min(1),
    reviewerUserId: z.string().trim().min(1),
    schema: z.literal("optimitron.review-response.v1"),
    submittedAt: z.string().datetime(),
    target: DocumentRevisionPinSchema,
    verdict: DocumentReviewVerdictSchema,
  })
  .strict()
  .superRefine((value, context) => {
    const ids = new Set<string>();
    for (const response of value.checklistResponses) {
      if (ids.has(response.criterionId)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Criterion answered more than once: ${response.criterionId}`,
          path: ["checklistResponses"],
        });
      }
      ids.add(response.criterionId);
    }
    if (
      value.verdict === "APPROVE" &&
      value.checklistResponses.some((response) => response.result === "FAIL")
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "An approval cannot include a failed criterion",
        path: ["verdict"],
      });
    }
  });

export const DocumentProposalApplicationV1Schema = z
  .object({
    appliedAt: z.string().datetime(),
    appliedByUserId: z.string().trim().min(1),
    baseDocument: DocumentRevisionPinSchema,
    resultingDocument: DocumentRevisionPinSchema,
    reviewArtifactId: z.string().trim().min(1),
    reviewTaskId: z.string().trim().min(1),
    schema: z.literal("optimitron.document-proposal-application.v1"),
    sourceProposalDocument: DocumentRevisionPinSchema,
  })
  .strict();

export const DocumentDecisionWaiverSchema = z
  .object({
    reason: z.string().trim().min(10).max(20_000),
    reviewTaskId: z.string().trim().min(1),
  })
  .strict();

export const DocumentDecisionV1Schema = z
  .object({
    acceptedReviewArtifactIds: z.array(z.string().trim().min(1)).max(500),
    adoptedDocument: DocumentRevisionPinSchema,
    authorityTaskId: z.string().trim().min(1),
    decidedAt: z.string().datetime(),
    decidedByUserId: z.string().trim().min(1),
    schema: z.literal("optimitron.document-decision.v1"),
    waivers: z.array(DocumentDecisionWaiverSchema).max(500),
  })
  .strict()
  .superRefine((value, context) => {
    const artifactIds = new Set(value.acceptedReviewArtifactIds);
    if (artifactIds.size !== value.acceptedReviewArtifactIds.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Accepted review artifacts must be unique",
        path: ["acceptedReviewArtifactIds"],
      });
    }
    const reviewTaskIds = new Set(
      value.waivers.map((item) => item.reviewTaskId),
    );
    if (reviewTaskIds.size !== value.waivers.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A review task can only be waived once",
        path: ["waivers"],
      });
    }
  });

export const RequestDocumentReviewInputSchema = z
  .object({
    checklist: z.array(DocumentReviewChecklistItemSchema).max(100).default([]),
    documentRevisionId: z.string().trim().min(1),
    instructions: z.string().trim().min(1).max(20_000),
    required: z.boolean().default(true),
    reviewerPersonId: z.string().trim().min(1),
    title: z.string().trim().min(1).max(300).optional(),
  })
  .strict();

export const SubmitDocumentReviewInputSchema = z
  .object({
    checklistResponses: z.array(ReviewChecklistResponseSchema).max(100),
    explanation: z.string().trim().min(1).max(20_000),
    proposal: z
      .object({
        body: z.string().trim().min(1).max(500_000),
        title: z.string().trim().min(1).max(300),
      })
      .strict()
      .optional(),
    verdict: DocumentReviewVerdictSchema,
  })
  .strict();

export const ApplyDocumentProposalInputSchema = z
  .object({
    expectedDocumentVersion: z.number().int().positive(),
    reviewTaskId: z.string().trim().min(1),
  })
  .strict();

export const AdoptDocumentRevisionInputSchema = z
  .object({
    documentRevisionId: z.string().trim().min(1),
    useAsFundingTerms: z.boolean().default(false),
    waivers: z.array(DocumentDecisionWaiverSchema).max(500).default([]),
  })
  .strict();

export type DocumentRevisionPin = z.infer<typeof DocumentRevisionPinSchema>;
export type ReviewRequestV1 = z.infer<typeof ReviewRequestV1Schema>;
export type ReviewResponseV1 = z.infer<typeof ReviewResponseV1Schema>;
export type DocumentProposalApplicationV1 = z.infer<
  typeof DocumentProposalApplicationV1Schema
>;
export type DocumentDecisionV1 = z.infer<typeof DocumentDecisionV1Schema>;
export type RequestDocumentReviewInput = z.infer<
  typeof RequestDocumentReviewInputSchema
>;
export type SubmitDocumentReviewInput = z.infer<
  typeof SubmitDocumentReviewInputSchema
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

export function readDocumentDecision(
  value: unknown,
): DocumentDecisionV1 | null {
  const parsed = DocumentDecisionV1Schema.safeParse(value);
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
): void {
  if (
    response.reviewTaskId.trim().length === 0 ||
    !sameDocumentRevisionPin(response.target, request.target)
  ) {
    throw new Error("Review response does not match the requested revision");
  }

  const criteria = new Map(request.checklist.map((item) => [item.id, item]));
  const responses = new Map(
    response.checklistResponses.map((item) => [item.criterionId, item]),
  );
  const unknown = response.checklistResponses.find(
    (item) => !criteria.has(item.criterionId),
  );
  if (unknown) {
    throw new Error(`Unknown review criterion: ${unknown.criterionId}`);
  }
  const missing = request.checklist.find(
    (item) => item.required && !responses.has(item.id),
  );
  if (missing) {
    throw new Error(`Required review criterion not answered: ${missing.id}`);
  }
}

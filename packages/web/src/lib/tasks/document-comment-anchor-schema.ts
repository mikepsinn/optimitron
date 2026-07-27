import { z } from "zod";
import { MAX_ANCHORED_TEXT_LENGTH } from "@/lib/tasks/document-comment-anchor";
import { DocumentRevisionPinSchema } from "@/lib/tasks/document-review-contracts";

export const DOCUMENT_COMMENT_ANCHOR_INPUT_JSON_SCHEMA = {
  additionalProperties: false,
  properties: {
    endOffset: {
      description: "Exclusive UTF-16 offset in the exact document body.",
      minimum: 1,
      type: "integer" as const,
    },
    exact: {
      description: "Exact selected text from the document body.",
      maxLength: MAX_ANCHORED_TEXT_LENGTH,
      minLength: 1,
      type: "string" as const,
    },
    field: {
      enum: ["BODY"],
      type: "string" as const,
    },
    revisionId: {
      description:
        "Pinned target or provenance-validated proposal revision ID shown on the review task.",
      minLength: 1,
      type: "string" as const,
    },
    startOffset: {
      description: "Inclusive UTF-16 offset in the exact document body.",
      minimum: 0,
      type: "integer" as const,
    },
  },
  required: ["revisionId", "field", "startOffset", "endOffset", "exact"],
  type: "object" as const,
} as const;

export const DocumentCommentAnchorInputSchema = z
  .object({
    endOffset: z.number().int().positive(),
    exact: z.string().min(1).max(MAX_ANCHORED_TEXT_LENGTH),
    field: z.literal("BODY"),
    revisionId: z.string().trim().min(1),
    startOffset: z.number().int().nonnegative(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.endOffset <= value.startOffset) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "The document comment range must have a positive length.",
        path: ["endOffset"],
      });
    }
    if (value.endOffset - value.startOffset !== value.exact.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "The document comment offsets must match the selected text.",
        path: ["exact"],
      });
    }
    if (!value.exact.trim()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "The anchored text cannot contain only whitespace.",
        path: ["exact"],
      });
    }
  });

export const DocumentCommentAnchorV1Schema = z
  .object({
    schema: z.literal("optimitron.document-comment-anchor.v1"),
    selector: z
      .object({
        endLine: z.number().int().positive(),
        endOffset: z.number().int().positive(),
        exact: z.string().min(1).max(MAX_ANCHORED_TEXT_LENGTH),
        field: z.literal("BODY"),
        startLine: z.number().int().positive(),
        startOffset: z.number().int().nonnegative(),
      })
      .strict(),
    target: DocumentRevisionPinSchema,
  })
  .strict()
  .superRefine((value, context) => {
    if (
      value.selector.endOffset <= value.selector.startOffset ||
      value.selector.endOffset - value.selector.startOffset !==
        value.selector.exact.length ||
      value.selector.endLine < value.selector.startLine ||
      !value.selector.exact.trim()
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid stored document comment selector.",
        path: ["selector"],
      });
    }
  });

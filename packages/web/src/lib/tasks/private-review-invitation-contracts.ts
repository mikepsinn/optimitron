import { z } from "zod";

export const PRIVATE_REVIEW_INVITATION_SCHEMA =
  "optimitron.private-review-invitation.v1" as const;

export const PrivateReviewRevisionBindingSchema = z
  .object({
    contentHash: z.string().trim().min(1).max(256),
    documentId: z.string().trim().min(1),
    documentRevisionId: z.string().trim().min(1),
    documentVersion: z.number().int().positive(),
  })
  .strict();

export const PrivateReviewInvitationApprovalContextSchema = z
  .object({
    batchKey: z.string().trim().min(8).max(200),
    kind: z.enum(["INVITATION", "REMINDER"]),
    recipientPersonId: z.string().trim().min(1),
    revision: PrivateReviewRevisionBindingSchema,
    schema: z.literal(PRIVATE_REVIEW_INVITATION_SCHEMA),
    taskId: z.string().trim().min(1),
  })
  .strict();

export const ProposePrivateReviewInvitationSchema = z
  .object({
    batchKey: z.string().trim().min(8).max(200),
    kind: z.enum(["INVITATION", "REMINDER"]).default("INVITATION"),
    recipientPersonId: z.string().trim().min(1),
    revision: PrivateReviewRevisionBindingSchema,
    taskId: z.string().trim().min(1),
  })
  .strict();

export type PrivateReviewInvitationApprovalContext = z.infer<
  typeof PrivateReviewInvitationApprovalContextSchema
>;
export type PrivateReviewRevisionBinding = z.infer<
  typeof PrivateReviewRevisionBindingSchema
>;

export function isPrivateReviewInvitationApprovalPayload(value: unknown) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  return PrivateReviewInvitationApprovalContextSchema.safeParse(
    (value as Record<string, unknown>).approvalContext,
  ).success;
}

/** True only for the dedicated immutable approval context. */
export function getPrivateReviewApprovalContext(value: unknown) {
  const parsed = PrivateReviewInvitationApprovalContextSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

/** Read batchKey from communication metadata without trusting its shape. */
export function getCommunicationBatchKey(value: unknown) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  const batchKey = (value as Record<string, unknown>).batchKey;
  return typeof batchKey === "string" && batchKey.trim()
    ? batchKey.trim()
    : null;
}

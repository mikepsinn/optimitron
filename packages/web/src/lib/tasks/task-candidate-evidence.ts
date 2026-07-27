import { z } from "zod";

export const TaskCandidateEvidenceSourceSchema = z
  .object({
    checkedAt: z.string().datetime().optional(),
    label: z.string().trim().min(1),
    sourceKind: z
      .enum([
        "OFFICIAL_DIRECTORY",
        "OFFICIAL_PROFILE",
        "PUBLISHED_BUSINESS_CONTACT",
        "OTHER",
      ])
      .default("OTHER"),
    url: z.string().url(),
  })
  .strict();

export const TaskCandidateQualificationSchema = z
  .object({
    claim: z.string().trim().min(1),
    sourceUrls: z.array(z.string().url()).min(1),
    verified: z.boolean(),
  })
  .strict();

export const TaskCandidateContactProvenanceSchema = z
  .object({
    channel: z.enum(["EMAIL", "CONTACT_FORM", "OTHER"]),
    sourceUrl: z.string().url(),
    type: z.enum(["PUBLISHED_BUSINESS_CONTACT", "REFERRED", "SELF_PROVIDED"]),
  })
  .strict();

/**
 * Evidence collected while researching an external task candidate. This lives
 * in TaskCandidateMatch.reasonJson until repeated use proves a database
 * invariant worth first-class columns.
 */
export const TaskCandidateEvidenceV1Schema = z
  .object({
    confidence: z.number().min(0).max(1),
    conflicts: z.array(z.string().trim().min(1)).default([]),
    contactProvenance: TaskCandidateContactProvenanceSchema,
    fitSummary: z.string().trim().min(1),
    qualifications: z.array(TaskCandidateQualificationSchema).min(1),
    schema: z.literal("candidate-evidence.v1"),
    sources: z.array(TaskCandidateEvidenceSourceSchema).min(1),
    uncertainties: z.array(z.string().trim().min(1)).default([]),
  })
  .strict();

export type TaskCandidateEvidenceV1 = z.infer<
  typeof TaskCandidateEvidenceV1Schema
>;

export function readTaskCandidateEvidence(
  value: unknown,
): TaskCandidateEvidenceV1 | null {
  const parsed = TaskCandidateEvidenceV1Schema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function validateTaskCandidateReasonJson(
  value: unknown,
  options: { requireTypedEvidence?: boolean } = {},
): unknown {
  if (options.requireTypedEvidence) {
    return TaskCandidateEvidenceV1Schema.parse(value);
  }
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    "schema" in value &&
    value.schema === "candidate-evidence.v1"
  ) {
    return TaskCandidateEvidenceV1Schema.parse(value);
  }
  return value;
}

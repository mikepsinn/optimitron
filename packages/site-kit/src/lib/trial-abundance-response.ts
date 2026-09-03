import { z } from "zod"
import { surveyParticipantSchema } from "./survey-participant"

export const trialAbundanceResponseSchema = z.object({
  submissionKey: z.string().uuid().optional(),
  // Older browser drafts can still finish verification after this release.
  participant: surveyParticipantSchema.optional(),
  patientAccessAnswer: z.enum(["YES", "NO", "ABSTAIN"]),
  selfFundedAccessAnswer: z.enum(["YES", "NO", "ABSTAIN"]),
  inviteToken: z.string().trim().max(200).nullable().optional(),
  militaryAllocationPercent: z.number().int().min(0).max(100),
  organizationId: z.string().trim().max(200).nullable().optional(),
  referredBy: z.string().trim().max(200).nullable().optional(),
  sourceReferrer: z.string().trim().max(512).nullable().optional(),
  sourceUrl: z.string().trim().max(512).nullable().optional(),
  timestamp: z.string().datetime(),
})

export type TrialAbundanceResponseInput = z.infer<
  typeof trialAbundanceResponseSchema
>

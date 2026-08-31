import { z } from "zod"

export const trialAbundanceResponseSchema = z.object({
  answer: z.enum(["YES", "NO", "ABSTAIN"]),
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

import { z } from 'zod';
import { WelfareEffectSchema } from './welfare.js';

/**
 * Policy types and schemas for the Optimal Policy Generator (OPG)
 * 
 * @see https://opg.warondisease.org
 */

export const PolicyTypeSchema = z.enum([
  'law',
  'regulation',
  'tax_policy',
  'budget_allocation',
  'executive_order',
  'court_ruling',
  'treaty',
  'local_ordinance',
]);

export type PolicyType = z.infer<typeof PolicyTypeSchema>;

export const RecommendationTypeSchema = z.enum([
  'enact',    // New policies the jurisdiction should adopt
  'replace',  // Existing policies to modify
  'repeal',   // Harmful policies to remove
  'maintain', // Current policies aligned with evidence
]);

export type RecommendationType = z.infer<typeof RecommendationTypeSchema>;

export const EvidenceGradeSchema = z.enum(['A', 'B', 'C', 'D', 'F']);
export type EvidenceGrade = z.infer<typeof EvidenceGradeSchema>;

export const BlockingFactorSchema = z.enum([
  'constitutional',
  'federal_preemption',
  'political',
  'autonomy',
  'implementation_capacity',
  'budget_constraint',
]);

export type BlockingFactor = z.infer<typeof BlockingFactorSchema>;

export const PolicySchema = z.object({
  id: z.string(),
  name: z.string(),
  type: PolicyTypeSchema,
  categoryId: z.string().optional(),
  description: z.string().optional(),
  isContinuous: z.boolean().default(false),
  typicalOnsetDelayDays: z.number().optional(),
  typicalDurationYears: z.number().optional(),
});

export type Policy = z.infer<typeof PolicySchema>;

export const JurisdictionPolicySchema = z.object({
  jurisdictionId: z.string(),
  policyId: z.string(),
  hasPolicy: z.boolean(),
  policyStrength: z.number().optional(), // For continuous policies (e.g., tax rate)
  implementationDate: z.string().optional(),
  dataSource: z.string().optional(),
  lastVerified: z.string().optional(),
});

export type JurisdictionPolicy = z.infer<typeof JurisdictionPolicySchema>;

export const PolicyRecommendationSchema = z.object({
  jurisdictionId: z.string(),
  policyId: z.string(),
  recommendationType: RecommendationTypeSchema,
  currentStatus: z.string().optional(),
  recommendedTarget: z.string().optional(),
  welfareEffect: WelfareEffectSchema,
  evidenceGrade: EvidenceGradeSchema,
  policyImpactScore: z.number().min(0).max(1),
  priorityScore: z.number(),
  blockingFactors: z.array(BlockingFactorSchema).optional(),
  similarJurisdictions: z.array(z.string()).optional(),
  rationale: z.string().optional(),
});

export type PolicyRecommendation = z.infer<typeof PolicyRecommendationSchema>;

import { z } from 'zod';
import { NOf1VariableRelationshipSchema } from '@optimitron/optimizer';

export const CidSchema = z.string().min(1);
export type Cid = z.infer<typeof CidSchema>;

export const PreferenceWeightSnapshotSchema = z.object({
  itemId: z.string(),
  weight: z.number().min(0).max(1),
  label: z.string().optional(),
  rank: z.number().int().positive().optional(),
  ciLow: z.number().optional(),
  ciHigh: z.number().optional(),
});

export type PreferenceWeightSnapshot = z.infer<typeof PreferenceWeightSnapshotSchema>;

export const AggregatedComparisonMatrixEntrySchema = z.object({
  itemAId: z.string(),
  itemBId: z.string(),
  ratio: z.number(),
  count: z.number().int().nonnegative(),
  stdDev: z.number().optional(),
});

export type AggregatedComparisonMatrixEntry = z.infer<typeof AggregatedComparisonMatrixEntrySchema>;

export const ConvergenceAnalysisSchema = z.object({
  stable: z.boolean(),
  minComparisonsNeeded: z.number().int().nonnegative().optional(),
});

export type ConvergenceAnalysis = z.infer<typeof ConvergenceAnalysisSchema>;

const LinkedSnapshotBaseSchema = z.object({
  timestamp: z.string().datetime(),
  jurisdictionId: z.string(),
  previousCid: CidSchema.optional(),
});

export const WishocracyAggregationSnapshotSchema = LinkedSnapshotBaseSchema.extend({
  type: z.literal('wishocracy-aggregation'),
  participantCount: z.number().int().nonnegative(),
  preferenceWeights: z.array(PreferenceWeightSnapshotSchema),
  consistencyRatio: z.number().min(0).optional(),
  convergenceAnalysis: ConvergenceAnalysisSchema.optional(),
  aggregatedComparisonMatrix: z.array(AggregatedComparisonMatrixEntrySchema).optional(),
});

export type WishocracyAggregationSnapshot = z.infer<typeof WishocracyAggregationSnapshotSchema>;

export const PolicyAnalysisSummarySchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  grade: z.enum(['A', 'B', 'C', 'D', 'F']),
  welfareScore: z.number(),
  ccs: z.number().min(0).max(1).optional(),
  pis: z.number().optional(),
  recommendation: z.string(),
  rationale: z.string().optional(),
});

export type PolicyAnalysisSummary = z.infer<typeof PolicyAnalysisSummarySchema>;

export const BudgetAnalysisSnapshotSchema = z.object({
  totalCurrent: z.number().optional(),
  totalOptimal: z.number().optional(),
  categoriesAnalyzed: z.number().int().nonnegative().optional(),
  estimatedWelfareImprovement: z.number().optional(),
});

export type BudgetAnalysisSnapshot = z.infer<typeof BudgetAnalysisSnapshotSchema>;

export const OptimitronPolicyAnalysisSnapshotSchema = LinkedSnapshotBaseSchema.extend({
  type: z.literal('optimitron-policy-analysis'),
  policies: z.array(PolicyAnalysisSummarySchema),
  budgetAnalysis: BudgetAnalysisSnapshotSchema.optional(),
});

export type OptimitronPolicyAnalysisSnapshot = z.infer<typeof OptimitronPolicyAnalysisSnapshotSchema>;

export const HealthAnalysisRelationshipSchema = NOf1VariableRelationshipSchema.extend({
  predictorVariableId: z.string(),
  outcomeVariableId: z.string(),
  evidenceGrade: z.string().optional(),
  pisScore: z.number().optional(),
});

export type HealthAnalysisRelationship = z.infer<typeof HealthAnalysisRelationshipSchema>;

export const HealthAnalysisSnapshotSchema = LinkedSnapshotBaseSchema.extend({
  type: z.literal('health-analysis'),
  contributorId: z.string(),
  relationships: z.array(HealthAnalysisRelationshipSchema),
  dataSpanDays: z.number().nonnegative(),
  personhoodVerified: z.boolean().optional(),
});

export type HealthAnalysisSnapshot = z.infer<typeof HealthAnalysisSnapshotSchema>;

export const EncryptedPayloadSchema = z.object({
  ciphertext: z.string(),
  iv: z.string(),
  algorithm: z.literal('AES-GCM-256'),
});

export type EncryptedPayload = z.infer<typeof EncryptedPayloadSchema>;

export const EncryptedIndividualSubmissionSnapshotSchema = LinkedSnapshotBaseSchema.extend({
  type: z.literal('encrypted-individual-submission'),
  encrypted: EncryptedPayloadSchema,
  submitterIdHash: z.string(),
});

export type EncryptedIndividualSubmissionSnapshot = z.infer<typeof EncryptedIndividualSubmissionSnapshotSchema>;

export const StoredSnapshotSchema = z.discriminatedUnion('type', [
  WishocracyAggregationSnapshotSchema,
  OptimitronPolicyAnalysisSnapshotSchema,
  HealthAnalysisSnapshotSchema,
  EncryptedIndividualSubmissionSnapshotSchema,
]);

export type StoredSnapshot = z.infer<typeof StoredSnapshotSchema>;

export const CreateWishocracyAggregationInputSchema =
  WishocracyAggregationSnapshotSchema.omit({
    type: true,
    timestamp: true,
  }).extend({
    timestamp: z.string().datetime().optional(),
  });

export type CreateWishocracyAggregationInput = z.infer<typeof CreateWishocracyAggregationInputSchema>;

export const CreateOptimitronPolicyAnalysisInputSchema =
  OptimitronPolicyAnalysisSnapshotSchema.omit({
    type: true,
    timestamp: true,
  }).extend({
    timestamp: z.string().datetime().optional(),
  });

export type CreateOptimitronPolicyAnalysisInput = z.infer<typeof CreateOptimitronPolicyAnalysisInputSchema>;

export const CreateHealthAnalysisInputSchema =
  HealthAnalysisSnapshotSchema.omit({
    type: true,
    timestamp: true,
  }).extend({
    timestamp: z.string().datetime().optional(),
  });

export type CreateHealthAnalysisInput = z.infer<typeof CreateHealthAnalysisInputSchema>;

export const CreateEncryptedIndividualSubmissionInputSchema =
  EncryptedIndividualSubmissionSnapshotSchema.omit({
    type: true,
    timestamp: true,
  }).extend({
    timestamp: z.string().datetime().optional(),
  });

export type CreateEncryptedIndividualSubmissionInput = z.infer<typeof CreateEncryptedIndividualSubmissionInputSchema>;

export interface StoredSnapshotUpload<TSnapshot extends StoredSnapshot> {
  cid: string;
  snapshot: TSnapshot;
}

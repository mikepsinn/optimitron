import { z } from 'zod';

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

export const OptomitronPolicyAnalysisSnapshotSchema = LinkedSnapshotBaseSchema.extend({
  type: z.literal('optomitron-policy-analysis'),
  policies: z.array(PolicyAnalysisSummarySchema),
  budgetAnalysis: BudgetAnalysisSnapshotSchema.optional(),
});

export type OptomitronPolicyAnalysisSnapshot = z.infer<typeof OptomitronPolicyAnalysisSnapshotSchema>;

export const StoredSnapshotSchema = z.discriminatedUnion('type', [
  WishocracyAggregationSnapshotSchema,
  OptomitronPolicyAnalysisSnapshotSchema,
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

export const CreateOptomitronPolicyAnalysisInputSchema =
  OptomitronPolicyAnalysisSnapshotSchema.omit({
    type: true,
    timestamp: true,
  }).extend({
    timestamp: z.string().datetime().optional(),
  });

export type CreateOptomitronPolicyAnalysisInput = z.infer<typeof CreateOptomitronPolicyAnalysisInputSchema>;

export interface StoredSnapshotUpload<TSnapshot extends StoredSnapshot> {
  cid: string;
  snapshot: TSnapshot;
}

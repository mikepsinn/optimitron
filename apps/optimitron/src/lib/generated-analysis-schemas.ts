import type {
  BudgetReportDiminishingReturns,
  BudgetReportHistoricalPoint,
  BudgetReportJSON,
  BudgetReportOutcomeMetric,
  EfficiencyAnalysis,
} from '@optimitron/obg';
import { z } from 'zod';

export interface BudgetCategoryOutput {
  id: string;
  name: string;
  currentSpending: number;
  currentSpendingRealPerCapita: number;
  optimalSpendingPerCapita: number | null;
  optimalSpendingNominal: number | null;
  gap: number;
  gapPercent: number;
  recommendation: string;
  evidenceSource: string;
  outcomeMetrics: BudgetReportOutcomeMetric[];
  historicalRealPerCapita: BudgetReportHistoricalPoint[];
  diminishingReturns: BudgetReportDiminishingReturns | null;
  efficiency: EfficiencyAnalysis | null;
}

export interface BudgetAnalysisOutput {
  jurisdiction: string;
  totalSpendingNominal: number;
  categories: BudgetCategoryOutput[];
  topRecommendations: string[];
  generatedAt: string;
  generatedBy: string;
  inflationAdjustment: Record<string, unknown>;
  methodology: Record<string, unknown>;
  note: string;
  efficientFrontier?: BudgetReportJSON['efficientFrontier'];
}

export interface PolicyOutput {
  name: string;
  type: string;
  category: string;
  description: string;
  recommendationType: string;
  evidenceKind: 'assumption' | 'comparison' | 'estimate';
  evidenceGrade: string | null;
  causalConfidenceScore: number | null;
  policyImpactScore: number | null;
  welfareScore: number | null;
  /** Fractional assumption, not annual growth or dollars. */
  incomeEffect: number | null;
  /** Fractional assumption, not years gained. */
  healthEffect: number | null;
  bradfordHillScores: Record<string, number>;
  rationale: string;
  currentStatus: string;
  recommendedTarget: string;
  blockingFactors: string[];
}

export interface PolicyAnalysisOutput {
  jurisdiction: string;
  policies: PolicyOutput[];
  generatedAt: string;
  generatedBy: string;
  note: string;
}

export type BudgetCategoryWithEfficiency = BudgetCategoryOutput & { efficiency: EfficiencyAnalysis };

export function hasEfficiency(category: BudgetCategoryOutput): category is BudgetCategoryWithEfficiency {
  return category.efficiency !== null;
}

const BudgetReportOutcomeMetricSchema: z.ZodType<BudgetReportOutcomeMetric> = z.object({
  name: z.string(),
  value: z.number(),
  trend: z.string(),
}) as unknown as z.ZodType<BudgetReportOutcomeMetric>;

const BudgetReportHistoricalPointSchema: z.ZodType<BudgetReportHistoricalPoint> = z.object({
  year: z.number(),
  nominalBillions: z.number(),
  realPerCapita: z.number(),
}) as unknown as z.ZodType<BudgetReportHistoricalPoint>;

const BudgetReportDiminishingReturnsSchema: z.ZodType<BudgetReportDiminishingReturns> = z.object({
  modelType: z.string(),
  r2: z.number(),
  n: z.number(),
  marginalReturn: z.number(),
  elasticity: z.number().nullable(),
  outcomeName: z.string(),
}) as unknown as z.ZodType<BudgetReportDiminishingReturns>;

export const BudgetCategoryOutputSchema: z.ZodType<BudgetCategoryOutput> = z.object({
  id: z.string(),
  name: z.string(),
  currentSpending: z.number(),
  currentSpendingRealPerCapita: z.number(),
  optimalSpendingPerCapita: z.number().nullable(),
  optimalSpendingNominal: z.number().nullable(),
  gap: z.number(),
  gapPercent: z.number(),
  recommendation: z.string(),
  evidenceSource: z.string(),
  outcomeMetrics: z.array(BudgetReportOutcomeMetricSchema),
  historicalRealPerCapita: z.array(BudgetReportHistoricalPointSchema),
  diminishingReturns: BudgetReportDiminishingReturnsSchema.nullable(),
  // Keep this runtime check loose to avoid deep cross-package instantiation overhead.
  efficiency: z.any().nullable(),
}) as unknown as z.ZodType<BudgetCategoryOutput>;

export const BudgetAnalysisOutputSchema: z.ZodType<BudgetAnalysisOutput> = z.object({
  jurisdiction: z.string(),
  totalSpendingNominal: z.number(),
  categories: z.array(BudgetCategoryOutputSchema),
  topRecommendations: z.array(z.string()),
  generatedAt: z.string(),
  generatedBy: z.string(),
  inflationAdjustment: z.record(z.unknown()),
  methodology: z.record(z.unknown()),
  note: z.string(),
  efficientFrontier: z.unknown().optional(),
}) as unknown as z.ZodType<BudgetAnalysisOutput>;

export const PolicyOutputSchema: z.ZodType<PolicyOutput> = z.object({
  name: z.string(),
  type: z.string(),
  category: z.string(),
  description: z.string(),
  recommendationType: z.string(),
  evidenceKind: z.enum(['assumption', 'comparison', 'estimate']),
  evidenceGrade: z.string().nullable(),
  causalConfidenceScore: z.number().nullable(),
  policyImpactScore: z.number().nullable(),
  welfareScore: z.number().nullable(),
  incomeEffect: z.number().nullable(),
  healthEffect: z.number().nullable(),
  bradfordHillScores: z.record(z.number()),
  rationale: z.string(),
  currentStatus: z.string(),
  recommendedTarget: z.string(),
  blockingFactors: z.array(z.string()),
}) as unknown as z.ZodType<PolicyOutput>;

export const PolicyAnalysisOutputSchema: z.ZodType<PolicyAnalysisOutput> = z.object({
  jurisdiction: z.string(),
  policies: z.array(PolicyOutputSchema),
  generatedAt: z.string(),
  generatedBy: z.string(),
  note: z.string(),
}) as unknown as z.ZodType<PolicyAnalysisOutput>;

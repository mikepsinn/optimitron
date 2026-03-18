import { z } from 'zod';
import { EvidenceGradeSchema, WelfareEffectSchema } from '@optimitron/opg';

/**
 * Budget types and schemas for the Optimal Budget Generator (OBG)
 * 
 * @see https://obg.warondisease.org
 */

export const SpendingTypeSchema = z.enum([
  'program',
  'transfer',
  'investment',
  'regulatory',
]);

export type SpendingType = z.infer<typeof SpendingTypeSchema>;

export const SpendingCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  parentCategoryId: z.string().optional(),
  spendingType: SpendingTypeSchema,
  currentSpendingUsd: z.number(),
  fiscalYear: z.number(),
  dataSource: z.string().optional(),
  /** Whether this is discretionary spending (can be reallocated). Default true. */
  discretionary: z.boolean().default(true),
});

export type SpendingCategory = z.infer<typeof SpendingCategorySchema>;

export const OSLEstimateSchema = z.object({
  categoryId: z.string(),
  estimationMethod: z.enum(['diminishing_returns', 'cost_effectiveness', 'benchmark']),
  oslUsd: z.number(),
  oslPerCapita: z.number().optional(),
  oslPctGdp: z.number().optional(),
  ciLow: z.number().optional(),
  ciHigh: z.number().optional(),
  evidenceGrade: EvidenceGradeSchema,
  welfareEvidenceScore: z.number().min(0).max(1),
  methodologyNotes: z.string().optional(),
});

export type OSLEstimate = z.infer<typeof OSLEstimateSchema>;

export const SpendingGapSchema = z.object({
  categoryId: z.string(),
  categoryName: z.string(),
  currentSpendingUsd: z.number(),
  oslUsd: z.number(),
  gapUsd: z.number(),
  gapPct: z.number(),
  welfareEvidenceScore: z.number(),
  priorityScore: z.number(),
  welfareEffect: WelfareEffectSchema,
  recommendedAction: z.enum(['scale_up', 'increase', 'maintain', 'decrease', 'major_decrease']),
});

export type SpendingGap = z.infer<typeof SpendingGapSchema>;

/**
 * Reference spending data for cross-country comparison
 */
export const ReferenceSpendingSchema = z.object({
  categoryId: z.string(),
  countryCode: z.string(),
  year: z.number(),
  spendingUsd: z.number(),
  spendingPerCapita: z.number().optional(),
  spendingPctGdp: z.number().optional(),
  population: z.number().optional(),
  gdp: z.number().optional(),
  dataSource: z.string().optional(),
});

export type ReferenceSpending = z.infer<typeof ReferenceSpendingSchema>;

import { z } from 'zod';

/**
 * The Two-Metric Welfare Function
 * 
 * All Optimitron calculations optimize for these two metrics:
 * 1. Real after-tax median income growth (pp/year)
 * 2. Median healthy life years
 * 
 * @see https://optimocracy.warondisease.org/#sec-two-metric-welfare
 */

export const WelfareMetricsSchema = z.object({
  /** Real after-tax median income growth in percentage points per year */
  incomeGrowth: z.number().describe('pp/year'),
  /** Median healthy life years (expected years of life in good health) */
  healthyLifeYears: z.number().describe('years'),
});

export type WelfareMetrics = z.infer<typeof WelfareMetricsSchema>;

export const WelfareFunctionConfigSchema = z.object({
  /** Weight for income metric (0-1), health weight = 1 - alpha */
  alpha: z.number().min(0).max(1).default(0.5),
});

export type WelfareFunctionConfig = z.infer<typeof WelfareFunctionConfigSchema>;

/**
 * Calculate combined welfare score from the two metrics
 * W = α × IncomeGrowth + (1-α) × HealthyYears
 */
export function calculateWelfare(
  metrics: WelfareMetrics,
  config: WelfareFunctionConfig = { alpha: 0.5 }
): number {
  return config.alpha * metrics.incomeGrowth + (1 - config.alpha) * metrics.healthyLifeYears;
}

export const WelfareEffectSchema = z.object({
  /** Effect on income growth (pp/year) */
  incomeEffect: z.number(),
  incomeEffectCILow: z.number().optional(),
  incomeEffectCIHigh: z.number().optional(),
  /** Effect on healthy life years */
  healthEffect: z.number(),
  healthEffectCILow: z.number().optional(),
  healthEffectCIHigh: z.number().optional(),
});

export type WelfareEffect = z.infer<typeof WelfareEffectSchema>;

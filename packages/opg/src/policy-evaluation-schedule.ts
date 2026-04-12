import { z } from 'zod';

/**
 * Policy Evaluation Schedule — Automatic Review & Sunset Framework
 *
 * Every policy recommendation includes a built-in evaluation schedule
 * that defines:
 * - Baseline metrics at time of enactment
 * - Target thresholds the policy must meet
 * - Review cadence (when to re-evaluate)
 * - Sunset conditions (when to expire if targets aren't met)
 * - Required data collection mandates
 *
 * The two welfare metrics (real after-tax median income growth + median
 * healthy life years) are the ONLY evaluation criteria. This prevents
 * gaming — you can't claim success on a secondary metric while the
 * primary metrics stagnate.
 *
 * @see https://optimocracy.warondisease.org/#sec-two-metric-welfare
 */

export const ReviewCadenceSchema = z.enum([
  /** Review every year (for pilot programs) */
  'annual',
  /** Review every 2 years (default for most legislation) */
  'biennial',
  /** Review every 3 years (for slow-moving structural reforms) */
  'triennial',
  /** Review every 5 years (for generational changes like education) */
  'quinquennial',
]);

export type ReviewCadence = z.infer<typeof ReviewCadenceSchema>;

export const SunsetConditionSchema = z.enum([
  /** Expires automatically if targets not met — must be actively renewed */
  'hard_sunset',
  /** Triggers mandatory review but doesn't auto-expire */
  'mandatory_review',
  /** Advisory review — non-binding but publicly reported */
  'advisory',
]);

export type SunsetCondition = z.infer<typeof SunsetConditionSchema>;

export const WelfareBaselineSchema = z.object({
  /** Real after-tax median income at time of measurement (annual, USD) */
  medianIncome: z.number(),
  /** Median healthy life years (HALE) at time of measurement */
  medianHaleYears: z.number(),
  /** Year the baseline was measured */
  measurementYear: z.number().int(),
  /** Data source for income */
  incomeSource: z.string(),
  /** Data source for HALE */
  haleSource: z.string(),
});

export type WelfareBaseline = z.infer<typeof WelfareBaselineSchema>;

export const WelfareTargetSchema = z.object({
  /** Expected income growth in pp/year attributable to this policy */
  expectedIncomeGrowthPpYear: z.number(),
  /** Expected HALE improvement in years attributable to this policy */
  expectedHaleImprovementYears: z.number(),
  /** Minimum acceptable income growth (below this = failing) */
  minimumIncomeGrowthPpYear: z.number(),
  /** Minimum acceptable HALE improvement (below this = failing) */
  minimumHaleImprovementYears: z.number(),
  /** Year by which targets should be measurable */
  targetYear: z.number().int(),
  /** Confidence level for the estimates (0-1) */
  confidence: z.number().min(0).max(1).optional(),
});

export type WelfareTarget = z.infer<typeof WelfareTargetSchema>;

export const DataCollectionMandateSchema = z.object({
  /** What data must be collected */
  metric: z.string(),
  /** How often (monthly, quarterly, annually) */
  frequency: z.enum(['monthly', 'quarterly', 'annually']),
  /** Responsible agency */
  responsibleAgency: z.string(),
  /** Whether data must be publicly available */
  publicAccess: z.boolean(),
});

export type DataCollectionMandate = z.infer<typeof DataCollectionMandateSchema>;

export const ReviewOutcomeSchema = z.enum([
  /** Targets met — policy continues */
  'continue',
  /** Targets partially met — policy continues with modifications */
  'modify',
  /** Targets not met — policy expires (hard sunset) or escalates (mandatory review) */
  'expire',
  /** Insufficient data to evaluate — extend review period */
  'extend',
]);

export type ReviewOutcome = z.infer<typeof ReviewOutcomeSchema>;

export const PolicyEvaluationScheduleSchema = z.object({
  /** ID of the policy this schedule applies to */
  policyId: z.string(),

  /** Baseline welfare metrics at time of enactment */
  baseline: WelfareBaselineSchema,

  /** Target welfare improvements */
  targets: z.array(WelfareTargetSchema).min(1),

  /** How often the policy is reviewed */
  reviewCadence: ReviewCadenceSchema,

  /** What happens if targets aren't met */
  sunsetCondition: SunsetConditionSchema,

  /** Maximum years before hard sunset (even if meeting targets) */
  maxDurationYears: z.number().int().positive(),

  /** First scheduled review date (ISO format) */
  firstReviewDate: z.string(),

  /** Required data collection mandates */
  dataCollectionMandates: z.array(DataCollectionMandateSchema),

  /** Comparison jurisdictions to benchmark against */
  benchmarkJurisdictions: z.array(z.string()),

  /** Who conducts the review */
  reviewBody: z.string(),
});

export type PolicyEvaluationSchedule = z.infer<typeof PolicyEvaluationScheduleSchema>;

// ─── Helper Functions ───────────────────────────────────────────────

/**
 * Determine the review outcome given observed vs target metrics.
 */
export function evaluateAgainstTargets(
  observed: { incomeGrowthPpYear: number; haleImprovementYears: number },
  target: WelfareTarget,
): ReviewOutcome {
  const meetsIncome = observed.incomeGrowthPpYear >= target.expectedIncomeGrowthPpYear;
  const meetsHale = observed.haleImprovementYears >= target.expectedHaleImprovementYears;
  const meetsMinIncome = observed.incomeGrowthPpYear >= target.minimumIncomeGrowthPpYear;
  const meetsMinHale = observed.haleImprovementYears >= target.minimumHaleImprovementYears;

  if (meetsIncome && meetsHale) return 'continue';
  if (meetsMinIncome && meetsMinHale) return 'modify';
  return 'expire';
}

/**
 * Create a default evaluation schedule for a policy recommendation.
 */
export function createDefaultEvaluationSchedule(
  policyId: string,
  expectedEffect: { incomeEffect: number; healthEffect: number },
  enactmentYear: number = new Date().getFullYear(),
): PolicyEvaluationSchedule {
  const reviewCadence: ReviewCadence = 'biennial';
  const firstReviewYear = enactmentYear + 2;

  return {
    policyId,
    baseline: {
      medianIncome: 0, // To be filled at enactment
      medianHaleYears: 0, // To be filled at enactment
      measurementYear: enactmentYear,
      incomeSource: 'FRED MEHOINUSA672N (real median household income)',
      haleSource: 'WHO GHO (healthy life expectancy at birth)',
    },
    targets: [
      {
        expectedIncomeGrowthPpYear: expectedEffect.incomeEffect,
        expectedHaleImprovementYears: expectedEffect.healthEffect,
        minimumIncomeGrowthPpYear: expectedEffect.incomeEffect * 0.5,
        minimumHaleImprovementYears: expectedEffect.healthEffect * 0.5,
        targetYear: enactmentYear + 5,
        confidence: 0.7,
      },
    ],
    reviewCadence,
    sunsetCondition: 'hard_sunset',
    maxDurationYears: 10,
    firstReviewDate: `${firstReviewYear}-01-01`,
    dataCollectionMandates: [
      {
        metric: 'Real after-tax median household income',
        frequency: 'annually',
        responsibleAgency: 'Bureau of Labor Statistics / Census Bureau',
        publicAccess: true,
      },
      {
        metric: 'Healthy life expectancy at birth (HALE)',
        frequency: 'annually',
        responsibleAgency: 'CDC / National Center for Health Statistics',
        publicAccess: true,
      },
      {
        metric: 'Per-capita spending in affected budget category',
        frequency: 'annually',
        responsibleAgency: 'Office of Management and Budget',
        publicAccess: true,
      },
    ],
    benchmarkJurisdictions: [],
    reviewBody: 'Government Accountability Office (GAO)',
  };
}

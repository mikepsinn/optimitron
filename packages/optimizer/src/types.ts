import { z } from 'zod';

/**
 * Core types for time series causal inference
 * 
 * These are agnostic to the specific domain (dFDA, policy, budget).
 * The predictor can be a drug, policy, or spending level.
 * The outcome can be a symptom, welfare metric, or any measurable value.
 */

/**
 * A single measurement in a time series
 */
export const MeasurementSchema = z.object({
  /** Timestamp (Unix ms or ISO string) */
  timestamp: z.union([z.number(), z.string()]),
  /** Numeric measurement value */
  value: z.number(),
  /** Optional: source of measurement */
  source: z.string().optional(),
  /** Optional: unit of measurement */
  unit: z.string().optional(),
});

export type Measurement = z.infer<typeof MeasurementSchema>;

/**
 * A time series of measurements for a single variable
 */
export const TimeSeriesSchema = z.object({
  /** Unique variable identifier */
  variableId: z.string(),
  /** Human-readable name */
  name: z.string(),
  /** Measurements ordered by time */
  measurements: z.array(MeasurementSchema),
  /** Category for default parameters */
  category: z.string().optional(),
});

export type TimeSeries = z.infer<typeof TimeSeriesSchema>;

/**
 * Filling strategy for missing values
 */
export const FillingTypeSchema = z.enum([
  'zero',          // Missing = 0 (treatments: assume not taken)
  'value',         // Missing = specific constant
  'none',          // No imputation
  'interpolation', // Linear interpolation
]);

export type FillingType = z.infer<typeof FillingTypeSchema>;

/**
 * Configuration for a predictor variable
 */
export const PredictorConfigSchema = z.object({
  /** Onset delay in seconds (time before effect begins) */
  onsetDelaySeconds: z.number().min(0).max(8_640_000).default(1800), // 30 min default
  /** Duration of action in seconds (how long effect persists) */
  durationOfActionSeconds: z.number().min(600).max(7_776_000).default(86400), // 24 hr default
  /** How to handle missing values */
  fillingType: FillingTypeSchema.default('zero'),
  /** Filling value (if fillingType is 'value') */
  fillingValue: z.number().optional(),
});

export type PredictorConfig = z.infer<typeof PredictorConfigSchema>;

/**
 * A paired predictor-outcome observation after temporal alignment
 */
export const AlignedPairSchema = z.object({
  predictorValue: z.number(),
  outcomeValue: z.number(),
  predictorTimestamp: z.number(),
  outcomeTimestamp: z.number(),
});

export type AlignedPair = z.infer<typeof AlignedPairSchema>;

/**
 * Statistical analysis results
 */
export const CorrelationResultSchema = z.object({
  /** Pearson correlation coefficient */
  pearson: z.number(),
  /** Spearman rank correlation */
  spearman: z.number().optional(),
  /** p-value for correlation significance */
  pValue: z.number(),
  /** Number of paired observations */
  n: z.number(),
  /** Standard error */
  standardError: z.number().optional(),
  /** 95% confidence interval */
  confidenceInterval: z.tuple([z.number(), z.number()]).optional(),
});

export type CorrelationResult = z.infer<typeof CorrelationResultSchema>;

/**
 * Effect size metrics
 */
export const EffectSizeSchema = z.object({
  /** Percent change from baseline */
  percentChange: z.number(),
  /** Absolute change */
  absoluteChange: z.number(),
  /** Baseline mean */
  baselineMean: z.number(),
  /** Follow-up mean */
  followUpMean: z.number(),
  /** Z-score (effect relative to baseline variability) */
  zScore: z.number(),
  /** Baseline standard deviation */
  baselineStd: z.number(),
  /** Number of baseline observations */
  baselineN: z.number(),
  /** Number of follow-up observations */
  followUpN: z.number(),
});

export type EffectSize = z.infer<typeof EffectSizeSchema>;

/**
 * Optimal value analysis results
 */
export const OptimalValueSchema = z.object({
  /** Predictor value associated with best outcomes */
  valuePredictingHighOutcome: z.number(),
  /** Predictor value associated with worst outcomes */
  valuePredictingLowOutcome: z.number(),
  /** Grouped (rounded) value for high outcome */
  groupedValueHigh: z.number().optional(),
  /** Grouped (rounded) value for low outcome */
  groupedValueLow: z.number().optional(),
  /** Confidence interval for optimal value */
  confidenceInterval: z.tuple([z.number(), z.number()]).optional(),
  /** Number of high-outcome observations */
  highOutcomeN: z.number(),
  /** Number of low-outcome observations */
  lowOutcomeN: z.number(),
});

export type OptimalValue = z.infer<typeof OptimalValueSchema>;

/**
 * Bradford Hill criteria scores (0-1 each)
 */
export const BradfordHillScoresSchema = z.object({
  /** Strength of association */
  strength: z.number().min(0).max(1),
  /** Consistency across subjects/studies */
  consistency: z.number().min(0).max(1),
  /** Temporality (predictor precedes outcome) */
  temporality: z.number().min(0).max(1),
  /** Biological gradient (dose-response) */
  gradient: z.number().min(0).max(1).nullable(),
  /** Experiment quality */
  experiment: z.number().min(0).max(1),
  /** Plausibility (mechanistic) */
  plausibility: z.number().min(0).max(1),
  /** Coherence with literature */
  coherence: z.number().min(0).max(1),
  /** Analogy to similar relationships */
  analogy: z.number().min(0).max(1),
  /** Specificity of effect */
  specificity: z.number().min(0).max(1),
});

export type BradfordHillScores = z.infer<typeof BradfordHillScoresSchema>;

/**
 * Complete Predictor Impact Score result
 */
export const PredictorImpactScoreSchema = z.object({
  /** Overall PIS (0-1+) */
  score: z.number(),
  /** Forward correlation (predictor → outcome) */
  forwardCorrelation: CorrelationResultSchema,
  /** Reverse correlation (outcome → predictor) */
  reverseCorrelation: CorrelationResultSchema.optional(),
  /** Effect size metrics */
  effectSize: EffectSizeSchema,
  /** Bradford Hill criteria scores */
  bradfordHill: BradfordHillScoresSchema,
  /** Temporality factor (forward / (forward + reverse)) */
  temporalityFactor: z.number(),
  /** Optimal predictor values */
  optimalValue: OptimalValueSchema.optional(),
  /** Evidence grade */
  evidenceGrade: z.enum(['A', 'B', 'C', 'D', 'F']),
  /** Recommended action */
  recommendation: z.enum([
    'high_priority_trial',
    'moderate_priority',
    'monitor',
    'insufficient_evidence',
  ]),
});

export type PredictorImpactScore = z.infer<typeof PredictorImpactScoreSchema>;

/**
 * Data quality validation result
 */
export const DataQualitySchema = z.object({
  /** Sufficient predictor variance */
  hasPredicorVariance: z.boolean(),
  /** Sufficient outcome variance */
  hasOutcomeVariance: z.boolean(),
  /** Minimum pair count met */
  hasMinimumPairs: z.boolean(),
  /** Adequate baseline fraction */
  hasAdequateBaseline: z.boolean(),
  /** Adequate follow-up fraction */
  hasAdequateFollowUp: z.boolean(),
  /** Number of predictor value changes */
  predictorChanges: z.number(),
  /** Number of outcome value changes */
  outcomeChanges: z.number(),
  /** Total aligned pairs */
  pairCount: z.number(),
  /** Baseline fraction */
  baselineFraction: z.number(),
  /** Follow-up fraction */
  followUpFraction: z.number(),
  /** Overall quality pass */
  isValid: z.boolean(),
  /** Reasons for failure (if any) */
  failureReasons: z.array(z.string()),
});

export type DataQuality = z.infer<typeof DataQualitySchema>;

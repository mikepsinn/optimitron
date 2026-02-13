import { z } from 'zod';

import {
  DataQualitySchema,
  PredictorImpactScoreSchema,
} from './types.js';

const VARIABLE_ID_PATTERN = /^[a-z0-9_.-]+$/;
const STUDY_ID_PATTERN = /^[a-z0-9_.:/-]+$/;

export const PAIR_STUDY_SCHEMA_VERSION = '2026-02-13';

export const PairStudyScopeSchema = z.enum([
  'aggregate_n_of_1',
  'unit_n_of_1',
]);
export type PairStudyScope = z.infer<typeof PairStudyScopeSchema>;

export const PairStudyScopeContextSchema = z
  .object({
    scope: PairStudyScopeSchema,
    unitId: z.string().regex(VARIABLE_ID_PATTERN).optional(),
    unitName: z.string().min(1).optional(),
  })
  .superRefine((context, ctx) => {
    if (context.scope === 'unit_n_of_1' && !context.unitId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'unitId is required for unit_n_of_1 scope.',
        path: ['unitId'],
      });
    }

    if (context.scope === 'aggregate_n_of_1' && context.unitId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'unitId is only valid for unit_n_of_1 scope.',
        path: ['unitId'],
      });
    }
  });
export type PairStudyScopeContext = z.infer<typeof PairStudyScopeContextSchema>;

export const PairStudyVariableSchema = z.object({
  id: z.string().regex(VARIABLE_ID_PATTERN),
  label: z.string().min(1),
  unit: z.string().min(1),
  transform: z.string().min(1).optional(),
  lagYears: z.number().int().min(0).max(50).optional(),
});
export type PairStudyVariable = z.infer<typeof PairStudyVariableSchema>;

export const PairStudyCoverageSchema = z
  .object({
    observations: z.number().int().min(0),
    alignedPairs: z.number().int().min(0),
    includedUnits: z.number().int().min(0),
    skippedUnits: z.number().int().min(0).default(0),
    yearMin: z.number().int().optional(),
    yearMax: z.number().int().optional(),
    predictorMissingFraction: z.number().min(0).max(1).optional(),
    outcomeMissingFraction: z.number().min(0).max(1).optional(),
  })
  .superRefine((coverage, ctx) => {
    if (coverage.yearMin != null && coverage.yearMax != null && coverage.yearMin > coverage.yearMax) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'yearMin must be <= yearMax.',
        path: ['yearMin'],
      });
    }
  });
export type PairStudyCoverage = z.infer<typeof PairStudyCoverageSchema>;

export const PairStudyQualitySeveritySchema = z.enum([
  'info',
  'warning',
  'error',
]);
export type PairStudyQualitySeverity = z.infer<typeof PairStudyQualitySeveritySchema>;

export const PairStudyQualityFlagSchema = z.object({
  severity: PairStudyQualitySeveritySchema,
  code: z.string().regex(VARIABLE_ID_PATTERN),
  message: z.string().min(1),
  metricId: z.string().regex(VARIABLE_ID_PATTERN).optional(),
  threshold: z.number().optional(),
  observed: z.number().optional(),
});
export type PairStudyQualityFlag = z.infer<typeof PairStudyQualityFlagSchema>;

export const PairStudyMetricDirectionSchema = z.enum([
  'higher_better',
  'lower_better',
  'neutral',
]);
export type PairStudyMetricDirection = z.infer<typeof PairStudyMetricDirectionSchema>;

export const PairStudyMetricDefinitionSchema = z.object({
  id: z.string().regex(VARIABLE_ID_PATTERN),
  label: z.string().min(1),
  unit: z.string().min(1).optional(),
  description: z.string().optional(),
  direction: PairStudyMetricDirectionSchema.optional(),
});
export type PairStudyMetricDefinition = z.infer<typeof PairStudyMetricDefinitionSchema>;

export const PairStudyBinRowSchema = z
  .object({
    binIndex: z.number().int().min(0),
    label: z.string().min(1),
    lowerBound: z.number(),
    upperBound: z.number(),
    isUpperInclusive: z.boolean(),
    observations: z.number().int().min(0),
    units: z.number().int().min(0),
    predictorMean: z.number().nullable(),
    predictorMedian: z.number().nullable(),
    metrics: z.record(z.string(), z.number().nullable()).default({}),
    qualityFlags: z.array(PairStudyQualityFlagSchema).default([]),
  })
  .superRefine((row, ctx) => {
    if (row.lowerBound > row.upperBound) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'lowerBound must be <= upperBound.',
        path: ['lowerBound'],
      });
    }
  });
export type PairStudyBinRow = z.infer<typeof PairStudyBinRowSchema>;

export const PairStudyBinningMetadataSchema = z.object({
  method: z.string().min(1).default('adaptive_numeric_bins'),
  targetBinCount: z.number().int().min(1),
  minBinSize: z.number().int().min(1),
  anchors: z.array(z.number()),
  roundTo: z.number().min(0),
  binsGenerated: z.number().int().min(1),
});
export type PairStudyBinningMetadata = z.infer<typeof PairStudyBinningMetadataSchema>;

export const PairStudyAdaptiveBinTableSchema = z
  .object({
    tableId: z.string().regex(VARIABLE_ID_PATTERN),
    tableLabel: z.string().min(1),
    predictorUnit: z.string().min(1).optional(),
    metricDefinitions: z.array(PairStudyMetricDefinitionSchema).nonempty(),
    binning: PairStudyBinningMetadataSchema,
    rows: z.array(PairStudyBinRowSchema).nonempty(),
  })
  .superRefine((table, ctx) => {
    if (table.rows.length !== table.binning.binsGenerated) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'rows length must match binning.binsGenerated.',
        path: ['rows'],
      });
    }

    const metricIds = new Set(table.metricDefinitions.map(metric => metric.id));
    table.rows.forEach((row, rowIndex) => {
      if (row.binIndex !== rowIndex) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Expected binIndex ${rowIndex} but received ${row.binIndex}.`,
          path: ['rows', rowIndex, 'binIndex'],
        });
      }

      for (const metricId of Object.keys(row.metrics)) {
        if (!metricIds.has(metricId)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Unknown metric '${metricId}' in bin row.`,
            path: ['rows', rowIndex, 'metrics', metricId],
          });
        }
      }

      for (const metric of table.metricDefinitions) {
        if (!(metric.id in row.metrics)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Missing metric '${metric.id}' in bin row.`,
            path: ['rows', rowIndex, 'metrics'],
          });
        }
      }
    });
  });
export type PairStudyAdaptiveBinTable = z.infer<typeof PairStudyAdaptiveBinTableSchema>;

export const PairStudyOptimalObjectiveSchema = z.enum([
  'maximize_outcome',
  'minimize_outcome',
  'minimum_effective_value',
  'target_band',
]);
export type PairStudyOptimalObjective = z.infer<typeof PairStudyOptimalObjectiveSchema>;

export const PairStudyOptimalValueSchema = z
  .object({
    objective: PairStudyOptimalObjectiveSchema,
    centralValue: z.number(),
    lowerValue: z.number(),
    upperValue: z.number(),
    groupedValue: z.number().optional(),
    predictorUnit: z.string().min(1).optional(),
    confidenceLevel: z.number().min(0.5).max(0.999).default(0.95),
    supportObservations: z.number().int().min(0),
    supportUnits: z.number().int().min(0),
    expectedOutcomeMetrics: z.record(z.string(), z.number().nullable()).default({}),
    method: z.string().min(1),
  })
  .superRefine((optimal, ctx) => {
    if (optimal.lowerValue > optimal.centralValue || optimal.centralValue > optimal.upperValue) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Expected lowerValue <= centralValue <= upperValue.',
        path: ['centralValue'],
      });
    }
  });
export type PairStudyOptimalValue = z.infer<typeof PairStudyOptimalValueSchema>;

export const PairStudyEvidenceDirectionSchema = z.enum([
  'positive',
  'negative',
  'neutral',
  'mixed',
]);
export type PairStudyEvidenceDirection = z.infer<typeof PairStudyEvidenceDirectionSchema>;

export const PairStudyEvidenceSummarySchema = z.object({
  evidenceGrade: z.enum(['A', 'B', 'C', 'D', 'F']),
  direction: PairStudyEvidenceDirectionSchema,
  predictorImpactScore: z.number().min(0).optional(),
  forwardPearson: z.number().optional(),
  reversePearson: z.number().optional(),
  predictivePearson: z.number().optional(),
  partialCorrelation: z.number().optional(),
  pValue: z.number().min(0).max(1).optional(),
  adjustedPValue: z.number().min(0).max(1).optional(),
  percentChangeFromBaseline: z.number().optional(),
  consistency: z
    .object({
      positive: z.number().int().min(0),
      negative: z.number().int().min(0),
      neutral: z.number().int().min(0).default(0),
    })
    .optional(),
  representativePis: PredictorImpactScoreSchema.optional(),
});
export type PairStudyEvidenceSummary = z.infer<typeof PairStudyEvidenceSummarySchema>;

export const PairStudyAnalysisConfigSchema = z.object({
  lagYearsEvaluated: z.array(z.number().int().min(0).max(50)).nonempty(),
  predictorTransform: z.string().min(1),
  outcomeTransform: z.string().min(1),
  targetBinCount: z.number().int().min(1),
  minBinSize: z.number().int().min(1),
  notes: z.array(z.string()).default([]),
});
export type PairStudyAnalysisConfig = z.infer<typeof PairStudyAnalysisConfigSchema>;

export const PairStudyDataFlowStepSchema = z
  .object({
    stepId: z.string().regex(VARIABLE_ID_PATTERN),
    label: z.string().min(1),
    inputCount: z.number().int().min(0),
    outputCount: z.number().int().min(0),
    droppedCount: z.number().int().min(0),
    note: z.string().optional(),
  })
  .superRefine((step, ctx) => {
    if (step.outputCount > step.inputCount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'outputCount cannot exceed inputCount.',
        path: ['outputCount'],
      });
    }

    if (step.droppedCount > step.inputCount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'droppedCount cannot exceed inputCount.',
        path: ['droppedCount'],
      });
    }
  });
export type PairStudyDataFlowStep = z.infer<typeof PairStudyDataFlowStepSchema>;

export const PairStudyResultSchema = z.object({
  schemaVersion: z.string().min(1).default(PAIR_STUDY_SCHEMA_VERSION),
  studyId: z.string().regex(STUDY_ID_PATTERN),
  generatedAt: z.string().min(1),
  scope: PairStudyScopeContextSchema,
  predictor: PairStudyVariableSchema,
  outcome: PairStudyVariableSchema,
  analysis: PairStudyAnalysisConfigSchema,
  coverage: PairStudyCoverageSchema,
  evidence: PairStudyEvidenceSummarySchema,
  optimalValue: PairStudyOptimalValueSchema.optional(),
  adaptiveBinTables: z.array(PairStudyAdaptiveBinTableSchema).nonempty(),
  qualityFlags: z.array(PairStudyQualityFlagSchema).default([]),
  dataFlow: z.array(PairStudyDataFlowStepSchema).default([]),
  dataQuality: DataQualitySchema.optional(),
});
export type PairStudyResult = z.infer<typeof PairStudyResultSchema>;

export interface BuildPairStudyIdOptions {
  scope: PairStudyScope;
  predictorId: string;
  outcomeId: string;
  unitId?: string;
}

function sanitizeIdSegment(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_.-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function buildPairStudyId(options: BuildPairStudyIdOptions): string {
  const predictor = sanitizeIdSegment(options.predictorId);
  const outcome = sanitizeIdSegment(options.outcomeId);
  const scope = sanitizeIdSegment(options.scope);

  if (!predictor || !outcome || !scope) {
    throw new Error('scope, predictorId, and outcomeId must include at least one alphanumeric character.');
  }

  if (options.scope === 'unit_n_of_1') {
    const unit = sanitizeIdSegment(options.unitId ?? '');
    if (!unit) {
      throw new Error('unitId is required for unit_n_of_1 scope.');
    }
    return `${scope}:${unit}:${predictor}:${outcome}`;
  }

  return `${scope}:${predictor}:${outcome}`;
}

export function validatePairStudyResult(input: unknown): PairStudyResult {
  return PairStudyResultSchema.parse(input);
}

export function collectPairStudyQualityFlags(result: PairStudyResult): PairStudyQualityFlag[] {
  const collected = [...result.qualityFlags];

  for (const table of result.adaptiveBinTables) {
    for (const row of table.rows) {
      collected.push(...row.qualityFlags);
    }
  }

  return collected;
}

export function hasBlockingQualityFlags(result: PairStudyResult): boolean {
  return collectPairStudyQualityFlags(result).some(flag => flag.severity === 'error');
}

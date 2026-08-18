import { OrgType, TaskImpactFrameKey, TaskClaimPolicy } from "@optimitron/db";
import { PolicyTypeSchema } from "@optimitron/opg";
import { z } from "zod";

export const PolicyModelRunSchemaVersion = "policy-model-run.v1" as const;

export const PolicyModelGeneratorKindSchema = z.enum([
  "manual_python",
  "manual_compiled",
  "gemini_grounded",
  "gemini_curated",
  "hybrid",
  "other",
]);

export const PolicyModelSourceTypeSchema = z.enum([
  "external",
  "calculated",
  "definition",
  "ai_estimated",
  "curated",
]);

export const PolicyModelConfidenceSchema = z.enum([
  "very_high",
  "high",
  "medium",
  "low",
  "estimated",
]);

export const PolicyModelMetricValueKindSchema = z.enum([
  "numeric",
  "categorical",
  "boolean",
  "text",
]);

export const PolicyExecutionActorRoleSchema = z.enum([
  "decision_maker",
  "implementer",
  "advocate",
  "researcher",
  "funder",
  "communicator",
  "reviewer",
  "voter",
  "constituent",
  "public",
]);

export const NumericEstimateSchema = z.object({
  high: z.number().nullable().optional(),
  low: z.number().nullable().optional(),
  base: z.number().nullable(),
});

export const SummaryStatsSchema = z.object({
  mean: z.number().optional(),
  median: z.number().optional(),
  p05: z.number().optional(),
  p95: z.number().optional(),
  sampleCount: z.number().int().positive().optional(),
  stdev: z.number().nonnegative().optional(),
});

export const PolicyModelArtifactSchema = z.object({
  artifactKey: z.string().min(1),
  artifactType: z.string().min(1),
  citationKey: z.string().nullish(),
  contentHash: z.string().nullish(),
  externalKey: z.string().nullish(),
  publishedAt: z.string().datetime().nullish(),
  sourceRef: z.string().nullish(),
  sourceSystem: z.string().min(1),
  sourceUrl: z.string().url().nullish(),
  title: z.string().nullish(),
  versionKey: z.string().nullish(),
});

export const PolicyModelParameterSchema = z.object({
  chapterUrl: z.string().url().nullish(),
  confidence: PolicyModelConfidenceSchema.nullish(),
  confidenceInterval: z
    .object({
      high: z.number(),
      low: z.number(),
    })
    .nullish(),
  conservative: z.boolean().nullish(),
  description: z.string().min(1),
  displayName: z.string().min(1),
  displayValue: z.string().nullish(),
  distribution: z.string().nullish(),
  formula: z.string().nullish(),
  formatted: z.string().nullish(),
  inputs: z.array(z.string().min(1)).default([]),
  key: z.string().min(1),
  keywords: z.array(z.string().min(1)).default([]),
  latex: z.string().nullish(),
  peerReviewed: z.boolean().nullish(),
  sourceArtifactKeys: z.array(z.string().min(1)).default([]),
  sourceRef: z.string().nullish(),
  sourceType: PolicyModelSourceTypeSchema,
  sourceUrl: z.string().url().nullish(),
  stdError: z.number().nonnegative().nullish(),
  unit: z.string().min(1),
  value: z.number(),
});

export const PolicyModelCalculationNodeSchema = z.object({
  chapterUrl: z.string().url().nullish(),
  description: z.string().nullish(),
  displayName: z.string().min(1),
  formula: z.string().nullish(),
  inputs: z.array(z.string().min(1)).default([]),
  key: z.string().min(1),
  latex: z.string().nullish(),
  outputKey: z.string().min(1),
  sourceArtifactKeys: z.array(z.string().min(1)).default([]),
  unit: z.string().min(1),
});

export const PolicyModelMetricSchema = z.object({
  chapterUrl: z.string().url().nullish(),
  description: z.string().nullish(),
  displayGroup: z.string().nullish(),
  displayName: z.string().min(1),
  estimate: NumericEstimateSchema.nullish(),
  key: z.string().min(1),
  sourceArtifactKeys: z.array(z.string().min(1)).default([]),
  summaryStats: SummaryStatsSchema.nullish(),
  unit: z.string().min(1),
  valueJson: z.unknown().nullish(),
  valueKind: PolicyModelMetricValueKindSchema.default("numeric"),
}).superRefine((metric, ctx) => {
  if (metric.valueKind === "numeric" && metric.estimate == null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Numeric metrics require an estimate.",
      path: ["estimate"],
    });
  }

  if (metric.valueKind !== "numeric" && metric.valueJson == null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Non-numeric metrics require valueJson.",
      path: ["valueJson"],
    });
  }
});

export const PolicyModelEvidenceClaimSchema = z.object({
  claimKey: z.string().min(1),
  confidence: PolicyModelConfidenceSchema.nullish(),
  description: z.string().nullish(),
  evidenceNote: z.string().nullish(),
  sourceArtifactKeys: z.array(z.string().min(1)).min(1),
  supportsKeys: z.array(z.string().min(1)).default([]),
  summary: z.string().min(1),
});

export const PolicyExecutionActorSchema = z.object({
  actorKey: z.string().nullish(),
  claimPolicyHint: z.nativeEnum(TaskClaimPolicy).nullish(),
  contactLabel: z.string().nullish(),
  contactTemplate: z.string().nullish(),
  contactUrl: z.string().url().nullish(),
  currentAffiliation: z.string().nullish(),
  displayName: z.string().min(1),
  organizationKey: z.string().nullish(),
  organizationName: z.string().nullish(),
  organizationType: z.nativeEnum(OrgType).nullish(),
  roleTitle: z.string().nullish(),
  role: PolicyExecutionActorRoleSchema,
});

export const PolicyExecutionHintsSchema = z.object({
  decompositionNotes: z.string().nullish(),
  parentTaskDescription: z.string().nullish(),
  parentTaskTitle: z.string().nullish(),
  supporterLevers: z.array(z.string().min(1)).default([]),
  targetActors: z.array(PolicyExecutionActorSchema).default([]),
});

export const PolicyModelFrameSchema = z.object({
  annualDiscountRate: z.number(),
  adoptionRampYears: z.number(),
  benefitDurationYears: z.number(),
  canonical: z.object({
    delayDalysLostPerDay: NumericEstimateSchema,
    delayEconomicValueUsdLostPerDay: NumericEstimateSchema,
    estimatedCashCostUsd: NumericEstimateSchema,
    estimatedEffortHours: NumericEstimateSchema,
    expectedDalysAverted: NumericEstimateSchema,
    expectedEconomicValueUsd: NumericEstimateSchema,
    medianHealthyLifeYearsEffect: NumericEstimateSchema,
    medianIncomeGrowthEffectPpPerYear: NumericEstimateSchema,
    successProbability: NumericEstimateSchema,
  }),
  customFrameLabel: z.string().nullish(),
  evaluationHorizonYears: z.number().positive(),
  frameKey: z.nativeEnum(TaskImpactFrameKey),
  frameSlug: z.string().min(1),
  metrics: z.array(PolicyModelMetricSchema).default([]),
  summaryStats: SummaryStatsSchema.nullish(),
  timeToImpactStartDays: z.number().nonnegative(),
});

export const PolicyModelPolicySchema = z.object({
  blockingFactors: z.array(z.string().min(1)).default([]),
  counterfactualKey: z.string().min(1),
  jurisdictionId: z.string().min(1),
  jurisdictionName: z.string().min(1),
  policyId: z.string().min(1),
  policyName: z.string().min(1),
  policyType: PolicyTypeSchema,
  recommendedTarget: z.string().nullish(),
  summary: z.string().min(1),
  tags: z.array(z.string().min(1)).default([]),
});

export const PolicyModelRunSchema = z.object({
  artifacts: z.array(PolicyModelArtifactSchema).min(1),
  calculationVersion: z.string().min(1),
  calculations: z.array(PolicyModelCalculationNodeSchema).default([]),
  defaultFrameKey: z.nativeEnum(TaskImpactFrameKey).default(TaskImpactFrameKey.TWENTY_YEAR),
  evidenceClaims: z.array(PolicyModelEvidenceClaimSchema).default([]),
  executionHints: PolicyExecutionHintsSchema.nullish(),
  frames: z.array(PolicyModelFrameSchema).min(1),
  generatedAt: z.string().datetime(),
  generator: z.object({
    kind: PolicyModelGeneratorKindSchema,
    model: z.string().nullish(),
    notes: z.string().nullish(),
  }),
  methodologyKey: z.string().min(1),
  modelKey: z.string().min(1),
  parameterSetHash: z.string().min(1),
  parameters: z.array(PolicyModelParameterSchema).default([]),
  policy: PolicyModelPolicySchema,
  schemaVersion: z.literal(PolicyModelRunSchemaVersion),
  summary: z.string().min(1),
  title: z.string().min(1),
});

export type NumericEstimate = z.infer<typeof NumericEstimateSchema>;
export type PolicyModelArtifact = z.infer<typeof PolicyModelArtifactSchema>;
export type PolicyModelCalculationNode = z.infer<typeof PolicyModelCalculationNodeSchema>;
export type PolicyModelEvidenceClaim = z.infer<typeof PolicyModelEvidenceClaimSchema>;
export type PolicyModelFrame = z.infer<typeof PolicyModelFrameSchema>;
export type PolicyModelMetric = z.infer<typeof PolicyModelMetricSchema>;
export type PolicyModelParameter = z.infer<typeof PolicyModelParameterSchema>;
export type PolicyModelPolicy = z.infer<typeof PolicyModelPolicySchema>;
export type PolicyModelRun = z.infer<typeof PolicyModelRunSchema>;
export type PolicyExecutionActor = z.infer<typeof PolicyExecutionActorSchema>;
export type PolicyExecutionHints = z.infer<typeof PolicyExecutionHintsSchema>;

export function getPolicyModelFrame(
  run: PolicyModelRun,
  frameKey: TaskImpactFrameKey | string | null | undefined = run.defaultFrameKey,
) {
  const requested = frameKey?.toString().trim().toLowerCase();

  return (
    run.frames.find((frame) => frame.frameSlug.trim().toLowerCase() === requested) ??
    run.frames.find((frame) => frame.frameKey === frameKey) ??
    run.frames.find((frame) => frame.frameKey === run.defaultFrameKey) ??
    run.frames[0] ??
    null
  );
}

export function getPrimaryPolicyModelArtifacts(run: PolicyModelRun) {
  const referencedKeys = new Set<string>();

  for (const parameter of run.parameters) {
    for (const artifactKey of parameter.sourceArtifactKeys) {
      referencedKeys.add(artifactKey);
    }
  }

  for (const claim of run.evidenceClaims) {
    for (const artifactKey of claim.sourceArtifactKeys) {
      referencedKeys.add(artifactKey);
    }
  }

  for (const calculation of run.calculations) {
    for (const artifactKey of calculation.sourceArtifactKeys) {
      referencedKeys.add(artifactKey);
    }
  }

  for (const frame of run.frames) {
    for (const metric of frame.metrics) {
      for (const artifactKey of metric.sourceArtifactKeys) {
        referencedKeys.add(artifactKey);
      }
    }
  }

  return run.artifacts.filter((artifact) => referencedKeys.has(artifact.artifactKey));
}

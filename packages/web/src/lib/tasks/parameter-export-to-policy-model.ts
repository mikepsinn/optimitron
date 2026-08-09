import { OrgType, TaskImpactFrameKey, TaskClaimPolicy } from "@optimitron/db";
import { PolicyTypeSchema } from "@optimitron/opg";
import { z } from "zod";
import {
  PolicyModelRunSchemaVersion,
  type NumericEstimate,
  type PolicyModelRun,
  type PolicyModelParameter,
} from "./policy-model-run";

export const ParameterExportEntrySchema = z
  .object({
    chapterUrl: z.string().nullish(),
    confidence: z.string().nullish(),
    confidenceInterval: z.tuple([z.number(), z.number()]).nullish(),
    conservative: z.boolean().nullish(),
    computeExpr: z.string().nullish(),
    computeInputsUsed: z.array(z.string()).optional(),
    declaredLatex: z.string().nullish(),
    definitionSource: z.string().nullish(),
    description: z.string().nullish(),
    displayName: z.string().nullish(),
    displayValue: z.string().nullish(),
    distribution: z.string().nullish(),
    formatted: z.string().nullish(),
    formula: z.string().nullish(),
    hideCi: z.boolean().nullish(),
    inputs: z.array(z.string()).optional(),
    keywords: z.array(z.string()).optional(),
    lastUpdated: z.string().nullish(),
    latex: z.string().nullish(),
    latexSymbol: z.string().nullish(),
    manualRef: z.string().nullish(),
    peerReviewed: z.boolean().nullish(),
    rawProperties: z.record(z.unknown()).optional(),
    sensitivity: z.number().finite().nullish(),
    sourceRef: z.string().nullish(),
    sourceEndLine: z.number().int().positive().nullish(),
    sourceStartLine: z.number().int().positive().nullish(),
    sourceType: z.string().nullish(),
    sourceUrl: z.string().nullish(),
    stdError: z.number().nonnegative().nullish(),
    unit: z.string().nullish(),
    validationMax: z.number().finite().nullish(),
    validationMin: z.number().finite().nullish(),
    value: z.number().finite(),
  })
  .passthrough();

export const ParameterExportCitationSchema = z
  .object({
    author: z.string().nullish(),
    id: z.string().min(1),
    note: z.string().nullish(),
    quote: z.string().nullish(),
    source: z.string().nullish(),
    title: z.string().nullish(),
    type: z.string().nullish(),
    url: z.string().nullish(),
    urls: z.array(z.string()).default([]),
    year: z.string().nullish(),
  })
  .passthrough();

export const ParameterExportSchema = z
  .object({
    citations: z.record(ParameterExportCitationSchema).default({}),
    parameters: z.record(ParameterExportEntrySchema),
    schemaVersion: z.string().optional(),
    shareableSnippets: z.record(z.unknown()).default({}),
    sourceContentHash: z.string().optional(),
    sourceFile: z.string().min(1),
  })
  .passthrough();

export const CanonicalFieldKeySchema = z.enum([
  "successProbability",
  "medianIncomeGrowthEffectPpPerYear",
  "medianHealthyLifeYearsEffect",
  "expectedDalysAverted",
  "expectedEconomicValueUsd",
  "estimatedCashCostUsd",
  "estimatedEffortHours",
  "delayDalysLostPerDay",
  "delayEconomicValueUsdLostPerDay",
]);

export const EstimateBindingSchema = z.object({
  highParameterKey: z.string().min(1).nullish(),
  lowParameterKey: z.string().min(1).nullish(),
  parameterKey: z.string().min(1),
});

export const CanonicalBindingsSchema = z.object({
  delayDalysLostPerDay: EstimateBindingSchema.optional(),
  delayEconomicValueUsdLostPerDay: EstimateBindingSchema.optional(),
  estimatedCashCostUsd: EstimateBindingSchema.optional(),
  estimatedEffortHours: EstimateBindingSchema.optional(),
  expectedDalysAverted: EstimateBindingSchema.optional(),
  expectedEconomicValueUsd: EstimateBindingSchema.optional(),
  medianHealthyLifeYearsEffect: EstimateBindingSchema.optional(),
  medianIncomeGrowthEffectPpPerYear: EstimateBindingSchema.optional(),
  successProbability: EstimateBindingSchema.optional(),
});

export const MetricBindingSchema = z.object({
  description: z.string().nullish(),
  displayGroup: z.string().nullish(),
  displayName: z.string().min(1),
  key: z.string().min(1),
  parameterKey: z.string().min(1),
  unit: z.string().nullish(),
  valueKind: z
    .enum(["numeric", "categorical", "boolean", "text"])
    .default("numeric"),
});

export const FrameCompileConfigSchema = z.object({
  adoptionRampYears: z.number(),
  benefitDurationYears: z.number(),
  canonicalBindings: CanonicalBindingsSchema,
  customFrameLabel: z.string().nullish(),
  evaluationHorizonYears: z.number().positive(),
  frameKey: z.nativeEnum(TaskImpactFrameKey),
  frameSlug: z.string().min(1),
  metricBindings: z.array(MetricBindingSchema).default([]),
  timeToImpactStartDays: z.number().nonnegative(),
});

export const PolicyExecutionActorHintSchema = z.object({
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
  role: z.enum([
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
  ]),
});

export const PolicyModelCompileConfigSchema = z.object({
  blockingFactors: z.array(z.string().min(1)).default([]),
  counterfactualKey: z.string().min(1),
  defaultFrameKey: z
    .nativeEnum(TaskImpactFrameKey)
    .default(TaskImpactFrameKey.TWENTY_YEAR),
  evidenceClaims: z
    .array(
      z.object({
        claimKey: z.string().min(1),
        confidence: z
          .enum(["very_high", "high", "medium", "low", "estimated"])
          .nullish(),
        description: z.string().nullish(),
        evidenceNote: z.string().nullish(),
        sourceArtifactKeys: z.array(z.string().min(1)).default([]),
        supportsKeys: z.array(z.string().min(1)).default([]),
        summary: z.string().min(1),
      }),
    )
    .default([]),
  executionHints: z
    .object({
      decompositionNotes: z.string().nullish(),
      parentTaskDescription: z.string().nullish(),
      parentTaskTitle: z.string().nullish(),
      supporterLevers: z.array(z.string().min(1)).default([]),
      targetActors: z.array(PolicyExecutionActorHintSchema).default([]),
    })
    .nullish(),
  frames: z.array(FrameCompileConfigSchema).min(1),
  generatedAt: z.string().datetime(),
  generator: z.object({
    kind: z.enum([
      "manual_python",
      "manual_compiled",
      "gemini_grounded",
      "gemini_curated",
      "hybrid",
      "other",
    ]),
    model: z.string().nullish(),
    notes: z.string().nullish(),
  }),
  calculationVersion: z.string().min(1),
  includedParameterKeys: z.array(z.string().min(1)).nullish(),
  methodologyKey: z.string().min(1),
  modelKey: z.string().min(1),
  parameterSetHash: z.string().min(1),
  policy: z.object({
    jurisdictionId: z.string().min(1),
    jurisdictionName: z.string().min(1),
    policyId: z.string().min(1),
    policyName: z.string().min(1),
    policyType: PolicyTypeSchema,
    recommendedTarget: z.string().nullish(),
    summary: z.string().min(1),
    tags: z.array(z.string().min(1)).default([]),
  }),
  summary: z.string().min(1),
  title: z.string().min(1),
});

export type ParameterExport = z.infer<typeof ParameterExportSchema>;
export type ParameterExportCitation = z.infer<
  typeof ParameterExportCitationSchema
>;
export type ParameterExportEntry = z.infer<typeof ParameterExportEntrySchema>;
export type PolicyModelCompileConfig = z.infer<
  typeof PolicyModelCompileConfigSchema
>;
export type EstimateBinding = z.infer<typeof EstimateBindingSchema>;

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeUrl(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).toString();
  } catch {
    return null;
  }
}

function normalizeConfidence(
  confidence: string | null | undefined,
): PolicyModelParameter["confidence"] | undefined {
  switch ((confidence ?? "").toLowerCase()) {
    case "very_high":
      return "very_high";
    case "high":
      return "high";
    case "medium":
      return "medium";
    case "low":
      return "low";
    case "estimated":
      return "estimated";
    default:
      return undefined;
  }
}

function normalizeSourceType(
  sourceType: string | null | undefined,
): PolicyModelParameter["sourceType"] {
  switch ((sourceType ?? "").toLowerCase()) {
    case "external":
      return "external";
    case "calculated":
      return "calculated";
    case "definition":
      return "definition";
    case "curated":
      return "curated";
    case "ai_estimated":
      return "ai_estimated";
    default:
      return "definition";
  }
}

function buildEstimate(
  entryMap: Record<string, ParameterExportEntry>,
  binding: EstimateBinding | undefined,
): NumericEstimate {
  if (!binding) {
    return {
      base: null,
      high: null,
      low: null,
    };
  }

  const baseEntry = entryMap[binding.parameterKey];
  const lowEntry = binding.lowParameterKey
    ? entryMap[binding.lowParameterKey]
    : null;
  const highEntry = binding.highParameterKey
    ? entryMap[binding.highParameterKey]
    : null;

  if (!baseEntry) {
    throw new Error(`Missing parameter binding for ${binding.parameterKey}`);
  }

  return {
    base: baseEntry.value,
    high: highEntry?.value ?? baseEntry.confidenceInterval?.[1] ?? null,
    low: lowEntry?.value ?? baseEntry.confidenceInterval?.[0] ?? null,
  };
}

function buildSourceArtifacts(
  exportData: ParameterExport,
  config: PolicyModelCompileConfig,
) {
  const artifacts = new Map<
    string,
    {
      artifactKey: string;
      artifactType: string;
      sourceSystem: string;
      sourceUrl?: string | null;
      sourceRef?: string | null;
      title?: string | null;
      versionKey?: string | null;
    }
  >();

  artifacts.set(`parameter-set:${config.modelKey}`, {
    artifactKey: `parameter-set:${config.modelKey}`,
    artifactType: "PARAMETER_SET",
    sourceRef: exportData.sourceFile,
    sourceSystem: "PARAMETER_CATALOG",
    title: exportData.sourceFile,
    versionKey: config.parameterSetHash,
  });

  for (const [parameterKey, entry] of Object.entries(exportData.parameters)) {
    if (entry.chapterUrl) {
      const artifactKey = `manual-section:${entry.chapterUrl}`;
      if (!artifacts.has(artifactKey)) {
        artifacts.set(artifactKey, {
          artifactKey,
          artifactType: "MANUAL_SECTION",
          sourceRef: entry.chapterUrl,
          sourceSystem: "MANUAL",
          sourceUrl: normalizeUrl(entry.chapterUrl),
          title: entry.chapterUrl,
        });
      }
    }

    if (entry.sourceUrl || entry.sourceRef) {
      const citation = entry.sourceRef
        ? exportData.citations[entry.sourceRef]
        : null;
      const sourceIdentity =
        citation?.id ?? entry.sourceRef ?? entry.sourceUrl ?? parameterKey;
      const artifactKey = `external-source:${sourceIdentity}`;
      if (!artifacts.has(artifactKey)) {
        artifacts.set(artifactKey, {
          artifactKey,
          artifactType: "EXTERNAL_SOURCE",
          sourceRef: citation?.id ?? entry.sourceRef ?? null,
          sourceSystem:
            normalizeSourceType(entry.sourceType) === "external"
              ? "EXTERNAL"
              : "CURATED",
          sourceUrl: normalizeUrl(
            citation?.url ?? citation?.urls[0] ?? entry.sourceUrl ?? null,
          ),
          title: citation?.title ?? entry.displayName ?? parameterKey,
        });
      }
    }
  }

  return Array.from(artifacts.values());
}

function buildParameterArtifactKeys(
  parameterKey: string,
  entry: ParameterExportEntry,
  citations: Record<string, ParameterExportCitation>,
) {
  const keys = new Set<string>();

  if (entry.chapterUrl) {
    keys.add(`manual-section:${entry.chapterUrl}`);
  }

  if (entry.sourceUrl || entry.sourceRef) {
    const citation = entry.sourceRef ? citations[entry.sourceRef] : null;
    keys.add(
      `external-source:${citation?.id ?? entry.sourceRef ?? entry.sourceUrl ?? parameterKey}`,
    );
  }

  return Array.from(keys);
}

export function buildPolicyModelRunFromParameterExport(
  rawExport: ParameterExport,
  rawConfig: PolicyModelCompileConfig,
): PolicyModelRun {
  const exportData = ParameterExportSchema.parse(rawExport);
  const config = PolicyModelCompileConfigSchema.parse(rawConfig);

  const includedKeys = new Set(
    config.includedParameterKeys ?? Object.keys(exportData.parameters),
  );

  const entryMap = Object.fromEntries(
    Object.entries(exportData.parameters).filter(([parameterKey]) =>
      includedKeys.has(parameterKey),
    ),
  );

  const artifacts = buildSourceArtifacts(
    {
      ...exportData,
      parameters: entryMap,
    },
    config,
  );

  const parameters = Object.entries(entryMap).map(([parameterKey, entry]) => ({
    chapterUrl: normalizeUrl(entry.chapterUrl),
    confidence: normalizeConfidence(entry.confidence),
    confidenceInterval: entry.confidenceInterval
      ? {
          high: entry.confidenceInterval[1],
          low: entry.confidenceInterval[0],
        }
      : null,
    conservative: entry.conservative ?? null,
    description: entry.description ?? parameterKey,
    displayName: entry.displayName ?? parameterKey,
    displayValue: entry.displayValue ?? entry.formatted ?? null,
    distribution: entry.distribution ?? null,
    formula: entry.formula ?? null,
    formatted: entry.formatted ?? null,
    inputs: entry.inputs ?? [],
    key: parameterKey,
    keywords: entry.keywords ?? [],
    latex: entry.declaredLatex ?? entry.latex ?? null,
    peerReviewed: entry.peerReviewed ?? null,
    sourceArtifactKeys: buildParameterArtifactKeys(
      parameterKey,
      entry,
      exportData.citations,
    ),
    sourceRef: entry.sourceRef ?? null,
    sourceType: normalizeSourceType(entry.sourceType),
    sourceUrl: normalizeUrl(entry.sourceUrl),
    stdError: entry.stdError ?? null,
    unit: entry.unit ?? "unitless",
    value: entry.value,
  }));

  const calculations = Object.entries(entryMap)
    .filter(([, entry]) => {
      const formula = entry.computeExpr ?? entry.formula;
      return typeof formula === "string" && formula.trim().length > 0;
    })
    .map(([parameterKey, entry]) => ({
      chapterUrl: normalizeUrl(entry.chapterUrl),
      description: entry.description ?? null,
      displayName: entry.displayName ?? parameterKey,
      formula: entry.computeExpr ?? entry.formula ?? null,
      inputs: entry.inputs ?? entry.computeInputsUsed ?? [],
      key: `calc:${slugify(parameterKey)}`,
      latex: entry.declaredLatex ?? entry.latex ?? null,
      outputKey: parameterKey,
      sourceArtifactKeys: [`parameter-set:${config.modelKey}`],
      unit: entry.unit ?? "unitless",
    }));

  const frames = config.frames.map((frameConfig) => ({
    adoptionRampYears: frameConfig.adoptionRampYears,
    benefitDurationYears: frameConfig.benefitDurationYears,
    canonical: {
      delayDalysLostPerDay: buildEstimate(
        entryMap,
        frameConfig.canonicalBindings.delayDalysLostPerDay,
      ),
      delayEconomicValueUsdLostPerDay: buildEstimate(
        entryMap,
        frameConfig.canonicalBindings.delayEconomicValueUsdLostPerDay,
      ),
      estimatedCashCostUsd: buildEstimate(
        entryMap,
        frameConfig.canonicalBindings.estimatedCashCostUsd,
      ),
      estimatedEffortHours: buildEstimate(
        entryMap,
        frameConfig.canonicalBindings.estimatedEffortHours,
      ),
      expectedDalysAverted: buildEstimate(
        entryMap,
        frameConfig.canonicalBindings.expectedDalysAverted,
      ),
      expectedEconomicValueUsd: buildEstimate(
        entryMap,
        frameConfig.canonicalBindings.expectedEconomicValueUsd,
      ),
      medianHealthyLifeYearsEffect: buildEstimate(
        entryMap,
        frameConfig.canonicalBindings.medianHealthyLifeYearsEffect,
      ),
      medianIncomeGrowthEffectPpPerYear: buildEstimate(
        entryMap,
        frameConfig.canonicalBindings.medianIncomeGrowthEffectPpPerYear,
      ),
      successProbability: buildEstimate(
        entryMap,
        frameConfig.canonicalBindings.successProbability,
      ),
    },
    customFrameLabel: frameConfig.customFrameLabel ?? null,
    evaluationHorizonYears: frameConfig.evaluationHorizonYears,
    frameKey: frameConfig.frameKey,
    frameSlug: frameConfig.frameSlug,
    metrics: frameConfig.metricBindings.map((metricBinding) => {
      const entry = entryMap[metricBinding.parameterKey];

      if (!entry) {
        throw new Error(
          `Missing metric parameter binding for ${metricBinding.parameterKey}`,
        );
      }

      return {
        chapterUrl: normalizeUrl(entry.chapterUrl),
        description: metricBinding.description ?? entry.description ?? null,
        displayGroup: metricBinding.displayGroup ?? null,
        displayName: metricBinding.displayName,
        estimate:
          metricBinding.valueKind === "numeric"
            ? {
                base: entry.value,
                high: entry.confidenceInterval?.[1] ?? null,
                low: entry.confidenceInterval?.[0] ?? null,
              }
            : null,
        key: metricBinding.key,
        sourceArtifactKeys: buildParameterArtifactKeys(
          metricBinding.parameterKey,
          entry,
          exportData.citations,
        ),
        summaryStats: null,
        unit: metricBinding.unit ?? entry.unit ?? "unitless",
        valueJson:
          metricBinding.valueKind === "numeric"
            ? null
            : metricBinding.valueKind === "boolean"
              ? Boolean(entry.value)
              : (entry.formatted ?? entry.value),
        valueKind: metricBinding.valueKind,
      };
    }),
    summaryStats: null,
    timeToImpactStartDays: frameConfig.timeToImpactStartDays,
  }));

  return {
    artifacts,
    calculationVersion: config.calculationVersion,
    calculations,
    defaultFrameKey: config.defaultFrameKey,
    evidenceClaims: config.evidenceClaims,
    executionHints: config.executionHints ?? null,
    frames,
    generatedAt: config.generatedAt,
    generator: config.generator,
    methodologyKey: config.methodologyKey,
    modelKey: config.modelKey,
    parameterSetHash: config.parameterSetHash,
    parameters,
    policy: {
      blockingFactors: config.blockingFactors,
      counterfactualKey: config.counterfactualKey,
      jurisdictionId: config.policy.jurisdictionId,
      jurisdictionName: config.policy.jurisdictionName,
      policyId: config.policy.policyId,
      policyName: config.policy.policyName,
      policyType: config.policy.policyType,
      recommendedTarget: config.policy.recommendedTarget ?? null,
      summary: config.policy.summary,
      tags: config.policy.tags,
    },
    schemaVersion: PolicyModelRunSchemaVersion,
    summary: config.summary,
    title: config.title,
  };
}

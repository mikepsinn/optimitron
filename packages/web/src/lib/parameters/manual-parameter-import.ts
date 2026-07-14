import {
  sha256CanonicalJson,
} from "@optimitron/data/parameters";
import { z } from "zod";

const NullableStringSchema = z.string().nullable().optional();
const NullableFiniteNumberSchema = z.number().finite().nullable().optional();

export const ManualParameterEntrySchema = z
  .object({
    value: z.number().finite(),
    formatted: NullableStringSchema,
    unit: NullableStringSchema,
    description: NullableStringSchema,
    displayName: NullableStringSchema,
    sourceType: NullableStringSchema,
    sourceRef: NullableStringSchema,
    sourceUrl: NullableStringSchema,
    confidence: NullableStringSchema,
    formula: NullableStringSchema,
    calculationUrl: NullableStringSchema,
    manualRef: NullableStringSchema,
    declaredLatex: NullableStringSchema,
    latex: NullableStringSchema,
    lastUpdated: NullableStringSchema,
    peerReviewed: z.boolean().optional(),
    conservative: z.boolean().optional(),
    sensitivity: NullableFiniteNumberSchema,
    displayValue: NullableStringSchema,
    keywords: z.array(z.string()).optional(),
    validationMin: NullableFiniteNumberSchema,
    validationMax: NullableFiniteNumberSchema,
    confidenceInterval: z
      .tuple([z.number().finite(), z.number().finite()])
      .nullable()
      .optional(),
    stdError: z.number().finite().nonnegative().nullable().optional(),
    distribution: NullableStringSchema,
    latexSymbol: NullableStringSchema,
    hideCi: z.boolean().optional(),
    inputs: z.array(z.string()).optional(),
    computeExpr: NullableStringSchema,
    computeInputsUsed: z.array(z.string()).optional(),
    sourceStartLine: z.number().int().positive().nullable().optional(),
    sourceEndLine: z.number().int().positive().nullable().optional(),
    definitionSource: NullableStringSchema,
    isParameter: z.boolean().optional(),
    chapterUrl: NullableStringSchema,
    chapterTitle: NullableStringSchema,
    rawProperties: z.record(z.unknown()).optional(),
  })
  .passthrough();

export const ManualParameterExportSchema = z
  .object({
    schemaVersion: z.string().optional(),
    sourceFile: z.string().min(1),
    sourceContentHash: z.string().optional(),
    parameters: z
      .record(ManualParameterEntrySchema)
      .refine((parameters) => Object.keys(parameters).length > 0, {
        message: "Manual parameter export must not be empty.",
      }),
    shareableSnippets: z.record(z.unknown()).optional().default({}),
    citations: z.record(z.unknown()).optional().default({}),
  })
  .passthrough();

export const ManualParameterSummarySchema = z
  .object({
    mean: z.number().finite(),
    std: z.number().finite().nonnegative(),
    p5: z.number().finite(),
    p50: z.number().finite(),
    p95: z.number().finite(),
  })
  .passthrough();

export const ManualParameterSummariesSchema = z.record(
  ManualParameterSummarySchema,
);

export type ManualParameterExport = z.infer<typeof ManualParameterExportSchema>;
export type ManualParameterEntry = z.infer<typeof ManualParameterEntrySchema>;
export type ManualParameterSummary = z.infer<
  typeof ManualParameterSummarySchema
>;

export type ImportedParameterSourceType =
  | "EXTERNAL"
  | "CALCULATED"
  | "DEFINITION"
  | "AI_ESTIMATED"
  | "CURATED";

export type ImportedParameterDistributionType =
  | "FIXED"
  | "NORMAL"
  | "LOGNORMAL"
  | "BETA"
  | "GAMMA"
  | "TRIANGULAR"
  | "UNIFORM";

export interface CompiledManualParameter {
  key: string;
  value: number;
  manualRef: string | null;
  sourceRef: string | null;
  sourceType: ImportedParameterSourceType;
  description: string;
  unit: string;
  formulaText: string | null;
  formulaLatex: string | null;
  calculationCode: string | null;
  calculationLanguage: string | null;
  confidence: string;
  sourceLastUpdated: string | null;
  peerReviewed: boolean;
  conservative: boolean;
  sensitivity: number | null;
  displayValue: string | null;
  displayName: string | null;
  keywords: string[];
  validationMin: number | null;
  validationMax: number | null;
  confidenceIntervalLow: number | null;
  confidenceIntervalHigh: number | null;
  stdError: number | null;
  distributionType: ImportedParameterDistributionType | null;
  distributionParameters: Record<string, unknown> | null;
  latexSymbol: string | null;
  hideConfidenceInterval: boolean;
  summaryStats: ManualParameterSummary | null;
  rawSource: ManualParameterEntry;
  sourceContentHash: string;
  sourceStartLine: number | null;
  sourceEndLine: number | null;
  definitionSource: string | null;
  inputs: string[];
}

export interface CompiledManualParameterCatalog {
  schemaVersion: string;
  sourceFile: string;
  sourceContentHash: string;
  exportContentHash: string;
  parameterSetHash: string;
  parameters: CompiledManualParameter[];
  citations: Record<string, unknown>;
  counts: {
    total: number;
    calculated: number;
    withCalculationCode: number;
    snapshotCalculated: number;
    withDistribution: number;
    withSummaryStats: number;
  };
}

function normalizeSourceType(
  value: string | null | undefined,
): ImportedParameterSourceType {
  switch ((value ?? "definition").toLowerCase()) {
    case "external":
      return "EXTERNAL";
    case "calculated":
      return "CALCULATED";
    case "ai_estimated":
    case "estimated":
      return "AI_ESTIMATED";
    case "curated":
      return "CURATED";
    default:
      return "DEFINITION";
  }
}

function normalizeDistribution(
  value: string | null | undefined,
): ImportedParameterDistributionType | null {
  switch ((value ?? "").toLowerCase()) {
    case "fixed":
      return "FIXED";
    case "normal":
      return "NORMAL";
    case "lognormal":
      return "LOGNORMAL";
    case "beta":
      return "BETA";
    case "gamma":
      return "GAMMA";
    case "triangular":
      return "TRIANGULAR";
    case "uniform":
      return "UNIFORM";
    default:
      return null;
  }
}

function distributionParameters(
  entry: ManualParameterEntry,
): Record<string, unknown> | null {
  const distribution = normalizeDistribution(entry.distribution);
  if (!distribution) return null;
  return {
    distribution,
    mean: entry.value,
    stdError: entry.stdError ?? null,
    confidenceInterval: entry.confidenceInterval ?? null,
    validationMin: entry.validationMin ?? null,
    validationMax: entry.validationMax ?? null,
    inference: "manual-uncertainty.py.v1",
  };
}

function topologicallyOrder(
  parameters: CompiledManualParameter[],
): CompiledManualParameter[] {
  const byKey = new Map(
    parameters.map((parameter) => [parameter.key, parameter]),
  );
  const temporary = new Set<string>();
  const permanent = new Set<string>();
  const ordered: CompiledManualParameter[] = [];

  const visit = (parameter: CompiledManualParameter): void => {
    if (permanent.has(parameter.key)) return;
    if (temporary.has(parameter.key))
      throw new Error(`Manual parameter dependency cycle at ${parameter.key}.`);
    temporary.add(parameter.key);
    for (const input of parameter.inputs) {
      const dependency = byKey.get(input);
      if (!dependency)
        throw new Error(
          `Manual parameter ${parameter.key} references missing input ${input}.`,
        );
      visit(dependency);
    }
    temporary.delete(parameter.key);
    permanent.add(parameter.key);
    ordered.push(parameter);
  };

  for (const parameter of parameters) visit(parameter);
  return ordered;
}

export async function compileManualParameterCatalog(
  rawExport: unknown,
  rawSummaries: unknown = {},
): Promise<CompiledManualParameterCatalog> {
  const exportData = ManualParameterExportSchema.parse(rawExport);
  const summaries = ManualParameterSummariesSchema.parse(rawSummaries);
  const sourceContentHash =
    exportData.sourceContentHash ??
    (await sha256CanonicalJson(exportData.parameters));
  const exportContentHash = await sha256CanonicalJson(exportData);

  const parameters = await Promise.all(
    Object.entries(exportData.parameters).map(async ([key, entry]) => {
      const inputs = entry.inputs ?? [];
      const calculationCode =
        entry.definitionSource ?? entry.computeExpr ?? null;
      const calculationLanguage = calculationCode
        ? entry.definitionSource
          ? "python"
          : "python-expression"
        : null;
      const sourceType = normalizeSourceType(entry.sourceType);
      const confidenceInterval = entry.confidenceInterval ?? null;
      const rawSource = ManualParameterEntrySchema.parse(entry);
      const normalizedRevision = {
        calculationCode,
        calculationLanguage,
        confidence: entry.confidence ?? "unspecified",
        confidenceIntervalHigh: confidenceInterval?.[1] ?? null,
        confidenceIntervalLow: confidenceInterval?.[0] ?? null,
        conservative: entry.conservative ?? false,
        definitionSource: entry.definitionSource ?? null,
        description: entry.description ?? "unspecified",
        displayName: entry.displayName ?? null,
        displayValue: entry.displayValue ?? null,
        distributionParameters: distributionParameters(entry),
        distributionType: normalizeDistribution(entry.distribution),
        formulaLatex: entry.declaredLatex ?? entry.latex ?? null,
        formulaText: entry.formula ?? null,
        hideConfidenceInterval: entry.hideCi ?? false,
        inputs,
        keywords: entry.keywords ?? [],
        latexSymbol: entry.latexSymbol ?? null,
        manualRef: entry.manualRef ?? null,
        peerReviewed: entry.peerReviewed ?? false,
        sensitivity: entry.sensitivity ?? null,
        sourceEndLine: entry.sourceEndLine ?? null,
        sourceLastUpdated: entry.lastUpdated ?? null,
        sourceRef: entry.sourceRef ?? null,
        sourceStartLine: entry.sourceStartLine ?? null,
        sourceType,
        stdError: entry.stdError ?? null,
        summaryStats: summaries[key] ?? null,
        unit: entry.unit ?? "unspecified",
        validationMax: entry.validationMax ?? null,
        validationMin: entry.validationMin ?? null,
        value: entry.value,
      };
      const sourceContentHashForRevision = await sha256CanonicalJson({
        citation:
          entry.sourceRef &&
          Object.hasOwn(exportData.citations, entry.sourceRef)
            ? exportData.citations[entry.sourceRef]
            : null,
        key,
        normalizedRevision,
        rawSource,
      });

      return {
        key,
        ...normalizedRevision,
        rawSource,
        sourceContentHash: sourceContentHashForRevision,
      } satisfies CompiledManualParameter;
    }),
  );

  const orderedParameters = topologicallyOrder(parameters);
  const parameterSetHash = await sha256CanonicalJson(
    orderedParameters
      .map(({ key, sourceContentHash: revisionHash }) => ({
        key,
        revisionHash,
      }))
      .sort((left, right) => left.key.localeCompare(right.key)),
  );
  const calculated = orderedParameters.filter(
    (parameter) => parameter.sourceType === "CALCULATED",
  );
  return {
    schemaVersion: exportData.schemaVersion ?? "manual-parameters.v1",
    sourceFile: exportData.sourceFile,
    sourceContentHash,
    exportContentHash,
    parameterSetHash,
    parameters: orderedParameters,
    citations: exportData.citations,
    counts: {
      total: orderedParameters.length,
      calculated: calculated.length,
      withCalculationCode: calculated.filter(
        (parameter) => parameter.calculationCode !== null,
      ).length,
      snapshotCalculated: calculated.filter(
        (parameter) => parameter.calculationCode === null,
      ).length,
      withDistribution: orderedParameters.filter(
        (parameter) => parameter.distributionType !== null,
      ).length,
      withSummaryStats: orderedParameters.filter(
        (parameter) => parameter.summaryStats !== null,
      ).length,
    },
  };
}

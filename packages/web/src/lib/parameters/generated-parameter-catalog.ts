import { sha256CanonicalJson } from "@optimitron/data/parameters";
import { z } from "zod";

const NullableStringSchema = z.string().nullable().optional();
const NullableFiniteNumberSchema = z.number().finite().nullable().optional();
const GeneratedDistributionSchema = z
  .enum([
    "fixed",
    "normal",
    "lognormal",
    "beta",
    "gamma",
    "triangular",
    "uniform",
  ])
  .nullable()
  .optional();

export const GeneratedParameterEntrySchema = z
  .object({
    calculationsUrl: NullableStringSchema,
    computeExpr: NullableStringSchema,
    confidence: NullableStringSchema,
    confidenceInterval: z
      .tuple([z.number().finite(), z.number().finite()])
      .nullable()
      .optional(),
    conservative: z.boolean().optional(),
    description: NullableStringSchema,
    displayName: NullableStringSchema,
    distribution: GeneratedDistributionSchema,
    formula: NullableStringSchema,
    inputs: z.array(z.string()).optional(),
    latex: NullableStringSchema,
    manualPageTitle: NullableStringSchema,
    manualPageUrl: NullableStringSchema,
    parameterName: NullableStringSchema,
    peerReviewed: z.boolean().optional(),
    sourceLastUpdated: NullableStringSchema,
    sourceRef: NullableStringSchema,
    sourceType: NullableStringSchema,
    sourceUrl: NullableStringSchema,
    stdError: z.number().finite().nonnegative().nullable().optional(),
    unit: NullableStringSchema,
    validationMax: NullableFiniteNumberSchema,
    validationMin: NullableFiniteNumberSchema,
    value: z.number().finite(),
  })
  .passthrough();

const GeneratedParametersSchema = z
  .record(GeneratedParameterEntrySchema)
  .refine((parameters) => Object.keys(parameters).length > 0, {
    message: "Generated parameter catalog must not be empty.",
  });

const GeneratedCitationsSchema = z.record(z.unknown());

export type GeneratedParameterEntry = z.infer<
  typeof GeneratedParameterEntrySchema
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

export interface CompiledGeneratedParameter {
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
  validationMin: number | null;
  validationMax: number | null;
  confidenceIntervalLow: number | null;
  confidenceIntervalHigh: number | null;
  stdError: number | null;
  distributionType: ImportedParameterDistributionType | null;
  distributionParameters: Record<string, unknown> | null;
  latexSymbol: string | null;
  sourceContentHash: string;
  inputs: string[];
}

export interface CompiledGeneratedParameterCatalog {
  catalogContentHash: string;
  parameters: CompiledGeneratedParameter[];
  citations: Record<string, unknown>;
  counts: {
    total: number;
    calculated: number;
    withCalculationCode: number;
    snapshotCalculated: number;
    withDistribution: number;
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
  entry: GeneratedParameterEntry,
): Record<string, unknown> | null {
  const distribution = normalizeDistribution(entry.distribution);
  if (!distribution) return null;
  return {
    confidenceInterval: entry.confidenceInterval ?? null,
    distribution,
    mean: entry.value,
    stdError: entry.stdError ?? null,
    validationMax: entry.validationMax ?? null,
    validationMin: entry.validationMin ?? null,
  };
}

function topologicallyOrder(
  parameters: CompiledGeneratedParameter[],
): CompiledGeneratedParameter[] {
  const byKey = new Map(
    parameters.map((parameter) => [parameter.key, parameter]),
  );
  const temporary = new Set<string>();
  const permanent = new Set<string>();
  const ordered: CompiledGeneratedParameter[] = [];

  const visit = (parameter: CompiledGeneratedParameter): void => {
    if (permanent.has(parameter.key)) return;
    if (temporary.has(parameter.key))
      throw new Error(`Parameter dependency cycle at ${parameter.key}.`);
    temporary.add(parameter.key);
    for (const input of parameter.inputs) {
      const dependency = byKey.get(input);
      if (!dependency)
        throw new Error(
          `Parameter ${parameter.key} references missing input ${input}.`,
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

export async function compileGeneratedParameterCatalog(
  rawParameters: unknown,
  rawCitations: unknown = {},
): Promise<CompiledGeneratedParameterCatalog> {
  const parameterEntries = GeneratedParametersSchema.parse(rawParameters);
  const citations = GeneratedCitationsSchema.parse(rawCitations);
  const catalogContentHash = await sha256CanonicalJson({
    citations,
    parameters: parameterEntries,
  });

  const parameters = await Promise.all(
    Object.entries(parameterEntries).map(async ([key, entry]) => {
      if (entry.parameterName && entry.parameterName !== key) {
        throw new Error(
          `Generated parameter ${key} declares mismatched name ${entry.parameterName}.`,
        );
      }
      const confidenceInterval = entry.confidenceInterval ?? null;
      const normalizedRevision = {
        calculationCode: entry.computeExpr ?? null,
        calculationLanguage: entry.computeExpr ? "javascript-expression" : null,
        confidence: entry.confidence ?? "unspecified",
        confidenceIntervalHigh: confidenceInterval?.[1] ?? null,
        confidenceIntervalLow: confidenceInterval?.[0] ?? null,
        conservative: entry.conservative ?? false,
        description: entry.description ?? "unspecified",
        displayName: entry.displayName ?? null,
        displayValue: null,
        distributionParameters: distributionParameters(entry),
        distributionType: normalizeDistribution(entry.distribution),
        formulaLatex: entry.latex ?? null,
        formulaText: entry.formula ?? null,
        inputs: entry.inputs ?? [],
        latexSymbol: null,
        manualRef: entry.manualPageUrl ?? null,
        peerReviewed: entry.peerReviewed ?? false,
        sensitivity: null,
        sourceLastUpdated: entry.sourceLastUpdated ?? null,
        sourceRef: entry.sourceRef ?? null,
        sourceType: normalizeSourceType(entry.sourceType),
        stdError: entry.stdError ?? null,
        unit: entry.unit ?? "unspecified",
        validationMax: entry.validationMax ?? null,
        validationMin: entry.validationMin ?? null,
        value: entry.value,
      };
      const sourceContentHash = await sha256CanonicalJson({
        citation: entry.sourceRef ? citations[entry.sourceRef] : null,
        key,
        normalizedRevision,
      });

      return {
        key,
        ...normalizedRevision,
        sourceContentHash,
      } satisfies CompiledGeneratedParameter;
    }),
  );

  const orderedParameters = topologicallyOrder(parameters);
  const calculated = orderedParameters.filter(
    (parameter) => parameter.sourceType === "CALCULATED",
  );

  return {
    catalogContentHash,
    parameters: orderedParameters,
    citations,
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
    },
  };
}

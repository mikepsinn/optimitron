import {
  ModelRevisionStatus,
  ParameterDistributionType,
  SourceArtifactType,
  SourceSystem,
} from "@optimitron/db/enums";
import { Prisma, type PrismaClient } from "@optimitron/db";
import { sha256CanonicalJson } from "@optimitron/data/parameters";
import { z } from "zod";
import { prisma as defaultPrisma } from "../prisma";
import { getSourceArtifactVisibilityWhere } from "../source-artifact-visibility.server";
import {
  CalculationSourcePayloadSchema,
  sourceArtifactFingerprint,
  storeInlineCalculationSourceArtifact,
} from "../source-artifacts";
import {
  compileGeneratedParameterCatalog,
  type CompiledGeneratedParameter,
} from "./generated-parameter-catalog";

type CatalogDb = PrismaClient | Prisma.TransactionClient;
type ParameterInputRevision = Prisma.ParameterRevisionGetPayload<{
  include: { parameter: true };
}>;

export interface ParameterActor {
  isAdmin: boolean;
  userId: string | null;
}

export class ParameterAuthorizationError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ParameterAuthorizationError";
  }
}

function json(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function nullableJson(
  value: unknown,
): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  return value == null ? Prisma.JsonNull : json(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function assertSemanticBounds(input: {
  confidenceIntervalHigh?: number | null;
  confidenceIntervalLow?: number | null;
  stdError?: number | null;
  validationMax?: number | null;
  validationMin?: number | null;
  value: number;
}) {
  for (const [key, value] of Object.entries({
    confidenceIntervalHigh: input.confidenceIntervalHigh,
    confidenceIntervalLow: input.confidenceIntervalLow,
    stdError: input.stdError,
    validationMax: input.validationMax,
    validationMin: input.validationMin,
    value: input.value,
  })) {
    if (value != null && !isFiniteNumber(value)) {
      throw new Error(`${key} must be finite.`);
    }
  }
  if (
    input.validationMin != null &&
    input.validationMax != null &&
    input.validationMin > input.validationMax
  ) {
    throw new Error("validationMin must not exceed validationMax.");
  }
  if (input.validationMin != null && input.value < input.validationMin) {
    throw new Error("value must not be below validationMin.");
  }
  if (input.validationMax != null && input.value > input.validationMax) {
    throw new Error("value must not exceed validationMax.");
  }
  if (
    input.confidenceIntervalLow != null &&
    input.confidenceIntervalHigh != null &&
    input.confidenceIntervalLow > input.confidenceIntervalHigh
  ) {
    throw new Error(
      "confidenceIntervalLow must not exceed confidenceIntervalHigh.",
    );
  }
  if (
    input.confidenceIntervalLow != null &&
    input.value < input.confidenceIntervalLow
  ) {
    throw new Error("value must not be below confidenceIntervalLow.");
  }
  if (
    input.confidenceIntervalHigh != null &&
    input.value > input.confidenceIntervalHigh
  ) {
    throw new Error("value must not exceed confidenceIntervalHigh.");
  }
  if (input.stdError != null && input.stdError < 0) {
    throw new Error("stdError must be nonnegative.");
  }
}

export function canReadParameterRevision(
  revision: {
    proposedByUserId: string | null;
    status: ModelRevisionStatus;
  },
  actor: ParameterActor,
) {
  return (
    actor.isAdmin ||
    (actor.userId != null && revision.proposedByUserId === actor.userId) ||
    revision.status === ModelRevisionStatus.PUBLISHED ||
    revision.status === ModelRevisionStatus.SUPERSEDED
  );
}

function parameterRevisionData(parameter: CompiledGeneratedParameter) {
  assertSemanticBounds(parameter);
  return {
    assumptionsJson: Prisma.JsonNull,
    confidence: parameter.confidence,
    confidenceIntervalHigh: parameter.confidenceIntervalHigh,
    confidenceIntervalLow: parameter.confidenceIntervalLow,
    conservative: parameter.conservative,
    description: parameter.description,
    displayName: parameter.displayName,
    displayValue: parameter.displayValue,
    distributionParametersJson: nullableJson(parameter.distributionParameters),
    distributionType: parameter.distributionType,
    calculationCode: parameter.calculationCode,
    calculationLanguage: parameter.calculationLanguage,
    formulaLatex: parameter.formulaLatex,
    formulaText: parameter.formulaText,
    latexSymbol: parameter.latexSymbol,
    manualRef: parameter.manualRef,
    peerReviewed: parameter.peerReviewed,
    rationale: null,
    sensitivity: parameter.sensitivity,
    sourceContentHash: parameter.sourceContentHash,
    sourceLastUpdated: parameter.sourceLastUpdated,
    sourceRef: parameter.sourceRef,
    sourceType: parameter.sourceType,
    stdError: parameter.stdError,
    summaryStatsJson: Prisma.JsonNull,
    unit: parameter.unit,
    validationMax: parameter.validationMax,
    validationMin: parameter.validationMin,
    value: parameter.value,
  } satisfies Omit<
    Prisma.ParameterRevisionCreateManyInput,
    "parameterId" | "revision" | "status"
  >;
}

export interface BootstrapGeneratedParameterCatalogInput {
  citations?: unknown;
  dryRun?: boolean;
  parameters: unknown;
}

export async function bootstrapGeneratedParameterCatalog(
  input: BootstrapGeneratedParameterCatalogInput,
  db: PrismaClient = defaultPrisma,
) {
  const catalog = await compileGeneratedParameterCatalog(
    input.parameters,
    input.citations ?? {},
  );
  for (const parameter of catalog.parameters) assertSemanticBounds(parameter);
  const citations = await Promise.all(
    Object.entries(catalog.citations).map(async ([key, value]) => ({
      contentHash: await sha256CanonicalJson(value),
      key,
      value,
    })),
  );
  const validation = {
    ...catalog.counts,
    citationCount: citations.length,
    catalogContentHash: catalog.catalogContentHash,
  };
  if (input.dryRun !== false) return { applied: false, ...validation };

  const result = await db.$transaction(
    async (tx) => {
      const keys = catalog.parameters.map((parameter) => parameter.key);
      const existingDefinitions = await tx.parameterDefinition.findMany({
        where: { key: { in: keys } },
        select: {
          currentRevisionId: true,
          deletedAt: true,
          id: true,
          key: true,
        },
      });
      const invalidExistingDefinitions = existingDefinitions.filter(
        (definition) =>
          definition.deletedAt != null || definition.currentRevisionId == null,
      );
      if (invalidExistingDefinitions.length > 0) {
        throw new Error(
          `Existing parameters must have a current revision: ${invalidExistingDefinitions
            .map((definition) => definition.key)
            .join(", ")}.`,
        );
      }
      const existingKeys = new Set(
        existingDefinitions.map((definition) => definition.key),
      );
      const newParameters = catalog.parameters.filter(
        (parameter) => !existingKeys.has(parameter.key),
      );
      if (newParameters.length === 0) {
        return {
          createdDefinitionCount: 0,
          createdRevisionCount: 0,
          importedCalculatedRevisionCount: 0,
          skippedExistingDefinitionCount: existingDefinitions.length,
        };
      }

      const requiredRevisionKeys = new Set(
        newParameters.flatMap((parameter) => [
          parameter.key,
          ...parameter.inputs,
        ]),
      );
      const parameterSetSourceKey = `generated:parameter-set:${catalog.catalogContentHash}`;
      await tx.sourceArtifact.createMany({
        data: [
          {
            artifactType: SourceArtifactType.PARAMETER_SET,
            contentHash: catalog.catalogContentHash,
            payloadJson: json({
              citations: catalog.citations,
              parameters: input.parameters,
            }),
            sourceKey: parameterSetSourceKey,
            sourceRef: "@optimitron/data/parameters",
            sourceSystem: SourceSystem.PARAMETER_CATALOG,
            title: `Generated parameter catalog ${catalog.catalogContentHash.slice(0, 12)}`,
          },
          ...citations.map((citation) => ({
            artifactType: SourceArtifactType.EXTERNAL_SOURCE,
            contentHash: citation.contentHash,
            externalKey: citation.key,
            payloadJson: json(citation.value),
            sourceKey: `manual:citation:${citation.key}:${citation.contentHash}`,
            sourceRef: citation.key,
            sourceSystem: SourceSystem.MANUAL,
            sourceUrl:
              typeof (citation.value as Record<string, unknown>)?.URL ===
              "string"
                ? ((citation.value as Record<string, unknown>).URL as string)
                : typeof (citation.value as Record<string, unknown>)?.url ===
                    "string"
                  ? ((citation.value as Record<string, unknown>).url as string)
                  : null,
            title:
              typeof (citation.value as Record<string, unknown>)?.title ===
              "string"
                ? ((citation.value as Record<string, unknown>).title as string)
                : citation.key,
          })),
        ],
        skipDuplicates: true,
      });
      await tx.parameterDefinition.createMany({
        data: newParameters.map((parameter) => ({ key: parameter.key })),
      });

      const definitions = await tx.parameterDefinition.findMany({
        where: { key: { in: keys } },
      });
      if (definitions.length !== keys.length) {
        throw new Error(
          `Expected ${keys.length} parameter definitions, found ${definitions.length}.`,
        );
      }
      const definitionByKey = new Map(
        definitions.map((definition) => [definition.key, definition]),
      );
      const publishedAt = new Date();
      await tx.parameterRevision.createMany({
        data: newParameters.map((parameter) => ({
          ...parameterRevisionData(parameter),
          parameterId: definitionByKey.get(parameter.key)!.id,
          publishedAt,
          revision: 1,
          status: ModelRevisionStatus.PUBLISHED,
        })),
      });

      const createdRevisions = await tx.parameterRevision.findMany({
        where: {
          parameterId: {
            in: newParameters.map(
              (parameter) => definitionByKey.get(parameter.key)!.id,
            ),
          },
        },
        select: { id: true, parameterId: true },
      });
      if (createdRevisions.length !== newParameters.length) {
        throw new Error(
          `Expected ${newParameters.length} new revisions, found ${createdRevisions.length}.`,
        );
      }
      const createdRevisionByParameterId = new Map(
        createdRevisions.map((revision) => [revision.parameterId, revision]),
      );
      const revisionByKey = new Map<string, { id: string }>();
      for (const key of requiredRevisionKeys) {
        const definition = definitionByKey.get(key)!;
        const revisionId =
          createdRevisionByParameterId.get(definition.id)?.id ??
          definition.currentRevisionId;
        if (!revisionId)
          throw new Error(`Parameter ${key} has no current revision.`);
        revisionByKey.set(key, { id: revisionId });
      }

      const inputRows: Prisma.ParameterRevisionInputCreateManyInput[] = [];
      for (const parameter of newParameters) {
        const calculatedRevision = revisionByKey.get(parameter.key)!;
        parameter.inputs.forEach((symbol, position) => {
          const inputRevision = revisionByKey.get(symbol);
          if (!inputRevision)
            throw new Error(`Missing parameter input revision ${symbol}.`);
          inputRows.push({
            calculatedRevisionId: calculatedRevision.id,
            inputRevisionId: inputRevision.id,
            position,
            symbol,
          });
        });
      }
      if (inputRows.length > 0) {
        await tx.parameterRevisionInput.createMany({ data: inputRows });
      }

      const artifacts = await tx.sourceArtifact.findMany({
        where: {
          sourceKey: {
            in: [
              parameterSetSourceKey,
              ...citations.map(
                (citation) =>
                  `manual:citation:${citation.key}:${citation.contentHash}`,
              ),
            ],
          },
        },
        select: { id: true, sourceKey: true, sourceRef: true },
      });
      const parameterSetArtifact = artifacts.find(
        (artifact) => artifact.sourceKey === parameterSetSourceKey,
      );
      if (!parameterSetArtifact)
        throw new Error("Generated parameter catalog artifact is missing.");
      const citationByRef = new Map(
        artifacts
          .filter((artifact) => artifact.sourceRef)
          .map((artifact) => [artifact.sourceRef!, artifact]),
      );
      const sourceLinks: Prisma.ParameterRevisionSourceArtifactCreateManyInput[] =
        [];
      for (const parameter of newParameters) {
        const revision = revisionByKey.get(parameter.key)!;
        const citation = parameter.sourceRef
          ? citationByRef.get(parameter.sourceRef)
          : null;
        if (parameter.sourceRef && !citation) {
          throw new Error(
            `Generated parameter ${parameter.key} references citation ${parameter.sourceRef}, but its source artifact is missing.`,
          );
        }
        sourceLinks.push({
          isPrimary: citation == null,
          parameterRevisionId: revision.id,
          sourceArtifactId: parameterSetArtifact.id,
        });
        if (citation) {
          sourceLinks.push({
            isPrimary: true,
            parameterRevisionId: revision.id,
            sourceArtifactId: citation.id,
          });
        }
      }
      await tx.parameterRevisionSourceArtifact.createMany({
        data: sourceLinks,
      });

      const pointerRows = newParameters.map((parameter) => ({
        parameterId: definitionByKey.get(parameter.key)!.id,
        revisionId: revisionByKey.get(parameter.key)!.id,
      }));
      const values = Prisma.join(
        pointerRows.map(
          (row) => Prisma.sql`(${row.parameterId}, ${row.revisionId})`,
        ),
      );
      await tx.$executeRaw(Prisma.sql`
        UPDATE "ParameterDefinition" AS parameter
        SET "currentRevisionId" = current."revisionId", "updatedAt" = CURRENT_TIMESTAMP
        FROM (VALUES ${values}) AS current("parameterId", "revisionId")
        WHERE parameter."id" = current."parameterId"
      `);

      return {
        createdDefinitionCount: newParameters.length,
        createdRevisionCount: newParameters.length,
        importedCalculatedRevisionCount: newParameters.filter(
          (parameter) => parameter.sourceType === "CALCULATED",
        ).length,
        skippedExistingDefinitionCount: existingDefinitions.length,
      };
    },
    { maxWait: 20_000, timeout: 120_000 },
  );

  return { applied: true, ...result, ...validation };
}

const ParameterInputReferenceSchema = z
  .object({
    parameterKey: z.string().min(1),
    revisionId: z.string().min(1).optional(),
    symbol: z.string().min(1),
  })
  .strict();

const ParameterInputReferencesSchema = z
  .array(ParameterInputReferenceSchema)
  .max(256)
  .superRefine((inputs, context) => {
    const symbols = new Set<string>();
    for (const [index, input] of inputs.entries()) {
      if (symbols.has(input.symbol)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate input symbol: ${input.symbol}`,
          path: [index, "symbol"],
        });
      }
      symbols.add(input.symbol);
    }
  });

export const ParameterRevisionProposalSchema = z
  .object({
    assumptions: z.array(z.string()).default([]),
    calculationCode: z.string().max(1_000_000).nullable().optional(),
    calculationLanguage: z.string().max(100).nullable().optional(),
    calculationSource: CalculationSourcePayloadSchema.nullable().optional(),
    confidence: z.string().min(1).default("estimated"),
    confidenceIntervalHigh: z.number().finite().nullable().optional(),
    confidenceIntervalLow: z.number().finite().nullable().optional(),
    conservative: z.boolean().default(false),
    description: z.string().min(1),
    displayName: z.string().min(1).nullable().optional(),
    displayValue: z.string().nullable().optional(),
    distributionParameters: z.record(z.unknown()).nullable().optional(),
    distributionType: z
      .nativeEnum(ParameterDistributionType)
      .nullable()
      .optional(),
    formulaLatex: z.string().nullable().optional(),
    formulaText: z.string().nullable().optional(),
    inputs: ParameterInputReferencesSchema.default([]),
    key: z.string().min(1),
    latexSymbol: z.string().nullable().optional(),
    manualRef: z.string().nullable().optional(),
    peerReviewed: z.boolean().default(false),
    rationale: z.string().min(1),
    sourceRef: z.string().nullable().optional(),
    sourceLastUpdated: z.string().nullable().optional(),
    sourceUrls: z.array(z.string().url()).max(50).default([]),
    sourceType: z
      .enum(["EXTERNAL", "CALCULATED", "DEFINITION", "AI_ESTIMATED", "CURATED"])
      .default("AI_ESTIMATED"),
    stdError: z.number().finite().nonnegative().nullable().optional(),
    sensitivity: z.number().finite().nullable().optional(),
    summaryStats: z.record(z.unknown()).nullable().optional(),
    unit: z.string().min(1),
    validationMax: z.number().finite().nullable().optional(),
    validationMin: z.number().finite().nullable().optional(),
    value: z.number().finite(),
  })
  .strict();

export type ParameterRevisionProposal = z.infer<
  typeof ParameterRevisionProposalSchema
>;

async function resolveProposalInputs(
  db: CatalogDb,
  proposals: ParameterRevisionProposal[],
  actor: ParameterActor,
) {
  const references = proposals.flatMap((proposal) => proposal.inputs);
  const revisionIds = [
    ...new Set(references.flatMap((reference) => reference.revisionId ?? [])),
  ];
  const parameterKeys = [
    ...new Set(
      references
        .filter((reference) => reference.revisionId == null)
        .map((reference) => reference.parameterKey),
    ),
  ];
  const [revisions, definitions] = await Promise.all([
    revisionIds.length > 0
      ? db.parameterRevision.findMany({
          where: { id: { in: revisionIds } },
          include: { parameter: true },
        })
      : Promise.resolve([]),
    parameterKeys.length > 0
      ? db.parameterDefinition.findMany({
          where: { key: { in: parameterKeys } },
          include: { currentRevision: { include: { parameter: true } } },
        })
      : Promise.resolve([]),
  ]);
  const revisionsById = new Map(
    revisions.map((revision) => [revision.id, revision]),
  );
  const revisionsByParameterKey = new Map(
    definitions.flatMap((definition) =>
      definition.currentRevision
        ? [[definition.key, definition.currentRevision] as const]
        : [],
    ),
  );
  const resolved = new Map<
    string,
    Array<{
      revision: ParameterInputRevision;
      symbol: string;
    }>
  >();
  for (const proposal of proposals) {
    const entries = [];
    for (const reference of proposal.inputs) {
      const revision = assertReadableInputRevision(
        reference.revisionId
          ? (revisionsById.get(reference.revisionId) ?? null)
          : (revisionsByParameterKey.get(reference.parameterKey) ?? null),
        reference,
        actor,
      );
      entries.push({ revision, symbol: reference.symbol });
    }
    resolved.set(proposal.key, entries);
  }
  return resolved;
}

function assertReadableInputRevision(
  revision: ParameterInputRevision | null,
  reference: z.infer<typeof ParameterInputReferenceSchema>,
  actor: ParameterActor,
) {
  if (!revision || revision.deletedAt || revision.parameter.deletedAt) {
    throw new Error(`Parameter input not found: ${reference.parameterKey}.`);
  }
  if (revision.parameter.key !== reference.parameterKey) {
    throw new Error(
      `Parameter revision ${revision.id} does not belong to ${reference.parameterKey}.`,
    );
  }
  if (!canReadParameterRevision(revision, actor)) {
    throw new ParameterAuthorizationError(
      "You cannot read one of the proposed parameter inputs.",
    );
  }
  return revision;
}

export async function proposeParameterBundle(
  rawProposals: unknown,
  actor: ParameterActor,
  db: PrismaClient = defaultPrisma,
) {
  if (!actor.userId)
    throw new ParameterAuthorizationError("Authentication is required.");
  const proposals = z
    .array(ParameterRevisionProposalSchema)
    .min(1)
    .max(100)
    .parse(rawProposals);
  const proposalKeys = new Set<string>();
  for (const proposal of proposals) assertSemanticBounds(proposal);
  for (const proposal of proposals) {
    if (proposalKeys.has(proposal.key))
      throw new Error(`Duplicate parameter proposal: ${proposal.key}.`);
    proposalKeys.add(proposal.key);
  }

  const createProposalBundle = async (tx: Prisma.TransactionClient) => {
    const resolved = await resolveProposalInputs(tx, proposals, actor);
    const reviews = [];
    for (const proposal of proposals) {
      const existing = await tx.parameterDefinition.findUnique({
        where: { key: proposal.key },
        include: { currentRevision: true },
      });
      if (existing?.deletedAt) {
        throw new Error(
          `Parameter proposal will not restore deleted definition ${proposal.key}.`,
        );
      }
      const definition =
        existing ??
        (await tx.parameterDefinition.create({
          data: {
            createdByUserId: actor.userId,
            key: proposal.key,
          },
          include: { currentRevision: true },
        }));
      const proposalInputs = resolved.get(proposal.key) ?? [];
      const inlineArtifact = proposal.calculationSource
        ? await storeInlineCalculationSourceArtifact(
            proposal.calculationSource,
            tx,
          )
        : null;
      const referencedArtifacts = inlineArtifact ? [inlineArtifact] : [];
      const artifactFingerprints = referencedArtifacts
        .map(sourceArtifactFingerprint)
        .sort((left, right) => left.sourceKey.localeCompare(right.sourceKey));
      if (
        proposal.sourceType === "CALCULATED" &&
        !proposal.formulaText &&
        !proposal.calculationCode &&
        !proposal.calculationSource
      ) {
        throw new Error(
          "Calculated parameter proposals require a formula or inert calculation code.",
        );
      }
      const {
        calculationSource: _calculationSource,
        ...proposalWithoutCalculationSource
      } = proposal;
      const sourceContentHash = await sha256CanonicalJson({
        ...proposalWithoutCalculationSource,
        sourceArtifacts: artifactFingerprints,
        inputs: proposal.inputs.map(
          ({ revisionId: _revisionId, ...reference }) => reference,
        ),
        inputRevisionHashes: proposalInputs
          .map((input) => ({
            sourceContentHash: input.revision.sourceContentHash,
            symbol: input.symbol,
          }))
          .sort((left, right) => left.symbol.localeCompare(right.symbol)),
      });
      const latest = await tx.parameterRevision.aggregate({
        where: { parameterId: definition.id },
        _max: { revision: true },
      });
      const revision = await tx.parameterRevision.upsert({
        where: {
          parameterId_sourceContentHash: {
            parameterId: definition.id,
            sourceContentHash,
          },
        },
        create: {
          assumptionsJson: json(proposal.assumptions),
          confidence: proposal.confidence,
          confidenceIntervalHigh: proposal.confidenceIntervalHigh ?? null,
          confidenceIntervalLow: proposal.confidenceIntervalLow ?? null,
          calculationCode:
            proposal.calculationCode ??
            proposal.calculationSource?.source ??
            null,
          calculationLanguage:
            proposal.calculationLanguage ??
            proposal.calculationSource?.language ??
            null,
          conservative: proposal.conservative,
          description: proposal.description,
          displayName: proposal.displayName ?? null,
          displayValue: proposal.displayValue ?? null,
          distributionParametersJson: nullableJson(
            proposal.distributionParameters ?? null,
          ),
          distributionType: proposal.distributionType ?? null,
          formulaLatex: proposal.formulaLatex ?? null,
          formulaText: proposal.formulaText ?? null,
          latexSymbol: proposal.latexSymbol ?? null,
          manualRef: proposal.manualRef ?? null,
          parameterId: definition.id,
          proposedByUserId: actor.userId,
          peerReviewed: proposal.peerReviewed,
          rationale: proposal.rationale,
          revision: (latest._max.revision ?? 0) + 1,
          sourceContentHash,
          sourceLastUpdated: proposal.sourceLastUpdated ?? null,
          sourceRef: proposal.sourceRef ?? null,
          sourceType: proposal.sourceType,
          status: ModelRevisionStatus.DRAFT,
          stdError: proposal.stdError ?? null,
          sensitivity: proposal.sensitivity ?? null,
          summaryStatsJson: nullableJson(proposal.summaryStats ?? null),
          unit: proposal.unit,
          validationMax: proposal.validationMax ?? null,
          validationMin: proposal.validationMin ?? null,
          value: proposal.value,
        },
        update: {},
      });
      if (proposalInputs.length > 0) {
        await tx.parameterRevisionInput.createMany({
          data: proposalInputs.map((input, position) => ({
            calculatedRevisionId: revision.id,
            inputRevisionId: input.revision.id,
            position,
            symbol: input.symbol,
          })),
          skipDuplicates: true,
        });
      }
      if (proposal.sourceUrls.length > 0 || referencedArtifacts.length > 0) {
        const artifacts = [...referencedArtifacts];
        for (const sourceUrl of proposal.sourceUrls) {
          const contentHash = await sha256CanonicalJson({ sourceUrl });
          artifacts.push(
            await tx.sourceArtifact.upsert({
              where: { sourceKey: `parameter-source:${contentHash}` },
              create: {
                artifactType: SourceArtifactType.EXTERNAL_SOURCE,
                contentHash,
                sourceKey: `parameter-source:${contentHash}`,
                sourceSystem: SourceSystem.EXTERNAL,
                sourceUrl,
                title: sourceUrl,
              },
              update: {},
            }),
          );
        }
        await tx.parameterRevisionSourceArtifact.createMany({
          data: artifacts.map((artifact, index) => ({
            isPrimary: index === 0,
            parameterRevisionId: revision.id,
            sourceArtifactId: artifact.id,
          })),
          skipDuplicates: true,
        });
      }
      reviews.push({
        assumptions: proposal.assumptions,
        currentValue: definition.currentRevision?.value ?? null,
        delta: definition.currentRevision
          ? proposal.value - definition.currentRevision.value
          : null,
        calculationCode:
          proposal.calculationCode ??
          proposal.calculationSource?.source ??
          null,
        calculationLanguage:
          proposal.calculationLanguage ??
          proposal.calculationSource?.language ??
          null,
        formulaLatex: proposal.formulaLatex ?? null,
        formulaText: proposal.formulaText ?? null,
        inputRevisions: proposalInputs.map((input) => ({
          parameterKey: input.revision.parameter.key,
          revisionId: input.revision.id,
          symbol: input.symbol,
          value: input.revision.value,
        })),
        proposedValue: proposal.value,
        rationale: proposal.rationale,
        revisionId: revision.id,
        sourceContentHash,
        sources: {
          sourceArtifactIds: referencedArtifacts.map((artifact) => artifact.id),
          sourceRef: proposal.sourceRef ?? null,
          sourceUrls: proposal.sourceUrls,
        },
        status: revision.status,
        uncertainty: {
          confidence: proposal.confidence,
          confidenceIntervalHigh: proposal.confidenceIntervalHigh ?? null,
          confidenceIntervalLow: proposal.confidenceIntervalLow ?? null,
          distributionParameters: proposal.distributionParameters ?? null,
          distributionType: proposal.distributionType ?? null,
          stdError: proposal.stdError ?? null,
        },
      });
    }
    return { requiresExplicitPublication: true, reviews };
  };

  return db.$transaction(createProposalBundle, {
    maxWait: 20_000,
    timeout: 120_000,
  });
}

export async function reviewParameterRevision(
  input: { action: "publish" | "reject"; revisionId: string },
  actor: ParameterActor,
  db: PrismaClient = defaultPrisma,
) {
  if (!actor.userId)
    throw new ParameterAuthorizationError("Authentication is required.");
  if (!actor.isAdmin) {
    throw new ParameterAuthorizationError(
      "Only an admin may review parameter revisions.",
    );
  }
  const revision = await db.parameterRevision.findUnique({
    where: { id: input.revisionId },
    include: { parameter: true },
  });
  if (!revision || revision.deletedAt || revision.parameter.deletedAt) {
    throw new Error("Parameter revision not found.");
  }
  if (input.action === "publish") {
    const unpublishedInputs = await db.parameterRevisionInput.findMany({
      where: {
        calculatedRevisionId: revision.id,
        deletedAt: null,
        inputRevision: {
          OR: [
            { deletedAt: { not: null } },
            {
              status: {
                notIn: [
                  ModelRevisionStatus.PUBLISHED,
                  ModelRevisionStatus.SUPERSEDED,
                ],
              },
            },
          ],
        },
      },
      select: { symbol: true },
    });
    if (unpublishedInputs.length > 0) {
      throw new Error(
        `Publish the input revisions first: ${unpublishedInputs
          .map((row) => row.symbol)
          .join(", ")}.`,
      );
    }
  }
  return db.$transaction(async (tx) => {
    const claimed = await tx.parameterRevision.updateMany({
      where: { id: revision.id, status: ModelRevisionStatus.DRAFT },
      data:
        input.action === "reject"
          ? {
              reviewedAt: new Date(),
              reviewedByUserId: actor.userId,
              status: ModelRevisionStatus.REJECTED,
            }
          : {
              publishedAt: new Date(),
              reviewedAt: new Date(),
              reviewedByUserId: actor.userId,
              status: ModelRevisionStatus.PUBLISHED,
            },
    });
    if (claimed.count !== 1)
      throw new Error("Revision is no longer awaiting review.");
    if (input.action === "publish") {
      await tx.parameterRevision.updateMany({
        where: {
          id: { not: revision.id },
          parameterId: revision.parameterId,
          status: ModelRevisionStatus.PUBLISHED,
        },
        data: { status: ModelRevisionStatus.SUPERSEDED },
      });
      await tx.parameterDefinition.update({
        where: { id: revision.parameterId },
        data: { currentRevisionId: revision.id },
      });
    }
    return {
      action: input.action,
      parameterId: revision.parameterId,
      revisionId: revision.id,
    };
  });
}

export async function searchParameters(
  input: { limit?: number; query?: string },
  _actor: ParameterActor,
  db: PrismaClient = defaultPrisma,
) {
  const query = input.query?.trim() ?? "";
  const rows = await db.parameterDefinition.findMany({
    where: {
      deletedAt: null,
      currentRevisionId: { not: null },
      ...(query
        ? {
            AND: [
              {
                OR: [
                  { key: { contains: query, mode: "insensitive" as const } },
                  {
                    currentRevision: {
                      description: {
                        contains: query,
                        mode: "insensitive" as const,
                      },
                    },
                  },
                  {
                    currentRevision: {
                      displayName: {
                        contains: query,
                        mode: "insensitive" as const,
                      },
                    },
                  },
                ],
              },
            ],
          }
        : {}),
    },
    include: { currentRevision: true },
    orderBy: { key: "asc" },
    take: Math.max(1, Math.min(Math.floor(input.limit ?? 20), 100)),
  });
  return rows.map((row) => ({
    confidence: row.currentRevision?.confidence ?? null,
    description: row.currentRevision?.description ?? null,
    displayName: row.currentRevision?.displayName ?? null,
    key: row.key,
    revisionId: row.currentRevisionId,
    sourceType: row.currentRevision?.sourceType ?? null,
    unit: row.currentRevision?.unit ?? null,
    value: row.currentRevision?.value ?? null,
  }));
}

export interface ParameterTraceNode {
  assumptionsJson: unknown;
  calculationCode: string | null;
  calculationLanguage: string | null;
  confidence: string;
  confidenceIntervalHigh: number | null;
  confidenceIntervalLow: number | null;
  conservative: boolean;
  currentRevisionId: string | null;
  description: string;
  displayName: string | null;
  displayValue: string | null;
  formulaLatex: string | null;
  formulaText: string | null;
  id: string;
  inputs: Array<{
    position: number;
    revision: ParameterTraceNode;
    symbol: string;
  }>;
  key: string;
  manualRef: string | null;
  rationale: string | null;
  revision: number;
  sourceArtifacts: Array<{
    artifactType: string;
    contentHash: string | null;
    id: string;
    sourceKey: string;
    sourceRef: string | null;
    sourceSystem: string;
    sourceUrl: string | null;
    title: string | null;
    versionKey: string | null;
  }>;
  sourceContentHash: string;
  sourceRef: string | null;
  sourceType: string;
  stale: boolean;
  status: string;
  unit: string;
  value: number;
}

async function loadParameterTraceNode(
  revisionId: string,
  actor: ParameterActor,
  db: CatalogDb,
  state: {
    cache: Map<string, ParameterTraceNode>;
    depth: number;
    visiting: Set<string>;
  },
): Promise<ParameterTraceNode> {
  const cached = state.cache.get(revisionId);
  if (cached) return cached;
  if (state.depth >= 64) {
    throw new Error("Parameter trace exceeds the maximum depth of 64.");
  }
  if (state.visiting.has(revisionId)) {
    throw new Error(`Parameter revision dependency cycle at ${revisionId}.`);
  }
  state.visiting.add(revisionId);
  const row = await db.parameterRevision.findUnique({
    where: { id: revisionId },
    include: {
      inputs: {
        where: { deletedAt: null },
        orderBy: { position: "asc" },
      },
      parameter: true,
      sourceArtifacts: {
        where: {
          deletedAt: null,
          sourceArtifact: getSourceArtifactVisibilityWhere(actor.userId),
        },
        select: {
          sourceArtifact: {
            select: {
              artifactType: true,
              contentHash: true,
              id: true,
              sourceKey: true,
              sourceRef: true,
              sourceSystem: true,
              sourceUrl: true,
              title: true,
              versionKey: true,
            },
          },
        },
      },
    },
  });
  if (
    !row ||
    row.deletedAt ||
    row.parameter.deletedAt ||
    !canReadParameterRevision(row, actor)
  ) {
    throw new Error("Parameter revision not found.");
  }
  const inputs = [];
  for (const input of row.inputs) {
    inputs.push({
      position: input.position,
      revision: await loadParameterTraceNode(input.inputRevisionId, actor, db, {
        cache: state.cache,
        depth: state.depth + 1,
        visiting: state.visiting,
      }),
      symbol: input.symbol,
    });
  }
  state.visiting.delete(revisionId);
  const trace: ParameterTraceNode = {
    assumptionsJson: row.assumptionsJson,
    calculationCode: row.calculationCode,
    calculationLanguage: row.calculationLanguage,
    confidence: row.confidence,
    confidenceIntervalHigh: row.confidenceIntervalHigh,
    confidenceIntervalLow: row.confidenceIntervalLow,
    conservative: row.conservative,
    currentRevisionId: row.parameter.currentRevisionId,
    description: row.description,
    displayName: row.displayName,
    displayValue: row.displayValue,
    formulaLatex: row.formulaLatex,
    formulaText: row.formulaText,
    id: row.id,
    inputs,
    key: row.parameter.key,
    manualRef: row.manualRef,
    rationale: row.rationale,
    revision: row.revision,
    sourceArtifacts: row.sourceArtifacts.map(({ sourceArtifact }) => ({
      artifactType: sourceArtifact.artifactType,
      contentHash: sourceArtifact.contentHash,
      id: sourceArtifact.id,
      sourceKey: sourceArtifact.sourceKey,
      sourceRef: sourceArtifact.sourceRef,
      sourceSystem: sourceArtifact.sourceSystem,
      sourceUrl: sourceArtifact.sourceUrl,
      title: sourceArtifact.title,
      versionKey: sourceArtifact.versionKey,
    })),
    sourceContentHash: row.sourceContentHash,
    sourceRef: row.sourceRef,
    sourceType: row.sourceType,
    stale:
      (row.parameter.currentRevisionId != null &&
        row.parameter.currentRevisionId !== row.id) ||
      inputs.some((input) => input.revision.stale),
    status: row.status,
    unit: row.unit,
    value: row.value,
  };
  state.cache.set(revisionId, trace);
  return trace;
}

export async function getParameterTrace(
  input: { key?: string; revisionId?: string },
  actor: ParameterActor,
  db: PrismaClient = defaultPrisma,
) {
  const revisionId =
    input.revisionId ??
    (
      await db.parameterDefinition.findUnique({
        where: { key: input.key ?? "" },
        select: { currentRevisionId: true },
      })
    )?.currentRevisionId;
  if (!revisionId) throw new Error("Parameter revision not found.");
  return loadParameterTraceNode(revisionId, actor, db, {
    cache: new Map(),
    depth: 0,
    visiting: new Set(),
  });
}

import { type Prisma } from "@optimitron/db";
import { SourceArtifactType, SourceSystem } from "@optimitron/db/enums";
import { sha256CanonicalJson } from "@optimitron/data/parameters";
import { z } from "zod";

export const CALCULATION_SOURCE_SCHEMA_VERSION = "calculation-source.v1";

export const CalculationSourcePayloadSchema = z
  .object({
    dependencies: z.array(z.string().min(1)).max(1_000).default([]),
    entrypoint: z.string().min(1).nullable().optional(),
    executionPolicy: z.literal("inert").default("inert"),
    inputs: z.array(z.record(z.unknown())).max(1_000).default([]),
    language: z.string().min(1).max(100),
    notes: z.string().max(100_000).nullable().optional(),
    outputs: z.array(z.record(z.unknown())).max(1_000).default([]),
    runtime: z.record(z.unknown()).nullable().optional(),
    schemaVersion: z
      .literal(CALCULATION_SOURCE_SCHEMA_VERSION)
      .default(CALCULATION_SOURCE_SCHEMA_VERSION),
    source: z.string().min(1).max(1_000_000),
  })
  .passthrough();

export function sourceArtifactFingerprint(artifact: {
  artifactType: SourceArtifactType;
  contentHash: string | null;
  sourceKey: string;
  sourceUrl: string | null;
  versionKey: string | null;
}) {
  return {
    artifactType: artifact.artifactType,
    contentHash: artifact.contentHash,
    sourceKey: artifact.sourceKey,
    sourceUrl: artifact.sourceUrl,
    versionKey: artifact.versionKey,
  };
}

interface SourceArtifactContentInput {
  artifactType: SourceArtifactType;
  contentHash: string | null;
  payloadJson?: unknown;
}

export async function prepareSourceArtifactContent(
  input: SourceArtifactContentInput,
) {
  if (
    input.artifactType !== SourceArtifactType.CALCULATION_SOURCE ||
    input.payloadJson == null
  ) {
    return {
      contentHash: input.contentHash,
      payloadJson: input.payloadJson,
    };
  }

  const payloadJson = CalculationSourcePayloadSchema.parse(input.payloadJson);
  const contentHash = await sha256CanonicalJson(payloadJson);
  if (input.contentHash && input.contentHash !== contentHash) {
    throw new Error(
      "The supplied calculation source hash does not match its payload.",
    );
  }

  return { contentHash, payloadJson };
}

export async function storeInlineCalculationSourceArtifact(
  rawPayload: unknown,
  db: Prisma.TransactionClient,
) {
  const prepared = await prepareSourceArtifactContent({
    artifactType: SourceArtifactType.CALCULATION_SOURCE,
    contentHash: null,
    payloadJson: rawPayload,
  });
  if (!prepared.contentHash) {
    throw new Error("Calculation source content hash was not generated.");
  }
  const sourceKey = `calculation-source:${prepared.contentHash}`;
  const artifact = await db.sourceArtifact.upsert({
    where: { sourceKey },
    create: {
      artifactType: SourceArtifactType.CALCULATION_SOURCE,
      contentHash: prepared.contentHash,
      payloadJson: prepared.payloadJson as Prisma.InputJsonValue,
      sourceKey,
      sourceSystem: SourceSystem.PARAMETER_CATALOG,
      title: `Calculation source ${prepared.contentHash.slice(0, 12)}`,
      versionKey: CALCULATION_SOURCE_SCHEMA_VERSION,
    },
    update: { deletedAt: null },
  });
  assertCalculationSourceArtifactIsImmutable(artifact, {
    artifactType: SourceArtifactType.CALCULATION_SOURCE,
    contentHash: prepared.contentHash,
  });
  return artifact;
}

export function assertCalculationSourceArtifactIsImmutable(
  existing: {
    artifactType: SourceArtifactType;
    contentHash: string | null;
  } | null,
  incoming: {
    artifactType: SourceArtifactType;
    contentHash: string | null;
  },
) {
  if (
    !existing ||
    (existing.artifactType !== SourceArtifactType.CALCULATION_SOURCE &&
      incoming.artifactType !== SourceArtifactType.CALCULATION_SOURCE)
  )
    return;
  if (
    existing.artifactType !== SourceArtifactType.CALCULATION_SOURCE ||
    incoming.artifactType !== SourceArtifactType.CALCULATION_SOURCE ||
    !existing.contentHash ||
    existing.contentHash !== incoming.contentHash
  ) {
    throw new Error(
      "Calculation source artifacts are immutable; store changed code under a new sourceKey.",
    );
  }
}

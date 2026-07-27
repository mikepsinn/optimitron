import { createHash } from "node:crypto";
import {
  ReferendumKind,
  ReferendumStatus,
  type Prisma,
  type PrismaClient,
} from "@optimitron/db";
import { sha256CanonicalJson } from "@optimitron/data/parameters";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  DocumentDecisionV1Schema,
  type DocumentDecisionV1,
} from "@/lib/tasks/document-review-contracts";
import {
  canUserManageTask,
  getTaskClientAccessWhere,
  type TaskClientAccessBoundary,
} from "@/lib/tasks/task-visibility.server";

const IdSchema = z.string().trim().min(1).max(300);
const ContentHashSchema = z.string().trim().min(1).max(256);

export const PublishDocumentRevisionAsReferendumInputSchema = z
  .object({
    decisionArtifactId: IdSchema,
    description: z.string().trim().min(1).max(20_000).nullable().optional(),
    jurisdictionId: IdSchema.nullable().optional(),
    kind: z.nativeEnum(ReferendumKind).default(ReferendumKind.GENERAL),
    question: z.string().trim().min(1).max(2_000),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u)
      .max(200),
  })
  .strict();

export const DocumentPublicationV1Schema = z
  .object({
    authorityTaskId: IdSchema,
    decisionArtifact: z
      .object({
        contentHash: ContentHashSchema,
        id: IdSchema,
      })
      .strict(),
    document: z
      .object({
        contentHash: ContentHashSchema,
        documentId: IdSchema,
        revisionId: IdSchema,
        title: z.string().min(1),
        version: z.number().int().positive(),
      })
      .strict(),
    publishedAt: z.string().datetime(),
    publishedByUserId: IdSchema,
    referendum: z
      .object({
        contentHash: ContentHashSchema,
        description: z.string().nullable(),
        id: IdSchema,
        jurisdictionId: z.string().nullable(),
        kind: z.nativeEnum(ReferendumKind),
        lockedAt: z.string().datetime(),
        publishedAt: z.string().datetime(),
        question: z.string().min(1),
        slug: z.string().min(1),
        status: z.literal("ACTIVE"),
        title: z.string().min(1),
      })
      .strict(),
    schema: z.literal("optimitron.document-publication.v1"),
  })
  .strict();

export type DocumentPublicationV1 = z.infer<typeof DocumentPublicationV1Schema>;

type DocumentPublicationDb = Pick<
  PrismaClient,
  "$transaction" | "task" | "taskExecutionArtifact"
>;

interface DocumentPublicationOptions {
  canManageTask?: typeof canUserManageTask;
  clientAccessBoundary?: TaskClientAccessBoundary;
  db?: DocumentPublicationDb;
  now?: Date;
}

function jsonValue(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function nullableTrimmed(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function buildImmutableReferendumContentHash(input: {
  bodyMarkdown: string;
  description: string | null;
  question: string;
}) {
  return createHash("sha256")
    .update(
      JSON.stringify({
        question: input.question.trim(),
        description: nullableTrimmed(input.description),
        bodyMarkdown: nullableTrimmed(input.bodyMarkdown),
      }),
    )
    .digest("hex");
}

function parseDecision(value: unknown): DocumentDecisionV1 {
  const parsed = DocumentDecisionV1Schema.safeParse(value);
  if (!parsed.success) throw new Error("Document decision artifact is invalid");
  return parsed.data;
}

function assertSamePublicationRequest(
  publication: DocumentPublicationV1,
  input: z.infer<typeof PublishDocumentRevisionAsReferendumInputSchema>,
) {
  if (
    publication.decisionArtifact.id !== input.decisionArtifactId ||
    publication.referendum.description !== (input.description ?? null) ||
    (input.jurisdictionId !== undefined &&
      publication.referendum.jurisdictionId !== input.jurisdictionId) ||
    publication.referendum.kind !== input.kind ||
    publication.referendum.question !== input.question ||
    publication.referendum.slug !== input.slug
  ) {
    throw new Error(
      "This document decision was already published with a different ballot snapshot",
    );
  }
}

export async function publishDocumentRevisionAsReferendum(
  rawInput: unknown,
  actorUserId: string,
  options: DocumentPublicationOptions = {},
) {
  const input = PublishDocumentRevisionAsReferendumInputSchema.parse(rawInput);
  const publisherUserId = IdSchema.parse(actorUserId);
  const db = options.db ?? prisma;
  const canManage = options.canManageTask ?? canUserManageTask;
  const now = options.now ?? new Date();
  const publicationArtifactId = `document-publication:${input.decisionArtifactId}`;

  const decisionArtifact = await db.taskExecutionArtifact.findFirst({
    where: { deletedAt: null, id: input.decisionArtifactId },
    select: { structuredResultJson: true },
  });
  if (!decisionArtifact) throw new Error("Document decision not found");
  const initialDecision = parseDecision(decisionArtifact.structuredResultJson);
  if (!(await canManage(initialDecision.authorityTaskId, publisherUserId))) {
    throw new Error("Document decision not found");
  }
  if (options.clientAccessBoundary) {
    const taskWithinClientBoundary = await db.task.findFirst({
      where: {
        deletedAt: null,
        id: initialDecision.authorityTaskId,
        ...getTaskClientAccessWhere(options.clientAccessBoundary),
      },
      select: { id: true },
    });
    if (!taskWithinClientBoundary) {
      throw new Error("Document decision not found");
    }
  }

  return db.$transaction(async (tx) => {
    const existing = await tx.taskExecutionArtifact.findUnique({
      where: { id: publicationArtifactId },
      select: { contentHash: true, id: true, structuredResultJson: true },
    });
    if (existing) {
      const publication = DocumentPublicationV1Schema.parse(
        existing.structuredResultJson,
      );
      const expectedContentHash = await sha256CanonicalJson(publication);
      if (existing.contentHash !== expectedContentHash) {
        throw new Error("Document publication content hash does not match");
      }
      assertSamePublicationRequest(publication, input);
      return {
        contentHash: existing.contentHash,
        created: false,
        publication,
        publicationArtifactId: existing.id,
        referendumId: publication.referendum.id,
      };
    }

    const artifact = await tx.taskExecutionArtifact.findFirst({
      where: { deletedAt: null, id: input.decisionArtifactId },
      select: {
        contentHash: true,
        id: true,
        metadataJson: true,
        structuredResultJson: true,
        submittedByUserId: true,
        taskExecutionAttempt: {
          select: {
            id: true,
            taskId: true,
          },
        },
      },
    });
    if (!artifact) throw new Error("Document decision not found");
    const decision = parseDecision(artifact.structuredResultJson);
    const decisionMetadata = z
      .object({ kind: z.literal("document-decision") })
      .passthrough()
      .safeParse(artifact.metadataJson);
    const decisionContentHash = await sha256CanonicalJson(decision);
    if (
      !decisionMetadata.success ||
      artifact.contentHash !== decisionContentHash ||
      artifact.submittedByUserId !== decision.decidedByUserId ||
      artifact.taskExecutionAttempt.taskId !== decision.authorityTaskId
    ) {
      throw new Error("Document decision artifact is inconsistent");
    }

    const revision = await tx.documentRevision.findFirst({
      where: {
        contentHash: decision.adoptedDocument.contentHash,
        deletedAt: null,
        documentId: decision.adoptedDocument.documentId,
        id: decision.adoptedDocument.revisionId,
        version: decision.adoptedDocument.version,
      },
      select: {
        body: true,
        contentHash: true,
        document: {
          select: {
            jurisdictionId: true,
          },
        },
        documentId: true,
        id: true,
        title: true,
        version: true,
      },
    });
    if (!revision?.contentHash) {
      throw new Error("Adopted document revision was not found");
    }

    const description = input.description ?? null;
    const jurisdictionId =
      input.jurisdictionId ?? revision.document.jurisdictionId;
    const referendumContentHash = buildImmutableReferendumContentHash({
      bodyMarkdown: revision.body,
      description,
      question: input.question,
    });
    const referendum = await tx.referendum.create({
      data: {
        bodyMarkdown: revision.body,
        contentHash: referendumContentHash,
        createdByUserId: publisherUserId,
        description,
        jurisdictionId,
        kind: input.kind,
        lockedAt: now,
        publishedAt: now,
        question: input.question,
        slug: input.slug,
        status: ReferendumStatus.ACTIVE,
        title: revision.title,
      },
      select: {
        contentHash: true,
        description: true,
        id: true,
        jurisdictionId: true,
        kind: true,
        lockedAt: true,
        publishedAt: true,
        question: true,
        slug: true,
        status: true,
        title: true,
      },
    });
    if (
      !referendum.contentHash ||
      !referendum.lockedAt ||
      !referendum.publishedAt
    ) {
      throw new Error("Referendum snapshot was not locked");
    }

    const publication = DocumentPublicationV1Schema.parse({
      authorityTaskId: decision.authorityTaskId,
      decisionArtifact: {
        contentHash: artifact.contentHash,
        id: artifact.id,
      },
      document: {
        contentHash: revision.contentHash,
        documentId: revision.documentId,
        revisionId: revision.id,
        title: revision.title,
        version: revision.version,
      },
      publishedAt: now.toISOString(),
      publishedByUserId: publisherUserId,
      referendum: {
        contentHash: referendum.contentHash,
        description: referendum.description,
        id: referendum.id,
        jurisdictionId: referendum.jurisdictionId,
        kind: referendum.kind,
        lockedAt: referendum.lockedAt.toISOString(),
        publishedAt: referendum.publishedAt.toISOString(),
        question: referendum.question,
        slug: referendum.slug,
        status: "ACTIVE",
        title: referendum.title,
      },
      schema: "optimitron.document-publication.v1",
    });
    const contentHash = await sha256CanonicalJson(publication);
    const publicationArtifact = await tx.taskExecutionArtifact.create({
      data: {
        contentHash,
        id: publicationArtifactId,
        label: "Document referendum publication",
        metadataJson: jsonValue({
          decisionArtifactId: artifact.id,
          documentRevisionId: revision.id,
          referendumId: referendum.id,
          schema: publication.schema,
        }),
        structuredResultJson: jsonValue(publication),
        submittedByUserId: publisherUserId,
        taskExecutionAttemptId: artifact.taskExecutionAttempt.id,
      },
      select: { id: true },
    });

    return {
      contentHash,
      created: true,
      publication,
      publicationArtifactId: publicationArtifact.id,
      referendumId: referendum.id,
    };
  });
}

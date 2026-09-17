import type { Prisma, PrismaClient } from "@optimitron/db";
import {
  CourtCaseItemStatus,
  CourtCasePartyCapacity,
  CourtCasePartyRole,
  CourtCaseStatus,
  ReferendumKind,
  ReferendumStatus,
  SubjectType,
} from "@optimitron/db/enums";
import { createHash } from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";

export type CourtDbClient = PrismaClient;
type DbClient = Prisma.TransactionClient;
import {
  CourtAccessError,
  courtChildVisibility,
  courtSubjectVisibility,
  requireCourtActor,
  requireCourtCase,
  requireCourtSubject,
  requireCourtTask,
  requireCourtReferendum,
  requireCourtChild,
  requirePublicCourtSources,
} from "./court-auth.server";
import type { CourtActor } from "./court-auth.server";
export { CourtAccessError } from "./court-auth.server";
export type { CourtActor } from "./court-auth.server";

const MAX_TITLE_LENGTH = 300;
const MAX_TEXT_LENGTH = 10_000;
const MAX_URL_LENGTH = 2_000;

const optionalTrimmedString = (maxLength = MAX_TEXT_LENGTH) =>
  z
    .unknown()
    .transform((value) => (typeof value === "string" ? value.trim() : ""))
    .transform((value) => (value ? value.slice(0, maxLength) : null));

const requiredTrimmedString = (maxLength = MAX_TEXT_LENGTH) =>
  z
    .unknown()
    .transform((value) => (typeof value === "string" ? value.trim() : ""))
    .refine((value) => value.length > 0, "Required")
    .transform((value) => value.slice(0, maxLength));

const optionalUrl = optionalTrimmedString(MAX_URL_LENGTH).refine(
  (value) => value === null || /^https?:\/\//i.test(value),
  "Use an http(s) URL.",
);

function normalizeReferendumContentText(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function buildReferendumContentHash(input: {
  question: string;
  description?: string | null;
  bodyMarkdown?: string | null;
}) {
  return createHash("sha256")
    .update(
      JSON.stringify({
        question: input.question.trim(),
        description: normalizeReferendumContentText(input.description),
        bodyMarkdown: normalizeReferendumContentText(input.bodyMarkdown),
      }),
    )
    .digest("hex");
}

const optionalDate = z.unknown().transform((value) => {
  if (value instanceof Date) return value;
  if (typeof value !== "string" || !value.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
});

const optionalNumber = z.unknown().transform((value) => {
  if (value == null || value === "") return null;
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : null;
});

const optionalScore = optionalNumber.refine(
  (value) => value === null || (value >= 0 && value <= 1),
  "Score must be between 0 and 1.",
);

const optionalInt = z.unknown().transform((value) => {
  if (value == null || value === "") return 0;
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? Math.trunc(numeric) : 0;
});

function enumInput<T extends Record<string, string>>(
  values: T,
  fallback: T[keyof T],
) {
  return z.unknown().transform((value) => {
    if (
      typeof value === "string" &&
      Object.values(values).includes(value as T[keyof T])
    ) {
      return value as T[keyof T];
    }
    return fallback;
  });
}

function optionalEnumInput<T extends Record<string, string>>(values: T) {
  return z.unknown().transform((value) => {
    if (
      typeof value === "string" &&
      Object.values(values).includes(value as T[keyof T])
    ) {
      return value as T[keyof T];
    }
    return null;
  });
}

function nullishJson(value: unknown): Prisma.InputJsonValue | undefined {
  if (value == null) return undefined;
  return value as Prisma.InputJsonValue;
}

const courtCaseSelect = {
  id: true,
  slug: true,
  title: true,
  summary: true,
  status: true,
  isPublic: true,
  createdByUserId: true,
  nominalPlaintiffSubjectId: true,
  primaryRespondentSubjectId: true,
  beneficiarySubjectId: true,
  rootTaskId: true,
  juryReferendumId: true,
  metadataJson: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
} satisfies Prisma.CourtCaseSelect;

const courtCasePartySelect = {
  id: true,
  caseId: true,
  partyKey: true,
  subjectId: true,
  role: true,
  capacity: true,
  displayNameSnapshot: true,
  standingTheory: true,
  powerToRemedyScore: true,
  blameAttributionScore: true,
  publicAccountabilityScore: true,
  sortOrder: true,
  isPublic: true,
  createdByUserId: true,
  metadataJson: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
} satisfies Prisma.CourtCasePartySelect;

const courtCaseClaimSelect = {
  id: true,
  caseId: true,
  claimKey: true,
  title: true,
  claimType: true,
  argumentMarkdown: true,
  requestedFinding: true,
  status: true,
  juryReferendumId: true,
  sortOrder: true,
  isPublic: true,
  createdByUserId: true,
  metadataJson: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
} satisfies Prisma.CourtCaseClaimSelect;

const courtCaseHarmSelect = {
  id: true,
  caseId: true,
  claimId: true,
  harmKey: true,
  harmType: true,
  title: true,
  bodyMarkdown: true,
  affectedSubjectId: true,
  globalVariableId: true,
  parameterName: true,
  lowValue: true,
  baseValue: true,
  highValue: true,
  unit: true,
  confidenceScore: true,
  sortOrder: true,
  isPublic: true,
  status: true,
  createdByUserId: true,
  metadataJson: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
} satisfies Prisma.CourtCaseHarmSelect;

const courtCaseEvidenceSelect = {
  id: true,
  caseId: true,
  claimId: true,
  harmId: true,
  evidenceKey: true,
  evidenceType: true,
  title: true,
  bodyMarkdown: true,
  sourceArtifactId: true,
  personMemorialId: true,
  globalVariableId: true,
  parameterName: true,
  sourceUrl: true,
  contentHash: true,
  isPublic: true,
  containsSensitiveData: true,
  reviewStatus: true,
  confidenceScore: true,
  sortOrder: true,
  createdByUserId: true,
  metadataJson: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
} satisfies Prisma.CourtCaseEvidenceSelect;

const courtCaseRemedySelect = {
  id: true,
  caseId: true,
  claimId: true,
  targetPartyId: true,
  remedyKey: true,
  remedyType: true,
  title: true,
  bodyMarkdown: true,
  amountUsdLow: true,
  amountUsdBase: true,
  amountUsdHigh: true,
  deadlineAt: true,
  enforcementTaskId: true,
  status: true,
  sortOrder: true,
  isPublic: true,
  createdByUserId: true,
  metadataJson: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
} satisfies Prisma.CourtCaseRemedySelect;

export const upsertCourtCaseInputSchema = z.object({
  beneficiarySubjectId: optionalTrimmedString(200),
  createdByUserId: optionalTrimmedString(200),
  id: optionalTrimmedString(200),
  isPublic: z.boolean().optional().default(false),
  juryReferendumId: optionalTrimmedString(200),
  metadataJson: z.unknown().optional(),
  nominalPlaintiffSubjectId: optionalTrimmedString(200),
  primaryRespondentSubjectId: optionalTrimmedString(200),
  rootTaskId: optionalTrimmedString(200),
  slug: optionalTrimmedString(300),
  status: enumInput(CourtCaseStatus, CourtCaseStatus.DRAFT),
  summary: optionalTrimmedString(MAX_TEXT_LENGTH),
  title: requiredTrimmedString(MAX_TITLE_LENGTH),
});

export type UpsertCourtCaseInput = z.infer<typeof upsertCourtCaseInputSchema>;

export async function upsertCourtCase(
  input: unknown,
  actor: CourtActor,
  db: CourtDbClient = prisma,
) {
  requireCourtActor(actor);
  return db.$transaction(async (db) => {
    const data = upsertCourtCaseInputSchema.parse(input);
    const slug = slugify(data.slug ?? data.title);
    if (!slug) throw new Error("A case needs a usable slug.");
    // Serialize slug creation as well as updates; do not turn a slug collision into an ownership takeover.
    await db.$executeRawUnsafe(
      "SELECT pg_advisory_xact_lock(hashtextextended($1, 0))",
      `court:${slug}`,
    );
    const identity = await db.courtCase.findFirst({
      where: { OR: [{ slug }, ...(data.id ? [{ id: data.id }] : [])] },
      select: { id: true },
    });
    const existing = identity
      ? await requireCourtCase(db, identity.id, actor, true)
      : null;
    if (data.id && (!existing || existing.id !== data.id))
      throw new CourtAccessError(
        "Court case not found or access denied.",
        "NOT_FOUND",
      );
    if (existing && existing.createdByUserId !== actor.userId && !data.isPublic)
      throw new CourtAccessError(
        "A public-case moderator cannot take a case private.",
      );
    for (const id of [
      data.nominalPlaintiffSubjectId,
      data.primaryRespondentSubjectId,
      data.beneficiarySubjectId,
    ])
      await requireCourtSubject(db, id, actor, data.isPublic);
    await requireCourtTask(db, data.rootTaskId, actor, data.isPublic);
    await requireCourtReferendum(
      db,
      data.juryReferendumId,
      actor,
      existing?.id,
      data.isPublic,
    );
    const payload = {
      beneficiarySubjectId: data.beneficiarySubjectId,
      isPublic: data.isPublic,
      juryReferendumId: data.juryReferendumId,
      metadataJson: nullishJson(data.metadataJson),
      nominalPlaintiffSubjectId: data.nominalPlaintiffSubjectId,
      primaryRespondentSubjectId: data.primaryRespondentSubjectId,
      rootTaskId: data.rootTaskId,
      slug,
      status: data.status,
      summary: data.summary,
      title: data.title,
    };
    return existing
      ? db.courtCase.update({
          where: { id: existing.id },
          data: payload,
          select: courtCaseSelect,
        })
      : db.courtCase.create({
          data: { ...payload, createdByUserId: actor.userId },
          select: courtCaseSelect,
        });
  });
}

export const addCourtCasePartyInputSchema = z.object({
  blameAttributionScore: optionalScore,
  capacity: optionalEnumInput(CourtCasePartyCapacity),
  caseId: requiredTrimmedString(200),
  createdByUserId: optionalTrimmedString(200),
  displayNameSnapshot: optionalTrimmedString(300),
  isPublic: z.boolean().optional().default(true),
  metadataJson: z.unknown().optional(),
  partyKey: optionalTrimmedString(300),
  powerToRemedyScore: optionalScore,
  publicAccountabilityScore: optionalScore,
  role: enumInput(CourtCasePartyRole, CourtCasePartyRole.RESPONDENT),
  sortOrder: optionalInt,
  standingTheory: optionalTrimmedString(MAX_TEXT_LENGTH),
  subjectDisplayName: optionalTrimmedString(300),
  subjectExternalId: optionalTrimmedString(300),
  subjectId: optionalTrimmedString(200),
  subjectType: enumInput(SubjectType, SubjectType.COHORT),
});

export type AddCourtCasePartyInput = z.infer<
  typeof addCourtCasePartyInputSchema
>;

async function resolvePartySubject(
  db: DbClient,
  data: AddCourtCasePartyInput,
  actor: CourtActor,
) {
  if (data.subjectId) {
    await requireCourtSubject(db, data.subjectId, actor, data.isPublic);
    return { id: data.subjectId };
  }
  if (!data.subjectExternalId)
    throw new Error(
      "Provide subjectId or subjectExternalId for the court case party.",
    );
  const existing = await db.subject.findUnique({
    where: {
      subjectType_externalId: {
        subjectType: data.subjectType,
        externalId: data.subjectExternalId,
      },
    },
  });
  if (existing) {
    await requireCourtSubject(db, existing.id, actor, data.isPublic);
    return { id: existing.id };
  }
  if (data.subjectType !== SubjectType.COHORT)
    throw new CourtAccessError(
      "Create person, user, organization, or jurisdiction identities through their owning service first.",
    );
  return db.subject.upsert({
    where: {
      subjectType_externalId: {
        subjectType: data.subjectType,
        externalId: data.subjectExternalId,
      },
    },
    update: {},
    create: {
      subjectType: data.subjectType,
      externalId: data.subjectExternalId,
      displayName: data.subjectDisplayName ?? data.subjectExternalId,
    },
    select: { id: true },
  });
}

export async function addCourtCaseParty(
  input: unknown,
  actor: CourtActor,
  db: CourtDbClient = prisma,
) {
  requireCourtActor(actor);
  return db.$transaction(async (db) => {
    const data = {
      ...addCourtCasePartyInputSchema.parse(input),
      createdByUserId: actor.userId,
    };
    await requireCourtCase(db, data.caseId, actor, true);
    const subject = await resolvePartySubject(db, data, actor);
    const existing = await db.courtCaseParty.findUnique({
      where: {
        caseId_role_subjectId: {
          caseId: data.caseId,
          role: data.role,
          subjectId: subject.id,
        },
      },
    });
    if (
      existing &&
      (!existing.isPublic || existing.deletedAt) &&
      existing.createdByUserId !== actor.userId
    )
      throw new CourtAccessError(
        "Private plaintiff records belong to their creator.",
      );
    const payload = {
      blameAttributionScore: data.blameAttributionScore,
      capacity: data.capacity,
      createdByUserId: data.createdByUserId,
      displayNameSnapshot: data.displayNameSnapshot ?? data.subjectDisplayName,
      isPublic: data.isPublic,
      metadataJson: nullishJson(data.metadataJson),
      partyKey: data.partyKey,
      powerToRemedyScore: data.powerToRemedyScore,
      publicAccountabilityScore: data.publicAccountabilityScore,
      role: data.role,
      sortOrder: data.sortOrder,
      standingTheory: data.standingTheory,
      subjectId: subject.id,
    };

    return db.courtCaseParty.upsert({
      where: {
        caseId_role_subjectId: {
          caseId: data.caseId,
          role: data.role,
          subjectId: subject.id,
        },
      },
      update: {
        ...payload,
        createdByUserId: existing?.createdByUserId ?? actor.userId,
      },
      create: {
        ...payload,
        caseId: data.caseId,
      },
      select: courtCasePartySelect,
    });
  });
}

export const addCourtCaseClaimInputSchema = z.object({
  argumentMarkdown: requiredTrimmedString(MAX_TEXT_LENGTH),
  caseId: requiredTrimmedString(200),
  claimKey: optionalTrimmedString(300),
  claimType: optionalTrimmedString(120),
  createdByUserId: optionalTrimmedString(200),
  isPublic: z.boolean().optional().default(true),
  juryReferendumId: optionalTrimmedString(200),
  metadataJson: z.unknown().optional(),
  requestedFinding: optionalTrimmedString(MAX_TEXT_LENGTH),
  sortOrder: optionalInt,
  status: enumInput(CourtCaseItemStatus, CourtCaseItemStatus.PROPOSED),
  title: requiredTrimmedString(MAX_TITLE_LENGTH),
});

export type AddCourtCaseClaimInput = z.infer<
  typeof addCourtCaseClaimInputSchema
>;

export async function addCourtCaseClaim(
  input: unknown,
  actor: CourtActor,
  db: CourtDbClient = prisma,
) {
  requireCourtActor(actor);
  return db.$transaction(async (db) => {
    const data = {
      ...addCourtCaseClaimInputSchema.parse(input),
      createdByUserId: actor.userId,
    };
    await requireCourtCase(db, data.caseId, actor, true);
    await requireCourtReferendum(
      db,
      data.juryReferendumId,
      actor,
      data.caseId,
      data.isPublic,
    );
    return db.courtCaseClaim.create({
      data: {
        argumentMarkdown: data.argumentMarkdown,
        caseId: data.caseId,
        claimKey: data.claimKey,
        claimType: data.claimType,
        createdByUserId: data.createdByUserId,
        isPublic: data.isPublic,
        juryReferendumId: data.juryReferendumId,
        metadataJson: nullishJson(data.metadataJson),
        requestedFinding: data.requestedFinding,
        sortOrder: data.sortOrder,
        status: data.status,
        title: data.title,
      },
      select: courtCaseClaimSelect,
    });
  });
}

export const addCourtCaseHarmInputSchema = z.object({
  affectedSubjectId: optionalTrimmedString(200),
  baseValue: optionalNumber,
  bodyMarkdown: optionalTrimmedString(MAX_TEXT_LENGTH),
  caseId: requiredTrimmedString(200),
  claimId: optionalTrimmedString(200),
  confidenceScore: optionalScore,
  createdByUserId: optionalTrimmedString(200),
  globalVariableId: optionalTrimmedString(200),
  harmKey: optionalTrimmedString(300),
  harmType: optionalTrimmedString(120),
  highValue: optionalNumber,
  isPublic: z.boolean().optional().default(true),
  lowValue: optionalNumber,
  metadataJson: z.unknown().optional(),
  parameterName: optionalTrimmedString(200),
  sortOrder: optionalInt,
  status: enumInput(CourtCaseItemStatus, CourtCaseItemStatus.PROPOSED),
  title: requiredTrimmedString(MAX_TITLE_LENGTH),
  unit: optionalTrimmedString(120),
});

export type AddCourtCaseHarmInput = z.infer<typeof addCourtCaseHarmInputSchema>;

export async function addCourtCaseHarm(
  input: unknown,
  actor: CourtActor,
  db: CourtDbClient = prisma,
) {
  requireCourtActor(actor);
  return db.$transaction(async (db) => {
    const data = {
      ...addCourtCaseHarmInputSchema.parse(input),
      createdByUserId: actor.userId,
    };
    await requireCourtCase(db, data.caseId, actor, true);
    await requireCourtChild(
      db,
      "claim",
      data.claimId,
      data.caseId,
      actor,
      data.isPublic,
    );
    await requireCourtSubject(db, data.affectedSubjectId, actor, data.isPublic);
    await requirePublicCourtSources(db, {
      globalVariableId: data.globalVariableId,
    });
    return db.courtCaseHarm.create({
      data: {
        affectedSubjectId: data.affectedSubjectId,
        baseValue: data.baseValue,
        bodyMarkdown: data.bodyMarkdown,
        caseId: data.caseId,
        claimId: data.claimId,
        confidenceScore: data.confidenceScore,
        createdByUserId: data.createdByUserId,
        globalVariableId: data.globalVariableId,
        harmKey: data.harmKey,
        harmType: data.harmType,
        highValue: data.highValue,
        isPublic: data.isPublic,
        lowValue: data.lowValue,
        metadataJson: nullishJson(data.metadataJson),
        parameterName: data.parameterName,
        sortOrder: data.sortOrder,
        status: data.status,
        title: data.title,
        unit: data.unit,
      },
      select: courtCaseHarmSelect,
    });
  });
}

export const addCourtCaseEvidenceInputSchema = z.object({
  bodyMarkdown: optionalTrimmedString(MAX_TEXT_LENGTH),
  caseId: requiredTrimmedString(200),
  claimId: optionalTrimmedString(200),
  confidenceScore: optionalScore,
  containsSensitiveData: z.boolean().optional().default(false),
  contentHash: optionalTrimmedString(200),
  createdByUserId: optionalTrimmedString(200),
  evidenceKey: optionalTrimmedString(300),
  evidenceType: optionalTrimmedString(120),
  globalVariableId: optionalTrimmedString(200),
  harmId: optionalTrimmedString(200),
  isPublic: z.boolean().optional().default(true),
  metadataJson: z.unknown().optional(),
  parameterName: optionalTrimmedString(200),
  personMemorialId: optionalTrimmedString(200),
  reviewStatus: enumInput(CourtCaseItemStatus, CourtCaseItemStatus.PROPOSED),
  sortOrder: optionalInt,
  sourceArtifactId: optionalTrimmedString(200),
  sourceUrl: optionalUrl,
  title: requiredTrimmedString(MAX_TITLE_LENGTH),
});

export type AddCourtCaseEvidenceInput = z.infer<
  typeof addCourtCaseEvidenceInputSchema
>;

export async function addCourtCaseEvidence(
  input: unknown,
  actor: CourtActor,
  db: CourtDbClient = prisma,
) {
  requireCourtActor(actor);
  return db.$transaction(async (db) => {
    const data = {
      ...addCourtCaseEvidenceInputSchema.parse(input),
      createdByUserId: actor.userId,
    };
    await requireCourtCase(db, data.caseId, actor, true);
    await requireCourtChild(
      db,
      "claim",
      data.claimId,
      data.caseId,
      actor,
      true,
    );
    await requireCourtChild(db, "harm", data.harmId, data.caseId, actor, true);
    if (data.claimId && data.harmId) {
      const harm = await db.courtCaseHarm.findUnique({
        where: { id: data.harmId },
        select: { claimId: true },
      });
      if (harm?.claimId && harm.claimId !== data.claimId)
        throw new CourtAccessError(
          "Evidence claim and harm do not belong together.",
        );
    }
    await requirePublicCourtSources(db, data);
    if (data.containsSensitiveData || !data.isPublic) {
      throw new Error(
        "Court evidence tools only accept public non-sensitive sources",
      );
    }
    if (
      !data.sourceArtifactId &&
      !data.personMemorialId &&
      !data.parameterName &&
      !data.sourceUrl &&
      !data.globalVariableId
    ) {
      throw new Error(
        "Court evidence must reference a source artifact, memorial, parameter, URL, or variable.",
      );
    }

    return db.courtCaseEvidence.create({
      data: {
        bodyMarkdown: data.bodyMarkdown,
        caseId: data.caseId,
        claimId: data.claimId,
        confidenceScore: data.confidenceScore,
        containsSensitiveData: false,
        contentHash: data.contentHash,
        createdByUserId: data.createdByUserId,
        evidenceKey: data.evidenceKey,
        evidenceType: data.evidenceType,
        globalVariableId: data.globalVariableId,
        harmId: data.harmId,
        isPublic: true,
        metadataJson: nullishJson(data.metadataJson),
        parameterName: data.parameterName,
        personMemorialId: data.personMemorialId,
        reviewStatus: data.reviewStatus,
        sortOrder: data.sortOrder,
        sourceArtifactId: data.sourceArtifactId,
        sourceUrl: data.sourceUrl,
        title: data.title,
      },
      select: courtCaseEvidenceSelect,
    });
  });
}

export const addCourtCaseRemedyInputSchema = z.object({
  amountUsdBase: optionalNumber,
  amountUsdHigh: optionalNumber,
  amountUsdLow: optionalNumber,
  bodyMarkdown: requiredTrimmedString(MAX_TEXT_LENGTH),
  caseId: requiredTrimmedString(200),
  claimId: optionalTrimmedString(200),
  createdByUserId: optionalTrimmedString(200),
  deadlineAt: optionalDate,
  enforcementTaskId: optionalTrimmedString(200),
  isPublic: z.boolean().optional().default(true),
  metadataJson: z.unknown().optional(),
  remedyKey: optionalTrimmedString(300),
  remedyType: optionalTrimmedString(120),
  sortOrder: optionalInt,
  status: enumInput(CourtCaseItemStatus, CourtCaseItemStatus.PROPOSED),
  targetPartyId: optionalTrimmedString(200),
  title: requiredTrimmedString(MAX_TITLE_LENGTH),
});

export type AddCourtCaseRemedyInput = z.infer<
  typeof addCourtCaseRemedyInputSchema
>;

export async function addCourtCaseRemedy(
  input: unknown,
  actor: CourtActor,
  db: CourtDbClient = prisma,
) {
  requireCourtActor(actor);
  return db.$transaction(async (db) => {
    const data = {
      ...addCourtCaseRemedyInputSchema.parse(input),
      createdByUserId: actor.userId,
    };
    await requireCourtCase(db, data.caseId, actor, true);
    await requireCourtChild(
      db,
      "claim",
      data.claimId,
      data.caseId,
      actor,
      data.isPublic,
    );
    await requireCourtChild(
      db,
      "party",
      data.targetPartyId,
      data.caseId,
      actor,
      data.isPublic,
    );
    await requireCourtTask(db, data.enforcementTaskId, actor, data.isPublic);
    return db.courtCaseRemedy.create({
      data: {
        amountUsdBase: data.amountUsdBase,
        amountUsdHigh: data.amountUsdHigh,
        amountUsdLow: data.amountUsdLow,
        bodyMarkdown: data.bodyMarkdown,
        caseId: data.caseId,
        claimId: data.claimId,
        createdByUserId: data.createdByUserId,
        deadlineAt: data.deadlineAt,
        enforcementTaskId: data.enforcementTaskId,
        isPublic: data.isPublic,
        metadataJson: nullishJson(data.metadataJson),
        remedyKey: data.remedyKey,
        remedyType: data.remedyType,
        sortOrder: data.sortOrder,
        status: data.status,
        targetPartyId: data.targetPartyId,
        title: data.title,
      },
      select: courtCaseRemedySelect,
    });
  });
}

export const getCourtCaseInputSchema = z.object({
  caseIdOrSlug: optionalTrimmedString(300),
  id: optionalTrimmedString(200),
  slug: optionalTrimmedString(300),
});

export type GetCourtCaseInput = z.infer<typeof getCourtCaseInputSchema>;

export async function getCourtCase(
  input: unknown,
  actor: CourtActor,
  db: CourtDbClient = prisma,
) {
  requireCourtActor(actor);
  return db.$transaction(async (db) => {
    const data = getCourtCaseInputSchema.parse(input);
    const lookup = data.caseIdOrSlug ?? data.id ?? data.slug;
    if (!lookup) throw new Error("Provide caseIdOrSlug, id, or slug.");

    await requireCourtCase(db, lookup, actor);
    const visible = courtChildVisibility(actor);
    const courtCase = await db.courtCase.findFirst({
      where: {
        deletedAt: null,
        OR: [{ id: lookup }, { slug: lookup }],
        AND: [{ OR: [{ isPublic: true }, { createdByUserId: actor.userId }] }],
      },
      select: {
        ...courtCaseSelect,
        juryReferendum: {
          select: {
            id: true,
            slug: true,
            title: true,
            status: true,
            publishedAt: true,
            createdByUserId: true,
            deletedAt: true,
          },
        },
        parties: {
          where: { ...visible, subject: courtSubjectVisibility(actor) },
          orderBy: [
            { role: "asc" },
            { sortOrder: "asc" },
            { createdAt: "asc" },
          ],
          select: {
            ...courtCasePartySelect,
            subject: {
              select: {
                id: true,
                subjectType: true,
                externalId: true,
                displayName: true,
                personId: true,
                organizationId: true,
                jurisdictionId: true,
              },
            },
          },
        },
        claims: {
          where: visible,
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          select: courtCaseClaimSelect,
        },
        harms: {
          where: visible,
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          select: courtCaseHarmSelect,
        },
        evidence: {
          where: visible,
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          select: courtCaseEvidenceSelect,
        },
        remedies: {
          where: visible,
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          select: courtCaseRemedySelect,
        },
      },
    });

    if (!courtCase) throw new Error(`Court case not found: ${lookup}`);
    if (
      courtCase.juryReferendum &&
      (courtCase.juryReferendum.deletedAt ||
        (!courtCase.juryReferendum.publishedAt &&
          courtCase.juryReferendum.createdByUserId !== actor.userId))
    ) {
      courtCase.juryReferendum = null;
      courtCase.juryReferendumId = null;
    }
    for (const claim of courtCase.claims) {
      if (
        claim.juryReferendumId &&
        !(await db.referendum.findFirst({
          where: {
            id: claim.juryReferendumId,
            deletedAt: null,
            OR: [
              { publishedAt: { not: null } },
              { createdByUserId: actor.userId },
            ],
          },
          select: { id: true },
        }))
      )
        claim.juryReferendumId = null;
    }
    const claimIds = new Set(courtCase.claims.map((row) => row.id));
    const partyIds = new Set(courtCase.parties.map((row) => row.id));
    courtCase.harms = courtCase.harms.filter(
      (row) => !row.claimId || claimIds.has(row.claimId),
    );
    const harmIds = new Set(courtCase.harms.map((row) => row.id));
    courtCase.evidence = courtCase.evidence.filter(
      (row) =>
        (!row.claimId || claimIds.has(row.claimId)) &&
        (!row.harmId || harmIds.has(row.harmId)),
    );
    courtCase.remedies = courtCase.remedies.filter(
      (row) =>
        (!row.claimId || claimIds.has(row.claimId)) &&
        (!row.targetPartyId || partyIds.has(row.targetPartyId)),
    );
    // Reference visibility can change after a public child was authored. Do not leak now-private identities or sources.
    for (const key of [
      "nominalPlaintiffSubjectId",
      "primaryRespondentSubjectId",
      "beneficiarySubjectId",
    ] as const) {
      if (
        courtCase[key] &&
        !(await db.subject.findFirst({
          where: { id: courtCase[key]!, ...courtSubjectVisibility(actor) },
          select: { id: true },
        }))
      )
        courtCase[key] = null;
    }
    const safeHarms = [];
    for (const harm of courtCase.harms) {
      try {
        await requireCourtSubject(db, harm.affectedSubjectId, actor);
        safeHarms.push(harm);
      } catch (error) {
        if (!(error instanceof CourtAccessError)) throw error;
      }
    }
    courtCase.harms = safeHarms;
    const safeEvidence = [];
    for (const evidence of courtCase.evidence) {
      try {
        await requirePublicCourtSources(db, evidence);
        if (
          !evidence.containsSensitiveData &&
          (!evidence.harmId ||
            courtCase.harms.some((harm) => harm.id === evidence.harmId))
        )
          safeEvidence.push(evidence);
      } catch (error) {
        if (!(error instanceof CourtAccessError)) throw error;
      }
    }
    courtCase.evidence = safeEvidence;
    try {
      await requireCourtTask(db, courtCase.rootTaskId, actor);
    } catch (error) {
      if (!(error instanceof CourtAccessError)) throw error;
      courtCase.rootTaskId = null;
    }
    const safeRemedies = [];
    for (const remedy of courtCase.remedies) {
      try {
        await requireCourtTask(db, remedy.enforcementTaskId, actor);
        safeRemedies.push(remedy);
      } catch (error) {
        if (!(error instanceof CourtAccessError)) throw error;
      }
    }
    courtCase.remedies = safeRemedies;
    const juryReferendum = courtCase.juryReferendum
      ? {
          id: courtCase.juryReferendum.id,
          slug: courtCase.juryReferendum.slug,
          title: courtCase.juryReferendum.title,
          status: courtCase.juryReferendum.status,
        }
      : null;
    return { ...courtCase, juryReferendum };
  });
}

export const openCourtCaseJuryVoteInputSchema = z.object({
  caseIdOrSlug: requiredTrimmedString(300),
  claimId: optionalTrimmedString(200),
  createdByUserId: optionalTrimmedString(200),
  questionKey: optionalTrimmedString(120),
  questionTitle: optionalTrimmedString(MAX_TITLE_LENGTH),
});

export type OpenCourtCaseJuryVoteInput = z.infer<
  typeof openCourtCaseJuryVoteInputSchema
>;

export async function openCourtCaseJuryVote(
  input: unknown,
  actor: CourtActor,
  db: CourtDbClient = prisma,
) {
  requireCourtActor(actor);
  return db.$transaction(async (db) => {
    const data = openCourtCaseJuryVoteInputSchema.parse(input);
    const courtCase = await requireCourtCase(
      db,
      data.caseIdOrSlug,
      actor,
      true,
    );
    if (!courtCase.isPublic)
      throw new CourtAccessError(
        "Publish the case before opening its public jury vote.",
      );
    await requireCourtChild(
      db,
      "claim",
      data.claimId,
      courtCase.id,
      actor,
      true,
    );
    const questionKey = data.questionKey ?? "verdict";
    const referendumSlug = slugify(`court-${courtCase.slug}-${questionKey}`);
    const question =
      data.questionTitle ??
      `Should humanity find for the plaintiffs in ${courtCase.title}?`;
    const description = `Court of Humanity jury vote for ${courtCase.title}.`;
    const contentHash = buildReferendumContentHash({ question, description });
    const existing = await db.referendum.findUnique({
      where: { slug: referendumSlug },
      include: { _count: { select: { votes: true } } },
    });
    if (existing) {
      await requireCourtReferendum(db, existing.id, actor, courtCase.id);
      if (existing.status === ReferendumStatus.CLOSED)
        throw new CourtAccessError(
          "A closed jury vote cannot be reopened by replaying this tool.",
        );
      if (
        (existing.lockedAt || existing._count.votes > 0) &&
        existing.contentHash !== contentHash
      )
        throw new CourtAccessError(
          "A locked or voted-on jury question cannot be changed.",
        );
    }
    const referendum = await db.referendum.upsert({
      where: { slug: referendumSlug },
      update: {
        title: question,
        contentHash,
        description,
        question,
        status: ReferendumStatus.ACTIVE,
        publishedAt: existing?.publishedAt ?? new Date(),
      },
      create: {
        contentHash,
        createdByUserId: actor.userId,
        description,
        kind: ReferendumKind.COURT_CASE,
        lockedAt: null,
        publishedAt: new Date(),
        question,
        slug: referendumSlug,
        status: ReferendumStatus.ACTIVE,
        title: question,
      },
      select: {
        id: true,
        slug: true,
        title: true,
        status: true,
        question: true,
        kind: true,
        description: true,
      },
    });
    if (data.claimId)
      await db.courtCaseClaim.update({
        where: { id: data.claimId },
        data: { juryReferendumId: referendum.id },
      });
    const updatedCase = await db.courtCase.update({
      where: { id: courtCase.id },
      data: { juryReferendumId: referendum.id, status: CourtCaseStatus.VOTING },
      select: courtCaseSelect,
    });
    return { case: updatedCase, referendum };
  });
}

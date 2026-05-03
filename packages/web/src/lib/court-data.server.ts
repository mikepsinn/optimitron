import type { Prisma } from "@optimitron/db";
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
import { prisma } from "./prisma";
import { slugify } from "./slugify";

type DbClient = Prisma.TransactionClient | typeof prisma;

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

function enumInput<T extends Record<string, string>>(values: T, fallback: T[keyof T]) {
  return z.unknown().transform((value) => {
    if (typeof value === "string" && Object.values(values).includes(value as T[keyof T])) {
      return value as T[keyof T];
    }
    return fallback;
  });
}

function optionalEnumInput<T extends Record<string, string>>(values: T) {
  return z.unknown().transform((value) => {
    if (typeof value === "string" && Object.values(values).includes(value as T[keyof T])) {
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

export async function upsertCourtCase(input: unknown, db: DbClient = prisma) {
  const data = upsertCourtCaseInputSchema.parse(input);
  const slug = slugify(data.slug ?? data.title);
  const payload = {
    beneficiarySubjectId: data.beneficiarySubjectId,
    createdByUserId: data.createdByUserId,
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

  const existing =
    data.id || data.slug
      ? await db.courtCase.findFirst({
          where: {
            deletedAt: null,
            OR: [
              ...(data.id ? [{ id: data.id }] : []),
              ...(data.slug ? [{ slug }] : []),
            ],
          },
          select: { id: true },
        })
      : null;

  if (existing) {
    return db.courtCase.update({
      where: { id: existing.id },
      data: payload,
      select: courtCaseSelect,
    });
  }

  return db.courtCase.create({
    data: payload,
    select: courtCaseSelect,
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

export type AddCourtCasePartyInput = z.infer<typeof addCourtCasePartyInputSchema>;

async function resolvePartySubject(
  db: DbClient,
  data: Pick<
    AddCourtCasePartyInput,
    "subjectDisplayName" | "subjectExternalId" | "subjectId" | "subjectType"
  >,
) {
  if (data.subjectId) return { id: data.subjectId };
  if (!data.subjectExternalId) {
    throw new Error("Provide subjectId or subjectExternalId for the court case party.");
  }

  const displayName = data.subjectDisplayName ?? data.subjectExternalId;
  return db.subject.upsert({
    where: {
      subjectType_externalId: {
        externalId: data.subjectExternalId,
        subjectType: data.subjectType,
      },
    },
    update: { displayName },
    create: {
      displayName,
      externalId: data.subjectExternalId,
      subjectType: data.subjectType,
    },
    select: { id: true },
  });
}

export async function addCourtCaseParty(input: unknown, db: DbClient = prisma) {
  const data = addCourtCasePartyInputSchema.parse(input);
  const subject = await resolvePartySubject(db, data);
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
    update: payload,
    create: {
      ...payload,
      caseId: data.caseId,
    },
    select: courtCasePartySelect,
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

export type AddCourtCaseClaimInput = z.infer<typeof addCourtCaseClaimInputSchema>;

export async function addCourtCaseClaim(input: unknown, db: DbClient = prisma) {
  const data = addCourtCaseClaimInputSchema.parse(input);
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

export async function addCourtCaseHarm(input: unknown, db: DbClient = prisma) {
  const data = addCourtCaseHarmInputSchema.parse(input);
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

export type AddCourtCaseEvidenceInput = z.infer<typeof addCourtCaseEvidenceInputSchema>;

export async function addCourtCaseEvidence(input: unknown, db: DbClient = prisma) {
  const data = addCourtCaseEvidenceInputSchema.parse(input);
  if (data.containsSensitiveData || !data.isPublic) {
    throw new Error("Court evidence tools only accept public non-sensitive sources");
  }
  if (
    !data.sourceArtifactId &&
    !data.personMemorialId &&
    !data.parameterName &&
    !data.sourceUrl &&
    !data.globalVariableId
  ) {
    throw new Error("Court evidence must reference a source artifact, memorial, parameter, URL, or variable.");
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

export type AddCourtCaseRemedyInput = z.infer<typeof addCourtCaseRemedyInputSchema>;

export async function addCourtCaseRemedy(input: unknown, db: DbClient = prisma) {
  const data = addCourtCaseRemedyInputSchema.parse(input);
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
}

export const getCourtCaseInputSchema = z.object({
  caseIdOrSlug: optionalTrimmedString(300),
  id: optionalTrimmedString(200),
  slug: optionalTrimmedString(300),
});

export type GetCourtCaseInput = z.infer<typeof getCourtCaseInputSchema>;

export async function getCourtCase(input: unknown, db: DbClient = prisma) {
  const data = getCourtCaseInputSchema.parse(input);
  const lookup = data.caseIdOrSlug ?? data.id ?? data.slug;
  if (!lookup) throw new Error("Provide caseIdOrSlug, id, or slug.");

  const courtCase = await db.courtCase.findFirst({
    where: {
      deletedAt: null,
      OR: [{ id: lookup }, { slug: lookup }],
    },
    select: {
      ...courtCaseSelect,
      juryReferendum: {
        select: {
          id: true,
          slug: true,
          title: true,
          status: true,
        },
      },
      parties: {
        where: { deletedAt: null },
        orderBy: [{ role: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
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
        where: { deletedAt: null },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: courtCaseClaimSelect,
      },
      harms: {
        where: { deletedAt: null },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: courtCaseHarmSelect,
      },
      evidence: {
        where: { deletedAt: null },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: courtCaseEvidenceSelect,
      },
      remedies: {
        where: { deletedAt: null },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: courtCaseRemedySelect,
      },
    },
  });

  if (!courtCase) throw new Error(`Court case not found: ${lookup}`);
  return courtCase;
}

export const openCourtCaseJuryVoteInputSchema = z.object({
  caseIdOrSlug: requiredTrimmedString(300),
  claimId: optionalTrimmedString(200),
  createdByUserId: optionalTrimmedString(200),
  questionKey: optionalTrimmedString(120),
  questionTitle: optionalTrimmedString(MAX_TITLE_LENGTH),
});

export type OpenCourtCaseJuryVoteInput = z.infer<typeof openCourtCaseJuryVoteInputSchema>;

export async function openCourtCaseJuryVote(input: unknown, db: DbClient = prisma) {
  const data = openCourtCaseJuryVoteInputSchema.parse(input);
  const courtCase = await db.courtCase.findFirst({
    where: {
      deletedAt: null,
      OR: [{ id: data.caseIdOrSlug }, { slug: data.caseIdOrSlug }],
    },
    select: {
      id: true,
      slug: true,
      title: true,
    },
  });
  if (!courtCase) throw new Error(`Court case not found: ${data.caseIdOrSlug}`);

  const questionKey = data.questionKey ?? "verdict";
  const referendumSlug = slugify(`court-${courtCase.slug}-${questionKey}`);
  const question = data.questionTitle ?? `Should humanity find for the plaintiffs in ${courtCase.title}?`;
  const title = question;
  const description = `Court of Humanity jury vote for ${courtCase.title}.`;
  const contentHash = buildReferendumContentHash({ question, description });

  const referendum = await db.referendum.upsert({
    where: { slug: referendumSlug },
    update: {
      contentHash,
      description,
      kind: ReferendumKind.COURT_CASE,
      question,
      status: ReferendumStatus.ACTIVE,
    },
    create: {
      contentHash,
      createdByUserId: data.createdByUserId,
      description,
      kind: ReferendumKind.COURT_CASE,
      lockedAt: null,
      publishedAt: new Date(),
      question,
      slug: referendumSlug,
      status: ReferendumStatus.ACTIVE,
      title,
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

  if (data.claimId) {
    await db.courtCaseClaim.update({
      where: { id: data.claimId },
      data: { juryReferendumId: referendum.id },
      select: { id: true },
    });
  }

  const updatedCase = await db.courtCase.update({
    where: { id: courtCase.id },
    data: {
      juryReferendumId: referendum.id,
      status: CourtCaseStatus.VOTING,
    },
    select: courtCaseSelect,
  });

  return { case: updatedCase, referendum };
}

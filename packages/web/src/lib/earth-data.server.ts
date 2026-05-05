import {
  CombinationOperation,
  ContentReportStatus,
  EfficacyLagEvidenceStatus,
  FillingType,
  InterventionExperienceStatus,
  InterventionOutcomeRating,
  InterventionSideEffectSeverity,
  OrgStatus,
  OrgType,
  OrganizationReferendumPositionStatus,
  PersonCivilianStatus,
  PersonConditionStatus,
  PersonDeathCauseCategory,
  PersonLifeStatus,
  PersonMemorialEvidenceKind,
  ReferendumStatus,
  ReferendumVoteSource,
  SourceArtifactType,
  SourceSystem,
  Valence,
  VariableEvidenceMetricKind,
  VariableRelationshipEvidenceSourceType,
  VotePosition,
  type Prisma,
} from "@optimitron/db";
import { z } from "zod";
import { TREATY_REFERENDUM_SLUG } from "@/lib/treaty";
import { findCanonicalConditionGlobalVariable } from "./global-variable-lookup.server";
import {
  canManageOrganization,
  createOrganizationWithOwner,
  findOrCreateOrganization,
} from "./organization.server";
import {
  ensurePersonForUser,
  findOrCreatePerson,
  mergeDuplicatePerson,
} from "./person.server";
import { prisma } from "./prisma";
import { slugify } from "./slugify";
import { ensureSubjectForPerson, ensureSubjectForUser } from "./subject.server";

type DbClient = Prisma.TransactionClient | typeof prisma;

const MAX_NAME_LENGTH = 160;
const MAX_TEXT_LENGTH = 2_000;
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

const optionalDate = z
  .unknown()
  .transform((value) => {
    if (value instanceof Date) return value;
    if (typeof value !== "string" || !value.trim()) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  });

const optionalCountryCode = z
  .unknown()
  .transform((value) => (typeof value === "string" ? value.trim().toUpperCase() : ""))
  .transform((value) => (value ? value : null))
  .refine((value) => value === null || /^[A-Z]{2}$/.test(value), {
    message: "Use a two-letter country code.",
  });

function enumInput<T extends Record<string, string>>(values: T, fallback: T[keyof T]) {
  return z.unknown().transform((value) => {
    if (typeof value === "string" && Object.values(values).includes(value as T[keyof T])) {
      return value as T[keyof T];
    }
    return fallback;
  });
}

function nullishJson(value: unknown): Prisma.InputJsonValue | undefined {
  if (value == null) return undefined;
  return value as Prisma.InputJsonValue;
}

function daysBetween(start: Date | null | undefined, end: Date | null | undefined) {
  if (!start || !end) return null;
  return Math.round((end.getTime() - start.getTime()) / 86_400_000);
}

function normalizeSourceKey(input: {
  sourceKey?: string | null;
  sourceRef?: string | null;
  sourceUrl?: string | null;
}) {
  const explicit = input.sourceKey?.trim() || input.sourceRef?.trim();
  if (explicit) return explicit;
  if (input.sourceUrl?.trim()) return `url:${input.sourceUrl.trim()}`;
  return null;
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  );
}

export const sourceArtifactInputSchema = z.object({
  artifactType: enumInput(SourceArtifactType, SourceArtifactType.EXTERNAL_SOURCE),
  contentHash: optionalTrimmedString(128),
  externalKey: optionalTrimmedString(300),
  payloadJson: z.unknown().optional(),
  sourceKey: requiredTrimmedString(500),
  sourceRef: optionalTrimmedString(500),
  sourceSystem: enumInput(SourceSystem, SourceSystem.EXTERNAL),
  sourceUrl: optionalUrl,
  title: optionalTrimmedString(500),
  versionKey: optionalTrimmedString(300),
});

export type SourceArtifactInput = z.infer<typeof sourceArtifactInputSchema>;

export async function upsertSourceArtifact(input: unknown, db: DbClient = prisma) {
  const data = sourceArtifactInputSchema.parse(input);
  return db.sourceArtifact.upsert({
    where: { sourceKey: data.sourceKey },
    update: {
      artifactType: data.artifactType,
      contentHash: data.contentHash,
      externalKey: data.externalKey,
      payloadJson: nullishJson(data.payloadJson),
      sourceRef: data.sourceRef,
      sourceSystem: data.sourceSystem,
      sourceUrl: data.sourceUrl,
      title: data.title,
      versionKey: data.versionKey,
      deletedAt: null,
    },
    create: {
      artifactType: data.artifactType,
      contentHash: data.contentHash,
      externalKey: data.externalKey,
      payloadJson: nullishJson(data.payloadJson),
      sourceKey: data.sourceKey,
      sourceRef: data.sourceRef,
      sourceSystem: data.sourceSystem,
      sourceUrl: data.sourceUrl,
      title: data.title,
      versionKey: data.versionKey,
    },
  });
}

export const resolveGlobalVariableInputSchema = z.object({
  code: optionalTrimmedString(120),
  codeSystem: optionalTrimmedString(80),
  description: optionalTrimmedString(MAX_TEXT_LENGTH),
  kind: z
    .enum(["condition", "intervention", "outcome", "side_effect", "policy", "other"])
    .default("other"),
  name: requiredTrimmedString(MAX_NAME_LENGTH),
  sourceArtifactId: optionalTrimmedString(200),
  sourceUrl: optionalUrl,
  variableCategoryName: optionalTrimmedString(120),
});

export type ResolveGlobalVariableInput = z.infer<typeof resolveGlobalVariableInputSchema>;

async function getVariableDefaults(
  db: DbClient,
  input: Pick<ResolveGlobalVariableInput, "kind" | "variableCategoryName">,
) {
  const categoryName =
    input.variableCategoryName ??
    (input.kind === "intervention" || input.kind === "policy"
      ? "Treatment"
      : input.kind === "condition"
        ? "Condition"
        : input.kind === "side_effect"
          ? "Symptom"
          : "Symptom");

  const category = await db.variableCategory.findFirst({
    where: { name: categoryName, deletedAt: null },
    select: {
      combinationOperation: true,
      defaultUnitId: true,
      durationOfAction: true,
      id: true,
      onsetDelay: true,
      outcome: true,
      predictorOnly: true,
    },
  });

  if (!category?.defaultUnitId) {
    throw new Error(`Variable category is not seeded or has no default unit: ${categoryName}`);
  }

  return { ...category, defaultUnitId: category.defaultUnitId };
}

export async function resolveGlobalVariable(
  input: unknown,
  db: DbClient = prisma,
) {
  const data = resolveGlobalVariableInputSchema.parse(input);
  const existingByCode =
    data.code && data.codeSystem
      ? await db.globalVariableExternalCode.findFirst({
          where: {
            code: data.code,
            codeSystem: data.codeSystem,
            deletedAt: null,
            globalVariable: { deletedAt: null },
          },
          select: { globalVariable: true },
        })
      : null;
  if (existingByCode?.globalVariable) return existingByCode.globalVariable;

  const existingByName = await db.globalVariable.findUnique({
    where: { name: data.name },
  });
  if (existingByName && existingByName.deletedAt == null) {
    if (data.code && data.codeSystem) {
      await db.globalVariableExternalCode.upsert({
        where: {
          globalVariableId_codeSystem_code: {
            code: data.code,
            codeSystem: data.codeSystem,
            globalVariableId: existingByName.id,
          },
        },
        update: {
          displayName: data.name,
          sourceArtifactId: data.sourceArtifactId,
          deletedAt: null,
        },
        create: {
          code: data.code,
          codeSystem: data.codeSystem,
          displayName: data.name,
          globalVariableId: existingByName.id,
          sourceArtifactId: data.sourceArtifactId,
        },
      });
    }
    return existingByName;
  }

  const defaults = await getVariableDefaults(db, data);
  const variable = await db.globalVariable.create({
    data: {
      combinationOperation: defaults.combinationOperation ?? CombinationOperation.MEAN,
      defaultUnitId: defaults.defaultUnitId,
      description: data.description,
      durationOfAction: defaults.durationOfAction,
      fillingType: FillingType.NONE,
      name: data.name,
      onsetDelay: defaults.onsetDelay,
      outcome: data.kind === "intervention" || data.kind === "policy" ? false : defaults.outcome,
      predictorOnly:
        data.kind === "intervention" || data.kind === "policy" ? true : defaults.predictorOnly,
      informationalUrl: data.sourceUrl,
      valence:
        data.kind === "side_effect" || data.kind === "condition"
          ? Valence.NEGATIVE
          : Valence.NEUTRAL,
      variableCategoryId: defaults.id,
    },
  });

  if (data.code && data.codeSystem) {
    await db.globalVariableExternalCode.create({
      data: {
        code: data.code,
        codeSystem: data.codeSystem,
        displayName: data.name,
        globalVariableId: variable.id,
        sourceArtifactId: data.sourceArtifactId,
      },
    });
  }

  return variable;
}

export const upsertConflictInputSchema = z.object({
  description: optionalTrimmedString(MAX_TEXT_LENGTH),
  endDate: optionalDate,
  name: requiredTrimmedString(MAX_NAME_LENGTH),
  primaryJurisdictionId: optionalTrimmedString(200),
  slug: optionalTrimmedString(160),
  sourceUrl: optionalUrl,
  startDate: optionalDate,
});

export type UpsertConflictInput = z.infer<typeof upsertConflictInputSchema>;

export async function upsertConflict(input: unknown, db: DbClient = prisma) {
  const data = upsertConflictInputSchema.parse(input);
  const slug = data.slug ?? slugify(data.name);
  if (!slug) throw new Error("Conflict slug is required");

  return db.conflict.upsert({
    where: { slug },
    update: {
      description: data.description,
      endDate: data.endDate,
      name: data.name,
      primaryJurisdictionId: data.primaryJurisdictionId,
      sourceUrl: data.sourceUrl,
      startDate: data.startDate,
      deletedAt: null,
    },
    create: {
      description: data.description,
      endDate: data.endDate,
      name: data.name,
      primaryJurisdictionId: data.primaryJurisdictionId,
      slug,
      sourceUrl: data.sourceUrl,
      startDate: data.startDate,
    },
  });
}

export const upsertMemorialPersonInputSchema = z
  .object({
    birthDate: optionalDate,
    causeCategory: enumInput(PersonDeathCauseCategory, PersonDeathCauseCategory.UNKNOWN),
    civilianStatus: enumInput(PersonCivilianStatus, PersonCivilianStatus.UNKNOWN),
    conditionCode: optionalTrimmedString(80),
    conditionCodeSystem: optionalTrimmedString(80),
    conditionName: optionalTrimmedString(MAX_NAME_LENGTH),
    conflictId: optionalTrimmedString(200),
    conflictName: optionalTrimmedString(MAX_NAME_LENGTH),
    consentCourtEvidence: z.unknown().transform((value) => value === true),
    dateOfDeath: optionalDate,
    deathCountryCode: optionalCountryCode,
    deathLocation: optionalTrimmedString(MAX_NAME_LENGTH),
    displayName: requiredTrimmedString(MAX_NAME_LENGTH),
    imageUrl: optionalTrimmedString(MAX_URL_LENGTH),
    isPublic: z.unknown().transform((value) => value !== false),
    lifeStatus: enumInput(PersonLifeStatus, PersonLifeStatus.DECEASED),
    memorialMessage: optionalTrimmedString(500),
    publicComment: optionalTrimmedString(500),
    recordTreatyVote: z.unknown().transform((value) => value === true),
    referendumSlug: optionalTrimmedString(200),
    relationshipType: optionalTrimmedString(80),
    responsiblePartyName: optionalTrimmedString(MAX_NAME_LENGTH),
    sourceArtifactId: optionalTrimmedString(200),
    sourceKey: optionalTrimmedString(500),
    sourceKind: z.enum(["PERSONAL_TESTIMONY", "PUBLIC_IMPORT"]).default("PERSONAL_TESTIMONY"),
    sourceRef: optionalTrimmedString(500),
    sourceUrl: optionalUrl,
    submittedByUserId: optionalTrimmedString(200),
    wasChild: z.unknown().transform((value) =>
      typeof value === "boolean" ? value : null,
    ),
  })
  .superRefine((data, ctx) => {
    if (data.birthDate && data.dateOfDeath && data.birthDate > data.dateOfDeath) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Birth date must be before death date.",
        path: ["birthDate"],
      });
    }
    if (data.lifeStatus === PersonLifeStatus.DECEASED && !data.dateOfDeath) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "dateOfDeath is required for deceased-person memorials.",
        path: ["dateOfDeath"],
      });
    }
    if (data.lifeStatus === PersonLifeStatus.DECEASED && !data.deathCountryCode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "deathCountryCode is required for deceased-person memorials.",
        path: ["deathCountryCode"],
      });
    }
    if (data.sourceKind === "PUBLIC_IMPORT" && !data.sourceArtifactId && !data.sourceUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Agent/imported casualty records require sourceUrl or sourceArtifactId.",
        path: ["sourceUrl"],
      });
    }
    if (data.sourceKind === "PUBLIC_IMPORT" && !data.sourceKey && !data.sourceRef) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Agent/imported casualty records require sourceKey or sourceRef for idempotency.",
        path: ["sourceKey"],
      });
    }
    if (data.sourceKind === "PUBLIC_IMPORT" && !data.isPublic) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Agent/imported casualty records must be public.",
        path: ["isPublic"],
      });
    }
  });

export type UpsertMemorialPersonInput = z.infer<typeof upsertMemorialPersonInputSchema>;

export async function upsertMemorialPerson(
  input: unknown,
  db: typeof prisma = prisma,
) {
  const data = upsertMemorialPersonInputSchema.parse(input);
  const sourceKey = normalizeSourceKey(data);
  const sourceRef = data.sourceRef ?? sourceKey;

  return db.$transaction(async (tx) => {
    const sourceArtifact =
      !data.sourceArtifactId && (data.sourceUrl || sourceKey)
        ? await upsertSourceArtifact(
            {
              sourceKey: sourceKey ?? `memorial:${slugify(data.displayName)}:${Date.now()}`,
              sourceUrl: data.sourceUrl,
              title: data.displayName,
            },
            tx,
          )
        : null;

    const existing =
      sourceRef != null
        ? await tx.person.findUnique({ where: { sourceRef } })
        : null;

    const person = existing
      ? await tx.person.update({
          where: { id: existing.id },
          data: {
            birthDate: data.birthDate ?? existing.birthDate,
            createdByUserId: existing.createdByUserId ?? data.submittedByUserId,
            deathDate: data.dateOfDeath ?? existing.deathDate,
            displayName: data.displayName,
            image: data.imageUrl ?? existing.image,
            isPublic: data.isPublic,
            lifeStatus: data.lifeStatus,
            sourceRef: sourceRef ?? existing.sourceRef,
            sourceUrl: data.sourceUrl ?? existing.sourceUrl,
            deletedAt: null,
          },
        })
      : await tx.person.create({
          data: {
            birthDate: data.birthDate,
            createdByUserId: data.submittedByUserId,
            deathDate: data.dateOfDeath,
            displayName: data.displayName,
            image: data.imageUrl,
            isPublic: data.isPublic,
            lifeStatus: data.lifeStatus,
            sourceRef,
            sourceUrl: data.sourceUrl,
          },
        });

    await ensureSubjectForPerson(tx, { displayName: person.displayName, id: person.id });

    const conflict =
      data.conflictId || data.conflictName
        ? data.conflictId
          ? await tx.conflict.findUnique({ where: { id: data.conflictId } })
          : await upsertConflict(
              {
                name: data.conflictName ?? "Unknown conflict",
                sourceUrl: data.sourceUrl,
              },
              tx,
            )
        : null;

    let condition: { id: string } | null = null;
    if (data.conditionName) {
      const canonicalCondition = data.conditionCode
        ? await resolveGlobalVariable(
            {
              code: data.conditionCode,
              codeSystem: data.conditionCodeSystem ?? "ICD-10",
              kind: "condition",
              name: data.conditionName,
              sourceArtifactId: sourceArtifact?.id ?? data.sourceArtifactId,
              sourceUrl: data.sourceUrl,
            },
            tx,
          )
        : await findCanonicalConditionGlobalVariable(tx, data.conditionName);
      const primaryCode =
        canonicalCondition && "externalCodes" in canonicalCondition
          ? canonicalCondition.externalCodes?.[0] ?? null
          : null;
      const conditionOr = [
        { conditionName: data.conditionName },
        ...(canonicalCondition ? [{ globalVariableId: canonicalCondition.id }] : []),
      ];

      condition =
        (await tx.personCondition.findFirst({
          where: {
            deletedAt: null,
            personId: person.id,
            status:
              data.lifeStatus === PersonLifeStatus.DECEASED
                ? PersonConditionStatus.CAUSE_OF_DEATH
                : PersonConditionStatus.ACTIVE,
            OR: conditionOr,
          },
          select: { id: true },
        })) ??
        (await tx.personCondition.create({
          data: {
            conditionCode: data.conditionCode ?? primaryCode?.code ?? null,
            conditionCodeSystem:
              data.conditionCodeSystem ?? primaryCode?.codeSystem ?? null,
            conditionName: data.conditionName,
            globalVariableId: canonicalCondition?.id ?? null,
            isPublic: data.isPublic,
            personId: person.id,
            reportedByUserId: data.submittedByUserId,
            sourceUrl: data.sourceUrl,
            status:
              data.lifeStatus === PersonLifeStatus.DECEASED
                ? PersonConditionStatus.CAUSE_OF_DEATH
                : PersonConditionStatus.ACTIVE,
          },
          select: { id: true },
        }));
    }

    let memorial = await tx.personMemorial.findUnique({
      where: { personId: person.id },
      select: { id: true },
    });

    if (data.lifeStatus === PersonLifeStatus.DECEASED) {
      memorial = await tx.personMemorial.upsert({
        where: { personId: person.id },
        update: {
          causeCategory: data.causeCategory,
          civilianStatus: data.civilianStatus,
          conflictId: conflict?.id ?? null,
          circumstances: data.memorialMessage,
          deathCountryCode: data.deathCountryCode,
          deathLocation: data.deathLocation,
          isPublic: data.isPublic,
          primaryPersonConditionId: condition?.id ?? null,
          wasChild: data.wasChild,
          deletedAt: null,
        },
        create: {
          causeCategory: data.causeCategory,
          civilianStatus: data.civilianStatus,
          conflictId: conflict?.id ?? null,
          circumstances: data.memorialMessage,
          deathCountryCode: data.deathCountryCode,
          deathLocation: data.deathLocation,
          isPublic: data.isPublic,
          personId: person.id,
          primaryPersonConditionId: condition?.id ?? null,
          wasChild: data.wasChild,
        },
        select: { id: true },
      });

      const consentTimestamp = new Date();
      if (data.submittedByUserId || data.memorialMessage || data.publicComment) {
        const submissionData = {
          consentCourtEvidence: data.consentCourtEvidence,
          consentCourtEvidenceAt: data.consentCourtEvidence ? consentTimestamp : null,
          consentPublicDisplay: data.isPublic,
          consentPublicDisplayAt: data.isPublic ? consentTimestamp : null,
          isPublic: data.isPublic,
          memorialMessage: data.memorialMessage ?? data.publicComment,
          submittedByUserId: data.submittedByUserId,
        };
        const existingSubmission = await tx.personMemorialSubmission.findFirst({
          where: {
            deletedAt: null,
            memorialId: memorial.id,
            memorialMessage: submissionData.memorialMessage,
            submittedByUserId: data.submittedByUserId,
          },
          select: { id: true },
        });
        if (existingSubmission) {
          await tx.personMemorialSubmission.update({
            where: { id: existingSubmission.id },
            data: submissionData,
          });
        } else {
          await tx.personMemorialSubmission.create({
            data: {
              ...submissionData,
              memorialId: memorial.id,
            },
          });
        }
      }

      if (data.isPublic && (sourceArtifact || data.sourceUrl)) {
        const evidenceData = {
          containsSensitiveData: false,
          evidenceKind: PersonMemorialEvidenceKind.OTHER,
          isPublic: true,
          sourceArtifactId: sourceArtifact?.id ?? data.sourceArtifactId,
          sourceUrl: data.sourceUrl,
          submittedByUserId: data.submittedByUserId,
          title: sourceArtifact?.title ?? data.displayName,
        };
        const existingEvidence = await tx.personMemorialEvidence.findFirst({
          where: {
            deletedAt: null,
            memorialId: memorial.id,
            OR: [
              evidenceData.sourceArtifactId
                ? { sourceArtifactId: evidenceData.sourceArtifactId }
                : undefined,
              evidenceData.sourceUrl ? { sourceUrl: evidenceData.sourceUrl } : undefined,
            ].filter((item): item is NonNullable<typeof item> => item != null),
          },
          select: { id: true },
        });
        if (existingEvidence) {
          await tx.personMemorialEvidence.update({
            where: { id: existingEvidence.id },
            data: evidenceData,
          });
        } else {
          await tx.personMemorialEvidence.create({
            data: {
              ...evidenceData,
              memorialId: memorial.id,
            },
          });
        }
      }

      if (data.responsiblePartyName) {
        const responsiblePartyData = {
          isPrimary: true,
          isPublic: data.isPublic,
          name: data.responsiblePartyName,
          sourceArtifactId: sourceArtifact?.id ?? data.sourceArtifactId,
          sourceUrl: data.sourceUrl,
        };
        const existingResponsibleParty = await tx.personMemorialResponsibleParty.findFirst({
          where: {
            deletedAt: null,
            memorialId: memorial.id,
            name: data.responsiblePartyName,
          },
          select: { id: true },
        });
        if (existingResponsibleParty) {
          await tx.personMemorialResponsibleParty.update({
            where: { id: existingResponsibleParty.id },
            data: responsiblePartyData,
          });
        } else {
          await tx.personMemorialResponsibleParty.create({
            data: {
              ...responsiblePartyData,
              memorialId: memorial.id,
            },
          });
        }
      }
    }

    if (data.relationshipType && data.submittedByUserId) {
      const casterPerson = await ensurePersonForUser(data.submittedByUserId, {}, tx);
      const relationshipType = slugify(data.relationshipType);
      const existingRelationship = await tx.personRelationship.findFirst({
        where: {
          deletedAt: null,
          objectPersonId: person.id,
          relationshipType,
          subjectPersonId: casterPerson.id,
        },
        select: { id: true },
      });
      if (existingRelationship) {
        await tx.personRelationship.update({
          where: { id: existingRelationship.id },
          data: {
            createdByUserId: data.submittedByUserId,
            isPublic: data.isPublic,
          },
        });
      } else {
        await tx.personRelationship.create({
          data: {
            createdByUserId: data.submittedByUserId,
            isPublic: data.isPublic,
            objectPersonId: person.id,
            relationshipType,
            subjectPersonId: casterPerson.id,
          },
        });
      }
    }

    let vote: { id: string; answer: VotePosition; voteSource: ReferendumVoteSource } | null = null;
    if (data.recordTreatyVote && data.submittedByUserId) {
      const referendumSlug = data.referendumSlug ?? TREATY_REFERENDUM_SLUG;
      const referendum = await tx.referendum.findFirst({
        where: { deletedAt: null, slug: referendumSlug },
        select: { id: true, status: true },
      });
      if (referendum?.status === ReferendumStatus.ACTIVE) {
        vote = await tx.referendumVote.upsert({
          where: {
            referendumId_personId: {
              personId: person.id,
              referendumId: referendum.id,
            },
          },
          update: {
            answer: VotePosition.YES,
            deletedAt: null,
            isPublic: data.isPublic,
            publicComment: data.publicComment,
          },
          create: {
            answer: VotePosition.YES,
            isPublic: data.isPublic,
            personId: person.id,
            publicComment: data.publicComment,
            referendumId: referendum.id,
            userId: data.submittedByUserId,
            voteSource: ReferendumVoteSource.REPRESENTED,
          },
          select: { answer: true, id: true, voteSource: true },
        });
      }
    }

    return {
      created: existing == null,
      conflictId: conflict?.id ?? null,
      conditionId: condition?.id ?? null,
      memorialId: memorial?.id ?? null,
      person: {
        displayName: person.displayName,
        handle: person.handle,
        id: person.id,
        lifeStatus: person.lifeStatus,
      },
      sourceArtifactId: sourceArtifact?.id ?? data.sourceArtifactId ?? null,
      vote,
    };
  });
}

export const addMemorialEvidenceInputSchema = z
  .object({
    containsSensitiveData: z.unknown().transform((value) => value === true),
    description: optionalTrimmedString(MAX_TEXT_LENGTH),
    evidenceKind: enumInput(PersonMemorialEvidenceKind, PersonMemorialEvidenceKind.OTHER),
    isPublic: z.unknown().transform((value) => value !== false),
    memorialId: requiredTrimmedString(200),
    sourceArtifactId: optionalTrimmedString(200),
    sourceKey: optionalTrimmedString(500),
    sourceUrl: optionalUrl,
    submittedByUserId: optionalTrimmedString(200),
    title: optionalTrimmedString(500),
  })
  .superRefine((data, ctx) => {
    if (data.containsSensitiveData) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Evidence tools only accept public non-sensitive sources.",
        path: ["containsSensitiveData"],
      });
    }
    if (!data.isPublic) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Evidence tools only accept public evidence.",
        path: ["isPublic"],
      });
    }
  });

export async function addMemorialEvidence(
  input: unknown,
  db: DbClient = prisma,
) {
  const data = addMemorialEvidenceInputSchema.parse(input);
  if (!data.sourceArtifactId && !data.sourceUrl) {
    throw new Error("sourceUrl or sourceArtifactId is required");
  }
  const sourceArtifact =
    data.sourceArtifactId == null && data.sourceUrl
      ? await upsertSourceArtifact(
          {
            sourceKey: data.sourceKey ?? `memorial-evidence:${data.memorialId}:${data.sourceUrl}`,
            sourceUrl: data.sourceUrl,
            title: data.title,
          },
          db,
        )
      : null;
  return db.personMemorialEvidence.create({
    data: {
      containsSensitiveData: false,
      description: data.description,
      evidenceKind: data.evidenceKind,
      isPublic: true,
      memorialId: data.memorialId,
      sourceArtifactId: data.sourceArtifactId ?? sourceArtifact?.id ?? null,
      sourceUrl: data.sourceUrl,
      submittedByUserId: data.submittedByUserId,
      title: data.title,
    },
  });
}

export const addMemorialResponsiblePartyInputSchema = z.object({
  confidenceScore: z.number().min(0).max(1).optional().nullable(),
  isPrimary: z.unknown().transform((value) => value === true),
  isPublic: z.unknown().transform((value) => value === true),
  jurisdictionId: optionalTrimmedString(200),
  memorialId: requiredTrimmedString(200),
  name: optionalTrimmedString(MAX_NAME_LENGTH),
  organizationId: optionalTrimmedString(200),
  roleSlug: optionalTrimmedString(120),
  sourceArtifactId: optionalTrimmedString(200),
  sourceUrl: optionalUrl,
});

export async function addMemorialResponsibleParty(
  input: unknown,
  db: DbClient = prisma,
) {
  const data = addMemorialResponsiblePartyInputSchema.parse(input);
  if (!data.name && !data.jurisdictionId && !data.organizationId) {
    throw new Error("name, jurisdictionId, or organizationId is required");
  }
  return db.personMemorialResponsibleParty.create({ data });
}

export const reportContentInputSchema = z.object({
  correctionJson: z.unknown().optional(),
  message: optionalTrimmedString(MAX_TEXT_LENGTH),
  reasonType: requiredTrimmedString(120),
  reportedByUserId: optionalTrimmedString(200),
  sourceUrl: optionalUrl,
  targetId: requiredTrimmedString(200),
  targetType: requiredTrimmedString(120),
});

export type ReportContentInput = z.infer<typeof reportContentInputSchema>;

export async function reportContent(input: unknown, db: DbClient = prisma) {
  const data = reportContentInputSchema.parse(input);
  return db.contentReport.create({
    data: {
      correctionJson: nullishJson(data.correctionJson),
      message: data.message,
      reasonType: data.reasonType,
      reportedByUserId: data.reportedByUserId,
      sourceUrl: data.sourceUrl,
      targetId: data.targetId,
      targetType: data.targetType,
    },
  });
}

export async function suggestCorrection(input: unknown, db: DbClient = prisma) {
  const raw = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const data = reportContentInputSchema.parse({
    ...raw,
    reasonType: raw.reasonType || "correction",
  });
  if (data.correctionJson == null) {
    throw new Error("correctionJson is required for correction suggestions");
  }
  return reportContent(data, db);
}

export const signReferendumAsOrganizationInputSchema = z.object({
  contactEmail: optionalTrimmedString(320),
  description: optionalTrimmedString(MAX_TEXT_LENGTH),
  logo: optionalUrl,
  newOrganizationName: optionalTrimmedString(MAX_NAME_LENGTH),
  organizationId: optionalTrimmedString(200),
  position: enumInput(VotePosition, VotePosition.YES),
  referendumSlug: optionalTrimmedString(200),
  sourceRef: optionalTrimmedString(500),
  sourceUrl: optionalUrl,
  statement: optionalTrimmedString(MAX_TEXT_LENGTH),
  submittedByUserId: requiredTrimmedString(200),
  type: enumInput(OrgType, OrgType.NONPROFIT),
  website: optionalUrl,
});

export async function signReferendumAsOrganization(
  input: unknown,
  db: typeof prisma = prisma,
) {
  const data = signReferendumAsOrganizationInputSchema.parse(input);
  const referendum = await db.referendum.findFirst({
    where: { deletedAt: null, slug: data.referendumSlug ?? TREATY_REFERENDUM_SLUG },
    select: { id: true, status: true },
  });
  if (!referendum) throw new Error("Referendum not found");
  if (referendum.status !== ReferendumStatus.ACTIVE) {
    throw new Error("Referendum is not accepting organization signatures");
  }

  let organizationId = data.organizationId;
  if (organizationId) {
    const canManage = await canManageOrganization(data.submittedByUserId, organizationId);
    if (!canManage) throw new Error("User cannot manage this organization");
  } else {
    if (!data.newOrganizationName) throw new Error("newOrganizationName is required");
    const organization = await createOrganizationWithOwner(
      {
        contactEmail: data.contactEmail,
        description: data.description,
        logo: data.logo,
        name: data.newOrganizationName,
        status: OrgStatus.APPROVED,
        type: data.type,
        website: data.website,
      },
      data.submittedByUserId,
    );
    organizationId = organization.id;
  }

  const existing = await db.organizationReferendumPosition.findUnique({
    where: {
      organizationId_referendumId: {
        organizationId,
        referendumId: referendum.id,
      },
    },
    select: { deletedAt: true, status: true },
  });
  if (
    existing?.deletedAt ||
    existing?.status === OrganizationReferendumPositionStatus.REJECTED
  ) {
    throw new Error("This organization's signatory record was removed by an admin");
  }

  const record = await db.organizationReferendumPosition.upsert({
    where: {
      organizationId_referendumId: {
        organizationId,
        referendumId: referendum.id,
      },
    },
    update: {
      approvedByUserId: null,
      deletedAt: null,
      position: data.position,
      statement: data.statement,
      status: OrganizationReferendumPositionStatus.APPROVED,
      submittedByUserId: data.submittedByUserId,
    },
    create: {
      organizationId,
      position: data.position,
      referendumId: referendum.id,
      statement: data.statement,
      status: OrganizationReferendumPositionStatus.APPROVED,
      submittedByUserId: data.submittedByUserId,
    },
  });

  return { organizationId, position: record };
}

export const upsertOrganizationInputSchema = z.object({
  contactEmail: optionalTrimmedString(320),
  description: optionalTrimmedString(MAX_TEXT_LENGTH),
  logo: optionalUrl,
  name: requiredTrimmedString(MAX_NAME_LENGTH),
  sourceRef: optionalTrimmedString(500),
  sourceUrl: optionalUrl,
  type: enumInput(OrgType, OrgType.OTHER),
  website: optionalUrl,
});

export async function upsertOrganization(
  input: unknown,
  db: DbClient = prisma,
) {
  const data = upsertOrganizationInputSchema.parse(input);
  return findOrCreateOrganization(data, db);
}

export const interventionApprovalTimelineInputSchema = z.object({
  approvalDate: optionalDate,
  approvalDescription: optionalTrimmedString(MAX_TEXT_LENGTH),
  brandName: optionalTrimmedString(MAX_NAME_LENGTH),
  conditionGlobalVariableId: optionalTrimmedString(200),
  conditionName: requiredTrimmedString(MAX_NAME_LENGTH),
  estimatedDeathsDuringLag: z.number().optional().nullable(),
  estimatedLivesSavedPerYear: z.number().optional().nullable(),
  firstEvidenceDate: optionalDate,
  firstEvidenceDescription: optionalTrimmedString(MAX_TEXT_LENGTH),
  interventionGlobalVariableId: optionalTrimmedString(200),
  interventionName: requiredTrimmedString(MAX_NAME_LENGTH),
  jurisdictionId: optionalTrimmedString(200),
  regulatorName: optionalTrimmedString(MAX_NAME_LENGTH),
  sourceArtifactId: optionalTrimmedString(200),
  sourceKey: optionalTrimmedString(500),
  sourceUrl: optionalUrl,
});

export async function upsertInterventionApprovalTimeline(
  input: unknown,
  db: DbClient = prisma,
) {
  const data = interventionApprovalTimelineInputSchema.parse(input);
  const intervention =
    data.interventionGlobalVariableId == null
      ? await resolveGlobalVariable({ kind: "intervention", name: data.interventionName }, db)
      : null;
  const condition =
    data.conditionGlobalVariableId == null
      ? await resolveGlobalVariable({ kind: "condition", name: data.conditionName }, db)
      : null;
  const sourceArtifact =
    data.sourceArtifactId == null && (data.sourceKey || data.sourceUrl)
      ? await upsertSourceArtifact(
          {
            sourceKey:
              data.sourceKey ??
              `approval:${slugify(data.interventionName)}:${slugify(data.conditionName)}:${data.sourceUrl}`,
            sourceUrl: data.sourceUrl,
            title: `${data.interventionName} for ${data.conditionName}`,
          },
          db,
        )
      : null;

  const efficacyLagDays = daysBetween(data.firstEvidenceDate, data.approvalDate);
  const existing = await db.interventionApprovalTimeline.findFirst({
    where: {
      deletedAt: null,
      interventionName: data.interventionName,
      conditionName: data.conditionName,
      sourceArtifactId: data.sourceArtifactId ?? sourceArtifact?.id ?? null,
    },
    select: { id: true },
  });
  const payload = {
    approvalDate: data.approvalDate,
    approvalDescription: data.approvalDescription,
    brandName: data.brandName,
    conditionGlobalVariableId: data.conditionGlobalVariableId ?? condition?.id ?? null,
    conditionName: data.conditionName,
    efficacyLagDays,
    estimatedDeathsDuringLag: data.estimatedDeathsDuringLag ?? null,
    estimatedLivesSavedPerYear: data.estimatedLivesSavedPerYear ?? null,
    firstEvidenceDate: data.firstEvidenceDate,
    firstEvidenceDescription: data.firstEvidenceDescription,
    interventionGlobalVariableId: data.interventionGlobalVariableId ?? intervention?.id ?? null,
    interventionName: data.interventionName,
    jurisdictionId: data.jurisdictionId,
    regulatorName: data.regulatorName,
    sourceArtifactId: data.sourceArtifactId ?? sourceArtifact?.id ?? null,
    sourceUrl: data.sourceUrl,
    deletedAt: null,
  };
  return existing
    ? db.interventionApprovalTimeline.update({ where: { id: existing.id }, data: payload })
    : db.interventionApprovalTimeline.create({ data: payload });
}

export const variableRelationshipEvidenceEstimateInputSchema = z.object({
  confidenceScore: z.number().min(0).max(1).optional().nullable(),
  contextGlobalVariableId: optionalTrimmedString(200),
  evidenceGrade: z.string().optional().nullable(),
  evidenceGradeValue: z.unknown().optional(),
  metricKind: enumInput(VariableEvidenceMetricKind, VariableEvidenceMetricKind.OTHER),
  outcomeGlobalVariableId: requiredTrimmedString(200),
  participants: z.number().int().optional().nullable(),
  predictorGlobalVariableId: requiredTrimmedString(200),
  rationale: optionalTrimmedString(MAX_TEXT_LENGTH),
  sourceArtifactId: optionalTrimmedString(200),
  sourceType: enumInput(VariableRelationshipEvidenceSourceType, VariableRelationshipEvidenceSourceType.OTHER),
  sourceUrl: optionalUrl,
  studies: z.number().int().optional().nullable(),
  unitId: optionalTrimmedString(200),
  value: z.number().optional().nullable(),
});

export async function upsertVariableRelationshipEvidenceEstimate(
  input: unknown,
  db: DbClient = prisma,
) {
  const data = variableRelationshipEvidenceEstimateInputSchema.parse(input);
  const existing = await db.variableRelationshipEvidenceEstimate.findFirst({
    where: {
      deletedAt: null,
      metricKind: data.metricKind,
      outcomeGlobalVariableId: data.outcomeGlobalVariableId,
      predictorGlobalVariableId: data.predictorGlobalVariableId,
      sourceArtifactId: data.sourceArtifactId,
    },
    select: { id: true },
  });
  const payload = {
    confidenceScore: data.confidenceScore ?? null,
    contextGlobalVariableId: data.contextGlobalVariableId,
    metricKind: data.metricKind,
    outcomeGlobalVariableId: data.outcomeGlobalVariableId,
    participants: data.participants ?? null,
    predictorGlobalVariableId: data.predictorGlobalVariableId,
    rationale: data.rationale,
    sourceArtifactId: data.sourceArtifactId,
    sourceType: data.sourceType,
    sourceUrl: data.sourceUrl,
    studies: data.studies ?? null,
    unitId: data.unitId,
    value: data.value ?? null,
    deletedAt: null,
  };
  return existing
    ? db.variableRelationshipEvidenceEstimate.update({ where: { id: existing.id }, data: payload })
    : db.variableRelationshipEvidenceEstimate.create({ data: payload });
}

export const recordInterventionExperienceInputSchema = z.object({
  conditionGlobalVariableId: optionalTrimmedString(200),
  doseUnitId: optionalTrimmedString(200),
  doseValue: z.number().optional().nullable(),
  endedAt: optionalDate,
  frequencyText: optionalTrimmedString(160),
  interventionGlobalVariableId: requiredTrimmedString(200),
  isPublic: z.unknown().transform((value) => value === true),
  notes: optionalTrimmedString(MAX_TEXT_LENGTH),
  outcomes: z
    .array(
      z.object({
        outcomeGlobalVariableId: requiredTrimmedString(200),
        publicComment: optionalTrimmedString(500),
        rating: enumInput(InterventionOutcomeRating, InterventionOutcomeRating.UNKNOWN),
        unitId: optionalTrimmedString(200),
        value: z.number().optional().nullable(),
      }),
    )
    .default([]),
  reportedByUserId: requiredTrimmedString(200),
  sideEffects: z
    .array(
      z.object({
        actionTaken: optionalTrimmedString(500),
        isSerious: z.unknown().transform((value) =>
          typeof value === "boolean" ? value : null,
        ),
        publicComment: optionalTrimmedString(500),
        severity: enumInput(
          InterventionSideEffectSeverity,
          InterventionSideEffectSeverity.UNKNOWN,
        ),
        sideEffectGlobalVariableId: requiredTrimmedString(200),
      }),
    )
    .default([]),
  sourceArtifactId: optionalTrimmedString(200),
  startedAt: optionalDate,
  status: enumInput(InterventionExperienceStatus, InterventionExperienceStatus.UNKNOWN),
  subjectId: optionalTrimmedString(200),
});

export async function recordInterventionExperience(
  input: unknown,
  db: typeof prisma = prisma,
) {
  const data = recordInterventionExperienceInputSchema.parse(input);
  return db.$transaction(async (tx) => {
    const subject = data.subjectId
      ? { id: data.subjectId }
      : await ensureSubjectForUser(tx, {
          ...(await tx.user.findUniqueOrThrow({
            where: { id: data.reportedByUserId },
            select: { countryCode: true, email: true, id: true, personId: true },
          })),
        });

    const experience = await tx.interventionExperience.create({
      data: {
        conditionGlobalVariableId: data.conditionGlobalVariableId,
        doseUnitId: data.doseUnitId,
        doseValue: data.doseValue ?? null,
        endedAt: data.endedAt,
        frequencyText: data.frequencyText,
        interventionGlobalVariableId: data.interventionGlobalVariableId,
        isPublic: data.isPublic,
        notes: data.notes,
        reportedByUserId: data.reportedByUserId,
        sourceArtifactId: data.sourceArtifactId,
        startedAt: data.startedAt,
        status: data.status,
        subjectId: subject.id,
      },
    });

    if (data.outcomes.length > 0) {
      await tx.interventionExperienceOutcome.createMany({
        data: data.outcomes.map((outcome) => ({
          interventionExperienceId: experience.id,
          isPublic: data.isPublic,
          outcomeGlobalVariableId: outcome.outcomeGlobalVariableId,
          publicComment: outcome.publicComment,
          rating: outcome.rating,
          unitId: outcome.unitId,
          value: outcome.value ?? null,
        })),
      });
    }

    if (data.sideEffects.length > 0) {
      await tx.interventionExperienceSideEffect.createMany({
        data: data.sideEffects.map((sideEffect) => ({
          actionTaken: sideEffect.actionTaken,
          interventionExperienceId: experience.id,
          isPublic: data.isPublic,
          isSerious: sideEffect.isSerious,
          publicComment: sideEffect.publicComment,
          severity: sideEffect.severity,
          sideEffectGlobalVariableId: sideEffect.sideEffectGlobalVariableId,
        })),
      });
    }

    return { experienceId: experience.id, subjectId: subject.id };
  });
}

export async function castReferendumVote(input: {
  answer?: VotePosition;
  publicComment?: string | null;
  referendumSlug?: string | null;
  userId: string;
}) {
  const person = await ensurePersonForUser(input.userId);
  const referendum = await prisma.referendum.findFirst({
    where: { deletedAt: null, slug: input.referendumSlug ?? TREATY_REFERENDUM_SLUG },
    select: { id: true, status: true },
  });
  if (!referendum) throw new Error("Referendum not found");
  if (referendum.status !== ReferendumStatus.ACTIVE) throw new Error("Referendum is not active");
  const vote = await prisma.referendumVote.upsert({
    where: {
      referendumId_personId: {
        personId: person.id,
        referendumId: referendum.id,
      },
    },
    update: {
      answer: input.answer ?? VotePosition.YES,
      deletedAt: null,
      isPublic: true,
      publicComment: input.publicComment ?? null,
      userId: input.userId,
      voteSource: ReferendumVoteSource.SELF,
    },
    create: {
      answer: input.answer ?? VotePosition.YES,
      isPublic: true,
      personId: person.id,
      publicComment: input.publicComment ?? null,
      referendumId: referendum.id,
      userId: input.userId,
      voteSource: ReferendumVoteSource.SELF,
    },
  });
  return { personId: person.id, vote };
}

export async function recordRepresentedReferendumVote(input: {
  answer?: VotePosition;
  isPublic?: boolean;
  personId: string;
  publicComment?: string | null;
  referendumSlug?: string | null;
  userId: string;
}) {
  const referendum = await prisma.referendum.findFirst({
    where: { deletedAt: null, slug: input.referendumSlug ?? TREATY_REFERENDUM_SLUG },
    select: { id: true, status: true },
  });
  if (!referendum) throw new Error("Referendum not found");
  if (referendum.status !== ReferendumStatus.ACTIVE) throw new Error("Referendum is not active");
  const existingVote = await prisma.referendumVote.findUnique({
    where: {
      referendumId_personId: {
        personId: input.personId,
        referendumId: referendum.id,
      },
    },
    select: {
      id: true,
      userId: true,
      voteSource: true,
    },
  });

  if (existingVote) {
    if (existingVote.voteSource !== ReferendumVoteSource.REPRESENTED) {
      throw new Error("Cannot overwrite an official self vote with a represented vote");
    }
    if (existingVote.userId !== input.userId) {
      throw new Error("Only the original representative can update this represented vote");
    }
  }

  const voteData = {
    answer: input.answer ?? VotePosition.YES,
    deletedAt: null,
    isPublic: input.isPublic !== false,
    publicComment: input.publicComment ?? null,
    voteSource: ReferendumVoteSource.REPRESENTED,
  };

  const vote = existingVote
    ? await prisma.referendumVote.update({
        where: { id: existingVote.id },
        data: voteData,
      })
    : await prisma.referendumVote
        .create({
          data: {
            ...voteData,
            personId: input.personId,
            referendumId: referendum.id,
            userId: input.userId,
          },
        })
        .catch((error: unknown) => {
          if (isUniqueConstraintError(error)) {
            throw new Error("A vote for this person already exists. Reload and try again.");
          }
          throw error;
        });
  return { vote };
}

export async function searchPeople(input: {
  limit?: number;
  query?: string | null;
  publicOnly?: boolean;
}) {
  const query = input.query?.trim();
  return prisma.person.findMany({
    where: {
      deletedAt: null,
      ...(input.publicOnly === false ? {} : { isPublic: true }),
      ...(query
        ? {
            OR: [
              { displayName: { contains: query, mode: "insensitive" } },
              { handle: { contains: query, mode: "insensitive" } },
              { currentAffiliation: { contains: query, mode: "insensitive" } },
              { sourceRef: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    select: {
      deathDate: true,
      displayName: true,
      handle: true,
      id: true,
      image: true,
      lifeStatus: true,
    },
    take: Math.min(Math.max(input.limit ?? 20, 1), 100),
  });
}

export async function getPerson(input: { idOrHandle: string; publicOnly?: boolean }) {
  const idOrHandle = input.idOrHandle.trim();
  if (!idOrHandle) throw new Error("idOrHandle is required");
  const publicOnly = input.publicOnly !== false;

  if (publicOnly) {
    return prisma.person.findFirst({
      where: {
        deletedAt: null,
        isPublic: true,
        OR: [{ id: idOrHandle }, { handle: idOrHandle }],
      },
      select: {
        bio: true,
        birthDate: true,
        conditions: {
          where: { deletedAt: null, isPublic: true },
          select: {
            conditionCode: true,
            conditionCodeSystem: true,
            conditionName: true,
            globalVariableId: true,
            id: true,
            status: true,
          },
        },
        countryCode: true,
        currentAffiliation: true,
        deathDate: true,
        displayName: true,
        handle: true,
        id: true,
        image: true,
        lifeStatus: true,
        memorial: {
          where: { deletedAt: null, isPublic: true },
          select: {
            causeCategory: true,
            civilianStatus: true,
            deathCountryCode: true,
            deathLocation: true,
            evidence: {
              where: {
                containsSensitiveData: false,
                deletedAt: null,
                isPublic: true,
              },
              select: {
                description: true,
                evidenceKind: true,
                id: true,
                sourceArtifactId: true,
                sourceUrl: true,
                title: true,
              },
            },
            id: true,
            responsibleParties: {
              where: { deletedAt: null, isPublic: true },
              select: {
                id: true,
                jurisdictionId: true,
                name: true,
                organizationId: true,
                roleSlug: true,
              },
            },
            submissions: {
              where: {
                consentPublicDisplay: true,
                deletedAt: null,
                isPublic: true,
              },
              select: {
                id: true,
                memorialMessage: true,
              },
            },
            wasChild: true,
          },
        },
        referendumVotes: {
          where: { deletedAt: null, isPublic: true },
          select: {
            answer: true,
            createdAt: true,
            id: true,
            publicComment: true,
            referendumId: true,
            voteSource: true,
          },
        },
      },
    });
  }

  return prisma.person.findFirst({
    where: {
      deletedAt: null,
      OR: [{ id: idOrHandle }, { handle: idOrHandle }],
    },
    include: {
      conditions: { where: { deletedAt: null } },
      memorial: {
        include: {
          evidence: { where: { deletedAt: null } },
          responsibleParties: { where: { deletedAt: null } },
          submissions: { where: { deletedAt: null } },
        },
      },
      referendumVotes: { where: { deletedAt: null } },
    },
  });
}

export async function searchOrganizations(input: { limit?: number; query?: string | null }) {
  const query = input.query?.trim();
  return prisma.organization.findMany({
    where: {
      deletedAt: null,
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { slug: { contains: query, mode: "insensitive" } },
              { sourceRef: { contains: query, mode: "insensitive" } },
              { website: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { name: "asc" },
    take: Math.min(Math.max(input.limit ?? 20, 1), 100),
  });
}

export async function runEfficacyLagMatcher(input: { limit?: number } = {}) {
  const memorials = await prisma.personMemorial.findMany({
    where: {
      deletedAt: null,
      person: { deathDate: { not: null }, deletedAt: null },
      primaryPersonCondition: { globalVariableId: { not: null }, deletedAt: null },
    },
    include: {
      person: { select: { deathDate: true, displayName: true } },
      primaryPersonCondition: true,
    },
    take: Math.min(Math.max(input.limit ?? 100, 1), 500),
  });

  let createdOrUpdated = 0;
  for (const memorial of memorials) {
    const deathDate = memorial.person.deathDate;
    const conditionId = memorial.primaryPersonCondition?.globalVariableId;
    if (!deathDate || !conditionId) continue;
    const timelines = await prisma.interventionApprovalTimeline.findMany({
      where: {
        approvalDate: { gt: deathDate },
        conditionGlobalVariableId: conditionId,
        deletedAt: null,
      },
      take: 20,
    });
    for (const timeline of timelines) {
      await prisma.personEfficacyLagEvidence.upsert({
        where: {
          memorialId_interventionApprovalTimelineId: {
            interventionApprovalTimelineId: timeline.id,
            memorialId: memorial.id,
          },
        },
        update: {
          confidenceScore: 0.7,
          diedBeforeApprovalDays: daysBetween(deathDate, timeline.approvalDate),
          explanation: `${memorial.person.displayName} died before ${timeline.interventionName} was approved for ${timeline.conditionName}.`,
          personConditionId: memorial.primaryPersonCondition?.id ?? null,
          status: EfficacyLagEvidenceStatus.CANDIDATE,
          deletedAt: null,
        },
        create: {
          confidenceScore: 0.7,
          diedBeforeApprovalDays: daysBetween(deathDate, timeline.approvalDate),
          explanation: `${memorial.person.displayName} died before ${timeline.interventionName} was approved for ${timeline.conditionName}.`,
          interventionApprovalTimelineId: timeline.id,
          memorialId: memorial.id,
          personConditionId: memorial.primaryPersonCondition?.id ?? null,
          status: EfficacyLagEvidenceStatus.CANDIDATE,
        },
      });
      createdOrUpdated += 1;
    }
  }
  return { matchedEvidenceRows: createdOrUpdated };
}

async function updateVisibility(targetType: string, targetId: string, visible: boolean) {
  const data = visible
    ? { deletedAt: null, isPublic: true }
    : { deletedAt: new Date(), isPublic: false };
  switch (targetType) {
    case "Person":
    case "person":
      return prisma.person.update({ where: { id: targetId }, data });
    case "PersonMemorial":
    case "personMemorial":
      return prisma.personMemorial.update({ where: { id: targetId }, data });
    case "PersonMemorialEvidence":
    case "personMemorialEvidence":
      return prisma.personMemorialEvidence.update({ where: { id: targetId }, data });
    case "PersonMemorialResponsibleParty":
    case "personMemorialResponsibleParty":
      return prisma.personMemorialResponsibleParty.update({ where: { id: targetId }, data });
    case "ReferendumVote":
    case "referendumVote":
      return prisma.referendumVote.update({ where: { id: targetId }, data });
    case "InterventionExperience":
    case "interventionExperience":
      return prisma.interventionExperience.update({ where: { id: targetId }, data });
    case "OrganizationReferendumPosition":
    case "organizationReferendumPosition":
      return prisma.organizationReferendumPosition.update({
        where: { id: targetId },
        data: visible
          ? {
              deletedAt: null,
              status: OrganizationReferendumPositionStatus.APPROVED,
            }
          : {
              deletedAt: new Date(),
              status: OrganizationReferendumPositionStatus.REJECTED,
            },
      });
    default:
      throw new Error(`Unsupported visibility targetType: ${targetType}`);
  }
}

export async function hideContent(input: { targetId: string; targetType: string }) {
  return updateVisibility(input.targetType, input.targetId, false);
}

export async function restoreContent(input: { targetId: string; targetType: string }) {
  return updateVisibility(input.targetType, input.targetId, true);
}

export async function mergeDuplicatePeople(input: {
  canonicalPersonId: string;
  duplicatePersonId: string;
}) {
  return mergeDuplicatePerson(input);
}

export async function resolveContentReport(input: {
  id: string;
  resolutionNote?: string | null;
  reviewedByUserId?: string | null;
  status?: ContentReportStatus;
}) {
  return prisma.contentReport.update({
    where: { id: input.id },
    data: {
      resolutionNote: input.resolutionNote ?? null,
      reviewedAt: new Date(),
      reviewedByUserId: input.reviewedByUserId ?? null,
      status: input.status ?? ContentReportStatus.RESOLVED,
    },
  });
}

export async function createPerson(input: {
  countryCode?: string | null;
  createdByUserId: string;
  currentAffiliation?: string | null;
  displayName: string;
  email?: string | null;
  image?: string | null;
  isPublicFigure?: boolean;
  sourceRef?: string | null;
  sourceUrl?: string | null;
}) {
  return findOrCreatePerson(input);
}

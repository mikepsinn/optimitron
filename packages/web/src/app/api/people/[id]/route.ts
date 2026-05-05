import { NextResponse } from "next/server";
import {
  PersonCivilianStatus,
  PersonConditionStatus,
  PersonDeathCauseCategory,
  PersonLifeStatus,
  PersonMemorialEvidenceKind,
  ReferendumVoteSource,
  VotePosition,
  schemas,
} from "@optimitron/db";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-utils";
import { findCanonicalConditionGlobalVariable } from "@/lib/global-variable-lookup.server";
import { ensurePersonForUser } from "@/lib/person.server";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";
import { ensureSubjectForPerson } from "@/lib/subject.server";
import { TREATY_REFERENDUM_SLUG } from "@/lib/treaty";

const MAX_NAME_LENGTH = 80;
const MAX_CONDITION_LENGTH = 80;
const MAX_COMMENT_LENGTH = 220;
const MAX_MEMORIAL_MESSAGE_LENGTH = 500;
const MAX_RELATIONSHIP_LENGTH = 48;
const MAX_EVIDENCE_ITEMS = 8;
const MAX_EVIDENCE_TITLE_LENGTH = 120;
const MAX_EVIDENCE_DESCRIPTION_LENGTH = 500;
const MAX_CLIENT_DRAFT_ID_LENGTH = 120;
const PUBLIC_TEXT_URL_PATTERN =
  /(?:https?:\/\/|www\.|(?:^|\s)[a-z0-9][a-z0-9.-]*\.(?:ai|biz|co|com|gov|info|io|net|org|ru|uk|us|xyz)\b)/i;

function normalizePublicText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ").slice(0, maxLength);
}

function cleanStringSchema(maxLength: number) {
  return z.unknown().transform((value) => normalizePublicText(value, maxLength));
}

function optionalCleanStringSchema(maxLength: number) {
  return z
    .unknown()
    .optional()
    .transform((value) =>
      value === undefined ? undefined : normalizePublicText(value, maxLength),
    );
}

const optionalNullableDateInputSchema = z
  .unknown()
  .optional()
  .transform((value) => {
    if (value === undefined) return undefined;
    if (typeof value !== "string" || !value.trim()) return null;
    return new Date(`${value.trim()}T00:00:00.000Z`);
  })
  .pipe(z.date().nullable().optional());

const optionalCountryCodeSchema = z
  .unknown()
  .optional()
  .transform((value) => {
    if (value === undefined) return undefined;
    return typeof value === "string" ? value.trim().toUpperCase() : "";
  })
  .transform((value) =>
    value === undefined ? undefined : value ? value : null,
  )
  .refine(
    (value) => value === undefined || value === null || /^[A-Z]{2}$/.test(value),
    {
      message: "Use a two-letter country code.",
    },
  );

const allowedImageHostPattern = (() => {
  const r2Public = process.env.R2_PUBLIC_URL?.replace(/\/$/, "");
  if (!r2Public) return null;
  try {
    const host = new URL(r2Public).hostname;
    return new RegExp(`^https://${host.replace(/\./g, "\\.")}/`);
  } catch {
    return null;
  }
})();

const optionalSiteLocalImageSchema = z
  .unknown()
  .optional()
  .transform((value) => {
    if (value === undefined) return undefined;
    const normalized = normalizePublicText(value, 500);
    return normalized ? normalized : null;
  })
  .refine(
    (value) => {
      if (value === undefined || value === null) return true;
      if (value.startsWith("/") && !value.startsWith("//")) return true;
      if (allowedImageHostPattern && allowedImageHostPattern.test(value)) {
        return true;
      }
      return false;
    },
    {
      message:
        "Use a site-local image path or an upload URL from this site's storage.",
    },
  );

const optionalLifeStatusInputSchema = z
  .unknown()
  .optional()
  .transform((value) => {
    if (value === undefined) return undefined;
    if (typeof value !== "string" || !value.trim()) {
      return PersonLifeStatus.UNKNOWN;
    }
    return value.trim();
  })
  .pipe(schemas.PersonLifeStatusSchema.optional());

const optionalCauseCategoryInputSchema = z
  .unknown()
  .optional()
  .transform((value) => {
    if (value === undefined) return undefined;
    if (typeof value !== "string" || !value.trim()) {
      return PersonDeathCauseCategory.UNKNOWN;
    }
    return value.trim();
  })
  .pipe(schemas.PersonDeathCauseCategorySchema.optional());

const memorialEvidenceInputSchema = z.object({
  id: optionalCleanStringSchema(MAX_CLIENT_DRAFT_ID_LENGTH),
  evidenceKind: z.preprocess((value) => {
    if (typeof value !== "string" || !value.trim()) {
      return PersonMemorialEvidenceKind.OTHER;
    }
    return value.trim();
  }, schemas.PersonMemorialEvidenceKindSchema),
  sourceUrl: cleanStringSchema(500).refine(
    (value) => {
      if (!value) return false;
      try {
        const url = new URL(value);
        return url.protocol === "https:" || url.protocol === "http:";
      } catch {
        return false;
      }
    },
    { message: "sourceUrl must be a valid http(s) URL." },
  ),
  title: cleanStringSchema(MAX_EVIDENCE_TITLE_LENGTH),
  description: cleanStringSchema(MAX_EVIDENCE_DESCRIPTION_LENGTH),
  containsSensitiveData: z
    .unknown()
    .optional()
    .refine((value) => value == null || value === false, {
      message:
        "Evidence uploads must be public. Do not upload private or sensitive files.",
    })
    .transform(() => false),
});

const updatePersonSchema = z
  .object({
    birthDate: optionalNullableDateInputSchema,
    causeCategory: optionalCauseCategoryInputSchema,
    conditionName: optionalCleanStringSchema(MAX_CONDITION_LENGTH),
    consentCourtEvidence: z
      .unknown()
      .optional()
      .transform((value) => (value === undefined ? undefined : value === true)),
    dateOfDeath: optionalNullableDateInputSchema,
    deathCountryCode: optionalCountryCodeSchema,
    displayName: optionalCleanStringSchema(MAX_NAME_LENGTH),
    imageUrl: optionalSiteLocalImageSchema,
    isPublic: z
      .unknown()
      .optional()
      .transform((value) => (value === undefined ? undefined : value !== false)),
    lifeStatus: optionalLifeStatusInputSchema,
    memorialEvidence: z
      .unknown()
      .optional()
      .transform((value) =>
        value === undefined
          ? undefined
          : Array.isArray(value)
            ? value.slice(0, MAX_EVIDENCE_ITEMS)
            : [],
      )
      .pipe(z.array(memorialEvidenceInputSchema).optional()),
    memorialMessage: optionalCleanStringSchema(MAX_MEMORIAL_MESSAGE_LENGTH),
    publicComment: optionalCleanStringSchema(MAX_COMMENT_LENGTH),
    referendumSlug: cleanStringSchema(80).transform((value) =>
      value ? value : TREATY_REFERENDUM_SLUG,
    ),
    relationshipType: optionalCleanStringSchema(
      MAX_RELATIONSHIP_LENGTH,
    ).transform((value) =>
      value === undefined ? undefined : value ? slugify(value) : "",
    ),
  })
  .superRefine((data, ctx) => {
    if (data.displayName !== undefined && !data.displayName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Name is required.",
        path: ["displayName"],
      });
    }

    if (data.birthDate && data.dateOfDeath && data.birthDate > data.dateOfDeath) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Birth date must be before date of death.",
        path: ["birthDate"],
      });
    }

    for (const field of [
      "displayName",
      "conditionName",
      "publicComment",
      "memorialMessage",
    ] as const) {
      if (data[field] && PUBLIC_TEXT_URL_PATTERN.test(data[field])) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Remove URLs and spam bait from the public card.",
          path: [field],
        });
      }
    }
  });

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await requireAuth();
    const { id } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    const parsed = updatePersonSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid person update",
          issues: parsed.error.issues.map((issue) => ({
            message: issue.message,
            path: issue.path,
          })),
        },
        { status: 400 },
      );
    }

    const existingPerson = await prisma.person.findUnique({
      where: { id },
      select: {
        birthDate: true,
        conditions: {
          where: { deletedAt: null },
          orderBy: { createdAt: "asc" },
          select: { conditionName: true, id: true },
          take: 1,
        },
        createdByUserId: true,
        deathDate: true,
        displayName: true,
        id: true,
        image: true,
        isPublic: true,
        lifeStatus: true,
        memorial: {
          select: {
            causeCategory: true,
            deathCountryCode: true,
            deletedAt: true,
            id: true,
            submissions: {
              where: { deletedAt: null, submittedByUserId: userId },
              orderBy: { createdAt: "desc" },
              select: {
                consentCourtEvidence: true,
                id: true,
                memorialMessage: true,
              },
              take: 1,
            },
          },
        },
      },
    });
    if (!existingPerson || existingPerson.createdByUserId !== userId) {
      return NextResponse.json({ error: "Person not found" }, { status: 404 });
    }

    const referendum = await prisma.referendum.findUnique({
      where: { slug: parsed.data.referendumSlug, deletedAt: null },
      select: { id: true },
    });
    if (!referendum) {
      return NextResponse.json({ error: "Referendum not found" }, { status: 404 });
    }

    const representedVote = await prisma.referendumVote.findFirst({
      where: {
        deletedAt: null,
        personId: id,
        referendumId: referendum.id,
        userId,
        voteSource: ReferendumVoteSource.REPRESENTED,
      },
      select: { id: true, publicComment: true },
    });
    if (!representedVote) {
      return NextResponse.json(
        { error: "Only the original representative can edit this person." },
        { status: 403 },
      );
    }

    const activeMemorial =
      existingPerson.memorial && !existingPerson.memorial.deletedAt
        ? existingPerson.memorial
        : null;
    const existingSubmission = activeMemorial?.submissions[0] ?? null;
    const existingCondition = existingPerson.conditions[0] ?? null;
    const finalLifeStatus = parsed.data.lifeStatus ?? existingPerson.lifeStatus;
    const finalIsPublic = parsed.data.isPublic ?? existingPerson.isPublic;
    const finalDisplayName =
      parsed.data.displayName ?? existingPerson.displayName;
    const finalBirthDate =
      parsed.data.birthDate === undefined
        ? existingPerson.birthDate
        : parsed.data.birthDate;
    const finalDateOfDeath =
      finalLifeStatus === PersonLifeStatus.DECEASED
        ? parsed.data.dateOfDeath === undefined
          ? existingPerson.deathDate
          : parsed.data.dateOfDeath
        : null;
    const finalDeathCountryCode =
      finalLifeStatus === PersonLifeStatus.DECEASED
        ? parsed.data.deathCountryCode === undefined
          ? activeMemorial?.deathCountryCode ?? null
          : parsed.data.deathCountryCode
        : null;
    const finalCauseCategory =
      parsed.data.causeCategory ??
      activeMemorial?.causeCategory ??
      PersonDeathCauseCategory.UNKNOWN;
    const finalMemorialMessage =
      parsed.data.memorialMessage ??
      existingSubmission?.memorialMessage ??
      "";
    const finalConsentCourtEvidence =
      parsed.data.consentCourtEvidence ??
      existingSubmission?.consentCourtEvidence ??
      false;
    const finalPublicComment =
      parsed.data.publicComment ?? representedVote.publicComment ?? "";
    const finalImageUrl =
      parsed.data.imageUrl === undefined
        ? existingPerson.image
        : parsed.data.imageUrl;
    const nextConditionName = parsed.data.conditionName;
    const nextRelationshipType = parsed.data.relationshipType;
    const nextMemorialEvidence = parsed.data.memorialEvidence;
    const newEvidenceCount =
      nextMemorialEvidence?.filter((evidence) => !evidence.id).length ?? 0;

    if (!finalDisplayName) {
      return NextResponse.json(
        {
          error: "Invalid person update",
          issues: [{ message: "Name is required.", path: ["displayName"] }],
        },
        { status: 400 },
      );
    }

    if (
      finalBirthDate &&
      finalDateOfDeath &&
      finalBirthDate > finalDateOfDeath
    ) {
      return NextResponse.json(
        {
          error: "Invalid person update",
          issues: [
            {
              message: "Birth date must be before date of death.",
              path: ["birthDate"],
            },
          ],
        },
        { status: 400 },
      );
    }

    if (newEvidenceCount > 0 && finalLifeStatus !== PersonLifeStatus.DECEASED) {
      return NextResponse.json(
        {
          error: "Invalid person update",
          issues: [
            {
              message: "Evidence uploads are only for memorials.",
              path: ["memorialEvidence"],
            },
          ],
        },
        { status: 400 },
      );
    }

    if (newEvidenceCount > 0 && !finalIsPublic) {
      return NextResponse.json(
        {
          error: "Invalid person update",
          issues: [
            {
              message: "Evidence uploads require a public memorial.",
              path: ["memorialEvidence"],
            },
          ],
        },
        { status: 400 },
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const now = new Date();
      const person = await tx.person.update({
        where: { id },
        data: {
          birthDate: finalBirthDate,
          deathDate: finalDateOfDeath,
          displayName: finalDisplayName,
          image: finalImageUrl,
          isPublic: finalIsPublic,
          lifeStatus: finalLifeStatus,
        },
        select: {
          displayName: true,
          id: true,
          image: true,
          isPublic: true,
          lifeStatus: true,
        },
      });

      await ensureSubjectForPerson(tx, {
        displayName: finalDisplayName,
        id: person.id,
      });

      let condition: { id: string } | null = null;
      if (nextConditionName !== undefined) {
        if (!nextConditionName) {
          if (existingCondition) {
            await tx.personCondition.update({
              where: { id: existingCondition.id },
              data: { deletedAt: now },
            });
          }
        } else {
          const canonicalCondition = await findCanonicalConditionGlobalVariable(
            tx,
            nextConditionName,
          );
          const primaryCode = canonicalCondition?.externalCodes[0] ?? null;
          const conditionData = {
            conditionCode: primaryCode?.code ?? null,
            conditionCodeSystem: primaryCode?.codeSystem ?? null,
            conditionName: nextConditionName,
            deletedAt: null,
            globalVariableId: canonicalCondition?.id ?? null,
            isPublic: finalIsPublic,
            reportedByUserId: userId,
            status:
              finalLifeStatus === PersonLifeStatus.DECEASED
                ? PersonConditionStatus.CAUSE_OF_DEATH
                : PersonConditionStatus.ACTIVE,
          };
          condition = existingCondition
            ? await tx.personCondition.update({
                where: { id: existingCondition.id },
                data: conditionData,
                select: { id: true },
              })
            : await tx.personCondition.create({
                data: { ...conditionData, personId: id },
                select: { id: true },
              });
        }
      } else if (existingCondition) {
        const canonicalCondition = await findCanonicalConditionGlobalVariable(
          tx,
          existingCondition.conditionName,
        );
        const primaryCode = canonicalCondition?.externalCodes[0] ?? null;
        const conditionData = {
          conditionCode: primaryCode?.code ?? null,
          conditionCodeSystem: primaryCode?.codeSystem ?? null,
          conditionName: existingCondition.conditionName,
          globalVariableId: canonicalCondition?.id ?? null,
          isPublic: finalIsPublic,
          reportedByUserId: userId,
          status:
            finalLifeStatus === PersonLifeStatus.DECEASED
              ? PersonConditionStatus.CAUSE_OF_DEATH
              : PersonConditionStatus.ACTIVE,
        };
        condition = await tx.personCondition.update({
          where: { id: existingCondition.id },
          data: conditionData,
          select: { id: true },
        });
      }

      await tx.referendumVote.update({
        where: { id: representedVote.id },
        data: {
          answer: VotePosition.YES,
          isPublic: finalIsPublic,
          publicComment: finalPublicComment || null,
        },
      });

      if (nextRelationshipType !== undefined) {
        const casterPerson = await ensurePersonForUser(userId, {}, tx);
        const existingRelationship = await tx.personRelationship.findFirst({
          where: {
            createdByUserId: userId,
            deletedAt: null,
            objectPersonId: id,
            subjectPersonId: casterPerson.id,
          },
          select: { id: true },
        });
        if (!nextRelationshipType) {
          if (existingRelationship) {
            await tx.personRelationship.update({
              where: { id: existingRelationship.id },
              data: { deletedAt: now },
            });
          }
        } else {
          const relationshipData = {
            createdByUserId: userId,
            deletedAt: null,
            isPublic: finalIsPublic,
            objectPersonId: id,
            relationshipType: nextRelationshipType,
            subjectPersonId: casterPerson.id,
          };
          if (existingRelationship) {
            await tx.personRelationship.update({
              where: { id: existingRelationship.id },
              data: relationshipData,
            });
          } else {
            await tx.personRelationship.create({ data: relationshipData });
          }
        }
      }

      let memorialId: string | null = null;
      if (finalLifeStatus !== PersonLifeStatus.DECEASED) {
        const existingMemorial = await tx.personMemorial.findUnique({
          where: { personId: id },
          select: { id: true },
        });
        if (existingMemorial) {
          await tx.personMemorial.update({
            where: { id: existingMemorial.id },
            data: { deletedAt: now },
          });
          await tx.personMemorialSubmission.updateMany({
            where: { deletedAt: null, memorialId: existingMemorial.id },
            data: { deletedAt: now },
          });
          await tx.personMemorialEvidence.updateMany({
            where: { deletedAt: null, memorialId: existingMemorial.id },
            data: { deletedAt: now },
          });
          await tx.personMemorialResponsibleParty.updateMany({
            where: { deletedAt: null, memorialId: existingMemorial.id },
            data: { deletedAt: now },
          });
        }
        return { memorialId, person: { ...person, evidence: [] } };
      }

      const memorial = await tx.personMemorial.upsert({
        where: { personId: id },
        update: {
          causeCategory: finalCauseCategory,
          civilianStatus: PersonCivilianStatus.UNKNOWN,
          deathCountryCode: finalDeathCountryCode,
          deletedAt: null,
          isPublic: finalIsPublic,
          primaryPersonConditionId: condition?.id ?? null,
        },
        create: {
          causeCategory: finalCauseCategory,
          civilianStatus: PersonCivilianStatus.UNKNOWN,
          deathCountryCode: finalDeathCountryCode,
          isPublic: finalIsPublic,
          personId: id,
          primaryPersonConditionId: condition?.id ?? null,
        },
        select: { id: true },
      });
      memorialId = memorial.id;

      const existingMemorialSubmission =
        await tx.personMemorialSubmission.findFirst({
          where: { deletedAt: null, memorialId, submittedByUserId: userId },
          select: { id: true },
        });
      const submissionData = {
        consentCourtEvidence: finalConsentCourtEvidence,
        consentCourtEvidenceAt: finalConsentCourtEvidence ? now : null,
        consentPublicDisplay: finalIsPublic,
        consentPublicDisplayAt: finalIsPublic ? now : null,
        isPublic: finalIsPublic,
        memorialMessage: finalMemorialMessage || null,
      };
      if (existingMemorialSubmission) {
        await tx.personMemorialSubmission.update({
          where: { id: existingMemorialSubmission.id },
          data: submissionData,
        });
      } else {
        await tx.personMemorialSubmission.create({
          data: {
            ...submissionData,
            memorialId,
            submittedByUserId: userId,
          },
        });
      }

      if (nextMemorialEvidence !== undefined) {
        const existingEvidence = await tx.personMemorialEvidence.findMany({
          where: { deletedAt: null, memorialId, submittedByUserId: userId },
          select: { id: true, sourceUrl: true },
        });
        const existingEvidenceById = new Map(
          existingEvidence.map((evidence) => [evidence.id, evidence]),
        );
        const existingEvidenceBySourceUrl = new Map(
          existingEvidence
            .filter((evidence) => evidence.sourceUrl)
            .map((evidence) => [evidence.sourceUrl!, evidence]),
        );
        const keptEvidenceIds = new Set<string>();
        const seenSourceUrls = new Set<string>();

        for (const evidence of nextMemorialEvidence) {
          if (seenSourceUrls.has(evidence.sourceUrl)) continue;
          seenSourceUrls.add(evidence.sourceUrl);
          const existing =
            (evidence.id ? existingEvidenceById.get(evidence.id) : null) ??
            existingEvidenceBySourceUrl.get(evidence.sourceUrl) ??
            null;
          const evidenceData = {
            containsSensitiveData: false,
            description: evidence.description || null,
            evidenceKind: evidence.evidenceKind,
            isPublic: finalIsPublic,
            memorialId,
            sourceUrl: evidence.sourceUrl,
            submittedByUserId: userId,
            title: evidence.title || null,
          };
          const savedEvidence = existing
            ? await tx.personMemorialEvidence.update({
                where: { id: existing.id },
                data: { ...evidenceData, deletedAt: null },
                select: { id: true },
              })
            : await tx.personMemorialEvidence.create({
                data: evidenceData,
                select: { id: true },
              });
          keptEvidenceIds.add(savedEvidence.id);
        }

        await tx.personMemorialEvidence.updateMany({
          where: {
            deletedAt: null,
            memorialId,
            submittedByUserId: userId,
            ...(keptEvidenceIds.size > 0
              ? { id: { notIn: Array.from(keptEvidenceIds) } }
              : {}),
          },
          data: { deletedAt: now },
        });
      } else {
        await tx.personMemorialEvidence.updateMany({
          where: { deletedAt: null, memorialId, submittedByUserId: userId },
          data: { isPublic: finalIsPublic },
        });
      }

      const evidence = await tx.personMemorialEvidence.findMany({
        where: { deletedAt: null, memorialId, submittedByUserId: userId },
        orderBy: { createdAt: "desc" },
        select: {
          description: true,
          evidenceKind: true,
          id: true,
          sourceUrl: true,
          title: true,
        },
        take: MAX_EVIDENCE_ITEMS,
      });

      return {
        memorialId,
        person: {
          ...person,
          evidence: evidence.map((item) => ({
            description: item.description ?? "",
            evidenceKind: item.evidenceKind,
            id: item.id,
            sourceUrl: item.sourceUrl ?? "",
            title: item.title ?? "",
          })),
        },
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Failed to update represented person", error);
    return NextResponse.json(
      { error: "Failed to update represented person" },
      { status: 500 },
    );
  }
}

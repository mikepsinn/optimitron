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

function normalizePublicText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ").slice(0, maxLength);
}

function cleanStringSchema(maxLength: number) {
  return z.unknown().transform((value) => normalizePublicText(value, maxLength));
}

const nullableDateInputSchema = z
  .unknown()
  .transform((value) => {
    if (typeof value !== "string" || !value.trim()) return null;
    return new Date(`${value.trim()}T00:00:00.000Z`);
  })
  .pipe(z.date().nullable());

const countryCodeSchema = z
  .unknown()
  .transform((value) =>
    typeof value === "string" ? value.trim().toUpperCase() : "",
  )
  .transform((value) => (value ? value : null))
  .refine((value) => value === null || /^[A-Z]{2}$/.test(value), {
    message: "Use a two-letter country code.",
  });

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

const siteLocalImageSchema = z
  .unknown()
  .transform((value) => normalizePublicText(value, 500))
  .transform((value) => (value ? value : null))
  .refine(
    (value) => {
      if (value === null) return true;
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

const lifeStatusInputSchema = z.preprocess((value) => {
  if (typeof value !== "string" || !value.trim()) {
    return PersonLifeStatus.UNKNOWN;
  }
  return value.trim();
}, schemas.PersonLifeStatusSchema);

const causeCategoryInputSchema = z.preprocess((value) => {
  if (typeof value !== "string" || !value.trim()) {
    return PersonDeathCauseCategory.UNKNOWN;
  }
  return value.trim();
}, schemas.PersonDeathCauseCategorySchema);

const memorialEvidenceInputSchema = z.object({
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
    birthDate: nullableDateInputSchema,
    causeCategory: causeCategoryInputSchema,
    conditionName: cleanStringSchema(MAX_CONDITION_LENGTH),
    consentCourtEvidence: z.unknown().transform((value) => value === true),
    dateOfDeath: nullableDateInputSchema,
    deathCountryCode: countryCodeSchema,
    displayName: cleanStringSchema(MAX_NAME_LENGTH),
    imageUrl: siteLocalImageSchema,
    isPublic: z.unknown().transform((value) => value !== false),
    lifeStatus: lifeStatusInputSchema,
    memorialEvidence: z
      .unknown()
      .transform((value) =>
        Array.isArray(value) ? value.slice(0, MAX_EVIDENCE_ITEMS) : [],
      )
      .pipe(z.array(memorialEvidenceInputSchema)),
    memorialMessage: cleanStringSchema(MAX_MEMORIAL_MESSAGE_LENGTH),
    publicComment: cleanStringSchema(MAX_COMMENT_LENGTH),
    referendumSlug: cleanStringSchema(80).transform((value) =>
      value ? value : TREATY_REFERENDUM_SLUG,
    ),
    relationshipType: cleanStringSchema(MAX_RELATIONSHIP_LENGTH).transform(
      (value) => slugify(value),
    ),
  })
  .superRefine((data, ctx) => {
    if (!data.displayName) {
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

    if (
      data.memorialEvidence.length > 0 &&
      data.lifeStatus !== PersonLifeStatus.DECEASED
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Evidence uploads are only for memorials.",
        path: ["memorialEvidence"],
      });
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
      select: { createdByUserId: true, id: true },
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
      select: { id: true },
    });
    if (!representedVote) {
      return NextResponse.json(
        { error: "Only the original representative can edit this person." },
        { status: 403 },
      );
    }

    const {
      birthDate,
      causeCategory,
      conditionName,
      consentCourtEvidence,
      dateOfDeath,
      deathCountryCode,
      displayName,
      imageUrl,
      isPublic,
      lifeStatus,
      memorialEvidence,
      memorialMessage,
      publicComment,
      relationshipType,
    } = parsed.data;

    const result = await prisma.$transaction(async (tx) => {
      const person = await tx.person.update({
        where: { id },
        data: {
          birthDate,
          deathDate: dateOfDeath,
          displayName,
          image: imageUrl,
          isPublic,
          lifeStatus,
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
        displayName,
        id: person.id,
      });

      let condition: { id: string } | null = null;
      if (conditionName) {
        const canonicalCondition = await findCanonicalConditionGlobalVariable(
          tx,
          conditionName,
        );
        const primaryCode = canonicalCondition?.externalCodes[0] ?? null;
        const existingCondition = await tx.personCondition.findFirst({
          where: { deletedAt: null, personId: id },
          orderBy: { createdAt: "asc" },
          select: { id: true },
        });
        const conditionData = {
          conditionCode: primaryCode?.code ?? null,
          conditionCodeSystem: primaryCode?.codeSystem ?? null,
          conditionName,
          globalVariableId: canonicalCondition?.id ?? null,
          isPublic,
          reportedByUserId: userId,
          status:
            lifeStatus === PersonLifeStatus.DECEASED
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

      await tx.referendumVote.update({
        where: { id: representedVote.id },
        data: {
          answer: VotePosition.YES,
          isPublic,
          publicComment: publicComment || null,
        },
      });

      if (relationshipType) {
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
        const relationshipData = {
          createdByUserId: userId,
          isPublic,
          objectPersonId: id,
          relationshipType,
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

      let memorialId: string | null = null;
      if (
        lifeStatus === PersonLifeStatus.DECEASED ||
        dateOfDeath ||
        deathCountryCode ||
        memorialMessage ||
        memorialEvidence.length > 0
      ) {
        const memorial = await tx.personMemorial.upsert({
          where: { personId: id },
          update: {
            causeCategory,
            civilianStatus: PersonCivilianStatus.UNKNOWN,
            deathCountryCode,
            isPublic,
            primaryPersonConditionId: condition?.id ?? undefined,
          },
          create: {
            causeCategory,
            civilianStatus: PersonCivilianStatus.UNKNOWN,
            deathCountryCode,
            isPublic,
            personId: id,
            primaryPersonConditionId: condition?.id ?? null,
          },
          select: { id: true },
        });
        memorialId = memorial.id;

        const existingSubmission = await tx.personMemorialSubmission.findFirst({
          where: { memorialId, submittedByUserId: userId },
          select: { id: true },
        });
        const now = new Date();
        const submissionData = {
          consentCourtEvidence,
          consentCourtEvidenceAt: consentCourtEvidence ? now : null,
          consentPublicDisplay: isPublic,
          consentPublicDisplayAt: isPublic ? now : null,
          isPublic,
          memorialMessage: memorialMessage || null,
        };
        if (existingSubmission) {
          await tx.personMemorialSubmission.update({
            where: { id: existingSubmission.id },
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

        for (const evidence of memorialEvidence) {
          await tx.personMemorialEvidence.create({
            data: {
              containsSensitiveData: false,
              description: evidence.description || null,
              evidenceKind: evidence.evidenceKind,
              isPublic: true,
              memorialId,
              sourceUrl: evidence.sourceUrl,
              submittedByUserId: userId,
              title: evidence.title || null,
            },
          });
        }
      }

      return { memorialId, person };
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

import { NextResponse } from "next/server";
import {
  PersonCivilianStatus,
  PersonConditionStatus,
  PersonDeathCauseCategory,
  PersonLifeStatus,
  PersonMemorialEvidenceKind,
  ReferendumStatus,
  ReferendumVoteSource,
  VotePosition,
  schemas,
} from "@optimitron/db";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-utils";
import {
  matchEfficacyLagForMemorial,
  type EfficacyLagMatch,
} from "@/lib/efficacy-lag-matcher.server";
import { findCanonicalConditionGlobalVariable } from "@/lib/global-variable-lookup.server";
import { prisma } from "@/lib/prisma";
import { ensurePersonForUser } from "@/lib/person.server";
import { slugify } from "@/lib/slugify";
import { ensureSubjectForPerson } from "@/lib/subject.server";

const MAX_NAME_LENGTH = 80;
const MAX_CONDITION_LENGTH = 80;
const MAX_COMMENT_LENGTH = 220;
const MAX_MEMORIAL_MESSAGE_LENGTH = 500;
const MAX_RELATIONSHIP_LENGTH = 48;
const MAX_RESPONSIBLE_PARTY_LENGTH = 120;
const MAX_CIRCUMSTANCES_LENGTH = 1000;
const MAX_CONFLICT_NAME_OVERRIDE_LENGTH = 120;
const MAX_RESPONSIBLE_PARTIES = 5;
const CONFLICT_CAUSE_CATEGORIES = new Set<PersonDeathCauseCategory>([
  PersonDeathCauseCategory.ARMED_CONFLICT,
  PersonDeathCauseCategory.STATE_VIOLENCE,
  PersonDeathCauseCategory.TERRORISM,
]);
const MAX_CLIENT_DRAFT_ID_LENGTH = 120;
const MAX_ORIGIN_URL_LENGTH = 2048;
const PUBLIC_TEXT_URL_PATTERN =
  /(?:https?:\/\/|www\.|(?:^|\s)[a-z0-9][a-z0-9.-]*\.(?:ai|biz|co|com|gov|info|io|net|org|ru|uk|us|xyz)\b)/i;

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
  .transform((value) => (typeof value === "string" ? value.trim().toUpperCase() : ""))
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
      if (allowedImageHostPattern && allowedImageHostPattern.test(value)) return true;
      return false;
    },
    { message: "Use a site-local image path or an upload URL from this site's storage." },
  );

const lifeStatusInputSchema = z.preprocess((value) => {
  if (typeof value !== "string" || !value.trim()) return PersonLifeStatus.UNKNOWN;
  return value.trim();
}, schemas.PersonLifeStatusSchema);

const causeCategoryInputSchema = z.preprocess((value) => {
  if (typeof value !== "string" || !value.trim()) {
    return PersonDeathCauseCategory.UNKNOWN;
  }
  return value.trim();
}, schemas.PersonDeathCauseCategorySchema);

const civilianStatusInputSchema = z.preprocess((value) => {
  if (typeof value !== "string" || !value.trim()) return PersonCivilianStatus.UNKNOWN;
  return value.trim();
}, schemas.PersonCivilianStatusSchema);

const wasChildInputSchema = z.preprocess((value) => {
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return null;
}, z.boolean().nullable());

const MAX_EVIDENCE_ITEMS = 8;
const MAX_EVIDENCE_TITLE_LENGTH = 120;
const MAX_EVIDENCE_DESCRIPTION_LENGTH = 500;

const memorialEvidenceInputSchema = z.object({
  evidenceKind: z.preprocess((value) => {
    if (typeof value !== "string" || !value.trim()) return PersonMemorialEvidenceKind.OTHER;
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
      message: "Evidence uploads must be public. Do not upload private or sensitive files.",
    })
    .transform(() => false),
});

const responsiblePartyInputSchema = z.object({
  jurisdictionCode: z
    .unknown()
    .transform((value) => (typeof value === "string" ? value.trim().toUpperCase() : ""))
    .transform((value) => (value ? value : null))
    .refine((value) => value === null || /^[A-Z]{2,8}(?:-[A-Z0-9]{1,3})?$/.test(value), {
      message: "Use a valid ISO jurisdiction code.",
    }),
  name: cleanStringSchema(MAX_RESPONSIBLE_PARTY_LENGTH),
  roleSlug: cleanStringSchema(48).transform((value) => (value ? slugify(value) : "")),
});

const representedPersonSubmissionSchema = z
  .object({
    birthDate: nullableDateInputSchema,
    causeCategory: causeCategoryInputSchema,
    circumstances: cleanStringSchema(MAX_CIRCUMSTANCES_LENGTH),
    civilianStatus: civilianStatusInputSchema,
    clientDraftId: cleanStringSchema(MAX_CLIENT_DRAFT_ID_LENGTH).transform(
      (value) => (value ? value : null),
    ),
    conditionName: cleanStringSchema(MAX_CONDITION_LENGTH),
    conflictId: cleanStringSchema(48).transform((value) => (value ? value : null)),
    conflictNameOverride: cleanStringSchema(MAX_CONFLICT_NAME_OVERRIDE_LENGTH),
    consentCourtEvidence: z.unknown().transform((value) => value === true),
    dateOfDeath: nullableDateInputSchema,
    deathCountryCode: countryCodeSchema,
    displayName: cleanStringSchema(MAX_NAME_LENGTH),
    imageUrl: siteLocalImageSchema,
    isPublic: z.unknown().transform((value) => value !== false),
    lifeStatus: lifeStatusInputSchema,
    memorialMessage: cleanStringSchema(MAX_MEMORIAL_MESSAGE_LENGTH),
    originUrl: cleanStringSchema(MAX_ORIGIN_URL_LENGTH)
      .transform((value) => (value ? value : null))
      .refine(
        (value) => {
          if (value === null) return true;
          try {
            const url = new URL(value);
            return url.protocol === "http:" || url.protocol === "https:";
          } catch {
            return false;
          }
        },
        { message: "Use a valid http(s) URL." },
      ),
    publicComment: cleanStringSchema(MAX_COMMENT_LENGTH),
    relationshipType: cleanStringSchema(MAX_RELATIONSHIP_LENGTH).transform((value) =>
      slugify(value),
    ),
    // New: structured multi-government attribution. Front-end sends an array;
    // legacy clients posting `responsiblePartyName` keep working via the
    // backward-compat fallback below.
    responsibleParties: z
      .unknown()
      .transform((value) => (Array.isArray(value) ? value.slice(0, MAX_RESPONSIBLE_PARTIES) : []))
      .pipe(z.array(responsiblePartyInputSchema)),
    responsiblePartyName: cleanStringSchema(MAX_RESPONSIBLE_PARTY_LENGTH),
    memorialEvidence: z
      .unknown()
      .transform((value) => (Array.isArray(value) ? value.slice(0, MAX_EVIDENCE_ITEMS) : []))
      .pipe(z.array(memorialEvidenceInputSchema)),
    wasChild: wasChildInputSchema,
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

    if (data.memorialEvidence.length > 0) {
      if (data.lifeStatus !== PersonLifeStatus.DECEASED) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Evidence uploads are only for memorial votes.",
          path: ["memorialEvidence"],
        });
      }
      if (!data.isPublic) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Evidence uploads require a public memorial.",
          path: ["memorialEvidence"],
        });
      }
    }

    for (const field of [
      "displayName",
      "conditionName",
      "publicComment",
      "memorialMessage",
    ] as const) {
      if (PUBLIC_TEXT_URL_PATTERN.test(data[field])) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Remove URLs and spam bait from the public card.",
          path: [field],
        });
      }
    }
  });

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { userId } = await requireAuth();
    const { slug } = await params;
    let body: Record<string, unknown>;
    try {
      const rawBody = (await request.json()) as unknown;
      body =
        rawBody && typeof rawBody === "object" && !Array.isArray(rawBody)
          ? (rawBody as Record<string, unknown>)
          : {};
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = representedPersonSubmissionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid represented person submission",
          issues: parsed.error.issues.map((issue) => ({
            message: issue.message,
            path: issue.path,
          })),
        },
        { status: 400 },
      );
    }

    const {
      birthDate,
      causeCategory,
      circumstances,
      civilianStatus,
      clientDraftId,
      conditionName,
      conflictId,
      conflictNameOverride,
      consentCourtEvidence,
      dateOfDeath,
      deathCountryCode,
      displayName,
      imageUrl,
      isPublic,
      lifeStatus,
      memorialEvidence,
      memorialMessage,
      originUrl,
      publicComment,
      relationshipType,
      responsibleParties,
      responsiblePartyName,
      wasChild,
    } = parsed.data;

    const isConflictCause = CONFLICT_CAUSE_CATEGORIES.has(causeCategory);

    // Resolve the chosen Conflict — accept id, slug, or fall back to free text.
    let resolvedConflictId: string | null = null;
    if (conflictId) {
      const match = await prisma.conflict.findFirst({
        where: { deletedAt: null, OR: [{ id: conflictId }, { slug: conflictId }] },
        select: { id: true },
      });
      resolvedConflictId = match?.id ?? null;
    }
    const conflictNameForCircumstances =
      isConflictCause && !resolvedConflictId && conflictNameOverride
        ? conflictNameOverride
        : null;
    const circumstancesText = [conflictNameForCircumstances, circumstances]
      .filter(Boolean)
      .join(" — ");

    // Combine the legacy single responsiblePartyName field with the new
    // responsibleParties array. First entry becomes primary; cap total.
    const partiesFromLegacy = responsiblePartyName
      ? [{ jurisdictionCode: null as string | null, name: responsiblePartyName, roleSlug: "" }]
      : [];
    const dedupedParties: Array<{
      jurisdictionCode: string | null;
      name: string;
      roleSlug: string;
    }> = [];
    for (const party of [...responsibleParties, ...partiesFromLegacy]) {
      if (!party.jurisdictionCode && !party.name) continue;
      const key = `${party.jurisdictionCode ?? ""}::${party.name.toLowerCase()}`;
      if (dedupedParties.some((p) => `${p.jurisdictionCode ?? ""}::${p.name.toLowerCase()}` === key)) {
        continue;
      }
      dedupedParties.push(party);
      if (dedupedParties.length >= MAX_RESPONSIBLE_PARTIES) break;
    }

    // Resolve jurisdictionCode → jurisdictionId in one batch query.
    const jurisdictionCodes = Array.from(
      new Set(
        dedupedParties
          .map((p) => p.jurisdictionCode)
          .filter((code): code is string => code !== null),
      ),
    );
    const jurisdictionRows = jurisdictionCodes.length
      ? await prisma.jurisdiction.findMany({
          where: { code: { in: jurisdictionCodes }, deletedAt: null },
          select: { id: true, code: true, name: true },
        })
      : [];
    const jurisdictionByCode = new Map(jurisdictionRows.map((r) => [r.code, r]));

    const referendum = await prisma.referendum.findUnique({
      where: { slug, deletedAt: null },
      select: { id: true, slug: true, status: true },
    });

    if (!referendum) {
      return NextResponse.json({ error: "Referendum not found" }, { status: 404 });
    }

    if (referendum.status !== ReferendumStatus.ACTIVE) {
      return NextResponse.json(
        { error: "This referendum is not currently accepting votes" },
        { status: 400 },
      );
    }

    const casterPerson = await ensurePersonForUser(userId);
    const sourceRef = clientDraftId
      ? `represented-person-draft:${userId}:${clientDraftId}`
      : null;

    const result = await prisma.$transaction(async (tx) => {
      const existingDraftPerson = sourceRef
        ? await tx.person.findUnique({
            where: { sourceRef },
            select: {
              displayName: true,
              handle: true,
              id: true,
              isPublic: true,
              lifeStatus: true,
            },
          })
        : null;
      const personData = {
        birthDate,
        createdByUserId: userId,
        deathDate: dateOfDeath,
        displayName,
        image: imageUrl,
        isPublic,
        lifeStatus,
        ...(sourceRef ? { sourceRef } : {}),
      };
      const personSelect = {
        displayName: true,
        handle: true,
        id: true,
        isPublic: true,
        lifeStatus: true,
      } as const;
      const person = sourceRef
        ? await tx.person.upsert({
            where: { sourceRef },
            create: personData,
            update: personData,
            select: personSelect,
          })
        : await tx.person.create({
            data: personData,
            select: personSelect,
          });
      await ensureSubjectForPerson(tx, {
        displayName,
        id: person.id,
      });

      let condition: { id: string } | null = null;
      if (!existingDraftPerson && conditionName) {
        const canonicalCondition = await findCanonicalConditionGlobalVariable(
          tx,
          conditionName,
        );
        const primaryCode = canonicalCondition?.externalCodes[0] ?? null;

        condition = await tx.personCondition.create({
          data: {
            conditionCode: primaryCode?.code ?? null,
            conditionCodeSystem: primaryCode?.codeSystem ?? null,
            conditionName,
            globalVariableId: canonicalCondition?.id ?? null,
            isPublic,
            personId: person.id,
            reportedByUserId: userId,
            status:
              lifeStatus === PersonLifeStatus.DECEASED
                ? PersonConditionStatus.CAUSE_OF_DEATH
                : PersonConditionStatus.ACTIVE,
          },
          select: { id: true },
        });
      }

      let efficacyLagMatches: EfficacyLagMatch[] = [];
      if (!existingDraftPerson && lifeStatus === PersonLifeStatus.DECEASED) {
        const consentTimestamp = new Date();
        const memorial = await tx.personMemorial.create({
          data: {
            causeCategory,
            circumstances: circumstancesText || null,
            civilianStatus: isConflictCause ? civilianStatus : PersonCivilianStatus.UNKNOWN,
            conflictId: resolvedConflictId,
            deathCountryCode,
            isPublic,
            personId: person.id,
            primaryPersonConditionId: condition?.id ?? null,
            wasChild: isConflictCause ? wasChild : null,
          },
          select: { id: true },
        });

        await tx.personMemorialSubmission.create({
          data: {
            consentCourtEvidence,
            consentCourtEvidenceAt: consentCourtEvidence ? consentTimestamp : null,
            consentPublicDisplay: isPublic,
            consentPublicDisplayAt: isPublic ? consentTimestamp : null,
            isPublic,
            memorialId: memorial.id,
            memorialMessage: memorialMessage || publicComment || null,
            submittedByUserId: userId,
          },
        });

        for (let i = 0; i < dedupedParties.length; i++) {
          const party = dedupedParties[i]!;
          const jurisdictionRow = party.jurisdictionCode
            ? jurisdictionByCode.get(party.jurisdictionCode) ?? null
            : null;
          // Prefer the canonical jurisdiction name when we matched one — keeps
          // the public attribution consistent regardless of typed casing.
          const partyName = jurisdictionRow?.name ?? party.name ?? null;
          await tx.personMemorialResponsibleParty.create({
            data: {
              isPrimary: i === 0,
              isPublic,
              jurisdictionId: jurisdictionRow?.id ?? null,
              memorialId: memorial.id,
              name: partyName,
              roleSlug: party.roleSlug || null,
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
              memorialId: memorial.id,
              sourceUrl: evidence.sourceUrl,
              submittedByUserId: userId,
              title: evidence.title || null,
            },
          });
        }

        // PRD Feature 3: cross-reference death against approval-lag windows.
        // Best-effort — failures should not block memorial creation.
        try {
          efficacyLagMatches = await matchEfficacyLagForMemorial(tx, memorial.id);
        } catch (matchError) {
          console.error("Efficacy-lag matcher failed", { memorialId: memorial.id, matchError });
        }
      }

      if (!existingDraftPerson && relationshipType) {
        await tx.personRelationship.create({
          data: {
            createdByUserId: userId,
            isPublic,
            objectPersonId: person.id,
            relationshipType,
            subjectPersonId: casterPerson.id,
          },
        });
      }

      const vote = await tx.referendumVote.upsert({
        where: {
          referendumId_personId: {
            referendumId: referendum.id,
            personId: person.id,
          },
        },
        update: {
          answer: VotePosition.YES,
          deletedAt: null,
          isPublic,
          ...(originUrl ? { originUrl } : {}),
          publicComment: publicComment || null,
        },
        create: {
          answer: VotePosition.YES,
          isPublic,
          originUrl: originUrl || null,
          personId: person.id,
          publicComment: publicComment || null,
          referendumId: referendum.id,
          userId,
          voteSource: ReferendumVoteSource.REPRESENTED,
        },
        select: {
          answer: true,
          id: true,
          personId: true,
          userId: true,
          voteSource: true,
        },
      });

      return { efficacyLagMatches, person, vote };
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Failed to add represented person", error);
    return NextResponse.json(
      { error: "Failed to add represented person" },
      { status: 500 },
    );
  }
}

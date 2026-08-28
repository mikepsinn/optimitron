import {
  CourtCasePartyRole,
  CourtCaseStatus,
  HUMANITY_V_GOVERNMENT_CASE_SLUG as DB_HUMANITY_V_GOVERNMENT_CASE_SLUG,
  HUMANITY_V_GOVERNMENT_VERDICT_REFERENDUM_SLUG,
  VotePosition,
} from "@optimitron/db";
import type { Prisma } from "@optimitron/db";
import { prisma } from "@/lib/prisma";

export const HUMANITY_V_GOVERNMENT_CASE_SLUG =
  DB_HUMANITY_V_GOVERNMENT_CASE_SLUG;
export const HUMANITY_V_GOVERNMENT_CASE_TITLE = "Humanity v Government";

/**
 * The verdict answers this case accepts. Derived from the database enum rather
 * than restated as string literals, so the three spellings cannot drift from
 * what `ReferendumVote.answer` actually stores.
 */
export type HumanityVGovernmentVerdictAnswer = Extract<
  VotePosition,
  "YES" | "NO" | "ABSTAIN"
>;

export interface HumanityVGovernmentVerdictStats {
  abstainCount: number;
  existingAnswer: HumanityVGovernmentVerdictAnswer | null;
  noCount: number;
  referendumSlug: string;
  yesCount: number;
}

type HumanityVGovernmentCaseClient = Pick<
  Prisma.TransactionClient,
  "courtCase" | "courtCaseParty"
>;

/**
 * Returns the live plaintiff count for *Humanity v. Government*.
 *
 * Counts soft-delete-aware `NAMED_PLAINTIFF` parties on the case. Returns 0
 * when the case row does not exist yet (the case is created lazily by
 * `ensureHumanityVGovernmentPlaintiffParty`, so a brand-new install hasn't
 * registered any plaintiffs yet).
 */
export async function getHumanityVGovernmentPlaintiffCount(): Promise<number> {
  const courtCase = await prisma.courtCase.findUnique({
    where: { slug: HUMANITY_V_GOVERNMENT_CASE_SLUG },
    select: { id: true, deletedAt: true },
  });
  if (!courtCase || courtCase.deletedAt) return 0;
  return prisma.courtCaseParty.count({
    where: {
      caseId: courtCase.id,
      role: CourtCasePartyRole.NAMED_PLAINTIFF,
      deletedAt: null,
    },
  });
}

export async function getHumanityVGovernmentVerdictStats(
  userId?: string | null,
): Promise<HumanityVGovernmentVerdictStats> {
  const fallback = {
    abstainCount: 0,
    existingAnswer: null,
    noCount: 0,
    referendumSlug: HUMANITY_V_GOVERNMENT_VERDICT_REFERENDUM_SLUG,
    yesCount: 0,
  } satisfies HumanityVGovernmentVerdictStats;

  // Both vote endpoints filter on `deletedAt: null`. Without the same filter
  // here, a soft-deleted referendum still renders its counts and the reader's
  // existing answer while every attempt to vote answers 404.
  const referendum = await prisma.referendum.findFirst({
    where: { deletedAt: null, slug: HUMANITY_V_GOVERNMENT_VERDICT_REFERENDUM_SLUG },
    select: { id: true },
  });
  if (!referendum) return fallback;

  const [groupedCounts, existingVote] = await Promise.all([
    prisma.referendumVote.groupBy({
      by: ["answer"],
      where: {
        deletedAt: null,
        referendumId: referendum.id,
      },
      _count: { _all: true },
    }),
    userId
      ? prisma.referendumVote.findFirst({
          where: {
            deletedAt: null,
            referendumId: referendum.id,
            userId,
          },
          select: { answer: true },
        })
      : Promise.resolve(null),
  ]);

  const counts = new Map(
    groupedCounts.map((row) => [row.answer, row._count._all]),
  );

  return {
    ...fallback,
    abstainCount: counts.get(VotePosition.ABSTAIN) ?? 0,
    existingAnswer:
      existingVote?.answer === VotePosition.YES ||
      existingVote?.answer === VotePosition.NO ||
      existingVote?.answer === VotePosition.ABSTAIN
        ? existingVote.answer
        : null,
    noCount: counts.get(VotePosition.NO) ?? 0,
    yesCount: counts.get(VotePosition.YES) ?? 0,
  };
}

export async function ensureHumanityVGovernmentPlaintiffParty(
  tx: HumanityVGovernmentCaseClient,
  input: {
    createdByUserId: string;
    displayName: string;
    isPublic: boolean;
    subjectId: string;
  },
) {
  const courtCase = await tx.courtCase.upsert({
    where: { slug: HUMANITY_V_GOVERNMENT_CASE_SLUG },
    update: {
      deletedAt: null,
      isPublic: true,
      title: HUMANITY_V_GOVERNMENT_CASE_TITLE,
    },
    create: {
      isPublic: true,
      slug: HUMANITY_V_GOVERNMENT_CASE_SLUG,
      status: CourtCaseStatus.OPEN,
      title: HUMANITY_V_GOVERNMENT_CASE_TITLE,
    },
    select: { id: true, slug: true },
  });

  return tx.courtCaseParty.upsert({
    where: {
      caseId_role_subjectId: {
        caseId: courtCase.id,
        role: CourtCasePartyRole.NAMED_PLAINTIFF,
        subjectId: input.subjectId,
      },
    },
    update: {
      createdByUserId: input.createdByUserId,
      deletedAt: null,
      displayNameSnapshot: input.displayName,
      isPublic: input.isPublic,
      role: CourtCasePartyRole.NAMED_PLAINTIFF,
    },
    create: {
      caseId: courtCase.id,
      createdByUserId: input.createdByUserId,
      displayNameSnapshot: input.displayName,
      isPublic: input.isPublic,
      role: CourtCasePartyRole.NAMED_PLAINTIFF,
      subjectId: input.subjectId,
    },
    select: { id: true },
  });
}

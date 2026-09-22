import {
  CourtCasePartyRole,
  HUMANITY_V_GOVERNMENT_CASE_SLUG as DB_HUMANITY_V_GOVERNMENT_CASE_SLUG,
  HUMANITY_V_GOVERNMENT_VERDICT_REFERENDUM_SLUG,
  VotePosition,
} from "@optimitron/db";
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
    select: { id: true, deletedAt: true, isPublic: true },
  });
  if (!courtCase || courtCase.deletedAt || !courtCase.isPublic) return 0;
  return prisma.courtCaseParty.count({
    where: {
      caseId: courtCase.id,
      case: { deletedAt: null, isPublic: true },
      role: CourtCasePartyRole.NAMED_PLAINTIFF,
      isPublic: true,
      deletedAt: null,
      subject: {
        deletedAt: null,
        person: { deletedAt: null, isPublic: true },
      },
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
    where: {
      deletedAt: null,
      publishedAt: { not: null },
      slug: HUMANITY_V_GOVERNMENT_VERDICT_REFERENDUM_SLUG,
    },
    select: { id: true },
  });
  if (!referendum) return fallback;

  const [groupedCounts, existingVote] = await Promise.all([
    prisma.referendumVote.groupBy({
      by: ["answer"],
      where: {
        deletedAt: null,
        referendumId: referendum.id,
        isPublic: true,
        person: { deletedAt: null, isPublic: true },
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

export { ensureHumanityVGovernmentPlaintiffParty } from "@optimitron/site-kit/lib/court-enrollment.server";

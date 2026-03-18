import { PersonhoodVerificationStatus, VotePosition } from "@optimitron/db";
import { prisma } from "@/lib/prisma";

export interface VerifiedVoteStats {
  totalReferrals: number;
  verifiedVotes: number;
  pendingVerification: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  image: string | null;
  verifiedVotes: number;
}

export interface ReferendumStats {
  totalVotes: number;
  yesVotes: number;
  noVotes: number;
  verifiedVotes: number;
}

/**
 * Count verified referendum votes attributed to a referrer.
 * A vote is "verified" when the voter has World ID personhood verification.
 */
export async function getVerifiedVoteCount(
  userId: string,
  referendumId?: string,
): Promise<number> {
  return prisma.referendumVote.count({
    where: {
      referredByUserId: userId,
      deletedAt: null,
      ...(referendumId ? { referendumId } : {}),
      user: {
        personhoodVerifications: {
          some: {
            status: PersonhoodVerificationStatus.VERIFIED,
            deletedAt: null,
          },
        },
      },
    },
  });
}

/**
 * Get detailed referral stats for a user across all referendums.
 */
export async function getVerifiedVoteStats(
  userId: string,
): Promise<VerifiedVoteStats> {
  const referrals = await prisma.referendumVote.findMany({
    where: {
      referredByUserId: userId,
      deletedAt: null,
    },
    select: {
      user: {
        select: {
          personhoodVerifications: {
            where: {
              status: PersonhoodVerificationStatus.VERIFIED,
              deletedAt: null,
            },
            select: { id: true },
            take: 1,
          },
        },
      },
    },
  });

  let verifiedVotes = 0;
  let pendingVerification = 0;

  for (const referral of referrals) {
    if (referral.user.personhoodVerifications.length > 0) {
      verifiedVotes++;
    } else {
      pendingVerification++;
    }
  }

  return {
    totalReferrals: referrals.length,
    verifiedVotes,
    pendingVerification,
  };
}

/**
 * Get the top referrers by verified vote count.
 */
export async function getTopReferrersByVerifiedVotes(
  referendumId?: string,
  limit = 10,
): Promise<LeaderboardEntry[]> {
  // Get all referendum votes with referrers, filtered to verified voters
  const votes = await prisma.referendumVote.groupBy({
    by: ["referredByUserId"],
    where: {
      referredByUserId: { not: null },
      deletedAt: null,
      ...(referendumId ? { referendumId } : {}),
      user: {
        personhoodVerifications: {
          some: {
            status: PersonhoodVerificationStatus.VERIFIED,
            deletedAt: null,
          },
        },
      },
    },
    _count: { _all: true },
    orderBy: { _count: { referredByUserId: "desc" } },
    take: limit,
  });

  if (votes.length === 0) {
    return [];
  }

  const userIds = votes
    .map((v) => v.referredByUserId)
    .filter((id): id is string => id !== null);

  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, username: true, image: true },
  });

  const userMap = new Map(users.map((u) => [u.id, u]));

  return votes
    .filter((v) => v.referredByUserId !== null)
    .map((v, index) => {
      const user = userMap.get(v.referredByUserId!);
      return {
        rank: index + 1,
        userId: v.referredByUserId!,
        name: user?.username ?? user?.name ?? "Anonymous",
        image: user?.image ?? null,
        verifiedVotes: v._count._all,
      };
    });
}

/**
 * Get the total number of verified votes across all referrers.
 */
export async function getGlobalVerifiedVoteCount(
  referendumId?: string,
): Promise<number> {
  return prisma.referendumVote.count({
    where: {
      deletedAt: null,
      ...(referendumId ? { referendumId } : {}),
      user: {
        personhoodVerifications: {
          some: {
            status: PersonhoodVerificationStatus.VERIFIED,
            deletedAt: null,
          },
        },
      },
    },
  });
}

/**
 * Get vote tallies for a specific referendum.
 */
export async function getReferendumStats(
  referendumId: string,
): Promise<ReferendumStats> {
  const [totalVotes, yesVotes, noVotes, verifiedVotes] = await Promise.all([
    prisma.referendumVote.count({
      where: { referendumId, deletedAt: null },
    }),
    prisma.referendumVote.count({
      where: { referendumId, deletedAt: null, answer: VotePosition.YES },
    }),
    prisma.referendumVote.count({
      where: { referendumId, deletedAt: null, answer: VotePosition.NO },
    }),
    prisma.referendumVote.count({
      where: {
        referendumId,
        deletedAt: null,
        user: {
          personhoodVerifications: {
            some: {
              status: PersonhoodVerificationStatus.VERIFIED,
              deletedAt: null,
            },
          },
        },
      },
    }),
  ]);

  return { totalVotes, yesVotes, noVotes, verifiedVotes };
}

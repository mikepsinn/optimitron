import { VoteAnswer } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function findUserByUsernameOrReferralCode(identifier: string | null | undefined) {
  const value = identifier?.trim();
  if (!value) {
    return null;
  }

  return prisma.user.findFirst({
    where: {
      OR: [
        {
          referralCode: {
            equals: value,
            mode: "insensitive",
          },
        },
        {
          username: {
            equals: value,
            mode: "insensitive",
          },
        },
      ],
    },
  });
}

export function getReferralVoteCount(userId: string) {
  return prisma.vote.count({
    where: { referredByUserId: userId },
  });
}

export async function recordReferralAttributionForUser(
  userId: string,
  identifier: string | null | undefined,
) {
  const referrer = await findUserByUsernameOrReferralCode(identifier);
  if (!referrer || referrer.id === userId) {
    return false;
  }

  const existingVote = await prisma.vote.findUnique({
    where: { userId },
  });

  if (existingVote) {
    return false;
  }

  await prisma.vote.create({
    data: {
      userId,
      answer: VoteAnswer.YES,
      referredByUserId: referrer.id,
    },
  });

  return true;
}

export async function getReferralCountsByUserIds(userIds: string[]) {
  if (userIds.length === 0) {
    return new Map<string, number>();
  }

  const rows = await prisma.vote.groupBy({
    by: ["referredByUserId"],
    where: {
      referredByUserId: { in: userIds },
      deletedAt: null,
    },
    _count: {
      _all: true,
    },
  });

  return new Map(
    rows
      .filter((row) => row.referredByUserId)
      .map((row) => [row.referredByUserId as string, row._count._all]),
  );
}

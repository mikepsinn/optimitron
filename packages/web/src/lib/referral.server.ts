import { ReferralAnswer } from "@optomitron/db";
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

export function getReferralCount(userId: string) {
  return prisma.referral.count({
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

  const existingVote = await prisma.referral.findUnique({
    where: { userId },
  });

  if (existingVote) {
    return false;
  }

  await prisma.referral.create({
    data: {
      userId,
      answer: ReferralAnswer.YES,
      referredByUserId: referrer.id,
    },
  });

  return true;
}

export async function getReferralCountsByUserIds(userIds: string[]) {
  if (userIds.length === 0) {
    return new Map<string, number>();
  }

  const rows = await prisma.referral.groupBy({
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

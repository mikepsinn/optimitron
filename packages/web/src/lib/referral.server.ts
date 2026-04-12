import { ReferralAnswer } from "@optimitron/db";
import { prisma } from "@/lib/prisma";
import { grantWishes } from "@/lib/wishes.server";
import { checkBadgesAfterWish } from "@/lib/badges.server";

export async function findUserByUsernameOrReferralCode(identifier: string | null | undefined) {
  const value = identifier?.trim();
  if (!value) {
    return null;
  }

  // Username is mirrored from Person.handle so existing username-based lookups
  // still work; we also include the linked Person on the result so callers can
  // route display reads through the user-display helpers.
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
        {
          person: {
            handle: {
              equals: value,
              mode: "insensitive",
            },
          },
        },
      ],
    },
    include: {
      person: {
        select: {
          id: true,
          handle: true,
          displayName: true,
          image: true,
        },
      },
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

  // Grant wish to the referrer (not the referred user)
  try {
    await grantWishes({
      userId: referrer.id,
      reason: "REFERRAL",
      amount: 1,
      dedupeKey: "referral-" + userId,
    });
    void checkBadgesAfterWish(referrer.id, "REFERRAL");
  } catch (wishError) {
    console.error("[REFERRAL] Wish grant error:", wishError);
  }

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

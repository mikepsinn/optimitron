import { ReferralAnswer } from "@optimitron/db";
import { prisma } from "@/lib/prisma";
import { grantWishes } from "@/lib/wishes.server";
import { checkBadgesAfterWish } from "@/lib/badges.server";

export async function findUserByHandleOrReferralCode(identifier: string | null | undefined) {
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
  shareAttemptId?: string | null,
) {
  const referrer = await findUserByHandleOrReferralCode(identifier);
  if (!referrer || referrer.id === userId) {
    return false;
  }

  const existingVote = await prisma.referral.findUnique({
    where: { userId },
  });

  if (existingVote) {
    return false;
  }

  // Attribute only the explicit sa= value carried through the signup flow.
  // Never guess from "most recent click" — that misattributes concurrent signups.
  const resolvedShareAttemptId = shareAttemptId
    ? await prisma.shareAttempt
        .findFirst({
          where: {
            id: shareAttemptId,
            userId: referrer.id,
          },
          select: { id: true },
        })
        .then((row) => row?.id ?? null)
        .catch(() => null)
    : null;

  await prisma.referral.create({
    data: {
      userId,
      answer: ReferralAnswer.YES,
      referredByUserId: referrer.id,
      originatingShareAttemptId: resolvedShareAttemptId,
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

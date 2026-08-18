import { prisma } from "@/lib/prisma";
import type { BadgeType, WishReason } from "@optimitron/db";

/**
 * Award a badge to a user (idempotent — @@unique([userId, type]) prevents duplicates).
 * Returns true if the badge was newly awarded, false if already owned.
 */
export async function awardBadge(
  userId: string,
  type: BadgeType,
  metadata?: string,
): Promise<boolean> {
  const result = await prisma.badge.createMany({
    data: { userId, type, metadata },
    skipDuplicates: true,
  });

  return result.count > 0;
}

/**
 * Check and award badges based on a wish grant reason.
 * Call this after granting wishes to trigger any milestone badges.
 */
export async function checkBadgesAfterWish(
  userId: string,
  reason: WishReason,
): Promise<void> {
  switch (reason) {
    case "WISHOCRATIC_ALLOCATION": {
      const count = await prisma.wishocraticAllocation.count({
        where: { userId, deletedAt: null },
      });
      if (count >= 1) await awardBadge(userId, "FIRST_COMPARISON");
      if (count >= 100) await awardBadge(userId, "HUNDRED_COMPARISONS");
      break;
    }
    case "REFERRAL": {
      const count = await prisma.referral.count({
        where: { referredByUserId: userId, deletedAt: null },
      });
      if (count >= 1) await awardBadge(userId, "FIRST_RECRUIT");
      if (count >= 10) await awardBadge(userId, "TEN_RECRUITS");
      break;
    }
    case "WORLD_ID_VERIFICATION": {
      await awardBadge(userId, "VERIFIED_HUMAN");
      break;
    }
    case "PRIZE_DEPOSIT": {
      await awardBadge(userId, "DEPOSITOR");
      break;
    }
    default:
      break;
  }
}

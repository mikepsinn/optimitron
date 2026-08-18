import { prisma } from "@/lib/prisma";
import type { WishReason, WishPoint } from "@optimitron/db";

/** Amounts granted for each action */
export const WISH_AMOUNTS: Record<WishReason, number> = {
  WORLD_ID_VERIFICATION: 10,
  KYC_COMPLETION: 5,
  CENSUS_SNAPSHOT: 5,
  DAILY_CHECKIN: 1,
  WISHOCRATIC_ALLOCATION: 2,
  REFERENDUM_VOTE: 2,
  ALIGNMENT_CHECK: 2,
  REFERRAL: 1,
  PRIZE_DEPOSIT: 1, // per $100 — caller computes actual amount
  SHARE_REPORT: 1,
  TASK_COMPLETED: 5,
};

interface GrantWishesParams {
  userId: string;
  reason: WishReason;
  /** Override the default amount (e.g. for PRIZE_DEPOSIT: floor(depositUsd / 100)) */
  amount?: number;
  activityId?: string;
  /** Dedup key — prevents duplicate grants for the same action. Stored in metadata. */
  dedupeKey?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Grant wishes for a user action. Idempotent when dedupeKey is provided —
 * won't grant twice for the same (userId, reason, dedupeKey) combo.
 */
export async function grantWishes({
  userId,
  reason,
  amount,
  activityId,
  dedupeKey,
  metadata,
}: GrantWishesParams): Promise<WishPoint | null> {
  const finalAmount = amount ?? WISH_AMOUNTS[reason];
  if (finalAmount <= 0) return null;

  // Dedup check
  if (dedupeKey) {
    const existing = await prisma.wishPoint.findFirst({
      where: {
        userId,
        reason,
        metadata: { contains: dedupeKey },
      },
    });
    if (existing) return existing;
  }

  const metadataJson = metadata
    ? JSON.stringify({ ...metadata, ...(dedupeKey ? { dedupeKey } : {}) })
    : dedupeKey
      ? JSON.stringify({ dedupeKey })
      : undefined;

  return prisma.wishPoint.create({
    data: {
      userId,
      amount: finalAmount,
      reason,
      activityId,
      metadata: metadataJson,
    },
  });
}

/** Get total wish balance for a user (computed from grants, never cached) */
export async function getWishBalance(userId: string): Promise<number> {
  const result = await prisma.wishPoint.aggregate({
    where: { userId },
    _sum: { amount: true },
  });
  return result._sum.amount ?? 0;
}

/** Get recent wish grants for a user */
export async function getWishHistory(
  userId: string,
  limit = 20,
): Promise<WishPoint[]> {
  return prisma.wishPoint.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/** Human-readable label for each wish reason */
export function getWishReasonLabel(reason: WishReason): string {
  const labels: Record<WishReason, string> = {
    WORLD_ID_VERIFICATION: "Verified Personhood",
    KYC_COMPLETION: "Completed KYC",
    CENSUS_SNAPSHOT: "Reported Census Data",
    DAILY_CHECKIN: "Daily Check-In",
    WISHOCRATIC_ALLOCATION: "Budget Allocation",
    REFERENDUM_VOTE: "Referendum Vote",
    ALIGNMENT_CHECK: "Alignment Check",
    REFERRAL: "Recruited a Voter",
    PRIZE_DEPOSIT: "Prize Deposit",
    SHARE_REPORT: "Shared Report",
    TASK_COMPLETED: "Verified Task Completion",
  };
  return labels[reason];
}

/** Emoji for each wish reason */
export function getWishReasonEmoji(reason: WishReason): string {
  const emojis: Record<WishReason, string> = {
    WORLD_ID_VERIFICATION: "🌐",
    KYC_COMPLETION: "🪪",
    CENSUS_SNAPSHOT: "📊",
    DAILY_CHECKIN: "☀️",
    WISHOCRATIC_ALLOCATION: "⚖️",
    REFERENDUM_VOTE: "🗳️",
    ALIGNMENT_CHECK: "🔮",
    REFERRAL: "🤝",
    PRIZE_DEPOSIT: "🏆",
    SHARE_REPORT: "📤",
    TASK_COMPLETED: "✅",
  };
  return emojis[reason];
}

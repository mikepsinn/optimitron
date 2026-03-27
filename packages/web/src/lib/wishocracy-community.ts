import { prisma } from "@/lib/prisma";
import { calculateAllocationsFromPairwise } from "@/lib/wishocracy-calculations";
import { WISHOCRATIC_ITEMS, type WishocraticItemId } from "@/lib/wishocracy-data";
import { createLogger } from "@/lib/logger";
import {
  isWishocraticItemId,
  isValidAllocationPair,
  isValidWishocraticAllocation,
  normalizeWishocraticAllocation,
  type WishocraticAllocationInput,
} from "@/lib/wishocracy-allocation";

const logger = createLogger("wishocracy-community");
export {
  isWishocraticItemId,
  isValidAllocationPair,
  isValidWishocraticAllocation,
  normalizeWishocraticAllocation,
  type WishocraticAllocationInput,
} from "@/lib/wishocracy-allocation";

export interface WishocraticStoredAllocation extends WishocraticAllocationInput {
  userId: string;
  updatedAt: Date;
}

export interface WishocracyCommunityCategory {
  categoryId: WishocraticItemId;
  percentage: number;
}

export interface WishocracyCommunitySummary {
  averageAllocations: Record<WishocraticItemId, number>;
  totalUsers: number;
  verifiedUsers: number;
  totalAllocations: number;
  topCategories: WishocracyCommunityCategory[];
}

export function createEmptyAverageAllocations(): Record<WishocraticItemId, number> {
  return Object.keys(WISHOCRATIC_ITEMS).reduce((allocations, categoryId) => {
    allocations[categoryId as WishocraticItemId] = 0;
    return allocations;
  }, {} as Record<WishocraticItemId, number>);
}

function buildTopCategories(
  averageAllocations: Record<WishocraticItemId, number>,
): WishocracyCommunityCategory[] {
  return Object.entries(averageAllocations)
    .map(([categoryId, percentage]) => ({
      categoryId: categoryId as WishocraticItemId,
      percentage,
    }))
    .filter((entry) => entry.percentage > 0)
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 5);
}

function dedupeLatestAllocations(
  allocations: WishocraticStoredAllocation[],
): Map<string, Array<WishocraticAllocationInput & { itemAId: WishocraticItemId; itemBId: WishocraticItemId }>> {
  const latestByUserPair = new Map<
    string,
    WishocraticStoredAllocation & { itemAId: WishocraticItemId; itemBId: WishocraticItemId }
  >();

  for (const allocation of allocations) {
    const normalized = normalizeWishocraticAllocation(allocation);
    if (!isValidWishocraticAllocation(normalized)) {
      continue;
    }

    const key = `${normalized.userId}:${normalized.itemAId}_${normalized.itemBId}`;
    const existing = latestByUserPair.get(key);

    if (!existing || normalized.updatedAt > existing.updatedAt) {
      latestByUserPair.set(key, normalized);
    }
  }

  const allocationsByUser = new Map<
    string,
    Array<WishocraticAllocationInput & { itemAId: WishocraticItemId; itemBId: WishocraticItemId }>
  >();

  for (const allocation of latestByUserPair.values()) {
    const existing = allocationsByUser.get(allocation.userId) ?? [];
    existing.push(allocation);
    allocationsByUser.set(allocation.userId, existing);
  }

  return allocationsByUser;
}

export function buildWishocracyCommunitySummary(
  allocations: WishocraticStoredAllocation[],
  verifiedUserIds: ReadonlySet<string> = new Set(),
): WishocracyCommunitySummary {
  const averageAllocations = createEmptyAverageAllocations();
  const allocationsByUser = dedupeLatestAllocations(allocations);

  if (allocationsByUser.size === 0) {
    return {
      averageAllocations,
      totalUsers: 0,
      verifiedUsers: 0,
      totalAllocations: 0,
      topCategories: [],
    };
  }

  let totalAllocations = 0;
  let verifiedUsers = 0;
  for (const [userId, userComparisons] of allocationsByUser.entries()) {
    totalAllocations += userComparisons.length;
    if (verifiedUserIds.has(userId)) verifiedUsers++;
    const userAllocations = calculateAllocationsFromPairwise(userComparisons);

    for (const categoryId of Object.keys(WISHOCRATIC_ITEMS) as WishocraticItemId[]) {
      averageAllocations[categoryId] += userAllocations[categoryId] / allocationsByUser.size;
    }
  }

  for (const categoryId of Object.keys(WISHOCRATIC_ITEMS) as WishocraticItemId[]) {
    averageAllocations[categoryId] = Number(averageAllocations[categoryId].toFixed(1));
  }

  return {
    averageAllocations,
    totalUsers: allocationsByUser.size,
    verifiedUsers,
    totalAllocations,
    topCategories: buildTopCategories(averageAllocations),
  };
}

export async function getWishocracyCommunitySummary(): Promise<WishocracyCommunitySummary> {
  try {
    const [allocations, verifiedVerifications] = await Promise.all([
      prisma.wishocraticAllocation.findMany({
        select: {
          userId: true,
          itemAId: true,
          itemBId: true,
          allocationA: true,
          allocationB: true,
          updatedAt: true,
        },
      }),
      prisma.personhoodVerification.findMany({
        where: { status: "VERIFIED", deletedAt: null },
        select: { userId: true },
        distinct: ["userId"],
      }),
    ]);

    const verifiedUserIds = new Set(verifiedVerifications.map((v) => v.userId));
    return buildWishocracyCommunitySummary(allocations, verifiedUserIds);
  } catch (error) {
    logger.error("Failed to load wishocracy community summary", error);
    return buildWishocracyCommunitySummary([]);
  }
}

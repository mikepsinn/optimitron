import { prisma } from "@/lib/prisma";
import { calculateAllocationsFromPairwise } from "@/lib/wishocracy-calculations";
import { BUDGET_CATEGORIES, type BudgetCategoryId } from "@/lib/wishocracy-data";
import { createLogger } from "@/lib/logger";

const logger = createLogger("wishocracy-community");

export interface WishocraticComparisonInput {
  itemAId: string;
  itemBId: string;
  allocationA: number;
  allocationB: number;
}

export interface WishocraticStoredAllocation extends WishocraticComparisonInput {
  userId: string;
  updatedAt: Date;
}

export interface WishocracyCommunityCategory {
  categoryId: BudgetCategoryId;
  percentage: number;
}

export interface WishocracyCommunitySummary {
  averageAllocations: Record<BudgetCategoryId, number>;
  totalUsers: number;
  totalComparisons: number;
  topCategories: WishocracyCommunityCategory[];
}

export function createEmptyAverageAllocations(): Record<BudgetCategoryId, number> {
  return Object.keys(BUDGET_CATEGORIES).reduce((allocations, categoryId) => {
    allocations[categoryId as BudgetCategoryId] = 0;
    return allocations;
  }, {} as Record<BudgetCategoryId, number>);
}

export function isBudgetCategoryId(value: string): value is BudgetCategoryId {
  return Object.prototype.hasOwnProperty.call(BUDGET_CATEGORIES, value);
}

export function isValidAllocationPair(allocationA: number, allocationB: number): boolean {
  const sum = allocationA + allocationB;
  const inRange =
    allocationA >= 0 &&
    allocationA <= 100 &&
    allocationB >= 0 &&
    allocationB <= 100;

  return inRange && (sum === 100 || sum === 0);
}

export function normalizeWishocraticComparison<T extends WishocraticComparisonInput>(
  comparison: T,
): T {
  if (comparison.itemAId <= comparison.itemBId) {
    return comparison;
  }

  return {
    ...comparison,
    itemAId: comparison.itemBId,
    itemBId: comparison.itemAId,
    allocationA: comparison.allocationB,
    allocationB: comparison.allocationA,
  };
}

export function isValidWishocraticComparison(
  comparison: WishocraticComparisonInput,
): comparison is WishocraticComparisonInput & {
  itemAId: BudgetCategoryId;
  itemBId: BudgetCategoryId;
} {
  return (
    comparison.itemAId !== comparison.itemBId &&
    isBudgetCategoryId(comparison.itemAId) &&
    isBudgetCategoryId(comparison.itemBId) &&
    isValidAllocationPair(comparison.allocationA, comparison.allocationB)
  );
}

function buildTopCategories(
  averageAllocations: Record<BudgetCategoryId, number>,
): WishocracyCommunityCategory[] {
  return Object.entries(averageAllocations)
    .map(([categoryId, percentage]) => ({
      categoryId: categoryId as BudgetCategoryId,
      percentage,
    }))
    .filter((entry) => entry.percentage > 0)
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 5);
}

function dedupeLatestAllocations(
  allocations: WishocraticStoredAllocation[],
): Map<string, Array<WishocraticComparisonInput & { itemAId: BudgetCategoryId; itemBId: BudgetCategoryId }>> {
  const latestByUserPair = new Map<
    string,
    WishocraticStoredAllocation & { itemAId: BudgetCategoryId; itemBId: BudgetCategoryId }
  >();

  for (const allocation of allocations) {
    const normalized = normalizeWishocraticComparison(allocation);
    if (!isValidWishocraticComparison(normalized)) {
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
    Array<WishocraticComparisonInput & { itemAId: BudgetCategoryId; itemBId: BudgetCategoryId }>
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
): WishocracyCommunitySummary {
  const averageAllocations = createEmptyAverageAllocations();
  const allocationsByUser = dedupeLatestAllocations(allocations);

  if (allocationsByUser.size === 0) {
    return {
      averageAllocations,
      totalUsers: 0,
      totalComparisons: 0,
      topCategories: [],
    };
  }

  let totalComparisons = 0;
  for (const userComparisons of allocationsByUser.values()) {
    totalComparisons += userComparisons.length;
    const userAllocations = calculateAllocationsFromPairwise(userComparisons);

    for (const categoryId of Object.keys(BUDGET_CATEGORIES) as BudgetCategoryId[]) {
      averageAllocations[categoryId] += userAllocations[categoryId] / allocationsByUser.size;
    }
  }

  for (const categoryId of Object.keys(BUDGET_CATEGORIES) as BudgetCategoryId[]) {
    averageAllocations[categoryId] = Number(averageAllocations[categoryId].toFixed(1));
  }

  return {
    averageAllocations,
    totalUsers: allocationsByUser.size,
    totalComparisons,
    topCategories: buildTopCategories(averageAllocations),
  };
}

export async function getWishocracyCommunitySummary(): Promise<WishocracyCommunitySummary> {
  try {
    const allocations = await prisma.wishocraticAllocation.findMany({
      select: {
        userId: true,
        itemAId: true,
        itemBId: true,
        allocationA: true,
        allocationB: true,
        updatedAt: true,
      },
    });

    return buildWishocracyCommunitySummary(allocations);
  } catch (error) {
    logger.error("Failed to load wishocracy community summary", error);
    return buildWishocracyCommunitySummary([]);
  }
}

import type { Session } from "next-auth";
import { API_ROUTES } from "@/lib/api-routes";
import { storage } from "@/lib/storage";
import { BudgetCategoryId, BUDGET_CATEGORIES } from "@/lib/wishocracy-data";
import { createLogger } from "@/lib/logger";

const logger = createLogger("wishocracy-utils");

export function generateAllPairsFromCategories(
  categories: Set<BudgetCategoryId> | BudgetCategoryId[],
): Array<[BudgetCategoryId, BudgetCategoryId]> {
  const categoryArray = Array.isArray(categories) ? categories : Array.from(categories);
  const pairs: Array<[BudgetCategoryId, BudgetCategoryId]> = [];

  for (let i = 0; i < categoryArray.length; i += 1) {
    for (let j = i + 1; j < categoryArray.length; j += 1) {
      pairs.push([categoryArray[i], categoryArray[j]]);
    }
  }

  return pairs;
}

export function shufflePairs<T>(pairs: T[]): T[] {
  const shuffled = [...pairs];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function filterRejectedPairs(
  pairs: Array<[BudgetCategoryId, BudgetCategoryId]>,
  rejectedCategories: Set<BudgetCategoryId>,
): Array<[BudgetCategoryId, BudgetCategoryId]> {
  return pairs.filter(
    (pair) => !rejectedCategories.has(pair[0]) && !rejectedCategories.has(pair[1]),
  );
}

export function filterCompletedPairs(
  allPairs: Array<[BudgetCategoryId, BudgetCategoryId]>,
  completedComparisons: Array<{ itemAId: string; itemBId: string }>,
): Array<[BudgetCategoryId, BudgetCategoryId]> {
  const completedPairKeys = new Set(
    completedComparisons.map((comparison) => `${comparison.itemAId}_${comparison.itemBId}`),
  );

  return allPairs.filter(
    (pair) =>
      !completedPairKeys.has(`${pair[0]}_${pair[1]}`) &&
      !completedPairKeys.has(`${pair[1]}_${pair[0]}`),
  );
}

export function calculateTotalPairs(categoryCount: number): number {
  return (categoryCount * (categoryCount - 1)) / 2;
}

export function generateRandomPairs(count: number = 25): Array<[BudgetCategoryId, BudgetCategoryId]> {
  const allPairs = generateAllPairsFromCategories(Object.keys(BUDGET_CATEGORIES) as BudgetCategoryId[]);
  const shuffled = shufflePairs(allPairs);
  const militaryVsTrialsPair: [BudgetCategoryId, BudgetCategoryId] = [
    "PRAGMATIC_CLINICAL_TRIALS",
    "MILITARY_OPERATIONS",
  ];

  const filteredPairs = shuffled.filter(
    (pair) =>
      !(
        (pair[0] === militaryVsTrialsPair[0] && pair[1] === militaryVsTrialsPair[1]) ||
        (pair[0] === militaryVsTrialsPair[1] && pair[1] === militaryVsTrialsPair[0])
      ),
  );

  const randomSample = filteredPairs.slice(0, count - 1);
  randomSample.push(militaryVsTrialsPair);
  return shufflePairs(randomSample);
}

function isCategoryValid(categoryId: string): boolean {
  return BUDGET_CATEGORIES[categoryId as BudgetCategoryId] !== undefined;
}

function isValidPair(pair: [BudgetCategoryId, BudgetCategoryId]): boolean {
  return isCategoryValid(pair[0]) && isCategoryValid(pair[1]);
}

export function filterValidPairs(
  pairs: Array<[string, string]>,
): Array<[BudgetCategoryId, BudgetCategoryId]> {
  return pairs.filter((pair) => isValidPair(pair as [BudgetCategoryId, BudgetCategoryId])) as Array<
    [BudgetCategoryId, BudgetCategoryId]
  >;
}

export function filterValidComparisons<T extends { itemAId: string; itemBId: string }>(
  comparisons: T[],
  validCategories?: Set<BudgetCategoryId>,
): T[] {
  return comparisons.filter((comparison) => {
    const categoryA = comparison.itemAId as BudgetCategoryId;
    const categoryB = comparison.itemBId as BudgetCategoryId;
    const exists = isCategoryValid(categoryA) && isCategoryValid(categoryB);
    const inValidSet = validCategories
      ? validCategories.has(categoryA) && validCategories.has(categoryB)
      : true;

    return exists && inValidSet;
  });
}

export async function syncPendingWishocracy(
  session?: Session | null,
  onSuccess?: () => void,
): Promise<boolean> {
  try {
    if (!session?.user) {
      return false;
    }

    const pending = storage.getPendingWishocracy();
    if (!pending) {
      logger.warn("No wishocracy data to sync");
      return false;
    }

    const hasData =
      (pending.comparisons && pending.comparisons.length > 0) ||
      (pending.selectedCategories && pending.selectedCategories.length > 0);

    if (!hasData) {
      logger.warn("No wishocracy data to sync");
      return false;
    }

    const response = await fetch(API_ROUTES.wishocracy.sync, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        comparisons: pending.comparisons || [],
        selectedCategories: pending.selectedCategories || [],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      logger.error("Wishocracy sync failed:", error);
      return false;
    }

    storage.removePendingWishocracy();
    onSuccess?.();
    return true;
  } catch (error) {
    logger.error("Wishocracy sync error:", error);
    return false;
  }
}

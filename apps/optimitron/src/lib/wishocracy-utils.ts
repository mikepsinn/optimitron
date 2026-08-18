import type { Session } from "next-auth";
import { API_ROUTES } from "@/lib/api-routes";
import { storage } from "@/lib/storage";
import { WishocraticItemId, WISHOCRATIC_ITEMS } from "@/lib/wishocracy-data";
import { createLogger } from "@/lib/logger";

const logger = createLogger("wishocracy-utils");

export function generateAllPairs(
  categories: Set<WishocraticItemId> | WishocraticItemId[],
): Array<[WishocraticItemId, WishocraticItemId]> {
  const itemArray = Array.isArray(categories) ? categories : Array.from(categories);
  const pairs: Array<[WishocraticItemId, WishocraticItemId]> = [];

  for (let i = 0; i < itemArray.length; i += 1) {
    for (let j = i + 1; j < itemArray.length; j += 1) {
      pairs.push([itemArray[i], itemArray[j]]);
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
  pairs: Array<[WishocraticItemId, WishocraticItemId]>,
  rejectedItemIds: Set<WishocraticItemId>,
): Array<[WishocraticItemId, WishocraticItemId]> {
  return pairs.filter(
    (pair) => !rejectedItemIds.has(pair[0]) && !rejectedItemIds.has(pair[1]),
  );
}

export function filterAllocatedPairs(
  allPairs: Array<[WishocraticItemId, WishocraticItemId]>,
  completedAllocations: Array<{ itemAId: string; itemBId: string }>,
): Array<[WishocraticItemId, WishocraticItemId]> {
  const completedPairKeys = new Set(
    completedAllocations.map((allocation) => `${allocation.itemAId}_${allocation.itemBId}`),
  );

  return allPairs.filter(
    (pair) =>
      !completedPairKeys.has(`${pair[0]}_${pair[1]}`) &&
      !completedPairKeys.has(`${pair[1]}_${pair[0]}`),
  );
}

export function calculateTotalPairs(itemCount: number): number {
  return (itemCount * (itemCount - 1)) / 2;
}

export function generateRandomPairs(count: number = 25): Array<[WishocraticItemId, WishocraticItemId]> {
  const allPairs = generateAllPairs(Object.keys(WISHOCRATIC_ITEMS) as WishocraticItemId[]);
  const shuffled = shufflePairs(allPairs);
  const militaryVsTrialsPair: [WishocraticItemId, WishocraticItemId] = [
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

function isValidItemId(categoryId: string): boolean {
  return WISHOCRATIC_ITEMS[categoryId as WishocraticItemId] !== undefined;
}

function isValidPair(pair: [WishocraticItemId, WishocraticItemId]): boolean {
  return isValidItemId(pair[0]) && isValidItemId(pair[1]);
}

export function filterValidPairs(
  pairs: Array<[string, string]>,
): Array<[WishocraticItemId, WishocraticItemId]> {
  return pairs.filter((pair) => isValidPair(pair as [WishocraticItemId, WishocraticItemId])) as Array<
    [WishocraticItemId, WishocraticItemId]
  >;
}

export function filterValidAllocations<T extends { itemAId: string; itemBId: string }>(
  allocations: T[],
  validItemIds?: Set<WishocraticItemId>,
): T[] {
  return allocations.filter((allocation) => {
    const itemA = allocation.itemAId as WishocraticItemId;
    const itemB = allocation.itemBId as WishocraticItemId;
    const exists = isValidItemId(itemA) && isValidItemId(itemB);
    const inValidSet = validItemIds
      ? validItemIds.has(itemA) && validItemIds.has(itemB)
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
      logger.info("No wishocracy data to sync");
      return false;
    }

    const hasData =
      (pending.allocations && pending.allocations.length > 0) ||
      (pending.includedItemIds && pending.includedItemIds.length > 0);

    if (!hasData) {
      logger.info("No wishocracy data to sync");
      return false;
    }

    const response = await fetch(API_ROUTES.wishocracy.sync, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        comparisons: pending.allocations || [],
        includedItemIds: pending.includedItemIds || [],
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

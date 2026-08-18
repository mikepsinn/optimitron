import type { Session } from "next-auth";
import { API_ROUTES } from "@/lib/api-routes";
import { WishocraticItemId, WISHOCRATIC_ITEMS } from "@/lib/wishocracy-data";
import { storage } from "@/lib/storage";
import {
  filterAllocatedPairs,
  filterRejectedPairs,
  filterValidAllocations,
  filterValidPairs,
  generateAllPairs,
  generateRandomPairs,
  shufflePairs,
  syncPendingWishocracy,
} from "@/lib/wishocracy-utils";

export const RANDOM_PAIR_BATCH_SIZE = 25;
export const AUTH_PROMPT_MILESTONES = new Set([5, 10, 15]);
export const ALL_WISHOCRATIC_ITEM_IDS = Object.keys(WISHOCRATIC_ITEMS) as WishocraticItemId[];

export type PendingWishocraticAllocation = {
  itemAId: string;
  itemBId: string;
  allocationA: number;
  allocationB: number;
  timestamp?: string;
};

type PendingInclusions = Array<{ itemId: string; included: boolean }> | string[] | undefined;

type PersistedInclusion = {
  itemId: string;
  included: boolean;
};

export type HydratedWishocracyState = {
  allocations: PendingWishocraticAllocation[];
  selectedItemIds: Set<WishocraticItemId>;
  rejectedItemIds: Set<WishocraticItemId>;
  shuffledPairs: Array<[WishocraticItemId, WishocraticItemId]>;
  showIntro: boolean;
};

export function getExcludedItemIds(allocations: PendingWishocraticAllocation[]) {
  return allocations.reduce((rejected, allocation) => {
    if (allocation.allocationA === 0 && allocation.allocationB === 0) {
      rejected.add(allocation.itemAId as WishocraticItemId);
      rejected.add(allocation.itemBId as WishocraticItemId);
    }
    return rejected;
  }, new Set<WishocraticItemId>());
}

export function buildSelectedPairQueue(
  selectedItemIds: Set<WishocraticItemId>,
  allocations: PendingWishocraticAllocation[],
  rejectedItemIds: Set<WishocraticItemId>,
) {
  const allPairs = generateAllPairs(selectedItemIds);
  const uncompletedPairs = filterAllocatedPairs(allPairs, allocations);
  return filterRejectedPairs(uncompletedPairs, rejectedItemIds);
}

export function buildRandomPairQueue(
  allocations: PendingWishocraticAllocation[],
  rejectedItemIds: Set<WishocraticItemId>,
) {
  const remainingPairs = filterRejectedPairs(
    filterAllocatedPairs(generateAllPairs(ALL_WISHOCRATIC_ITEM_IDS), allocations),
    rejectedItemIds,
  );

  return shufflePairs(remainingPairs).slice(0, RANDOM_PAIR_BATCH_SIZE);
}

function getIncludedItemSet(selections: PendingInclusions) {
  if (!selections?.length) {
    return new Set<WishocraticItemId>();
  }

  if (typeof selections[0] === "string") {
    return new Set(
      (selections as string[]).filter(
        (itemId): itemId is WishocraticItemId =>
          WISHOCRATIC_ITEMS[itemId as WishocraticItemId] !== undefined,
      ),
    );
  }

  return new Set(
    (selections as PersistedInclusion[])
      .filter((inclusion) => inclusion.included)
      .map((inclusion) => inclusion.itemId)
      .filter(
        (itemId): itemId is WishocraticItemId =>
          WISHOCRATIC_ITEMS[itemId as WishocraticItemId] !== undefined,
      ),
  );
}

export function shouldShowIntro(
  allocations: PendingWishocraticAllocation[],
  selectedItemIds: Set<WishocraticItemId>,
) {
  return allocations.length === 0 && selectedItemIds.size === 0;
}

export function getInitialGuestState(): HydratedWishocracyState {
  return {
    allocations: [],
    selectedItemIds: new Set<WishocraticItemId>(),
    rejectedItemIds: new Set<WishocraticItemId>(),
    shuffledPairs: generateRandomPairs(RANDOM_PAIR_BATCH_SIZE),
    showIntro: true,
  };
}

export async function hydrateAuthenticatedState(
  session: Session,
): Promise<HydratedWishocracyState> {
  await syncPendingWishocracy(session);

  const [allocationsResponse, inclusionsResponse] = await Promise.all([
    fetch(API_ROUTES.wishocracy.allocations),
    fetch(API_ROUTES.wishocracy.itemInclusions),
  ]);
  const allocationsPayload = (await allocationsResponse.json()) as {
    allocations?: PendingWishocraticAllocation[];
  };
  const inclusionsPayload = (await inclusionsResponse.json()) as {
    inclusions?: PersistedInclusion[];
  };

  const selectedItemIds = getIncludedItemSet(inclusionsPayload.inclusions);
  const allocations = filterValidAllocations(
    allocationsPayload.allocations ?? [],
    selectedItemIds.size ? selectedItemIds : undefined,
  );
  const rejectedItemIds = getExcludedItemIds(allocations);
  const shuffledPairs = selectedItemIds.size
    ? buildSelectedPairQueue(selectedItemIds, allocations, rejectedItemIds)
    : buildRandomPairQueue(allocations, rejectedItemIds);

  return {
    allocations,
    selectedItemIds,
    rejectedItemIds,
    shuffledPairs,
    showIntro: shouldShowIntro(allocations, selectedItemIds),
  };
}

export function hydrateGuestState(): HydratedWishocracyState {
  const pending = storage.getPendingWishocracy();
  if (!pending) {
    return getInitialGuestState();
  }

  const selectedItemIds = getIncludedItemSet(pending.includedItemIds);
  const allocations = filterValidAllocations(
    pending.allocations ?? [],
    selectedItemIds.size ? selectedItemIds : undefined,
  );
  const rejectedItemIds = getExcludedItemIds(allocations);
  const savedPairs = filterRejectedPairs(
    filterValidPairs(pending.shuffledPairs ?? []),
    rejectedItemIds,
  );
  const shuffledPairs = savedPairs.length
    ? savedPairs
    : selectedItemIds.size
      ? buildSelectedPairQueue(selectedItemIds, allocations, rejectedItemIds)
      : buildRandomPairQueue(allocations, rejectedItemIds);

  return {
    allocations,
    selectedItemIds,
    rejectedItemIds,
    shuffledPairs,
    showIntro: shouldShowIntro(allocations, selectedItemIds),
  };
}

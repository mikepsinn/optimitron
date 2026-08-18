import type {
  PendingTreatyVoteState,
  PendingWishocraticAllocation,
} from "@/lib/storage";
import type { WishocraticItemId } from "@/lib/wishocracy-data";
import { normalizeWishocraticAllocation } from "@/lib/wishocracy-allocation";

export const TREATY_WISHOCRATIC_ITEM_IDS = {
  military: "MILITARY_OPERATIONS",
  pragmaticClinicalTrials: "PRAGMATIC_CLINICAL_TRIALS",
} as const satisfies Record<string, WishocraticItemId>;

function isTreatyWishocraticAllocation(
  comparison: { itemAId: string; itemBId: string },
): comparison is { itemAId: WishocraticItemId; itemBId: WishocraticItemId } {
  const ids = new Set([comparison.itemAId, comparison.itemBId]);
  return (
    ids.size === 2 &&
    ids.has(TREATY_WISHOCRATIC_ITEM_IDS.military) &&
    ids.has(TREATY_WISHOCRATIC_ITEM_IDS.pragmaticClinicalTrials)
  );
}

export function buildTreatyWishocraticAllocation(
  militaryAllocationPercent: number,
  timestamp: string = new Date().toISOString(),
): PendingWishocraticAllocation {
  return normalizeWishocraticAllocation({
    itemAId: TREATY_WISHOCRATIC_ITEM_IDS.military,
    itemBId: TREATY_WISHOCRATIC_ITEM_IDS.pragmaticClinicalTrials,
    allocationA: militaryAllocationPercent,
    allocationB: 100 - militaryAllocationPercent,
    timestamp,
  });
}

export function getTreatyWishocraticAllocation(
  pendingTreatyVote?: PendingTreatyVoteState | null,
): PendingWishocraticAllocation | null {
  if (
    pendingTreatyVote?.wishocraticAllocation &&
    isTreatyWishocraticAllocation(pendingTreatyVote.wishocraticAllocation)
  ) {
    return normalizeWishocraticAllocation(pendingTreatyVote.wishocraticAllocation);
  }

  return null;
}

export function getMilitaryAllocationPercentFromPendingTreatyVote(
  pendingTreatyVote?: PendingTreatyVoteState | null,
): number | null {
  const allocation = getTreatyWishocraticAllocation(pendingTreatyVote);
  if (!allocation) {
    return null;
  }

  return allocation.itemAId === TREATY_WISHOCRATIC_ITEM_IDS.military
    ? allocation.allocationA
    : allocation.allocationB;
}

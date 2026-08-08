/**
 * Legacy DIH budget-category IDs → Optimitron WishocraticItem ids.
 *
 * Most DIH keys already match DEFAULT_WISHOCRATIC_ITEMS. A few were renamed
 * or split when the catalog landed in @optimitron/data.
 */
import {
  DEFAULT_WISHOCRATIC_ITEMS,
  type DefaultWishocraticItemId,
} from "./wishocratic-items-registry";

const DIH_CATEGORY_TO_ITEM_IDS: Record<string, DefaultWishocraticItemId[]> = {
  DRUG_WAR_ENFORCEMENT: ["DRUG_WAR"],
  PRISON_CONSTRUCTION: ["VIOLENT_CRIME_INCARCERATION"],
  ICE_IMMIGRATION_ENFORCEMENT: [
    "ICE_CRIMINAL_DEPORTATION",
    "ICE_NONCRIMINAL_DEPORTATION",
  ],
};

const ITEM_TO_DIH_CATEGORY: Partial<Record<DefaultWishocraticItemId, string>> = {
  DRUG_WAR: "DRUG_WAR_ENFORCEMENT",
  VIOLENT_CRIME_INCARCERATION: "PRISON_CONSTRUCTION",
  ICE_CRIMINAL_DEPORTATION: "ICE_IMMIGRATION_ENFORCEMENT",
  ICE_NONCRIMINAL_DEPORTATION: "ICE_IMMIGRATION_ENFORCEMENT",
};

export function isWishocraticItemId(value: string): value is DefaultWishocraticItemId {
  return Object.prototype.hasOwnProperty.call(DEFAULT_WISHOCRATIC_ITEMS, value);
}

/** Resolve a DIH or Optimitron category id to one or more WishocraticItem ids. */
export function resolveDihCategoryToItemIds(categoryId: string): DefaultWishocraticItemId[] {
  if (isWishocraticItemId(categoryId)) {
    return [categoryId];
  }
  return DIH_CATEGORY_TO_ITEM_IDS[categoryId] ?? [];
}

/** Map a WishocraticItem id back to a DIH client category id when one exists. */
export function toDihClientCategoryId(itemId: string): string {
  if (isWishocraticItemId(itemId) && ITEM_TO_DIH_CATEGORY[itemId]) {
    return ITEM_TO_DIH_CATEGORY[itemId];
  }
  return itemId;
}

export type DihPairAllocationInput = {
  categoryA: string;
  categoryB: string;
  allocationA: number;
  allocationB: number;
};

export type ResolvedWishocraticPairAllocation = {
  itemAId: DefaultWishocraticItemId;
  itemBId: DefaultWishocraticItemId;
  allocationA: number;
  allocationB: number;
};

/**
 * Expand a DIH category pair into WishocraticAllocation row(s).
 * ICE expands to both deportation items; self-vs-self pairs are skipped.
 * Pair order is normalized alphabetically by item id.
 */
export function resolveDihPairAllocations(
  pair: DihPairAllocationInput,
): ResolvedWishocraticPairAllocation[] {
  const aIds = resolveDihCategoryToItemIds(pair.categoryA);
  const bIds = resolveDihCategoryToItemIds(pair.categoryB);
  const results: ResolvedWishocraticPairAllocation[] = [];

  for (const rawA of aIds) {
    for (const rawB of bIds) {
      if (rawA === rawB) continue;

      let itemAId = rawA;
      let itemBId = rawB;
      let allocationA = pair.allocationA;
      let allocationB = pair.allocationB;

      if (itemAId > itemBId) {
        ;[itemAId, itemBId] = [itemBId, itemAId];
        ;[allocationA, allocationB] = [allocationB, allocationA];
      }

      results.push({ itemAId, itemBId, allocationA, allocationB });
    }
  }

  return results;
}

/** Flatten category ids for deleteMany OR filters (includes expanded aliases). */
export function resolveDihCategoryIdsForFilter(categoryIds: string[]): DefaultWishocraticItemId[] {
  return Array.from(new Set(categoryIds.flatMap(resolveDihCategoryToItemIds)));
}

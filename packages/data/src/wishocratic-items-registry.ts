import {
  US_WISHOCRATIC_ITEMS,
  getUSWishocraticAllocations,
} from "./datasets/us-wishocratic-items";

export const WISHOCRATIC_ITEMS_BY_JURISDICTION = {
  USA: {
    wishocraticItems: US_WISHOCRATIC_ITEMS,
    getWishocraticAllocations: getUSWishocraticAllocations,
  },
} as const;

export type WishocraticItemsJurisdictionCode =
  keyof typeof WISHOCRATIC_ITEMS_BY_JURISDICTION;
export type WishocraticItemsRegistryEntry =
  (typeof WISHOCRATIC_ITEMS_BY_JURISDICTION)[WishocraticItemsJurisdictionCode];

export const DEFAULT_WISHOCRATIC_ITEMS_JURISDICTION_CODE = "USA" as const;

export const DEFAULT_WISHOCRATIC_ITEMS =
  WISHOCRATIC_ITEMS_BY_JURISDICTION[DEFAULT_WISHOCRATIC_ITEMS_JURISDICTION_CODE].wishocraticItems;

export type DefaultWishocraticItemId = keyof typeof DEFAULT_WISHOCRATIC_ITEMS;

export function getDefaultWishocraticAllocations(): Record<DefaultWishocraticItemId, number> {
  return WISHOCRATIC_ITEMS_BY_JURISDICTION[
    DEFAULT_WISHOCRATIC_ITEMS_JURISDICTION_CODE
  ].getWishocraticAllocations();
}

export function getWishocraticItemsRegistryEntry(
  code: string,
): WishocraticItemsRegistryEntry | undefined {
  return WISHOCRATIC_ITEMS_BY_JURISDICTION[code as WishocraticItemsJurisdictionCode];
}

export function getAvailableWishocraticItemsJurisdictions(): WishocraticItemsJurisdictionCode[] {
  return Object.keys(WISHOCRATIC_ITEMS_BY_JURISDICTION) as WishocraticItemsJurisdictionCode[];
}


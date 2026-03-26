/**
 * Budget categories for Wishocracy pairwise comparisons.
 *
 * Re-exports from @optimitron/data — the single source of truth for
 * priority items including Wishonia's voice, ROI data, and fiscal mappings.
 */

export {
  DEFAULT_WISHOCRATIC_ITEMS as WISHOCRATIC_ITEMS,
  DEFAULT_WISHOCRATIC_ITEMS_JURISDICTION_CODE as DEFAULT_WISHOCRACY_JURISDICTION_CODE,
  getDefaultWishocraticAllocations as getActualGovernmentAllocations,
} from '@optimitron/data';

export type {
  DefaultWishocraticItemId as WishocraticItemId,
} from '@optimitron/data';

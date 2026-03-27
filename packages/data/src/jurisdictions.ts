/**
 * Jurisdiction Registry
 *
 * Central lookup for jurisdiction-specific data (budget, priority items).
 * Each jurisdiction provides its own budget data and citizen priority items.
 * Add new jurisdictions by importing their data and registering here.
 */

import { US_FEDERAL_BUDGET } from './datasets/us-federal-budget';
import type { JurisdictionBudget } from './datasets/jurisdiction-budget';
import type { WishocraticItemDefinition } from './datasets/us-wishocratic-items';
import {
  DEFAULT_WISHOCRATIC_ITEMS_JURISDICTION_CODE,
  WISHOCRATIC_ITEMS_BY_JURISDICTION,
} from './wishocratic-items-registry';

export interface JurisdictionData {
  /** Budget data with fiscal categories */
  budget: JurisdictionBudget;
  /** Wishocratic items for pairwise comparison */
  wishocraticItems: Record<string, WishocraticItemDefinition>;
  /** Calculate allocation percentages from wishocratic item budgets */
  getWishocraticAllocations: () => Record<string, number>;
}

const JURISDICTIONS: Record<string, JurisdictionData> = {
  USA: {
    budget: US_FEDERAL_BUDGET,
    wishocraticItems: WISHOCRATIC_ITEMS_BY_JURISDICTION.USA.wishocraticItems,
    getWishocraticAllocations:
      WISHOCRATIC_ITEMS_BY_JURISDICTION.USA.getWishocraticAllocations,
  },
};

/** Get data for a specific jurisdiction */
export function getJurisdiction(code: string): JurisdictionData | undefined {
  return JURISDICTIONS[code];
}

/** List all available jurisdiction codes */
export function getAvailableJurisdictions(): string[] {
  return Object.keys(JURISDICTIONS);
}

/** Default jurisdiction code */
export const DEFAULT_JURISDICTION_CODE = DEFAULT_WISHOCRATIC_ITEMS_JURISDICTION_CODE;


/**
 * Jurisdiction registry
 *
 * Canonical lookup for jurisdiction-specific public catalogs consumed by the
 * UI and database seed/bootstrap flows.
 */

import { US_FEDERAL_BUDGET } from './datasets/us-federal-budget';
import type { JurisdictionBudget } from './datasets/jurisdiction-budget';
import {
  US_WISHOCRATIC_ITEMS,
  US_WISHOCRATIC_JURISDICTION,
  type WishocraticCatalogRecord,
  type WishocraticItemDefinition,
  type USWishocraticItemId,
  getUSWishocraticAllocations,
  getUSWishocraticCatalogRecords,
} from './datasets/us-wishocratic-items';

export interface JurisdictionData<
  TItemId extends string = string,
  TItem extends WishocraticItemDefinition = WishocraticItemDefinition,
> {
  /** Jurisdiction code matching the seeded Jurisdiction.code */
  code: string;
  /** Human-readable name */
  name: string;
  /** Prisma JurisdictionType value */
  type: string;
  /** Budget data with fiscal categories */
  budget: JurisdictionBudget;
  /** Wishocratic items for pairwise comparison */
  wishocraticItems: Readonly<Record<TItemId, TItem>>;
  /** Calculate allocation percentages from Wishocratic item budgets */
  getWishocraticAllocations: () => Record<TItemId, number>;
  /** Project Wishocratic items into DB-ready catalog rows */
  getWishocraticCatalogRecords: () => Record<TItemId, WishocraticCatalogRecord<TItemId>>;
}

export const JURISDICTIONS = {
  [US_WISHOCRATIC_JURISDICTION.code]: {
    code: US_WISHOCRATIC_JURISDICTION.code,
    name: US_WISHOCRATIC_JURISDICTION.name,
    type: US_WISHOCRATIC_JURISDICTION.type,
    budget: US_FEDERAL_BUDGET,
    wishocraticItems: US_WISHOCRATIC_ITEMS,
    getWishocraticAllocations: getUSWishocraticAllocations,
    getWishocraticCatalogRecords: getUSWishocraticCatalogRecords,
  },
} as const satisfies Record<
  string,
  JurisdictionData<USWishocraticItemId, WishocraticItemDefinition>
>;

/** Default jurisdiction code */
export const DEFAULT_JURISDICTION_CODE = US_WISHOCRATIC_JURISDICTION.code;

export type RegisteredJurisdictionCode = keyof typeof JURISDICTIONS;
export type DefaultJurisdictionCode = typeof DEFAULT_JURISDICTION_CODE;
export type DefaultJurisdictionData = (typeof JURISDICTIONS)[DefaultJurisdictionCode];

/** Default jurisdiction entry */
export const DEFAULT_JURISDICTION = JURISDICTIONS[DEFAULT_JURISDICTION_CODE];

/** Get data for a specific jurisdiction */
export function getJurisdiction(code: string): JurisdictionData | undefined {
  return JURISDICTIONS[code as RegisteredJurisdictionCode];
}

/** List all available jurisdiction codes */
export function getAvailableJurisdictions(): RegisteredJurisdictionCode[] {
  return Object.keys(JURISDICTIONS) as RegisteredJurisdictionCode[];
}

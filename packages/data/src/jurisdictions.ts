/**
 * Jurisdiction Registry
 *
 * Central lookup for jurisdiction-specific data (budget, priority items).
 * Each jurisdiction provides its own budget data and citizen priority items.
 * Add new jurisdictions by importing their data and registering here.
 */

import { US_FEDERAL_BUDGET } from './datasets/us-federal-budget.js';
import { US_PRIORITY_ITEMS, getUSPriorityAllocations } from './datasets/us-priority-items.js';
import type { JurisdictionBudget } from './datasets/jurisdiction-budget.js';
import type { PriorityItem } from './datasets/us-priority-items.js';

export interface JurisdictionData {
  /** Budget data with fiscal categories */
  budget: JurisdictionBudget;
  /** Citizen priority items for pairwise comparison */
  priorityItems: Record<string, PriorityItem>;
  /** Calculate allocation percentages from priority item budgets */
  getAllocations: () => Record<string, number>;
}

const JURISDICTIONS: Record<string, JurisdictionData> = {
  USA: {
    budget: US_FEDERAL_BUDGET,
    priorityItems: US_PRIORITY_ITEMS,
    getAllocations: getUSPriorityAllocations,
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
export const DEFAULT_JURISDICTION_CODE = 'USA';

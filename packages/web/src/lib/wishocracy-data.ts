/**
 * Budget categories for Wishocracy pairwise comparisons.
 *
 * Re-exports from @optimitron/data — the single source of truth for
 * priority items including Wishonia's voice, ROI data, and fiscal mappings.
 *
 * IMPORTANT: Import from the specific dataset file, NOT from the barrel
 * '@optimitron/data'. The barrel re-exports csv-loader and other modules
 * that use Node.js built-ins (node:fs, node:url), which crash in the browser.
 */

export {
  US_PRIORITY_ITEMS as BUDGET_CATEGORIES,
  getUSPriorityAllocations as getActualGovernmentAllocations,
} from '@optimitron/data/dist/datasets/us-priority-items.js';

export type { USPriorityItemId as BudgetCategoryId } from '@optimitron/data/dist/datasets/us-priority-items.js';

/**
 * Wishocracy budget categories = Optimitron US Wishocratic catalog.
 * No DIH alias layer — client keys are DEFAULT_WISHOCRATIC_ITEMS ids.
 */
import {
  DEFAULT_WISHOCRATIC_ITEMS,
  getDefaultWishocraticAllocations,
  type DefaultWishocraticItemId,
} from "@optimitron/data/wishocratic-items-registry"
import type { WishocraticItemRoiData } from "@optimitron/data/datasets/us-wishocratic-items"

export type BudgetCategoryId = DefaultWishocraticItemId

export type BudgetCategoryView = {
  /** Stable slug (presentation); storage uses {@link BudgetCategoryId}. */
  id: string
  name: string
  description: string
  icon: string
  /** Annual budget in billions USD. */
  annualBudget: number
  roiData: WishocraticItemRoiData | null
}

function toBudgetCategoryView(
  itemId: BudgetCategoryId,
): BudgetCategoryView {
  const item = DEFAULT_WISHOCRATIC_ITEMS[itemId]
  return {
    id: item.slug,
    name: item.name,
    description: item.description,
    icon: item.icon,
    annualBudget: item.annualBudgetBillions,
    roiData: item.roiData,
  }
}

export const BUDGET_CATEGORIES = Object.fromEntries(
  (Object.keys(DEFAULT_WISHOCRATIC_ITEMS) as BudgetCategoryId[]).map(
    (itemId) => [itemId, toBudgetCategoryView(itemId)],
  ),
) as Record<BudgetCategoryId, BudgetCategoryView>

export function isBudgetCategoryId(value: string): value is BudgetCategoryId {
  return Object.prototype.hasOwnProperty.call(DEFAULT_WISHOCRATIC_ITEMS, value)
}

/** Government allocation percentages from annual budgets (sum ~100%). */
export function getActualGovernmentAllocations(): Record<BudgetCategoryId, number> {
  return getDefaultWishocraticAllocations()
}

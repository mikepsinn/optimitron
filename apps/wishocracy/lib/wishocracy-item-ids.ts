/**
 * Wishocratic item id helpers — identity map (item id === client category id).
 */
import { prisma } from "@/lib/prisma"
import { ensureWishocraticItemsExist as ensureCatalogItems } from "@optimitron/db"
import type { DefaultWishocraticItemId } from "@optimitron/data/wishocratic-items-registry"
import {
  isBudgetCategoryId,
  type BudgetCategoryId,
} from "@/lib/wishocracy-data"

export type PairAllocationInput = {
  categoryA: string
  categoryB: string
  allocationA: number
  allocationB: number
}

export type ResolvedPairAllocation = {
  itemAId: DefaultWishocraticItemId
  itemBId: DefaultWishocraticItemId
  allocationA: number
  allocationB: number
}

/** Category id is the WishocraticItem id (1:1). */
export function resolveItemIds(categoryId: string): DefaultWishocraticItemId[] {
  return isBudgetCategoryId(categoryId) ? [categoryId] : []
}

/** Pass-through — storage and client share Optimitron item ids. */
export function toClientCategoryId(itemId: string): string {
  return itemId
}

/**
 * Normalize a pair: order item ids alphabetically and swap allocations to match.
 */
export function resolvePairAllocations(
  pair: PairAllocationInput,
): ResolvedPairAllocation[] {
  if (!isBudgetCategoryId(pair.categoryA) || !isBudgetCategoryId(pair.categoryB)) {
    return []
  }
  if (pair.categoryA === pair.categoryB) {
    return []
  }

  let itemAId = pair.categoryA as BudgetCategoryId
  let itemBId = pair.categoryB as BudgetCategoryId
  let allocationA = pair.allocationA
  let allocationB = pair.allocationB

  if (itemAId > itemBId) {
    ;[itemAId, itemBId] = [itemBId, itemAId]
    ;[allocationA, allocationB] = [allocationB, allocationA]
  }

  return [{ itemAId, itemBId, allocationA, allocationB }]
}

export function resolveItemIdsForFilter(
  categoryIds: string[],
): DefaultWishocraticItemId[] {
  return Array.from(
    new Set(
      categoryIds.filter(isBudgetCategoryId) as DefaultWishocraticItemId[],
    ),
  )
}

export function isValidPairAllocation(pair: {
  categoryA: unknown
  categoryB: unknown
  allocationA: unknown
  allocationB: unknown
}): pair is PairAllocationInput {
  const { categoryA, categoryB, allocationA, allocationB } = pair

  if (
    typeof categoryA !== "string" ||
    typeof categoryB !== "string" ||
    !isBudgetCategoryId(categoryA) ||
    !isBudgetCategoryId(categoryB) ||
    categoryA === categoryB
  ) {
    return false
  }

  if (
    typeof allocationA !== "number" ||
    typeof allocationB !== "number" ||
    !Number.isInteger(allocationA) ||
    !Number.isInteger(allocationB) ||
    allocationA < 0 ||
    allocationA > 100 ||
    allocationB < 0 ||
    allocationB > 100 ||
    allocationA + allocationB !== 100
  ) {
    return false
  }

  return true
}

/**
 * Upsert WishocraticItem rows from @optimitron/data so FKs succeed.
 */
export async function ensureWishocraticItemsExist(
  itemIds: string[],
): Promise<void> {
  const uniqueIds = Array.from(
    new Set(itemIds.filter(isBudgetCategoryId)),
  ) as DefaultWishocraticItemId[]
  if (!uniqueIds.length) return

  await ensureCatalogItems(prisma, uniqueIds)
}

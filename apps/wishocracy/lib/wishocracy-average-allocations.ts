import type { WishocraticAllocation } from "@optimitron/db"
import { calculateAllocationsFromPairwise } from "./wishocracy-calculations"
import { BUDGET_CATEGORIES, isBudgetCategoryId } from "./wishocracy-data"
import type { BudgetCategoryId } from "./wishocracy-data"

type SavedAllocation = Pick<WishocraticAllocation,
  "userId" | "itemAId" | "itemBId" | "allocationA" | "allocationB" | "updatedAt"
>

export interface AverageAllocationResults {
  averageAllocations: Record<BudgetCategoryId, number>
  totalUsers: number
}

/** Average each participant's normalized budget, using their latest answer per pair. */
export function calculateAverageAllocations(rows: SavedAllocation[]): AverageAllocationResults {
  const byUser = new Map<string, Map<string, SavedAllocation>>()
  for (const row of rows) {
    if (!isBudgetCategoryId(row.itemAId) || !isBudgetCategoryId(row.itemBId) || row.itemAId === row.itemBId) continue
    if (row.allocationA < 0 || row.allocationB < 0 || row.allocationA > 100 || row.allocationB > 100) continue
    if (![0, 100].includes(row.allocationA + row.allocationB)) continue
    const pairs = byUser.get(row.userId) ?? new Map<string, SavedAllocation>()
    const key = JSON.stringify([row.itemAId, row.itemBId].sort())
    const previous = pairs.get(key)
    if (!previous || row.updatedAt > previous.updatedAt) pairs.set(key, row)
    byUser.set(row.userId, pairs)
  }

  const averageAllocations = Object.fromEntries(
    Object.keys(BUDGET_CATEGORIES).map((id) => [id, 0]),
  ) as Record<BudgetCategoryId, number>
  let totalUsers = 0
  for (const pairs of byUser.values()) {
    const comparisons = [...pairs.values()].map((row) => ({
      categoryA: row.itemAId, categoryB: row.itemBId,
      allocationA: row.allocationA, allocationB: row.allocationB,
    }))
    if (!comparisons.some((row) => row.allocationA + row.allocationB > 0)) continue
    const allocation = calculateAllocationsFromPairwise(comparisons)
    totalUsers += 1
    for (const id of Object.keys(averageAllocations) as BudgetCategoryId[]) {
      averageAllocations[id] += allocation[id] ?? 0
    }
  }
  if (totalUsers > 0) {
    for (const id of Object.keys(averageAllocations) as BudgetCategoryId[]) {
      averageAllocations[id] /= totalUsers
    }
  }
  return { averageAllocations, totalUsers }
}

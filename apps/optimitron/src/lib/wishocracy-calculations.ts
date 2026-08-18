import type { WishocraticAllocationInput } from './wishocracy-allocation'
import { WISHOCRATIC_ITEMS } from './wishocracy-data'

/**
 * Calculate final budget allocations from pairwise allocations
 * using simple win-loss ratio method.
 *
 * Algorithm: Sum up all allocations for each item across all pairs,
 * then normalize to percentages that sum to 100%.
 */
export function calculateAllocationsFromPairwise(
  allocations: WishocraticAllocationInput[]
): Record<string, number> {
  const scores: Record<string, number> = {}

  Object.keys(WISHOCRATIC_ITEMS).forEach(itemId => {
    scores[itemId] = 0
  })

  // Note: 0/0 allocations (NEITHER button) naturally get skipped
  // as they contribute 0 to both items
  allocations.forEach(allocation => {
    scores[allocation.itemAId] = (scores[allocation.itemAId] || 0) + allocation.allocationA
    scores[allocation.itemBId] = (scores[allocation.itemBId] || 0) + allocation.allocationB
  })

  const total = Object.values(scores).reduce((sum, score) => sum + score, 0)

  if (total === 0) {
    return Object.keys(WISHOCRATIC_ITEMS).reduce((result, itemId) => {
      result[itemId] = 0
      return result
    }, {} as Record<string, number>)
  }

  const normalized: Record<string, number> = {}

  Object.entries(scores).forEach(([itemId, score]) => {
    normalized[itemId] = Number(((score / total) * 100).toFixed(1))
  })

  return normalized
}

import { BUDGET_CATEGORIES } from './wishocracy-data'

export interface Comparison {
  itemAId: string
  itemBId: string
  allocationA: number
  allocationB: number
}

/**
 * Calculate final budget allocations from pairwise comparisons
 * using simple win-loss ratio method
 *
 * Algorithm: Sum up all allocations for each category across all pairs,
 * then normalize to percentages that sum to 100%
 */
export function calculateAllocationsFromPairwise(
  comparisons: Comparison[]
): Record<string, number> {
  const scores: Record<string, number> = {}

  // Initialize all categories to 0
  Object.keys(BUDGET_CATEGORIES).forEach(categoryId => {
    scores[categoryId] = 0
  })

  // Sum up allocations across all pairs
  // Note: 0/0 allocations (NEITHER button) naturally get skipped
  // as they contribute 0 to both categories
  comparisons.forEach(comparison => {
    scores[comparison.itemAId] = (scores[comparison.itemAId] || 0) + comparison.allocationA
    scores[comparison.itemBId] = (scores[comparison.itemBId] || 0) + comparison.allocationB
  })

  // Normalize to percentages (sum to 100)
  const total = Object.values(scores).reduce((sum, score) => sum + score, 0)

  // Avoid division by zero
  if (total === 0) {
    return Object.keys(BUDGET_CATEGORIES).reduce((result, categoryId) => {
      result[categoryId] = 0
      return result
    }, {} as Record<string, number>)
  }

  const normalized: Record<string, number> = {}

  Object.entries(scores).forEach(([categoryId, score]) => {
    normalized[categoryId] = Number(((score / total) * 100).toFixed(1))
  })

  return normalized
}

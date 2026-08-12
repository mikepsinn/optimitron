import { BUDGET_CATEGORIES } from './wishocracy-data'

export interface Comparison {
  categoryA: string
  categoryB: string
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
  Object.keys(BUDGET_CATEGORIES).forEach(cat => {
    scores[cat] = 0
  })

  // Sum up allocations across all pairs
  // Note: 0/0 allocations (NEITHER button) naturally get skipped
  // as they contribute 0 to both categories
  comparisons.forEach(comp => {
    scores[comp.categoryA] = (scores[comp.categoryA] || 0) + comp.allocationA
    scores[comp.categoryB] = (scores[comp.categoryB] || 0) + comp.allocationB
  })

  // Normalize to percentages (sum to 100)
  const total = Object.values(scores).reduce((sum, val) => sum + val, 0)

  // Avoid division by zero
  if (total === 0) {
    return Object.keys(BUDGET_CATEGORIES).reduce((acc, cat) => {
      acc[cat] = 0
      return acc
    }, {} as Record<string, number>)
  }

  const normalized: Record<string, number> = {}

  Object.entries(scores).forEach(([cat, score]) => {
    normalized[cat] = Number(((score / total) * 100).toFixed(1))
  })

  return normalized
}

/**
 * Validate that comparisons array is valid
 * Accepts any number of comparisons (users can do as many as they want)
 */
export function validateComparisons(comparisons: Comparison[]): boolean {
  return Array.isArray(comparisons) && comparisons.length >= 1
}

/**
 * Get the number of comparisons in current batch
 * Users can continue indefinitely, so this is just for tracking within a batch
 */
export function getRemainingPairs(currentIndex: number, totalInBatch: number = 25): number {
  return Math.max(0, totalInBatch - currentIndex)
}

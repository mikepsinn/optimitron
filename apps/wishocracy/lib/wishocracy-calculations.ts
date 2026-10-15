import { logLeastSquaresWeights, type PairwiseComparison } from "@optimitron/wishocracy"
import { BUDGET_CATEGORIES, isBudgetCategoryId } from './wishocracy-data'

export interface Comparison {
  categoryA: string
  categoryB: string
  allocationA: number
  allocationB: number
}

/** The "fund neither" answer (0 and 0) says nothing about which program deserves more. */
export function isNeitherAnswer(comparison: Pick<Comparison, "allocationA" | "allocationB">): boolean {
  return comparison.allocationA + comparison.allocationB === 0
}

/** Convert saved answers to the RAPPA engine's format, dropping "fund neither" answers and unknown programs. */
export function toPairwiseComparisons(comparisons: Comparison[], participantId: string): PairwiseComparison[] {
  return comparisons
    .filter((comparison) =>
      !isNeitherAnswer(comparison) &&
      comparison.categoryA !== comparison.categoryB &&
      isBudgetCategoryId(comparison.categoryA) &&
      isBudgetCategoryId(comparison.categoryB))
    .map((comparison, index) => ({
      id: `${participantId}-${index}`,
      participantId,
      itemAId: comparison.categoryA,
      itemBId: comparison.categoryB,
      allocationA: (comparison.allocationA / (comparison.allocationA + comparison.allocationB)) * 100,
      timestamp: 0,
    }))
}

/**
 * One person's budget split across the programs they compared, using the
 * Wishocracy paper's log least squares method. A program gets 0% when the
 * person never compared it or answered "fund neither" for it.
 */
export function calculateAllocationsFromPairwise(
  comparisons: Comparison[]
): Record<string, number> {
  const allocations: Record<string, number> = Object.fromEntries(
    Object.keys(BUDGET_CATEGORIES).map((id) => [id, 0]),
  )
  const pairwise = toPairwiseComparisons(comparisons, "self")
  const comparedIds = [...new Set(pairwise.flatMap((row) => [row.itemAId, row.itemBId]))].sort()
  const rejectedIds = new Set(
    comparisons.filter(isNeitherAnswer).flatMap((row) => [row.categoryA, row.categoryB]),
  )
  // Fit with rejected programs included: their answers still place the others.
  const weights = logLeastSquaresWeights(pairwise, comparedIds)
  const fundedIds = comparedIds.filter((id) => !rejectedIds.has(id))
  const fundedTotal = fundedIds.reduce((sum, id) => sum + (weights[id] ?? 0), 0)
  if (fundedTotal === 0) return allocations

  for (const id of fundedIds) {
    allocations[id] = Number((((weights[id] ?? 0) / fundedTotal) * 100).toFixed(1))
  }
  return allocations
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

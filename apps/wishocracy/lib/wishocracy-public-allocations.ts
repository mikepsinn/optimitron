import type { WishocraticAllocation } from "@optimitron/db"
import { logLeastSquaresConfidenceIntervals, type PairwiseComparison } from "@optimitron/wishocracy"
import { toPairwiseComparisons } from "./wishocracy-calculations"
import { BUDGET_CATEGORIES, isBudgetCategoryId } from "./wishocracy-data"
import type { BudgetCategoryId } from "./wishocracy-data"

type SavedAllocation = Pick<WishocraticAllocation,
  "id" | "userId" | "itemAId" | "itemBId" | "allocationA" | "allocationB" | "updatedAt"
>

export interface PublicAllocationResults {
  /** The public's preferred share of the listed programs, in percent. Sums to 100 when anyone has answered. */
  allocations: Record<BudgetCategoryId, number>
  /** 95% bootstrap interval for each share, in percent. */
  intervals: Record<BudgetCategoryId, { low: number; high: number }>
  /** Answers that compared each program with another. Programs with 0 answers get no share. */
  answerCounts: Record<BudgetCategoryId, number>
  /** People with at least one answer that split money between two programs. */
  totalUsers: number
}

const BOOTSTRAP_ITERATIONS = 200

/** Keep each person's latest answer per pair, whichever order the pair was saved in. */
export function latestAnswersByUser(rows: SavedAllocation[]): Map<string, SavedAllocation[]> {
  const byUser = new Map<string, Map<string, SavedAllocation>>()
  for (const row of rows) {
    if (!isBudgetCategoryId(row.itemAId) || !isBudgetCategoryId(row.itemBId) || row.itemAId === row.itemBId) continue
    if (row.allocationA < 0 || row.allocationB < 0 || row.allocationA > 100 || row.allocationB > 100) continue
    if (![0, 100].includes(row.allocationA + row.allocationB)) continue
    const pairs = byUser.get(row.userId) ?? new Map<string, SavedAllocation>()
    const key = JSON.stringify([row.itemAId, row.itemBId].sort())
    const previous = pairs.get(key)
    // Imported pairs can retain both orientations; IDs break timestamp ties stably.
    if (!previous || row.updatedAt > previous.updatedAt ||
      (row.updatedAt.getTime() === previous.updatedAt.getTime() && row.id > previous.id)) {
      pairs.set(key, row)
    }
    byUser.set(row.userId, pairs)
  }
  return new Map([...byUser].map(([userId, pairs]) => [userId, [...pairs.values()]]))
}

function emptyRecord<T>(value: () => T): Record<BudgetCategoryId, T> {
  return Object.fromEntries(Object.keys(BUDGET_CATEGORIES).map((id) => [id, value()])) as Record<BudgetCategoryId, T>
}

/**
 * The public's budget from everyone's latest answers, using the Wishocracy
 * paper's method: pool every answer per pair and fit one set of weights by
 * log least squares. Intervals resample people, not single answers.
 */
export function calculatePublicAllocations(rows: SavedAllocation[]): PublicAllocationResults {
  const pairwise: PairwiseComparison[] = []
  let totalUsers = 0
  for (const [userId, answers] of latestAnswersByUser(rows)) {
    const userRows = toPairwiseComparisons(answers.map((row) => ({
      categoryA: row.itemAId, categoryB: row.itemBId,
      allocationA: row.allocationA, allocationB: row.allocationB,
    })), userId)
    if (userRows.length === 0) continue
    totalUsers += 1
    pairwise.push(...userRows)
  }

  const answerCounts = emptyRecord(() => 0)
  for (const row of pairwise) {
    answerCounts[row.itemAId as BudgetCategoryId] += 1
    answerCounts[row.itemBId as BudgetCategoryId] += 1
  }
  const answeredIds = (Object.keys(answerCounts) as BudgetCategoryId[]).filter((id) => answerCounts[id] > 0)
  const allocations = emptyRecord(() => 0)
  const intervals = emptyRecord(() => ({ low: 0, high: 0 }))
  for (const weight of logLeastSquaresConfidenceIntervals(pairwise, answeredIds, { iterations: BOOTSTRAP_ITERATIONS })) {
    const id = weight.itemId as BudgetCategoryId
    allocations[id] = weight.weight * 100
    intervals[id] = { low: (weight.ciLow ?? weight.weight) * 100, high: (weight.ciHigh ?? weight.weight) * 100 }
  }
  return { allocations, intervals, answerCounts, totalUsers }
}

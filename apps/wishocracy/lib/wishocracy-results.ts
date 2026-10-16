import { answerAgreement, logLeastSquaresWeights } from "@optimitron/wishocracy"
import { BUDGET_CATEGORIES, getActualGovernmentAllocations, isBudgetCategoryId, type BudgetCategoryId } from "./wishocracy-data"
import { calculateAllocationsFromPairwise, toPairwiseComparisons, type Comparison } from "./wishocracy-calculations"
import type { PublicAllocationResults } from "./wishocracy-public-allocations"

export const MILITARY_ID: BudgetCategoryId = "MILITARY_OPERATIONS"
export const TRIALS_ID: BudgetCategoryId = "PRAGMATIC_CLINICAL_TRIALS"

/** Smaller differences between your order and other people's are not worth listing. */
const NOTABLE_PLACES = 2

/**
 * How people's priority for a program compares with the government's. Ranks,
 * not budget shares: the military takes over half of these programs' money,
 * so share ratios called nearly every small program "underfunded", even ones
 * most people want cut.
 */
export type Gap =
  | { kind: "no-answers" }
  | { kind: "not-funded" }
  | { kind: "same" }
  | { kind: "higher"; places: number }
  | { kind: "lower"; places: number }

export interface PersonalResult {
  /** Your split across the programs you compared, in percent. */
  allocations: Record<string, number>
  /** Programs you compared or answered "fund neither" for. */
  answeredIds: BudgetCategoryId[]
  /** How many of your answers your result reproduces. */
  agreement: { agreed: number; total: number }
}

export type YourPlace = { rejected: true } | { rejected: false; rank: number; of: number }

export interface GapRow {
  id: BudgetCategoryId
  name: string
  icon: string
  /** Annual federal spending, in billions. */
  budget: number
  answerCount: number
  /** Share of people who decided and would fund it at all. */
  support: number
  /** 1 = people's top priority, among the programs people have compared. */
  peopleRank?: number
  /** Likely best and worst people's rank, from the 95% intervals. */
  peopleRankRange?: [number, number]
  /** 1 = the government's largest budget, among the same programs. */
  governmentRank: number
  /** How many programs the ranks cover. */
  rankedCount: number
  gap: Gap
  /** Where your answers put this program among the programs you compared. */
  you?: YourPlace
}

export interface Difference {
  row: GapRow
  /** Your place among the programs you'd fund, or null if you'd fund none of it. */
  yourRank: number | null
  /** Other people's place among the same programs: the ones you'd fund, or all you compared if you reject it. */
  peopleRank: number
  of: number
}

export function buildPersonalResult(comparisons: Comparison[]): PersonalResult {
  const pairwise = toPairwiseComparisons(comparisons, "self")
  const comparedIds = [...new Set(pairwise.flatMap((row) => [row.itemAId, row.itemBId]))].sort()
  const answeredIds = [...new Set(comparisons.flatMap((row) => [row.categoryA, row.categoryB]))]
    .filter(isBudgetCategoryId)
    .sort()
  return {
    allocations: calculateAllocationsFromPairwise(comparisons),
    answeredIds,
    agreement: answerAgreement(pairwise, logLeastSquaresWeights(pairwise, comparedIds)),
  }
}

/** 1 + how many of the other values are strictly larger; ties share a rank. */
function rankOf(value: number, others: number[]): number {
  return 1 + others.filter((other) => other > value).length
}

export function classifyGap(
  peopleRank: number | undefined,
  range: [number, number] | undefined,
  governmentRank: number,
  budget: number,
): Gap {
  if (peopleRank === undefined || range === undefined) return { kind: "no-answers" }
  if (budget === 0) return { kind: "not-funded" }
  if (governmentRank >= range[0] && governmentRank <= range[1]) return { kind: "same" }
  return peopleRank < governmentRank
    ? { kind: "higher", places: governmentRank - peopleRank }
    : { kind: "lower", places: peopleRank - governmentRank }
}

function gapSortKey(row: GapRow): number {
  if (row.peopleRank === undefined) return -Infinity
  return row.governmentRank - row.peopleRank
}

/**
 * Every program, the ones people rank furthest above the government first.
 * Both ranks cover only the programs people have compared, so early results
 * with partial coverage still compare like with like.
 */
export function buildGapRows(results: PublicAllocationResults, personal?: PersonalResult): GapRow[] {
  const government = getActualGovernmentAllocations()
  const ids = Object.keys(BUDGET_CATEGORIES) as BudgetCategoryId[]
  const ranked = ids.filter((id) => results.answerCounts[id] > 0)
  const rankedSet = new Set(ranked)
  const scope = ranked.length > 0 ? ranked : ids
  const others = (id: BudgetCategoryId, value: (other: BudgetCategoryId) => number) =>
    scope.filter((other) => other !== id).map(value)

  const yours = (personal?.answeredIds ?? []).filter((id) => rankedSet.has(id))
  const yourFunded = yours.filter((id) => (personal?.allocations[id] ?? 0) > 0)

  return ids
    .map((id) => {
      const budget = BUDGET_CATEGORIES[id].annualBudget
      const governmentRank = rankOf(government[id], others(id, (other) => government[other]))
      const row: GapRow = {
        id,
        name: BUDGET_CATEGORIES[id].name,
        icon: BUDGET_CATEGORIES[id].icon,
        budget,
        answerCount: results.answerCounts[id],
        support: results.support[id],
        governmentRank,
        rankedCount: scope.length,
        gap: { kind: "no-answers" },
      }
      if (rankedSet.has(id)) {
        const { low, high } = results.intervals[id]
        row.peopleRank = rankOf(results.allocations[id], others(id, (other) => results.allocations[other]))
        row.peopleRankRange = [
          rankOf(high, others(id, (other) => results.intervals[other].low)),
          rankOf(low, others(id, (other) => results.intervals[other].high)),
        ]
      }
      row.gap = classifyGap(row.peopleRank, row.peopleRankRange, governmentRank, budget)
      if (personal && yours.includes(id)) {
        const mine = personal.allocations[id] ?? 0
        row.you = mine > 0
          ? { rejected: false, rank: rankOf(mine, yourFunded.filter((other) => other !== id).map((other) => personal.allocations[other] ?? 0)), of: yourFunded.length }
          : { rejected: true }
      }
      return row
    })
    .sort((a, b) => gapSortKey(b) - gapSortKey(a) || b.budget - a.budget || a.name.localeCompare(b.name))
}

/**
 * Where your order of the programs you compared differs most from other
 * people's order of the same programs. Programs you'd fund none of come first.
 */
export function biggestDifferences(rows: GapRow[], results: PublicAllocationResults, count = 3): Difference[] {
  const mine = rows.filter((row) => row.you !== undefined && row.peopleRank !== undefined)
  const funded = mine.filter((row) => row.you?.rejected === false)
  const peopleRankAmong = (row: GapRow, set: GapRow[]) =>
    rankOf(results.allocations[row.id], set.filter((other) => other.id !== row.id).map((other) => results.allocations[other.id]))
  return mine
    .map((row): Difference => row.you?.rejected === false
      ? { row, yourRank: row.you.rank, peopleRank: peopleRankAmong(row, funded), of: funded.length }
      : { row, yourRank: null, peopleRank: peopleRankAmong(row, mine), of: mine.length })
    .filter((d) => d.yourRank === null || Math.abs(d.peopleRank - d.yourRank) >= NOTABLE_PLACES)
    .sort((a, b) =>
      (a.yourRank === null ? -1 : 0) - (b.yourRank === null ? -1 : 0) ||
      Math.abs(b.peopleRank - (b.yourRank ?? b.peopleRank)) - Math.abs(a.peopleRank - (a.yourRank ?? a.peopleRank)) ||
      a.row.name.localeCompare(b.row.name))
    .slice(0, count)
}

/** Dollars spent on the base military budget per $1 on pragmatic clinical trials. */
export function militaryPerTrialDollar(results: PublicAllocationResults): { government: number; everyone: number | null } {
  const government = BUDGET_CATEGORIES[MILITARY_ID].annualBudget / BUDGET_CATEGORIES[TRIALS_ID].annualBudget
  const answered = results.answerCounts[MILITARY_ID] > 0 && results.allocations[TRIALS_ID] > 0
  return {
    government,
    everyone: answered ? results.allocations[MILITARY_ID] / results.allocations[TRIALS_ID] : null,
  }
}

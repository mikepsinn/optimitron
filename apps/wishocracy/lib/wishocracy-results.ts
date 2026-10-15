import { answerAgreement, logLeastSquaresWeights } from "@optimitron/wishocracy"
import { BUDGET_CATEGORIES, getActualGovernmentAllocations, isBudgetCategoryId, type BudgetCategoryId } from "./wishocracy-data"
import { calculateAllocationsFromPairwise, toPairwiseComparisons, type Comparison } from "./wishocracy-calculations"
import type { PublicAllocationResults } from "./wishocracy-public-allocations"

export const MILITARY_ID: BudgetCategoryId = "MILITARY_OPERATIONS"
export const TRIALS_ID: BudgetCategoryId = "PRAGMATIC_CLINICAL_TRIALS"

/** Ratios between 1/1.1 and 1.1 read as no clear gap. */
const SAME_RATIO = 1.1
/** Smaller personal differences are not worth listing. */
const NOTABLE_RATIO = 1.5

export type Gap =
  | { kind: "no-answers" }
  | { kind: "not-funded" }
  | { kind: "unclear" }
  | { kind: "more"; ratio: number }
  | { kind: "less"; ratio: number }

export interface PersonalResult {
  /** Your split across the programs you compared, in percent. */
  allocations: Record<string, number>
  /** Programs you compared or answered "fund neither" for. */
  answeredIds: BudgetCategoryId[]
  /** How many of your answers your result reproduces. */
  agreement: { agreed: number; total: number }
}

export interface GapRow {
  id: BudgetCategoryId
  name: string
  icon: string
  everyone: number
  everyoneLow: number
  everyoneHigh: number
  government: number
  answerCount: number
  gap: Gap
  /** Your share, scaled to the money everyone gives the programs you answered. */
  you?: number
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

export function classifyGap(everyone: number, low: number, high: number, government: number, answerCount: number): Gap {
  if (answerCount === 0) return { kind: "no-answers" }
  if (government === 0) return { kind: "not-funded" }
  const ratio = everyone / government
  if ((low <= government && government <= high) || (ratio < SAME_RATIO && ratio > 1 / SAME_RATIO)) {
    return { kind: "unclear" }
  }
  return ratio > 1 ? { kind: "more", ratio } : { kind: "less", ratio: 1 / ratio }
}

function gapSortKey(row: GapRow): number {
  if (row.gap.kind === "no-answers") return -Infinity
  if (row.gap.kind === "not-funded") return Infinity
  return Math.log(row.everyone / row.government)
}

/**
 * Every program, most underfunded relative to what everyone wants first.
 * People's shares cover only programs someone answered, so they are rescaled
 * to split the government money for those programs; both bars then share one
 * total even before every program has answers.
 */
export function buildGapRows(results: PublicAllocationResults, personal?: PersonalResult): GapRow[] {
  const government = getActualGovernmentAllocations()
  const ids = Object.keys(BUDGET_CATEGORIES) as BudgetCategoryId[]
  const answeredGovernment = ids
    .filter((id) => results.answerCounts[id] > 0)
    .reduce((sum, id) => sum + government[id], 0)
  const scale = answeredGovernment > 0 ? answeredGovernment / 100 : 1
  const yours = new Set(personal?.answeredIds ?? [])
  const yourShare = [...yours].reduce((sum, id) => sum + results.allocations[id] * scale, 0)

  return ids
    .map((id) => {
      const everyone = results.allocations[id] * scale
      const low = results.intervals[id].low * scale
      const high = results.intervals[id].high * scale
      const row: GapRow = {
        id,
        name: BUDGET_CATEGORIES[id].name,
        icon: BUDGET_CATEGORIES[id].icon,
        everyone,
        everyoneLow: low,
        everyoneHigh: high,
        government: government[id],
        answerCount: results.answerCounts[id],
        gap: classifyGap(everyone, low, high, government[id], results.answerCounts[id]),
      }
      if (personal && yours.has(id)) row.you = ((personal.allocations[id] ?? 0) / 100) * yourShare
      return row
    })
    .sort((a, b) => gapSortKey(b) - gapSortKey(a) || b.government - a.government || a.name.localeCompare(b.name))
}

/** Your answered programs where you differ from everyone by at least 1.5×, biggest first. */
export function biggestDifferences(rows: GapRow[], count = 3): Array<{ row: GapRow; ratio: number }> {
  return rows
    .filter((row): row is GapRow & { you: number } => row.you !== undefined && row.everyone > 0)
    .map((row) => ({ row, ratio: row.you / row.everyone }))
    .filter(({ ratio }) => Math.abs(Math.log(ratio)) >= Math.log(NOTABLE_RATIO))
    .sort((a, b) => Math.abs(Math.log(b.ratio)) - Math.abs(Math.log(a.ratio)) || a.row.name.localeCompare(b.row.name))
    .slice(0, count)
}

/** Dollars spent on the base military budget per $1 on pragmatic clinical trials. */
export function militaryPerTrialDollar(results: PublicAllocationResults): { government: number; everyone: number | null } {
  const government = BUDGET_CATEGORIES[MILITARY_ID].annualBudget / BUDGET_CATEGORIES[TRIALS_ID].annualBudget
  const answered = results.answerCounts[MILITARY_ID] > 0 && results.answerCounts[TRIALS_ID] > 0
  return {
    government,
    everyone: answered ? results.allocations[MILITARY_ID] / results.allocations[TRIALS_ID] : null,
  }
}

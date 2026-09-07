import type { VotePosition } from "@optimitron/db"

export function summarizeVotePercentages(groups: { answer: VotePosition; _count: { _all: number } }[]) {
  const total = groups.reduce((sum, group) => sum + group._count._all, 0)
  if (total === 0) return null
  return groups.reduce((result, group) => {
    result[group.answer] += group._count._all / total * 100
    return result
  }, { YES: 0, NO: 0, ABSTAIN: 0 })
}

export const MILITARY_ALLOCATION_ITEM_ID = "MILITARY_OPERATIONS"
export const TRIALS_ALLOCATION_ITEM_ID = "PRAGMATIC_CLINICAL_TRIALS"

export function summarizeFundingAllocations(allocations: {
  userId: string
  itemAId: string
  itemBId: string
  allocationA: number
  allocationB: number
  updatedAt: Date
}[], userId: string) {
  const latest = new Map<string, { military: number; updatedAt: Date }>()
  for (const allocation of allocations) {
    const forward = allocation.itemAId === MILITARY_ALLOCATION_ITEM_ID && allocation.itemBId === TRIALS_ALLOCATION_ITEM_ID
    const reverse = allocation.itemBId === MILITARY_ALLOCATION_ITEM_ID && allocation.itemAId === TRIALS_ALLOCATION_ITEM_ID
    if (!forward && !reverse) continue
    const military = forward ? allocation.allocationA : allocation.allocationB
    if (!Number.isFinite(military) || military < 0 || military > 100 || allocation.allocationA + allocation.allocationB !== 100) continue
    const previous = latest.get(allocation.userId)
    if (!previous || allocation.updatedAt > previous.updatedAt) {
      latest.set(allocation.userId, { military, updatedAt: allocation.updatedAt })
    }
  }
  const values = [...latest.values()].map(value => value.military).sort((a, b) => a - b)
  const middle = Math.floor(values.length / 2)
  return {
    user: latest.get(userId)?.military ?? null,
    average: values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null,
    median: values.length ? (values[middle]! + values[Math.floor((values.length - 1) / 2)]!) / 2 : null,
  }
}

export type SurveyVotePercentages = NonNullable<ReturnType<typeof summarizeVotePercentages>>
export interface DashboardSurveyResults {
  questions: { slug: string; title: string; question: string; percentages: SurveyVotePercentages | null }[]
  funding: ReturnType<typeof summarizeFundingAllocations>
}

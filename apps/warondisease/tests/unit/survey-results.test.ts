import { describe, expect, it } from "vitest"
import {
  MILITARY_ALLOCATION_ITEM_ID as military,
  TRIALS_ALLOCATION_ITEM_ID as trials,
  summarizeFundingAllocations,
  summarizeVotePercentages,
} from "../../../../packages/site-kit/src/lib/survey-results"

describe("survey result percentages", () => {
  it("includes unsure responses in the denominator without returning counts", () => {
    expect(summarizeVotePercentages([
      { answer: "YES", _count: { _all: 3 } },
      { answer: "NO", _count: { _all: 1 } },
      { answer: "ABSTAIN", _count: { _all: 4 } },
    ])).toEqual({ YES: 37.5, NO: 12.5, ABSTAIN: 50 })
  })

  it("keeps an unanswered question distinct from zero support", () => {
    expect(summarizeVotePercentages([])).toBeNull()
    expect(summarizeVotePercentages([{ answer: "NO", _count: { _all: 1 } }])).toEqual({ YES: 0, NO: 100, ABSTAIN: 0 })
  })
})

const allocation = (userId: string, allocationA: number, reversed = false, day = 1) => ({
  userId, itemAId: reversed ? trials : military, itemBId: reversed ? military : trials,
  allocationA, allocationB: 100 - allocationA, updatedAt: new Date(`2026-01-0${day}T00:00:00Z`),
})

describe("funding results", () => {
  it("uses each participant's latest answer, including reversed item order", () => {
    const rows = [allocation("a", 10), allocation("a", 70, true, 2), allocation("b", 80), allocation("c", 10)]
    const results = summarizeFundingAllocations(rows, "a")
    expect(results).toEqual({ user: 30, average: 40, median: 30 })
    expect(summarizeFundingAllocations([...rows].reverse(), "a")).toEqual(results)
  })

  it("retains genuine zero allocations and ignores invalid or unrelated comparisons", () => {
    expect(summarizeFundingAllocations([
      allocation("a", 0), allocation("b", 100),
      { ...allocation("c", 70), allocationB: 70 },
      { ...allocation("d", 40), itemBId: "EDUCATION" },
      allocation("e", -1),
    ], "a")).toEqual({ user: 0, average: 50, median: 50 })
  })

  it("does not invent an average or require the current user to have answered", () => {
    expect(summarizeFundingAllocations([], "a")).toEqual({ user: null, average: null, median: null })
    expect(summarizeFundingAllocations([allocation("b", 20)], "a")).toEqual({ user: null, average: 20, median: 20 })
  })

  it("returns only aggregate values when no participant is requested", () => {
    expect(summarizeFundingAllocations([allocation("a", 20), allocation("b", 60)]))
      .toEqual({ user: null, average: 40, median: 40 })
  })
})

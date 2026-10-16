import { describe, expect, it } from "vitest"
import { biggestDifferences, buildGapRows, buildPersonalResult, classifyGap, militaryPerTrialDollar, MILITARY_ID, TRIALS_ID } from "./wishocracy-results"
import { calculatePublicAllocations } from "./wishocracy-public-allocations"
import { BUDGET_CATEGORIES, type BudgetCategoryId } from "./wishocracy-data"

const ids = Object.keys(BUDGET_CATEGORIES) as BudgetCategoryId[]
const ISRAEL_AID: BudgetCategoryId = "ISRAEL_GAZA_MILITARY_AID"
const VETERANS: BudgetCategoryId = "VETERANS_HEALTHCARE"
function row(userId: string, itemAId: string, itemBId: string, allocationA: number, allocationB = 100 - allocationA) {
  return { id: `${userId}-${itemAId}-${itemBId}`, userId, itemAId, itemBId, allocationA, allocationB, updatedAt: new Date(2026, 0, 1) }
}
const people = ["p1", "p2", "p3", "p4"]

describe("classifyGap", () => {
  it("only calls a gap when the government's rank falls outside people's likely ranks", () => {
    expect(classifyGap(undefined, undefined, 3, 10)).toEqual({ kind: "no-answers" })
    expect(classifyGap(2, [1, 4], 9, 0)).toEqual({ kind: "not-funded" })
    expect(classifyGap(5, [3, 7], 6, 10)).toEqual({ kind: "same" })
    expect(classifyGap(2, [1, 3], 9, 10)).toEqual({ kind: "higher", places: 7 })
    expect(classifyGap(9, [8, 10], 1, 10)).toEqual({ kind: "lower", places: 8 })
  })
})

describe("buildGapRows", () => {
  it("shows a program people put last as ranked lower, even when the government barely funds it", () => {
    // Share ratios called this "Want 6.6x more" because the military takes half the money.
    const answers = people.flatMap((p) => [
      row(p, MILITARY_ID, ISRAEL_AID, 90),
      row(p, VETERANS, ISRAEL_AID, 95),
      row(p, VETERANS, MILITARY_ID, 60),
    ])
    const rows = buildGapRows(calculatePublicAllocations(answers))
    const aid = rows.find((r) => r.id === ISRAEL_AID)!
    expect(aid.peopleRank).toBe(3)
    expect(aid.governmentRank).toBe(3)
    expect(rows.find((r) => r.id === VETERANS)!.gap.kind).toBe("higher")
    expect(rows.find((r) => r.id === MILITARY_ID)!.gap.kind).toBe("lower")
    expect(rows.slice(3).every((r) => r.gap.kind === "no-answers")).toBe(true)
  })

  it("ranks both sides over only the programs people compared, so partial results compare like with like", () => {
    const rows = buildGapRows(calculatePublicAllocations(people.map((p) => row(p, TRIALS_ID, MILITARY_ID, 70))))
    const trials = rows.find((r) => r.id === TRIALS_ID)!
    expect(trials.rankedCount).toBe(2)
    expect(trials.peopleRank).toBe(1)
    expect(trials.governmentRank).toBe(2)
    expect(trials.gap).toEqual({ kind: "higher", places: 1 })
    expect(rows[0]!.id).toBe(TRIALS_ID)
  })

  it("never reports a program with a budget as unfunded", () => {
    const rows = buildGapRows(calculatePublicAllocations(ids.slice(1).map((id) => row("p1", ids[0]!, id, 50))))
    for (const r of rows) {
      expect(r.gap.kind === "not-funded", r.id).toBe(BUDGET_CATEGORIES[r.id].annualBudget === 0)
    }
  })
})

describe("your answers", () => {
  it("places you among the programs you'd fund and lists what you reject first", () => {
    const [x, y] = ids.filter((id) => id !== MILITARY_ID && id !== TRIALS_ID && id !== VETERANS)
    const yours = [
      { categoryA: TRIALS_ID, categoryB: MILITARY_ID, allocationA: 90, allocationB: 10 },
      { categoryA: MILITARY_ID, categoryB: VETERANS, allocationA: 70, allocationB: 30 },
      { categoryA: x!, categoryB: y!, allocationA: 0, allocationB: 0 },
    ]
    const others = people.flatMap((p) => [
      row(p, VETERANS, MILITARY_ID, 80), row(p, MILITARY_ID, TRIALS_ID, 60),
      row(p, x!, VETERANS, 30), row(p, y!, TRIALS_ID, 40),
    ])
    const results = calculatePublicAllocations(others)
    const rows = buildGapRows(results, buildPersonalResult(yours))
    expect(rows.find((r) => r.id === TRIALS_ID)!.you).toEqual({ rejected: false, rank: 1, of: 3 })
    expect(rows.find((r) => r.id === x)!.you).toEqual({ rejected: true })

    const differences = biggestDifferences(rows, results, 5)
    expect(differences.slice(0, 2).map((d) => d.yourRank)).toEqual([null, null])
    expect(differences[0]!.of).toBe(5)
    // Among the 3 you'd fund, you put veterans last; other people put it first.
    expect(differences.find((d) => d.row.id === VETERANS)).toMatchObject({ yourRank: 3, peopleRank: 1, of: 3 })
    expect(differences.some((d) => d.row.id === MILITARY_ID)).toBe(false)
  })
})

describe("militaryPerTrialDollar", () => {
  it("compares government spending even before anyone has answered both programs", () => {
    const empty = militaryPerTrialDollar(calculatePublicAllocations([]))
    expect(empty.government).toBeCloseTo(BUDGET_CATEGORIES[MILITARY_ID].annualBudget / BUDGET_CATEGORIES[TRIALS_ID].annualBudget)
    expect(empty.everyone).toBeNull()
    const answered = militaryPerTrialDollar(calculatePublicAllocations([row("p1", MILITARY_ID, TRIALS_ID, 20)]))
    expect(answered.everyone).toBeCloseTo(0.25, 1)
  })
})

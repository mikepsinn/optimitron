import { describe, expect, it } from "vitest"
import { biggestDifferences, buildGapRows, buildPersonalResult, classifyGap, militaryPerTrialDollar, MILITARY_ID, TRIALS_ID } from "./wishocracy-results"
import { calculatePublicAllocations } from "./wishocracy-public-allocations"
import { BUDGET_CATEGORIES, getActualGovernmentAllocations, type BudgetCategoryId } from "./wishocracy-data"

const ids = Object.keys(BUDGET_CATEGORIES) as BudgetCategoryId[]
const government = getActualGovernmentAllocations()
const [funded, other, third] = ids.filter((id) => government[id] > 0)
const unfunded = ids.find((id) => government[id] === 0)
function row(userId: string, itemAId: string, itemBId: string, allocationA: number, allocationB = 100 - allocationA) {
  return { id: `${userId}-${itemAId}-${itemBId}`, userId, itemAId, itemBId, allocationA, allocationB, updatedAt: new Date(2026, 0, 1) }
}

describe("classifyGap", () => {
  it("only calls a gap when the government share sits outside everyone's interval", () => {
    expect(classifyGap(0, 0, 0, 5, 0)).toEqual({ kind: "no-answers" })
    expect(classifyGap(3, 2, 4, 0, 4)).toEqual({ kind: "not-funded" })
    expect(classifyGap(6, 2, 9, 5, 4)).toEqual({ kind: "unclear" })
    expect(classifyGap(5.2, 5.2, 5.2, 5, 4)).toEqual({ kind: "unclear" })
    expect(classifyGap(10, 9, 11, 2, 4)).toEqual({ kind: "more", ratio: 5 })
    expect(classifyGap(1, 0.9, 1.1, 4, 4)).toEqual({ kind: "less", ratio: 4 })
  })
})

describe("buildGapRows", () => {
  it("puts unfunded programs first, then the largest shortfall, and unanswered programs last", () => {
    const people = ["p1", "p2", "p3"]
    const results = calculatePublicAllocations(people.flatMap((p) => [
      row(p, funded!, other!, 90), row(p, other!, third!, 50), row(p, unfunded!, funded!, 50),
    ]))
    const rows = buildGapRows(results)
    expect(rows[0]!.id).toBe(unfunded)
    expect(rows[0]!.gap.kind).toBe("not-funded")
    const answeredOrder = rows.filter((r) => r.answerCount > 0).map((r) => r.everyone / (r.government || 1e-9))
    expect(answeredOrder.slice(1)).toEqual([...answeredOrder.slice(1)].sort((a, b) => b - a))
    expect(rows.slice(4).every((r) => r.gap.kind === "no-answers")).toBe(true)
  })

  it("places your dots only on programs you answered, scaled to everyone's money for those programs", () => {
    const yours = [
      { categoryA: funded!, categoryB: other!, allocationA: 50, allocationB: 50 },
      { categoryA: third!, categoryB: unfunded!, allocationA: 0, allocationB: 0 },
    ]
    const results = calculatePublicAllocations([
      row("you", funded!, other!, 50), row("you", third!, unfunded!, 0, 0),
      row("p2", funded!, other!, 80), row("p2", other!, third!, 50), row("p2", third!, unfunded!, 50),
    ])
    const rows = buildGapRows(results, buildPersonalResult(yours))
    const answered = rows.filter((r) => r.you !== undefined)
    expect(answered.map((r) => r.id).sort()).toEqual([funded!, other!, third!, unfunded!].sort())
    const everyoneTotal = answered.reduce((sum, r) => sum + r.everyone, 0)
    expect(answered.reduce((sum, r) => sum + (r.you ?? 0), 0)).toBeCloseTo(everyoneTotal, 5)
    expect(rows.find((r) => r.id === third)!.you).toBe(0)

    const differences = biggestDifferences(rows)
    expect(differences[0]!.ratio).toBe(0)
    expect(differences.every(({ ratio }) => ratio === 0 || ratio >= 1.5 || ratio <= 1 / 1.5)).toBe(true)
  })
})

describe("buildGapRows with few programs answered", () => {
  it("splits the government's money for the answered programs instead of a separate 100%", () => {
    // One answer used to show trials at 64.9% against a 0.1% government share of all programs.
    const rows = buildGapRows(calculatePublicAllocations([row("p1", MILITARY_ID, TRIALS_ID, 35)]))
    const answered = rows.filter((r) => r.answerCount > 0)
    expect(answered.map((r) => r.id).sort()).toEqual([MILITARY_ID, TRIALS_ID].sort())
    const everyoneTotal = answered.reduce((sum, r) => sum + r.everyone, 0)
    const governmentTotal = answered.reduce((sum, r) => sum + r.government, 0)
    expect(everyoneTotal).toBeCloseTo(governmentTotal, 5)
    const military = answered.find((r) => r.id === MILITARY_ID)!
    expect(military.everyone / military.government).toBeCloseTo(0.35 * governmentTotal / military.government, 1)
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

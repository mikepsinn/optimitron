import { describe, expect, it } from "vitest"
import { calculatePublicAllocations } from "./wishocracy-public-allocations"
import { BUDGET_CATEGORIES } from "./wishocracy-data"

const [a, b, c] = Object.keys(BUDGET_CATEGORIES)
function row(userId: string, amount: number, itemAId = a!, itemBId = b!, day = 1) {
  return { id: `${userId}-${itemAId}-${itemBId}-${day}`, userId, itemAId, itemBId, allocationA: amount, allocationB: 100 - amount, updatedAt: new Date(2026, 0, day) }
}

describe("public budget", () => {
  it("ranks a program above another when the only person who compared them preferred it", () => {
    // Averaging each person's own split ranked b first (40% vs 50%), although p1 gave a 80 of 100 against b.
    const results = calculatePublicAllocations([row("p1", 80, a!, b!), row("p2", 80, b!, c!)])
    expect(results.allocations[a!]).toBeGreaterThan(results.allocations[b!])
    expect(results.allocations[b!]).toBeGreaterThan(results.allocations[c!])
    expect(results.totalUsers).toBe(2)
  })

  it("splits evenly when two people give opposite all-or-nothing answers", () => {
    const results = calculatePublicAllocations([row("one", 0), row("two", 100)])
    expect(results.allocations[a!]).toBeCloseTo(50, 5)
    expect(results.allocations[b!]).toBeCloseTo(50, 5)
  })

  it("gives no share to programs nobody has compared", () => {
    const results = calculatePublicAllocations([row("one", 60)])
    expect(results.allocations[c!]).toBe(0)
    expect(results.answerCounts[c!]).toBe(0)
    expect(results.answerCounts[a!]).toBe(1)
    expect(results.allocations[a!] + results.allocations[b!]).toBeCloseTo(100, 5)
  })

  it("uses the latest answer even when pair order changes", () => {
    const results = calculatePublicAllocations([row("one", 80, b!, a!, 2), row("one", 90)])
    expect(results.allocations[a!]).toBeCloseTo(20, 0)
    expect(results.allocations[b!]).toBeCloseTo(80, 0)
  })

  it("breaks timestamp ties consistently without overriding a newer answer", () => {
    const first = { ...row("one", 70), id: "allocation-a" }
    const reversed = { ...row("one", 80, b!, a!), id: "allocation-z" }
    const forward = calculatePublicAllocations([first, reversed])
    const backward = calculatePublicAllocations([reversed, first])
    expect(forward.allocations[a!]).toBeCloseTo(20, 0)
    expect(backward).toEqual(forward)
    expect(forward.totalUsers).toBe(1)

    const newer = { ...first, updatedAt: new Date(2026, 0, 2) }
    expect(calculatePublicAllocations([reversed, newer]).allocations[a!]).toBeCloseTo(70, 0)
  })

  it("excludes other catalogs and people who only answered fund neither", () => {
    const results = calculatePublicAllocations([
      row("one", 60), row("one", 100, "foreign", a!), row("foreign", 50, "other", "foreign"),
      { ...row("neither", 0), allocationB: 0 },
    ])
    expect(results.allocations[a!]).toBeCloseTo(60, 0)
    expect(results.totalUsers).toBe(1)
    expect(Object.keys(results.allocations)).toEqual(Object.keys(BUDGET_CATEGORIES))
  })

  it("replaces a prior allocation with a latest neither response", () => {
    const results = calculatePublicAllocations([row("one", 60), { ...row("one", 0, a!, b!, 2), allocationB: 0 }])
    expect(results.totalUsers).toBe(0)
    expect(Object.values(results.allocations).every((value) => value === 0)).toBe(true)
  })

  it("reports an interval around each share that widens when people disagree", () => {
    const agree = calculatePublicAllocations(["p1", "p2", "p3"].map((p) => row(p, 70)))
    const disagree = calculatePublicAllocations([row("p1", 90), row("p2", 70), row("p3", 30)])
    expect(agree.intervals[a!].high - agree.intervals[a!].low).toBeCloseTo(0, 5)
    const { low, high } = disagree.intervals[a!]
    expect(high - low).toBeGreaterThan(1)
    expect(low).toBeLessThanOrEqual(disagree.allocations[a!])
    expect(high).toBeGreaterThanOrEqual(disagree.allocations[a!])
  })
})

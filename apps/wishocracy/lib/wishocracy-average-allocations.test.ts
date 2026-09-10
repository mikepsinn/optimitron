import { describe, expect, it } from "vitest"
import { calculateAverageAllocations } from "./wishocracy-average-allocations"
import { BUDGET_CATEGORIES } from "./wishocracy-data"

const [a, b, c] = Object.keys(BUDGET_CATEGORIES)
function row(userId: string, amount: number, itemAId = a!, itemBId = b!, day = 1) {
  return { userId, itemAId, itemBId, allocationA: amount, allocationB: 100 - amount, updatedAt: new Date(2026, 0, day) }
}

describe("public budget averages", () => {
  it("includes zero allocations in the equal-weight participant average", () => {
    const results = calculateAverageAllocations([row("one", 0), row("two", 100)])
    expect(results.averageAllocations[a!]).toBe(50)
    expect(results.averageAllocations[b!]).toBe(50)
    expect(results.totalUsers).toBe(2)
  })

  it("does not give participants with more comparisons more weight", () => {
    const results = calculateAverageAllocations([row("one", 100), row("one", 100, a!, c!), row("two", 0)])
    expect(results.averageAllocations[a!]).toBe(50)
    expect(results.averageAllocations[b!]).toBe(50)
  })

  it("uses the latest answer even when pair order changes", () => {
    const results = calculateAverageAllocations([row("one", 80, b!, a!, 2), row("one", 90)])
    expect(results.averageAllocations[a!]).toBe(20)
    expect(results.averageAllocations[b!]).toBe(80)
  })

  it("excludes other catalogs and participants with no positive allocation", () => {
    const results = calculateAverageAllocations([
      row("one", 60), row("one", 100, "foreign", a!), row("foreign", 50, "other", "foreign"),
      { ...row("neither", 0), allocationB: 0 },
    ])
    expect(results.averageAllocations[a!]).toBe(60)
    expect(results.totalUsers).toBe(1)
    expect(Object.keys(results.averageAllocations)).toEqual(Object.keys(BUDGET_CATEGORIES))
  })

  it("replaces a prior allocation with a latest neither response", () => {
    const results = calculateAverageAllocations([row("one", 60), { ...row("one", 0, a!, b!, 2), allocationB: 0 }])
    expect(results.totalUsers).toBe(0)
    expect(Object.values(results.averageAllocations).every((value) => value === 0)).toBe(true)
  })
})

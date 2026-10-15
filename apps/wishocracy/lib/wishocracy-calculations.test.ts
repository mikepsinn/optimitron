import { describe, expect, it } from "vitest"
import { calculateAllocationsFromPairwise } from "./wishocracy-calculations"
import { BUDGET_CATEGORIES } from "./wishocracy-data"

const [a, b, c, d] = Object.keys(BUDGET_CATEGORIES)
const pair = (categoryA: string, categoryB: string, allocationA: number, allocationB = 100 - allocationA) =>
  ({ categoryA, categoryB, allocationA, allocationB })

describe("personal budget", () => {
  it("does not give a program more money just because it appeared in more pairs", () => {
    // Summing slider points gave a 50% and the others 16.7% each for the same 50-50 answers.
    const allocations = calculateAllocationsFromPairwise([pair(a!, b!, 50), pair(a!, c!, 50), pair(a!, d!, 50)])
    for (const id of [a!, b!, c!, d!]) expect(allocations[id]).toBeCloseTo(25, 0)
  })

  it("gives 0% to programs never compared and to programs answered with fund neither", () => {
    const allocations = calculateAllocationsFromPairwise([pair(a!, b!, 75), pair(b!, c!, 60), pair(c!, d!, 0, 0)])
    expect(allocations[c!]).toBe(0)
    expect(allocations[d!]).toBe(0)
    const others = Object.keys(BUDGET_CATEGORIES).filter((id) => ![a, b, c, d].includes(id))
    expect(others.every((id) => allocations[id] === 0)).toBe(true)
    expect(allocations[a]! + allocations[b]!).toBeCloseTo(100, 0)
    expect(allocations[a]! / allocations[b]!).toBeCloseTo(3, 1)
  })

  it("returns all zeros when every answer is fund neither", () => {
    const allocations = calculateAllocationsFromPairwise([pair(a!, b!, 0, 0)])
    expect(Object.values(allocations).every((value) => value === 0)).toBe(true)
  })
})

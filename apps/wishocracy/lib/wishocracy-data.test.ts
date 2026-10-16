import { describe, expect, it } from "vitest"
import { BUDGET_CATEGORIES, getActualGovernmentAllocations, type BudgetCategoryId } from "./wishocracy-data"

describe("government shares", () => {
  it("gives every program with a budget a nonzero share", () => {
    // Rounding to 0.1% showed the $0.6B violent crime incarceration figure as unfunded.
    const shares = getActualGovernmentAllocations()
    for (const id of Object.keys(BUDGET_CATEGORIES) as BudgetCategoryId[]) {
      expect(shares[id] > 0, id).toBe(BUDGET_CATEGORIES[id].annualBudget > 0)
    }
    expect(Object.values(shares).reduce((sum, share) => sum + share, 0)).toBeCloseTo(100, 10)
  })
})

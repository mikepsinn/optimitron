import { BUDGET_CATEGORIES } from "./wishocracy-data"
import { calculateAverageAllocations } from "./wishocracy-average-allocations"

/** Explicit, deterministic review data. Normal requests always use saved responses. */
export function getWishocracyVisualFixture(visual?: string) {
  if (process.env.NODE_ENV !== "development" && process.env.SITE_APP_VISUAL_FIXTURES !== "1") return undefined
  if (visual !== "1" && visual !== "empty" && visual !== "complete") return undefined
  const ids = Object.keys(BUDGET_CATEGORIES)
  const comparisons = ids.slice(1).map((id) => ({
    categoryA: ids[0]!, categoryB: id, allocationA: 65, allocationB: 35,
  }))
  const results = calculateAverageAllocations(visual === "empty" ? [] : comparisons.map((row) => ({
    userId: "visual-review", itemAId: row.categoryA, itemBId: row.categoryB,
    allocationA: row.allocationA, allocationB: row.allocationB,
    updatedAt: new Date("2026-01-01T00:00:00Z"),
  })))
  return { comparisons, results }
}

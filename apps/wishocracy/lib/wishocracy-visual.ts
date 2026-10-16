import { DEFAULT_WISHOCRATIC_ITEMS } from "@optimitron/data/wishocratic-items-registry"
import { BUDGET_CATEGORIES, type BudgetCategoryId } from "./wishocracy-data"
import type { Comparison } from "./wishocracy-calculations"
import { calculatePublicAllocations } from "./wishocracy-public-allocations"
import { MILITARY_ID, TRIALS_ID } from "./wishocracy-results"

const FIXTURE_DATE = new Date("2026-01-01T00:00:00Z")
const FIXTURE_PEOPLE = 60
const FIXTURE_ANSWERS_EACH = 12
/** Below this estimated share, synthetic people sometimes answer "fund neither". */
const DISLIKED_PCT = 2.5

function seededRng(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) | 0
    return (s >>> 0) / 0x100000000
  }
}

/** The visual reviewer's own answers: a few programs, one "fund neither". */
function reviewerAnswers(ids: BudgetCategoryId[]): Comparison[] {
  const [a, b, c, d] = ids.filter((id) => id !== MILITARY_ID && id !== TRIALS_ID)
  return [
    { categoryA: TRIALS_ID, categoryB: MILITARY_ID, allocationA: 90, allocationB: 10 },
    { categoryA: TRIALS_ID, categoryB: a!, allocationA: 70, allocationB: 30 },
    { categoryA: a!, categoryB: b!, allocationA: 40, allocationB: 60 },
    { categoryA: b!, categoryB: MILITARY_ID, allocationA: 75, allocationB: 25 },
    { categoryA: c!, categoryB: d!, allocationA: 0, allocationB: 0 },
  ]
}

/**
 * Explicit, deterministic review data: synthetic people whose answers follow
 * the catalog's poll-based citizen estimate, with noise. Normal requests
 * always use saved responses.
 */
export function getWishocracyVisualFixture(visual?: string) {
  if (process.env.NODE_ENV !== "development" && process.env.SITE_APP_VISUAL_FIXTURES !== "1") return undefined
  if (visual !== "1" && visual !== "empty" && visual !== "complete" && visual !== "personal") return undefined
  const ids = Object.keys(BUDGET_CATEGORIES) as BudgetCategoryId[]
  const comparisons = reviewerAnswers(ids)
  if (visual === "empty") return { comparisons, results: calculatePublicAllocations([]) }

  const strength = (id: BudgetCategoryId) => DEFAULT_WISHOCRATIC_ITEMS[id].estimatedCitizenAllocationPct
  const rng = seededRng(42)
  const rows = []
  for (let person = 0; person < FIXTURE_PEOPLE; person++) {
    for (let answer = 0; answer < FIXTURE_ANSWERS_EACH; answer++) {
      const itemAId = ids[Math.floor(rng() * ids.length)]!
      const itemBId = ids[Math.floor(rng() * ids.length)]!
      if (itemAId === itemBId) continue
      const share = (100 * strength(itemAId)) / (strength(itemAId) + strength(itemBId))
      const allocationA = Math.min(100, Math.max(0, Math.round(share + (rng() - 0.5) * 40)))
      const neither = strength(itemAId) < DISLIKED_PCT && strength(itemBId) < DISLIKED_PCT && rng() < 0.5
      rows.push({
        id: `visual-${person}-${answer}`, userId: `visual-person-${person}`, itemAId, itemBId,
        allocationA: neither ? 0 : allocationA, allocationB: neither ? 0 : 100 - allocationA, updatedAt: FIXTURE_DATE,
      })
    }
  }
  comparisons.forEach((row, i) => rows.push({
    id: `visual-you-${i}`, userId: "visual-you", itemAId: row.categoryA, itemBId: row.categoryB,
    allocationA: row.allocationA, allocationB: row.allocationB, updatedAt: FIXTURE_DATE,
  }))
  return { comparisons, results: calculatePublicAllocations(rows), showPersonal: visual === "personal" }
}

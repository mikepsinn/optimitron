import { describe, expect, it } from "vitest"
import {
  compareSignersByMilitarySpending,
  getAccountabilityReferenceMs,
} from "@optimitron/site-kit/lib/tasks/treaty-signers"

describe("getAccountabilityReferenceMs", () => {
  it("does not let a frozen browser clock turn an overdue task back into on time", () => {
    const serverNow = new Date("2026-08-29T00:00:00.000Z").getTime()
    const frozenBrowserNow = new Date("2026-01-15T00:00:00.000Z").getTime()

    expect(getAccountabilityReferenceMs(serverNow, frozenBrowserNow)).toBe(
      serverNow,
    )
  })

  it("accepts a browser clock that advances beyond the server render", () => {
    expect(getAccountabilityReferenceMs(100, 101)).toBe(101)
  })
})

/**
 * All 189 signer tasks carry the same title and the same due date, so the
 * comparator is the only thing deciding which head of government a visitor
 * sees on page 1 — and whether they see the same one twice in a row.
 */
describe("compareSignersByMilitarySpending", () => {
  it("puts the larger military budget first", () => {
    expect(
      compareSignersByMilitarySpending(886_000_000_000, 296_000_000_000),
    ).toBeLessThan(0)
    expect(
      compareSignersByMilitarySpending(296_000_000_000, 886_000_000_000),
    ).toBeGreaterThan(0)
  })

  it("ranks a government with a report card above one without", () => {
    expect(compareSignersByMilitarySpending(1, null)).toBeLessThan(0)
    expect(compareSignersByMilitarySpending(null, 1)).toBeGreaterThan(0)
  })

  it("ranks zero spending above an absent report card", () => {
    // A government that spends nothing on its military is a known fact worth
    // ordering on; a missing report card is not. Collapsing both to 0 would
    // interleave them.
    expect(compareSignersByMilitarySpending(0, null)).toBeLessThan(0)
  })

  it("reports a tie so the caller's existing order survives", () => {
    expect(compareSignersByMilitarySpending(null, null)).toBe(0)
    expect(compareSignersByMilitarySpending(5, 5)).toBe(0)
  })

  it("leaves an already-sorted roster untouched and is order-independent", () => {
    // Array.prototype.sort is stable, so a comparator that returns 0 for every
    // unranked government must leave the query's name order intact. Sorting a
    // reversed copy has to land on the same sequence, or page 1 depends on
    // whatever order the database happened to return.
    const spending: [string, number | null][] = [
      ["us", 886_000_000_000],
      ["cn", 296_000_000_000],
      ["ru", 109_000_000_000],
      ["albania", null],
      ["belize", null],
    ]
    const sortBySpending = (rows: typeof spending) =>
      [...rows]
        .sort(([, a], [, b]) => compareSignersByMilitarySpending(a, b))
        .map(([code]) => code)

    expect(sortBySpending(spending)).toEqual([
      "us",
      "cn",
      "ru",
      "albania",
      "belize",
    ])
    expect(sortBySpending([...spending].reverse())).toEqual([
      "us",
      "cn",
      "ru",
      "belize",
      "albania",
    ])
  })
})

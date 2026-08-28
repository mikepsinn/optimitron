import { describe, expect, it } from "vitest"
import { parsePositivePageParam } from "@optimitron/site-kit/lib/pagination"

/**
 * The page param comes straight off the query string, so it is attacker-shaped
 * input. The digits-only pattern alone is not enough: a long enough run of
 * digits still parses, and Number() turns it into Infinity, which then poisons
 * the pagination arithmetic downstream.
 */
describe("parsePositivePageParam", () => {
  it("accepts an ordinary page number", () => {
    expect(parsePositivePageParam("3")).toBe(3)
  })

  it("takes the first entry when the param repeats", () => {
    expect(parsePositivePageParam(["2", "9"])).toBe(2)
  })

  it("falls back to page 1 for junk, empty and missing values", () => {
    expect(parsePositivePageParam("abc")).toBe(1)
    expect(parsePositivePageParam("0")).toBe(1)
    expect(parsePositivePageParam("-4")).toBe(1)
    expect(parsePositivePageParam("")).toBe(1)
    expect(parsePositivePageParam(undefined)).toBe(1)
  })

  it("rejects a digit run long enough to become Infinity", () => {
    expect(parsePositivePageParam("9".repeat(400))).toBe(1)
  })

  it("rejects values past MAX_SAFE_INTEGER, which Number() rounds", () => {
    expect(parsePositivePageParam("9007199254740993")).toBe(1)
  })
})

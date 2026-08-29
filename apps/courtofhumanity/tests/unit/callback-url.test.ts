import { describe, expect, it } from "vitest"

import { resolveCallbackUrl } from "@/lib/callback-url"

const ORIGIN = "https://courtofhumanity.org"

describe("resolveCallbackUrl", () => {
  it("keeps same-origin paths, including search and hash", () => {
    expect(resolveCallbackUrl("/dashboard?x=1#top", ORIGIN)).toBe(
      "/dashboard?x=1#top",
    )
  })

  it("rejects the backslash form that browsers resolve off-origin", () => {
    // "/\evil.example/path" begins with a single slash but resolves to
    // https://evil.example/path — the case a startsWith("/") check misses.
    expect(resolveCallbackUrl("/\\evil.example/path", ORIGIN)).toBe("/dashboard")
  })

  it("rejects protocol-relative and absolute external URLs", () => {
    expect(resolveCallbackUrl("//evil.example/path", ORIGIN)).toBe("/dashboard")
    expect(resolveCallbackUrl("https://evil.example/path", ORIGIN)).toBe(
      "/dashboard",
    )
  })

  it("normalizes an absolute same-origin URL down to its path", () => {
    expect(resolveCallbackUrl(`${ORIGIN}/plaintiffs`, ORIGIN)).toBe(
      "/plaintiffs",
    )
  })

  it("falls back for empty, missing, and unparseable values", () => {
    expect(resolveCallbackUrl(null, ORIGIN)).toBe("/dashboard")
    expect(resolveCallbackUrl(undefined, ORIGIN)).toBe("/dashboard")
    expect(resolveCallbackUrl("", ORIGIN)).toBe("/dashboard")
    expect(resolveCallbackUrl("http://[bad", ORIGIN)).toBe("/dashboard")
  })
})

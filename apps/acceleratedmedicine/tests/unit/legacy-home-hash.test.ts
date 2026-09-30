import { describe, expect, it } from "vitest"

import { getLegacyHomeHashRedirect } from "@/lib/legacy-home-hash"

const homeAnchors = new Set(["initiatives", "research"])
const homeHasAnchor = (id: string) => homeAnchors.has(id)

describe("getLegacyHomeHashRedirect", () => {
  it("sends old Right to Trial anchors to the Right to Trial page", () => {
    expect(getLegacyHomeHashRedirect("#state-support", homeHasAnchor)).toBe(
      "/right-to-trial#state-support",
    )
  })

  it("keeps anchors that exist on the new homepage", () => {
    expect(getLegacyHomeHashRedirect("#initiatives", homeHasAnchor)).toBeNull()
  })

  it("does nothing without a hash", () => {
    expect(getLegacyHomeHashRedirect("", homeHasAnchor)).toBeNull()
    expect(getLegacyHomeHashRedirect("#", homeHasAnchor)).toBeNull()
  })
})

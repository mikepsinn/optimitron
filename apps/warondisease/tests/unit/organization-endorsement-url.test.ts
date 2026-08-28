import { describe, expect, it, vi } from "vitest"

vi.mock("@/lib/prisma", () => ({ prisma: {} }))

import {
  normalizeOrganizationHttpUrl,
} from "../../../../packages/site-kit/src/lib/organization-endorsement.server"

/**
 * These four branches are what stands between a pasted organization website
 * and a 400 from the endorsement route, and `false` versus `null` is the
 * distinction the route keys on: `null` means "not supplied", `false` means
 * "supplied and invalid".
 */
describe("normalizeOrganizationHttpUrl", () => {
  it("returns null for an absent or blank value", () => {
    expect(normalizeOrganizationHttpUrl(undefined)).toBeNull()
    expect(normalizeOrganizationHttpUrl(null)).toBeNull()
    expect(normalizeOrganizationHttpUrl("   ")).toBeNull()
  })

  it("rejects a non-http protocol rather than passing it through", () => {
    // javascript: and data: reach an href on the organization page.
    expect(normalizeOrganizationHttpUrl("javascript:alert(1)")).toBe(false)
    expect(normalizeOrganizationHttpUrl("data:text/html,x")).toBe(false)
    expect(normalizeOrganizationHttpUrl("ftp://example.org")).toBe(false)
  })

  it("rejects a value that is not a URL at all", () => {
    expect(normalizeOrganizationHttpUrl("not a url")).toBe(false)
  })

  it("lowercases the host and drops the fragment", () => {
    expect(normalizeOrganizationHttpUrl("HTTPS://Example.ORG/Path#frag")).toBe(
      "https://example.org/Path",
    )
  })
})

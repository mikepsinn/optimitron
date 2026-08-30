import { describe, expect, it } from "vitest"
import { getCountryCodeFromLocale } from "@optimitron/site-kit/lib/detect-country"

describe("getCountryCodeFromLocale", () => {
  it("reads regions after BCP 47 script subtags", () => {
    expect(getCountryCodeFromLocale("zh-Hant-TW")).toBe("TW")
    expect(getCountryCodeFromLocale("sr-Latn-RS")).toBe("RS")
  })

  it("returns null when a locale has no valid region", () => {
    expect(getCountryCodeFromLocale("en")).toBeNull()
    expect(getCountryCodeFromLocale("not_a_locale")).toBeNull()
  })
})

import { describe, expect, it } from "vitest"
import { getSurveyPostAuthPath } from "../../lib/auth-redirect"

describe("survey post-auth destination", () => {
  const origin = "https://trialabundancesurvey.org"

  it.each([undefined, "", "/", "/#vote", `${origin}/#vote`])(
    "sends missing or old homepage callbacks (%s) to the dashboard",
    (callback) => expect(getSurveyPostAuthPath(callback, origin)).toBe("/dashboard"),
  )

  it.each(["/dashboard?tab=referrals#share", `${origin}/dashboard?tab=referrals#share`])(
    "preserves a safe destination (%s)",
    (callback) => expect(getSurveyPostAuthPath(callback, origin)).toBe("/dashboard?tab=referrals#share"),
  )

  it.each([
    "https://example.com/phishing",
    "//example.com/phishing",
    "javascript:alert(1)",
    "/auth/complete-signup",
    "/api/auth/signout",
  ])("rejects external destinations and auth loops (%s)", (callback) => {
    expect(getSurveyPostAuthPath(callback, origin)).toBe("/dashboard")
  })
})

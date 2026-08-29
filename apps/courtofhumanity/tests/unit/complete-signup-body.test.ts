import { describe, expect, it } from "vitest"

import { buildCompleteSignupBody } from "@/lib/complete-signup-body"

describe("buildCompleteSignupBody", () => {
  it("omits newsletterSubscribed when nothing was stored", () => {
    const body = buildCompleteSignupBody({
      name: "Ada",
      referralCode: null,
      inviteToken: null,
      newsletterSubscribed: null,
    })

    expect("newsletterSubscribed" in body).toBe(false)
    expect(body).toEqual({ name: "Ada", referralCode: null, inviteToken: null })
  })

  it("omits it for a referral arrival, so a past unsubscribe is not overwritten", () => {
    // The request fires because referralCode is set, not because the signer
    // touched the newsletter checkbox. Sending `true` here would resubscribe
    // someone who had opted out, with no affirmative choice on this visit.
    const body = buildCompleteSignupBody({
      name: null,
      referralCode: "abc123",
      inviteToken: null,
      newsletterSubscribed: null,
    })

    expect("newsletterSubscribed" in body).toBe(false)
  })

  it("preserves an explicit opt-in", () => {
    const body = buildCompleteSignupBody({
      name: null,
      referralCode: null,
      inviteToken: "tok",
      newsletterSubscribed: true,
    })

    expect(body.newsletterSubscribed).toBe(true)
  })

  it("preserves an explicit opt-out", () => {
    const body = buildCompleteSignupBody({
      name: "Ada",
      referralCode: null,
      inviteToken: null,
      newsletterSubscribed: false,
    })

    expect(body.newsletterSubscribed).toBe(false)
  })

  it("normalizes empty strings to null", () => {
    const body = buildCompleteSignupBody({
      name: "",
      referralCode: "",
      inviteToken: "",
      newsletterSubscribed: true,
    })

    expect(body).toEqual({
      name: null,
      referralCode: null,
      inviteToken: null,
      newsletterSubscribed: true,
    })
  })
})

import { describe, expect, it } from "vitest"
import { insertGeneratedReferralInviteUrl } from "@optimitron/site-kit/lib/referral-invitation-message-url"

/**
 * The invite URL is spliced into the drafted message with String.replace. When
 * the replacement is a plain string, `$&` and `$1` inside it are interpreted as
 * substitution patterns rather than literal text, so a URL containing them
 * would be corrupted on the way into the message.
 */
describe("insertGeneratedReferralInviteUrl", () => {
  it("inserts an ordinary invite URL", () => {
    const message = insertGeneratedReferralInviteUrl(
      "Join here: https://warondisease.org/vote",
      "https://warondisease.org/i/abc123",
    )
    expect(message).toContain("https://warondisease.org/i/abc123")
  })

  it("keeps a URL containing $& literal", () => {
    const url = "https://warondisease.org/i/abc?a=$&b=1"
    const message = insertGeneratedReferralInviteUrl(
      "Join here: https://warondisease.org/vote",
      url,
    )
    expect(message).toContain(url)
  })
})

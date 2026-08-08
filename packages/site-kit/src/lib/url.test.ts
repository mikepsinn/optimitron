import { describe, expect, it } from "vitest"
import { buildInviteReferralUrl, buildReferralUrl, buildUserInviteReferralUrl, buildUserReferralUrl } from "./url"

describe("referral URL builders", () => {
  it("uses the clean /vote identifier path for generic referral URLs", () => {
    expect(buildReferralUrl("alice", "https://warondisease.org")).toBe("https://warondisease.org/vote/alice")
    expect(buildUserReferralUrl({ username: "alice", referralCode: "CODE123" }, "https://warondisease.org")).toBe(
      "https://warondisease.org/vote/alice"
    )
  })

  it("falls back to referralCode when no username exists", () => {
    expect(buildUserReferralUrl({ username: null, referralCode: "CODE123" }, "https://warondisease.org")).toBe(
      "https://warondisease.org/vote/CODE123"
    )
  })

  it("adds invite tokens only to directed invitation URLs", () => {
    expect(buildInviteReferralUrl("alice", "tok_123", "https://warondisease.org")).toBe(
      "https://warondisease.org/vote/alice?invite=tok_123"
    )
    expect(buildUserInviteReferralUrl({ username: null, referralCode: "CODE123" }, "tok 123", "https://warondisease.org")).toBe(
      "https://warondisease.org/vote/CODE123?invite=tok%20123"
    )
  })
})

import { describe, expect, it } from "vitest"
import { recipientModeRequiresSignIn } from "../../../../packages/site-kit/src/components/landing/treaty-reminder-composer"

describe("recipientModeRequiresSignIn", () => {
  it("requires sign-in only for a signed-out one-human workflow", () => {
    expect(recipientModeRequiresSignIn("one_human", "unauthenticated")).toBe(true)
    expect(recipientModeRequiresSignIn("one_human", "authenticated")).toBe(false)
    expect(recipientModeRequiresSignIn("president", "unauthenticated")).toBe(false)
  })
})

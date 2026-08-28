import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

// vi.mock is hoisted above module-scope consts, so the spy is created inside
// vi.hoisted to exist by the time the factory runs.
const { copyTextToClipboard } = vi.hoisted(() => ({
  copyTextToClipboard: vi.fn(() => Promise.resolve(true)),
}))
vi.mock("@/lib/clipboard", () => ({ copyTextToClipboard }))

import { LoveShareButton } from "../../app/love/love-client"

/**
 * The share CTA at the bottom of /love used to copy window.location.href, so a
 * signed-in reader who shared from there handed out a plain /love link and got
 * no referral credit for anyone who voted through it. The copy button higher up
 * the same page was already using the personal URL.
 */
describe("LoveShareButton", () => {
  it("copies the personal referral URL when one is supplied", () => {
    copyTextToClipboard.mockClear()
    render(<LoveShareButton value="https://warondisease.org/u/ada" />)
    fireEvent.click(screen.getByRole("button"))
    expect(copyTextToClipboard).toHaveBeenCalledWith(
      "https://warondisease.org/u/ada",
    )
  })

  it("falls back to the current page when there is no referral URL", () => {
    // Signed-out readers have no personal link; sharing the page itself is
    // still better than sharing nothing.
    copyTextToClipboard.mockClear()
    render(<LoveShareButton />)
    fireEvent.click(screen.getByRole("button"))
    expect(copyTextToClipboard).toHaveBeenCalledWith(window.location.href)
  })
})

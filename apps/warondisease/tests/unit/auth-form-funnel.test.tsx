import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { signIn } from "next-auth/react"
import { AuthForm } from "../../../../packages/site-kit/src/components/auth/AuthForm"
import { storage } from "../../../../packages/site-kit/src/lib/storage"

vi.mock("next-auth/react", () => ({ signIn: vi.fn() }))

beforeEach(() => {
  vi.mocked(signIn).mockReset()
  window.localStorage.clear()
  window.gtag = vi.fn()
})

async function submitEmail() {
  render(<AuthForm emailOnly showNameField={false} showSubscribe={false} />)
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "private@example.invalid" } })
  fireEvent.click(screen.getByRole("button", { name: "Send magic link" }))
}

describe("email verification intent analytics", () => {
  it("records an email request only after the provider accepts it, without claiming signup or completion", async () => {
    let resolve!: (value: { ok: boolean; status: number; error: undefined; url: null }) => void
    vi.mocked(signIn).mockImplementation(() => new Promise((done) => { resolve = done }))
    storage.setPendingVote({ answer: "YES", referredBy: "private-referral", timestamp: "now", militaryAllocationPercent: 37 })
    await submitEmail()
    expect(window.gtag).not.toHaveBeenCalled()
    resolve({ ok: true, status: 200, error: undefined, url: null })
    await screen.findByText("Check your email!")
    expect(vi.mocked(window.gtag!).mock.calls).toEqual([
      ["event", "treaty_verification_requested", { survey_id: "one-percent-treaty" }],
    ])
  })

  it.each([
    undefined,
    { ok: false, status: 500, error: "EmailSignin", url: null },
  ])("does not count a missing or failed email response: %j", async (result) => {
    vi.mocked(signIn).mockResolvedValue(result)
    storage.setPendingVote({ answer: "NO", referredBy: null, timestamp: "now" })
    await submitEmail()
    await screen.findByText("Failed to send email. Please try again.")
    expect(window.gtag).not.toHaveBeenCalled()
    expect(storage.getPendingVote()?.answer).toBe("NO")
  })

  it("does not count an unrelated sign-in as a treaty verification request", async () => {
    vi.mocked(signIn).mockResolvedValue({ ok: true, status: 200, error: undefined, url: null })
    await submitEmail()
    await screen.findByText("Check your email!")
    expect(window.gtag).not.toHaveBeenCalled()
  })

  it("keeps the accepted email success state when analytics delivery throws", async () => {
    vi.mocked(signIn).mockResolvedValue({ ok: true, status: 200, error: undefined, url: null })
    window.gtag = () => { throw new Error("Analytics unavailable") }
    storage.setPendingVote({ answer: "YES", referredBy: null, timestamp: "now" })
    await submitEmail()
    await screen.findByText("Check your email!")
    expect(screen.queryByText("An error occurred. Please try again.")).toBeNull()
    expect(storage.getPendingVote()?.answer).toBe("YES")
  })

  it("does not label a social sign-in click as a completed signup", async () => {
    vi.mocked(signIn).mockResolvedValue(undefined)
    render(<AuthForm />)
    fireEvent.click(await screen.findByRole("button", { name: "Continue with Google" }))
    await waitFor(() => expect(signIn).toHaveBeenCalled())
    expect(window.gtag).not.toHaveBeenCalled()
  })
})

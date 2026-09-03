import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { AuthForm } from "@optimitron/site-kit/components/auth/AuthForm"
import { storage } from "@optimitron/site-kit/lib/storage"

vi.mock("next-auth/react", () => ({ signIn: vi.fn(async () => ({ ok: true })) }))

describe("survey verification consent", () => {
  beforeEach(() => storage.clearSignupData())

  it.each(["email", "google"])("does not carry hidden newsletter consent through %s sign-in", async (method) => {
    storage.setSignupSubscribe(true)
    render(<AuthForm defaultEmailOpen showSubscribe={false} />)
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument()
    if (method === "email") {
      fireEvent.change(screen.getByLabelText("Email", { exact: true }), { target: { value: "survey@example.invalid" } })
      fireEvent.click(screen.getByRole("button", { name: "Send magic link", exact: true }))
      await screen.findByText("Check your email!", { exact: true })
    } else {
      fireEvent.click(await screen.findByRole("button", { name: /continue with google/i }))
    }
    await waitFor(() => expect(storage.getSignupSubscribe()).toBeNull())
  })
})

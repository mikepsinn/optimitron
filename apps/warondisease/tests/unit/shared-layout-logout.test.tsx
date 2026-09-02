import React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import Layout from "../../../../packages/site-kit/src/components/layout"
import { ROUTES } from "../../../../packages/site-kit/src/lib/routes"

const mocks = vi.hoisted(() => ({
  signOut: vi.fn(),
}))

vi.mock("next-auth/react", () => ({
  signOut: mocks.signOut,
  useSession: () => ({
    data: {
      user: {
        email: "voter@example.com",
        name: "Test Voter",
      },
    },
    status: "authenticated",
  }),
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock(
  "../../../../packages/site-kit/src/components/shared/VoteOrShareButton",
  () => ({ VoteOrShareButton: () => null }),
)

describe("shared authenticated navigation", () => {
  beforeEach(() => {
    mocks.signOut.mockReset()
  })

  it("logs the user out from the menu and returns to the site home page", async () => {
    render(
      <Layout>
        <main>Page content</main>
      </Layout>,
    )

    fireEvent.click(screen.getByRole("button", { name: "Toggle menu" }))
    fireEvent.click(await screen.findByRole("button", { name: "Log Out" }))

    expect(mocks.signOut).toHaveBeenCalledWith({ callbackUrl: ROUTES.home })
    expect(
      screen.queryByRole("dialog", { name: "Navigation Menu" }),
    ).not.toBeInTheDocument()
  })
})

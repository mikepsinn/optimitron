import React from "react"
import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { TreatySignatureBox } from "../../../../packages/site-kit/src/components/landing/TreatySignatureBox"

const mocks = vi.hoisted(() => ({
  session: {
    data: null as { user: { email: string } } | null,
    status: "unauthenticated" as "authenticated" | "unauthenticated" | "loading",
  },
}))

vi.mock("next-auth/react", () => ({
  signIn: vi.fn(),
  useSession: () => mocks.session,
}))

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock("canvas-confetti", () => ({ default: vi.fn() }))

// The real flow opens with the post-vote questions for signed-in users and
// shows only email verification for signed-out users.
vi.mock("../../../../packages/site-kit/src/components/landing/TreatyPostVoteFlow", () => ({
  TreatyPostVoteFlow: () => <div data-testid="post-vote-flow" />,
}))

describe("treaty signed state", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("offers a signed-in signer one next action instead of the post-vote questions", () => {
    mocks.session = { data: { user: { email: "signer@example.com" } }, status: "authenticated" }

    render(<TreatySignatureBox initialSignedYes />)

    expect(screen.getByRole("link", { name: "Accept your promotion" })).toHaveAttribute("href", "/dashboard")
    expect(screen.queryByTestId("post-vote-flow")).toBeNull()
  })

  it("keeps email verification for a signed-out signer so the signature is saved", () => {
    mocks.session = { data: null, status: "unauthenticated" }

    render(<TreatySignatureBox initialSignedYes />)

    expect(screen.getByTestId("post-vote-flow")).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "Accept your promotion" })).toBeNull()
  })
})

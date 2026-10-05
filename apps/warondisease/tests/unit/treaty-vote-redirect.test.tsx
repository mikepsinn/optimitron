import React, { act } from "react"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import TreatyVoteSection from "../../../../packages/site-kit/src/components/landing/treaty-vote-section"

const mocks = vi.hoisted(() => ({
  pendingVote: null as Record<string, unknown> | null,
  push: vi.fn(),
  searchParams: new URLSearchParams(),
  signupInviteToken: null as string | null,
  signupReferral: null as string | null,
  setVoteStatusCache: vi.fn(),
  syncPendingVote: vi.fn(),
}))

vi.mock("next-auth/react", () => ({
  useSession: () => ({
    data: {
      user: {
        email: "voter@example.com",
        referralCode: "voter-ref",
      },
    },
    status: "authenticated",
  }),
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
  useSearchParams: () => mocks.searchParams,
}))

vi.mock("canvas-confetti", () => ({ default: vi.fn() }))

vi.mock("framer-motion", async () => {
  const ReactModule = await import("react")
  const motion = new Proxy(
    {},
    {
      get: (_target, tag: string) =>
        ReactModule.forwardRef<HTMLElement, Record<string, unknown>>(
          ({ animate, exit, initial, transition, ...props }, ref) => ReactModule.createElement(tag, { ...props, ref }),
        ),
    },
  )

  return {
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
    motion,
  }
})

vi.mock("../../../../packages/site-kit/src/components/landing/PragmaticTrialsDialog", () => ({
  PragmaticTrialsDialog: ({ children }: { children: React.ReactNode }) => children,
}))

vi.mock("../../../../packages/site-kit/src/components/landing/TreatyPostVoteFlow", () => ({
  TreatyPostVoteFlow: () => <div data-testid="full-post-vote-flow" />,
}))

vi.mock("../../../../packages/site-kit/src/lib/storage", () => ({
  storage: {
    clearVoteStatusCache: vi.fn(),
    getPendingVote: () => mocks.pendingVote,
    setPendingVote: (vote: Record<string, unknown>) => {
      mocks.pendingVote = vote
    },
    setVoteStatusCache: mocks.setVoteStatusCache,
    getSignupReferral: () => mocks.signupReferral,
    setSignupReferral: (code: string) => {
      mocks.signupReferral = code
    },
    getSignupInviteToken: () => mocks.signupInviteToken,
    setSignupInviteToken: (token: string) => {
      mocks.signupInviteToken = token
    },
    removeSignupInviteToken: () => {
      mocks.signupInviteToken = null
    },
  },
}))

vi.mock("../../../../packages/site-kit/src/lib/vote-utils", () => ({
  syncPendingVote: mocks.syncPendingVote,
}))

vi.mock("../../../../packages/site-kit/src/lib/referral.client", () => ({
  getUsernameOrReferralCode: () => "voter-ref",
}))

beforeEach(() => {
  mocks.pendingVote = null
  mocks.searchParams = new URLSearchParams()
  mocks.signupInviteToken = null
  mocks.signupReferral = null
})

async function voteYes() {
  fireEvent.change(screen.getByRole("slider"), { target: { value: "60" } })
  fireEvent.click(await screen.findByRole("button", { name: "SUBMIT" }))
  fireEvent.click(await screen.findByRole("button", { name: "YES" }))
}

describe("authenticated treaty voting", () => {
  beforeEach(() => {
    mocks.push.mockReset()
    mocks.setVoteStatusCache.mockReset()
    mocks.syncPendingVote.mockReset()
  })

  it("saves the vote and goes directly to the dashboard", async () => {
    let finishSync: ((synced: boolean) => void) | undefined
    mocks.syncPendingVote.mockImplementation(() => {
      if (mocks.pendingVote?.answer !== "YES") return Promise.resolve(false)
      return new Promise<boolean>((resolve) => {
        finishSync = resolve
      })
    })

    render(<TreatyVoteSection hideHeading questionAs="h1" authenticatedPostVoteRedirectUrl="/dashboard" disableIntroAnimation />)

    expect(screen.getByRole("heading", { level: 1, name: /Drag the slider/ })).toBeInTheDocument()

    fireEvent.change(screen.getByRole("slider"), { target: { value: "60" } })
    fireEvent.click(await screen.findByRole("button", { name: "SUBMIT" }))
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1)
    expect(screen.getByRole("heading", { level: 1, name: /Should all nations allocate/ })).toBeInTheDocument()
    fireEvent.click(await screen.findByRole("button", { name: "YES" }))

    expect(await screen.findByTestId("treaty-vote-saving")).toHaveTextContent("Saving your vote.")
    expect(screen.queryByTestId("full-post-vote-flow")).toBeNull()
    expect(mocks.syncPendingVote).toHaveBeenCalledTimes(2)

    await act(async () => finishSync?.(true))

    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith("/dashboard"))
    expect(mocks.pendingVote?.answer).toBe("YES")
  })

  it("syncs a restored completed vote and goes to the dashboard", async () => {
    let finishSync: ((synced: boolean) => void) | undefined
    mocks.pendingVote = {
      answer: "YES",
      militaryAllocationPercent: 40,
      timestamp: "2026-08-30T00:00:00.000Z",
    }
    mocks.syncPendingVote.mockImplementation(
      () =>
        new Promise<boolean>((resolve) => {
          finishSync = resolve
        }),
    )

    render(<TreatyVoteSection hideHeading questionAs="h1" authenticatedPostVoteRedirectUrl="/dashboard" disableIntroAnimation />)

    expect(screen.queryByRole("slider")).toBeNull()
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1)
    expect(screen.getByRole("heading", { level: 1, name: /Should all nations allocate/ })).toBeInTheDocument()

    expect(await screen.findByTestId("treaty-vote-saving")).toHaveTextContent("Saving your vote.")
    expect(screen.queryByTestId("full-post-vote-flow")).toBeNull()
    expect(mocks.syncPendingVote).toHaveBeenCalledTimes(1)

    await act(async () => finishSync?.(true))

    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith("/dashboard"))
  })
})

describe("referral attribution", () => {
  beforeEach(() => {
    mocks.syncPendingVote.mockReset()
    mocks.syncPendingVote.mockResolvedValue(true)
  })

  it("credits the saved referrer when the visitor votes on a page without ?ref=", async () => {
    mocks.signupReferral = "jane"
    mocks.signupInviteToken = "tok-jane"

    render(<TreatyVoteSection hideHeading questionAs="h1" disableIntroAnimation />)
    await voteYes()

    expect(mocks.pendingVote).toMatchObject({ answer: "YES", referredBy: "jane", inviteToken: "tok-jane" })
  })

  it("lets a newer referral link replace the saved referrer and invite", async () => {
    mocks.signupReferral = "jane"
    mocks.signupInviteToken = "tok-jane"
    mocks.searchParams = new URLSearchParams("ref=mike")

    render(<TreatyVoteSection hideHeading questionAs="h1" disableIntroAnimation />)
    await voteYes()

    expect(mocks.pendingVote).toMatchObject({ answer: "YES", referredBy: "mike", inviteToken: null })
    expect(mocks.signupReferral).toBe("mike")
    expect(mocks.signupInviteToken).toBeNull()
  })

  it("keeps an invite token that arrives without a referral code", async () => {
    mocks.signupReferral = "jane"
    mocks.searchParams = new URLSearchParams("invite=tok-direct")

    render(<TreatyVoteSection hideHeading questionAs="h1" disableIntroAnimation />)
    await voteYes()

    expect(mocks.pendingVote).toMatchObject({ answer: "YES", referredBy: "jane", inviteToken: "tok-direct" })
    expect(mocks.signupInviteToken).toBe("tok-direct")
  })
})

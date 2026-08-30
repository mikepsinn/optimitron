import React, { act } from "react"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import TreatyVoteSection from "../../../../packages/site-kit/src/components/landing/treaty-vote-section"

const mocks = vi.hoisted(() => ({
  pendingVote: null as Record<string, unknown> | null,
  push: vi.fn(),
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
  useSearchParams: () => new URLSearchParams(),
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
  },
}))

vi.mock("../../../../packages/site-kit/src/lib/vote-utils", () => ({
  syncPendingVote: mocks.syncPendingVote,
}))

vi.mock("../../../../packages/site-kit/src/lib/referral.client", () => ({
  getUsernameOrReferralCode: () => "voter-ref",
}))

describe("authenticated treaty voting", () => {
  beforeEach(() => {
    mocks.pendingVote = null
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

    render(<TreatyVoteSection authenticatedPostVoteRedirectUrl="/dashboard" disableIntroAnimation />)

    fireEvent.change(screen.getByRole("slider"), { target: { value: "60" } })
    fireEvent.click(await screen.findByRole("button", { name: "SUBMIT" }))
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

    render(<TreatyVoteSection authenticatedPostVoteRedirectUrl="/dashboard" disableIntroAnimation />)

    expect(await screen.findByTestId("treaty-vote-saving")).toHaveTextContent("Saving your vote.")
    expect(screen.queryByTestId("full-post-vote-flow")).toBeNull()
    expect(mocks.syncPendingVote).toHaveBeenCalledTimes(1)

    await act(async () => finishSync?.(true))

    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith("/dashboard"))
  })
})

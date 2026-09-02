import { act, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { PendingResponseRecovery } from "../../app/dashboard/pending-response-recovery"

const {
  getPendingTrialAbundanceResponse,
  refresh,
  router,
  syncPendingTrialAbundanceResponse,
} = vi.hoisted(() => ({
  getPendingTrialAbundanceResponse: vi.fn(),
  refresh: vi.fn(),
  router: { refresh: vi.fn() },
  syncPendingTrialAbundanceResponse: vi.fn(),
}))

router.refresh = refresh

vi.mock("next/navigation", () => ({
  useRouter: () => router,
}))

vi.mock("@/lib/storage", () => ({
  storage: { getPendingTrialAbundanceResponse },
}))

vi.mock("@/lib/trial-abundance-survey", () => ({
  syncPendingTrialAbundanceResponse,
}))

describe("pending Trial Abundance response recovery", () => {
  beforeEach(() => {
    refresh.mockReset()
    getPendingTrialAbundanceResponse.mockReset()
    syncPendingTrialAbundanceResponse.mockReset()
  })

  it("restores a locally saved response and refreshes the dashboard", async () => {
    getPendingTrialAbundanceResponse.mockReturnValue({
      patientAccessAnswer: "YES",
    })
    syncPendingTrialAbundanceResponse.mockResolvedValue(true)

    render(<PendingResponseRecovery />)

    expect(
      screen.getByText("Saving the response from this browser…"),
    ).toBeInTheDocument()
    await waitFor(() => expect(refresh).toHaveBeenCalledOnce())
    expect(
      screen.queryByText(/No response on file yet/u),
    ).not.toBeInTheDocument()
  })

  it("shows the survey link when this browser has no pending response", async () => {
    getPendingTrialAbundanceResponse.mockReturnValue(null)

    render(<PendingResponseRecovery />)

    expect(
      await screen.findByText(/No response on file yet/u),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: "Take the survey" }),
    ).toHaveAttribute("href", "/#vote")
  })

  it("keeps a failed response recoverable with a retry action", async () => {
    getPendingTrialAbundanceResponse.mockReturnValue({
      patientAccessAnswer: "YES",
    })
    syncPendingTrialAbundanceResponse
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true)

    render(<PendingResponseRecovery />)

    const retry = await screen.findByRole("button", { name: "Retry save" })
    expect(screen.getByText(/still saved in this browser/u)).toBeInTheDocument()

    await act(async () => retry.click())
    await waitFor(() => expect(refresh).toHaveBeenCalledOnce())
  })
})

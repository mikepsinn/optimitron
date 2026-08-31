import { afterEach, describe, expect, it, vi } from "vitest"

import { storage } from "@/lib/storage"
import { syncPendingTrialAbundanceResponse } from "@/lib/trial-abundance-survey"

const pendingResponse = {
  answer: "YES" as const,
  inviteToken: null,
  militaryAllocationPercent: 35,
  organizationId: null,
  referredBy: "REFERRAL123",
  sourceReferrer: null,
  sourceUrl: "https://trialabundancesurvey.org/",
  timestamp: "2026-08-31T12:00:00.000Z",
}

describe("Trial Abundance local response sync", () => {
  afterEach(() => {
    window.localStorage.clear()
    vi.restoreAllMocks()
  })

  it("removes the local copy only after a successful server save", async () => {
    storage.setPendingTrialAbundanceResponse(pendingResponse)
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify({ success: true })))

    await expect(syncPendingTrialAbundanceResponse()).resolves.toBe(true)

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/votes/sync",
      expect.objectContaining({
        body: JSON.stringify(pendingResponse),
        method: "POST",
      }),
    )
    expect(storage.getPendingTrialAbundanceResponse()).toBeNull()
  })

  it("keeps the local copy when the server save fails", async () => {
    storage.setPendingTrialAbundanceResponse(pendingResponse)
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "database unavailable" }), {
        status: 503,
      }),
    )

    await expect(syncPendingTrialAbundanceResponse()).resolves.toBe(false)
    expect(storage.getPendingTrialAbundanceResponse()).toEqual(pendingResponse)
  })
})

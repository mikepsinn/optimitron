import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const draft = {
  answer: "YES", militaryAllocationPercent: 37, referredBy: "private-referral",
  inviteToken: "private-token", displayName: "Private name", timestamp: "2026-09-26T00:00:00Z",
}
const params = { survey_id: "one-percent-treaty" }
const completionKey = "treaty_funnel_completions_v1"

function response(id = "saved-vote", referred = true) {
  return Response.json({ vote: { id }, analytics: {
    responseId: id, verifiedResponseSaved: true, verifiedReferredParticipant: referred,
  } })
}

function deferResponse() {
  let resolve!: (response: Response) => void
  const promise = new Promise<Response>((done) => { resolve = done })
  return { promise, resolve }
}

beforeEach(() => {
  vi.resetModules()
  window.localStorage.clear()
  window.gtag = vi.fn()
  delete window.dataLayer
  vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "")
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe("treaty persistence analytics boundary", () => {
  it("coalesces concurrent syncs and deduplicates retries and a fresh module against the saved receipt", async () => {
    const request = deferResponse()
    const fetch = vi.fn().mockReturnValueOnce(request.promise).mockImplementation(async () => response())
    vi.stubGlobal("fetch", fetch)
    const { storage } = await import("../../../../packages/site-kit/src/lib/storage")
    const { syncPendingVote } = await import("../../../../packages/site-kit/src/lib/vote-utils")
    storage.setPendingVote(draft)
    const first = syncPendingVote()
    const duplicate = syncPendingVote()
    expect(fetch).toHaveBeenCalledTimes(1)
    request.resolve(response())
    expect(await Promise.all([first, duplicate])).toEqual([true, true])
    expect(storage.getPendingVote()).toBeNull()
    expect(window.gtag).toHaveBeenCalledWith("event", "treaty_response_saved", params)
    expect(window.gtag).toHaveBeenCalledWith("event", "treaty_referred_participant", params)
    expect(window.gtag).toHaveBeenCalledTimes(2)

    storage.setPendingVote(draft)
    expect(await syncPendingVote()).toBe(true)
    vi.resetModules()
    storage.setPendingVote(draft)
    const reloaded = await import("../../../../packages/site-kit/src/lib/vote-utils")
    expect(await reloaded.syncPendingVote()).toBe(true)
    expect(window.gtag).toHaveBeenCalledTimes(2)
    expect(JSON.stringify(vi.mocked(window.gtag!).mock.calls)).not.toMatch(/private|YES|37|saved-vote/)
  })

  it.each([400, 500])("keeps the draft and emits nothing after HTTP %s", async (status) => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ error: "Save rejected" }, { status })))
    const { storage } = await import("../../../../packages/site-kit/src/lib/storage")
    const { syncPendingVote } = await import("../../../../packages/site-kit/src/lib/vote-utils")
    storage.setPendingVote(draft)
    expect(await syncPendingVote()).toBe(false)
    expect(storage.getPendingVote()).toEqual(draft)
    expect(window.gtag).not.toHaveBeenCalled()
  })

  it("does not treat an incomplete answer or an unconfirmed 200 as a saved vote", async () => {
    const fetch = vi.fn(async () => Response.json({ success: true }))
    vi.stubGlobal("fetch", fetch)
    const { storage } = await import("../../../../packages/site-kit/src/lib/storage")
    const { syncPendingVote } = await import("../../../../packages/site-kit/src/lib/vote-utils")
    storage.setPendingVote({ ...draft, answer: "" })
    expect(await syncPendingVote()).toBe(false)
    expect(fetch).not.toHaveBeenCalled()
    storage.setPendingVote(draft)
    expect(await syncPendingVote()).toBe(false)
    expect(storage.getPendingVote()).toEqual(draft)
    expect(window.gtag).not.toHaveBeenCalled()
  })

  it.each([
    { responseId: "saved-vote", verifiedResponseSaved: false, verifiedReferredParticipant: true },
    { responseId: "different-vote", verifiedResponseSaved: true, verifiedReferredParticipant: true },
  ])("never infers verification or attribution from the draft: %j", async (analytics) => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ vote: { id: "saved-vote" }, analytics })))
    const { storage } = await import("../../../../packages/site-kit/src/lib/storage")
    const { syncPendingVote } = await import("../../../../packages/site-kit/src/lib/vote-utils")
    storage.setPendingVote(draft)
    expect(await syncPendingVote()).toBe(true)
    expect(window.gtag).not.toHaveBeenCalled()
  })

  it("retains a newer draft until its own request persists", async () => {
    const firstRequest = deferResponse()
    const secondRequest = deferResponse()
    const fetch = vi.fn().mockReturnValueOnce(firstRequest.promise).mockReturnValueOnce(secondRequest.promise)
    vi.stubGlobal("fetch", fetch)
    const { storage } = await import("../../../../packages/site-kit/src/lib/storage")
    const { syncPendingVote } = await import("../../../../packages/site-kit/src/lib/vote-utils")
    storage.setPendingVote(draft)
    const first = syncPendingVote()
    const newer = { ...draft, answer: "NO", militaryAllocationPercent: 64 }
    storage.setPendingVote(newer)
    const second = syncPendingVote()
    firstRequest.resolve(response())
    expect(await first).toBe(true)
    expect(storage.getPendingVote()).toEqual(newer)
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(2))
    expect(JSON.parse(fetch.mock.calls[1][1].body)).toEqual(newer)
    secondRequest.resolve(response())
    expect(await second).toBe(true)
    expect(storage.getPendingVote()).toBeNull()
    expect(window.gtag).toHaveBeenCalledTimes(2)
  })

  it("counts a later server-confirmed referral once without counting the response again", async () => {
    const { trackTreatyResponseSaved } = await import("../../../../packages/site-kit/src/lib/analytics")
    const receipt = { responseId: "late-referral", verifiedResponseSaved: true, verifiedReferredParticipant: false }
    await trackTreatyResponseSaved(receipt)
    await trackTreatyResponseSaved({ ...receipt, verifiedReferredParticipant: true })
    await trackTreatyResponseSaved({ ...receipt, verifiedReferredParticipant: true })
    expect(vi.mocked(window.gtag!).mock.calls).toEqual([
      ["event", "treaty_response_saved", params], ["event", "treaty_referred_participant", params],
    ])
  })

  it("keeps deduplication in memory if analytics storage writes are blocked", async () => {
    const write = window.localStorage.setItem.bind(window.localStorage)
    vi.spyOn(Object.getPrototypeOf(window.localStorage), "setItem").mockImplementation((key: string, value: string) => {
      if (key === completionKey) throw new Error("Storage full")
      write(key, value)
    })
    const { trackTreatyResponseSaved } = await import("../../../../packages/site-kit/src/lib/analytics")
    const receipt = { responseId: "blocked-storage", verifiedResponseSaved: true, verifiedReferredParticipant: false }
    await trackTreatyResponseSaved(receipt)
    await trackTreatyResponseSaved(receipt)
    expect(window.gtag).toHaveBeenCalledTimes(1)
  })

  it("queues early funnel events for configured GA and caps saved receipt storage", async () => {
    delete window.gtag
    vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "G-EXAMPLE\n")
    const { trackTreatyFunnelStep, trackTreatyResponseSaved } = await import("../../../../packages/site-kit/src/lib/analytics")
    trackTreatyFunnelStep("viewed")
    expect(Array.from(window.dataLayer![0] as IArguments)).toEqual(["event", "treaty_viewed", params])
    for (let index = 0; index < 101; index++) {
      await trackTreatyResponseSaved({ responseId: `response-${index}`, verifiedResponseSaved: true, verifiedReferredParticipant: false })
    }
    expect(JSON.parse(window.localStorage.getItem(completionKey)!)).toHaveLength(100)
    expect(Array.from(window.dataLayer![1] as IArguments)).toEqual(["event", "treaty_response_saved", params])
  })

  it("does not mark completion when GA is absent or fail a saved vote when GA throws", async () => {
    delete window.gtag
    const { trackTreatyResponseSaved } = await import("../../../../packages/site-kit/src/lib/analytics")
    await trackTreatyResponseSaved({ responseId: "no-ga", verifiedResponseSaved: true, verifiedReferredParticipant: false })
    expect(window.localStorage.getItem(completionKey)).toBeNull()
    window.gtag = () => { throw new Error("Blocked analytics") }
    vi.stubGlobal("fetch", vi.fn(async () => response()))
    const { storage } = await import("../../../../packages/site-kit/src/lib/storage")
    const { syncPendingVote } = await import("../../../../packages/site-kit/src/lib/vote-utils")
    storage.setPendingVote(draft)
    expect(await syncPendingVote()).toBe(true)
    expect(storage.getPendingVote()).toBeNull()
  })
})

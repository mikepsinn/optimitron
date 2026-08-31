import { describe, expect, it, vi } from "vitest"

import { createPostHandler } from "../../lib/trial-abundance-response-route"

const validResponse = {
  inviteToken: null,
  militaryAllocationPercent: 35,
  organizationId: null,
  patientAccessAnswer: "YES",
  referredBy: "REFERRAL123",
  selfFundedAccessAnswer: "ABSTAIN",
  sourceReferrer: null,
  sourceUrl: "https://trialabundancesurvey.org/",
  timestamp: "2026-08-31T12:00:00.000Z",
} as const

function makeRequest(body: unknown) {
  return new Request("https://trialabundancesurvey.org/api/votes/sync", {
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
    method: "POST",
  })
}

describe("Trial Abundance response POST", () => {
  it("rejects an allocation outside the 0 to 100 range", async () => {
    const submit = vi.fn()
    const post = createPostHandler({ submit })
    const response = await post(
      makeRequest({ ...validResponse, militaryAllocationPercent: 101 }),
    )

    expect(response.status).toBe(400)
    expect(submit).not.toHaveBeenCalled()
  })

  it("accepts yes, no, and not-sure responses for both questions", async () => {
    const submit = vi.fn(async () => ({ responseId: "response-1" }))
    const post = createPostHandler({ submit })

    for (const answer of ["YES", "NO", "ABSTAIN"] as const) {
      const response = await post(
        makeRequest({
          ...validResponse,
          patientAccessAnswer: answer,
          selfFundedAccessAnswer: answer,
        }),
      )
      expect(response.status).toBe(200)
    }

    expect(submit).toHaveBeenCalledTimes(3)
  })

  it("requires separate answers for both patient-access questions", async () => {
    const submit = vi.fn()
    const post = createPostHandler({ submit })
    const { selfFundedAccessAnswer: _, ...missingSelfFundedAnswer } =
      validResponse
    const response = await post(makeRequest(missingSelfFundedAnswer))

    expect(response.status).toBe(400)
    expect(submit).not.toHaveBeenCalled()
  })

  it("returns 401 when an authenticated save is not available", async () => {
    const post = createPostHandler({
      submit: async () => {
        throw new Error("Unauthorized - authentication required")
      },
    })
    const response = await post(makeRequest(validResponse))

    expect(response.status).toBe(401)
  })
})

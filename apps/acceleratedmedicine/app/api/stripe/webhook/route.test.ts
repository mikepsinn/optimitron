import { describe, it, expect, vi, beforeEach } from "vitest"
import type Stripe from "stripe"

const mockConstructEvent = vi.hoisted(() => vi.fn())
const mockEnv = vi.hoisted(() => ({
  STRIPE_SECRET_KEY: "sk_test_1234567890" as string | undefined,
  STRIPE_WEBHOOK_SECRET: "whsec_test_1234567890" as string | undefined,
}))
const mockHeadersGet = vi.hoisted(() => vi.fn())

vi.mock("@/lib/env", () => ({
  env: mockEnv,
}))

vi.mock("next/headers", () => ({
  headers: vi.fn(() => ({
    get: mockHeadersGet,
  })),
}))

vi.mock("stripe", () => ({
  default: class MockStripe {
    webhooks = {
      constructEvent: mockConstructEvent,
    }
  },
}))

import { POST } from "./route"

function makeRequest(body = JSON.stringify({ id: "evt_test" })) {
  return new Request("http://localhost:3000/api/stripe/webhook", {
    method: "POST",
    body,
  }) as unknown as import("next/server").NextRequest
}

describe("Stripe Webhook (verify-only)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockEnv.STRIPE_SECRET_KEY = "sk_test_1234567890"
    mockEnv.STRIPE_WEBHOOK_SECRET = "whsec_test_1234567890"
    mockHeadersGet.mockReturnValue("sig_test")
  })

  it("returns ignored when Stripe env is not configured", async () => {
    mockEnv.STRIPE_SECRET_KEY = undefined
    mockEnv.STRIPE_WEBHOOK_SECRET = undefined

    const response = await POST(makeRequest())
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.received).toBe(true)
    expect(data.ignored).toBe(true)
    expect(mockConstructEvent).not.toHaveBeenCalled()
  })

  it("returns 400 if signature is missing", async () => {
    mockHeadersGet.mockReturnValue(null)

    const response = await POST(makeRequest())
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe("Missing signature")
    expect(mockConstructEvent).not.toHaveBeenCalled()
  })

  it("returns 400 if signature verification fails", async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error("Invalid signature")
    })

    const response = await POST(makeRequest())
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe("Invalid signature")
  })

  it("acknowledges valid events without writing donations", async () => {
    const mockEvent = {
      id: "evt_test_valid",
      type: "checkout.session.completed",
    } as Stripe.Event

    mockConstructEvent.mockReturnValue(mockEvent)

    const response = await POST(makeRequest())
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.received).toBe(true)
    expect(data.ignored).toBeUndefined()
    expect(mockConstructEvent).toHaveBeenCalled()
  })
})

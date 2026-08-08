import { describe, it, expect, vi, beforeEach } from "vitest"
import { POST, GET } from "./route"
import { mockCheckoutSession, mockSubscriptionSession, mockInvoice } from "@/tests/fixtures/stripe"
import type Stripe from "stripe"

const mockStripe = vi.hoisted(() => ({
  webhooks: {
    constructEvent: vi.fn(),
  },
}))

// Mock dependencies
vi.mock("@/lib/stripe", () => ({
  getStripe: vi.fn(() => mockStripe),
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    donation: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    badge: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    activity: {
      create: vi.fn(),
    },
  },
}))

vi.mock("next/headers", () => ({
  headers: vi.fn(() => ({
    get: vi.fn((key: string) => {
      if (key === "stripe-signature") return "test_signature"
      return null
    }),
  })),
}))

describe("Stripe Webhook", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("GET handler", () => {
    it("returns 200 with ready message", async () => {
      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toContain("Webhook endpoint is ready")
    })
  })

  describe("POST handler - checkout.session.completed", () => {
    it("creates donation for one-time payment", async () => {
      const { getStripe } = await import("@/lib/stripe")
      const stripe = getStripe()
      const { prisma } = await import("@/lib/prisma")

      const mockEvent: Stripe.Event = {
        id: "evt_test_123",
        object: "event",
        api_version: "2025-10-29.clover",
        created: 1699999999,
        data: {
          object: mockCheckoutSession,
        },
        livemode: false,
        pending_webhooks: 0,
        request: { id: null, idempotency_key: null },
        type: "checkout.session.completed",
      }

      vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(mockEvent)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.donation.create).mockResolvedValue({
        id: "don_test_123",
        userId: null,
        email: "test@example.com",
        name: "Test Donor",
        amount: 10000,
        frequency: "ONE_TIME",
        status: "COMPLETED",
        stripePaymentId: "pi_test_123456",
        sourceUrl: null,
        sourceReferrer: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const mockRequest = new Request("http://localhost:3000/api/stripe/webhook", {
        method: "POST",
        body: JSON.stringify({ test: "data" }),
      })

      const response = await POST(mockRequest as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.received).toBe(true)
      expect(prisma.donation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            amount: 10000,
            frequency: "ONE_TIME",
            status: "COMPLETED",
          }),
        })
      )
    })

    it("creates donation for subscription payment", async () => {
      const { getStripe } = await import("@/lib/stripe")
      const stripe = getStripe()
      const { prisma } = await import("@/lib/prisma")

      const mockEvent: Stripe.Event = {
        id: "evt_test_456",
        object: "event",
        api_version: "2025-10-29.clover",
        created: 1699999999,
        data: {
          object: mockSubscriptionSession,
        },
        livemode: false,
        pending_webhooks: 0,
        request: { id: null, idempotency_key: null },
        type: "checkout.session.completed",
      }

      vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(mockEvent)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.donation.create).mockResolvedValue({
        id: "don_test_456",
        userId: null,
        email: "test@example.com",
        name: "Test Donor",
        amount: 10000,
        frequency: "MONTHLY",
        status: "COMPLETED",
        stripePaymentId: "sub_test_123456",
        sourceUrl: null,
        sourceReferrer: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const mockRequest = new Request("http://localhost:3000/api/stripe/webhook", {
        method: "POST",
        body: JSON.stringify({ test: "data" }),
      })

      const response = await POST(mockRequest as any)

      expect(response.status).toBe(200)
      expect(prisma.donation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            frequency: "MONTHLY",
          }),
        })
      )
    })

    it("handles Payment Links without metadata", async () => {
      const { getStripe } = await import("@/lib/stripe")
      const stripe = getStripe()
      const { prisma } = await import("@/lib/prisma")

      const paymentLinkSession = {
        ...mockCheckoutSession,
        metadata: {}, // Empty metadata for Payment Links
      }

      const mockEvent: Stripe.Event = {
        id: "evt_test_789",
        object: "event",
        api_version: "2025-10-29.clover",
        created: 1699999999,
        data: {
          object: paymentLinkSession,
        },
        livemode: false,
        pending_webhooks: 0,
        request: { id: null, idempotency_key: null },
        type: "checkout.session.completed",
      }

      vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(mockEvent)
      vi.mocked(prisma.donation.create).mockResolvedValue({
        id: "don_test_789",
        userId: null,
        email: "test@example.com",
        name: "Test Donor",
        amount: 10000,
        frequency: "ONE_TIME",
        status: "COMPLETED",
        stripePaymentId: "pi_test_123456",
        sourceUrl: null,
        sourceReferrer: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const mockRequest = new Request("http://localhost:3000/api/stripe/webhook", {
        method: "POST",
        body: JSON.stringify({ test: "data" }),
      })

      const response = await POST(mockRequest as any)

      expect(response.status).toBe(200)
      expect(prisma.donation.create).toHaveBeenCalled()
    })

    it("awards GENEROUS_DONOR badge for first donation", async () => {
      const { getStripe } = await import("@/lib/stripe")
      const stripe = getStripe()
      const { prisma } = await import("@/lib/prisma")

      const mockEvent: Stripe.Event = {
        id: "evt_test_badge",
        object: "event",
        api_version: "2025-10-29.clover",
        created: 1699999999,
        data: {
          object: mockCheckoutSession,
        },
        livemode: false,
        pending_webhooks: 0,
        request: { id: null, idempotency_key: null },
        type: "checkout.session.completed",
      }

      vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(mockEvent)
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "user_123",
        email: "test@example.com",
        name: "Test User",
        username: null,
        password: null,
        location: null,
        bio: null,
        referralCode: "test_ref_123",
        country: null,
        address: null,
        phoneNumber: null,
        emailVerified: null,
        phoneVerified: false,
        addressVerified: false,
        governmentIdVerified: false,
        verifiedAt: null,
        image: null,
        isPublic: false,
        emailNotifications: true,
        weeklyDigest: true,
        newsletterSubscribed: true,
        referralAlerts: true,
        isAdmin: false,
        organizationId: null,
        website: null,
        headline: null,
        coverImage: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      })
      vi.mocked(prisma.donation.create).mockResolvedValue({
        id: "don_test_badge",
        userId: "user_123",
        email: "test@example.com",
        name: "Test Donor",
        amount: 10000,
        frequency: "ONE_TIME",
        status: "COMPLETED",
        stripePaymentId: "pi_test_123456",
        sourceUrl: null,
        sourceReferrer: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      vi.mocked(prisma.badge.findFirst).mockResolvedValue(null) // No existing badge
      vi.mocked(prisma.badge.create).mockResolvedValue({
        id: "badge_123",
        userId: "user_123",
        type: "GENEROUS_DONOR",
        earnedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      vi.mocked(prisma.activity.create).mockResolvedValue({
        id: "act_123",
        userId: "user_123",
        type: "DONATED",
        description: "Made a one-time donation of $100",
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const mockRequest = new Request("http://localhost:3000/api/stripe/webhook", {
        method: "POST",
        body: JSON.stringify({ test: "data" }),
      })

      const response = await POST(mockRequest as any)

      expect(response.status).toBe(200)
      expect(prisma.badge.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: "GENEROUS_DONOR",
          }),
        })
      )
    })
  })

  describe("POST handler - invoice.payment_succeeded", () => {
    it("records recurring payment", async () => {
      const { getStripe } = await import("@/lib/stripe")
      const stripe = getStripe()
      const { prisma } = await import("@/lib/prisma")

      const mockEvent: Stripe.Event = {
        id: "evt_test_invoice",
        object: "event",
        api_version: "2025-10-29.clover",
        created: 1699999999,
        data: {
          object: mockInvoice,
        },
        livemode: false,
        pending_webhooks: 0,
        request: { id: null, idempotency_key: null },
        type: "invoice.payment_succeeded",
      }

      vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(mockEvent)
      vi.mocked(prisma.donation.findFirst).mockResolvedValue({
        id: "don_existing",
        userId: "user_123",
        email: "test@example.com",
        name: "Test Donor",
        amount: 10000,
        frequency: "MONTHLY",
        status: "COMPLETED",
        stripePaymentId: "sub_test_123456",
        sourceUrl: null,
        sourceReferrer: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      vi.mocked(prisma.activity.create).mockResolvedValue({
        id: "act_recurring",
        userId: "user_123",
        type: "DONATED",
        description: "Monthly donation of $100.00 processed",
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const mockRequest = new Request("http://localhost:3000/api/stripe/webhook", {
        method: "POST",
        body: JSON.stringify({ test: "data" }),
      })

      const response = await POST(mockRequest as any)

      expect(response.status).toBe(200)
      expect(prisma.activity.create).toHaveBeenCalled()
    })
  })

  describe("Error handling", () => {
    it("returns 400 if signature is missing", async () => {
      const { headers } = await import("next/headers")

      vi.mocked(headers).mockReturnValue({
        get: vi.fn(() => null),
      } as any)

      const mockRequest = new Request("http://localhost:3000/api/stripe/webhook", {
        method: "POST",
        body: JSON.stringify({ test: "data" }),
      })

      const response = await POST(mockRequest as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("No signature")
    })

    it("returns 400 if signature verification fails", async () => {
      const { getStripe } = await import("@/lib/stripe")
      const stripe = getStripe()
      const { headers } = await import("next/headers")

      // Mock headers to return a signature
      vi.mocked(headers).mockReturnValue({
        get: vi.fn((key: string) => {
          if (key === "stripe-signature") return "invalid_signature"
          return null
        }),
      } as any)

      vi.mocked(stripe.webhooks.constructEvent).mockImplementation(() => {
        throw new Error("Invalid signature")
      })

      const mockRequest = new Request("http://localhost:3000/api/stripe/webhook", {
        method: "POST",
        body: JSON.stringify({ test: "data" }),
      })

      const response = await POST(mockRequest as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("Invalid signature")
    })
  })
})

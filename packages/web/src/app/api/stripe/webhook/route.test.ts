import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  activityCreate: vi.fn(),
  commerceFulfillmentCreate: vi.fn(),
  commerceFulfillmentFindFirst: vi.fn(),
  commerceOrderFindFirst: vi.fn(),
  commerceOrderUpdate: vi.fn(),
  constructEvent: vi.fn(),
  fulfillShirtCheckoutSession: vi.fn(),
  headersGet: vi.fn(),
  isStripeConfigured: vi.fn(),
  serverEnv: {
    STRIPE_WEBHOOK_SECRET: "whsec_test" as string | undefined,
  },
  userFindUnique: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => ({
    get: mocks.headersGet,
  })),
}));

vi.mock("@/lib/stripe", () => ({
  isStripeConfigured: mocks.isStripeConfigured,
  getStripeClient: () => ({
    webhooks: {
      constructEvent: mocks.constructEvent,
    },
  }),
}));

vi.mock("@/lib/env", () => ({
  serverEnv: mocks.serverEnv,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    activity: {
      create: mocks.activityCreate,
    },
    commerceFulfillment: {
      create: mocks.commerceFulfillmentCreate,
      findFirst: mocks.commerceFulfillmentFindFirst,
    },
    commerceOrder: {
      findFirst: mocks.commerceOrderFindFirst,
      update: mocks.commerceOrderUpdate,
    },
    user: {
      findUnique: mocks.userFindUnique,
    },
  },
}));

vi.mock("@/lib/shirt-fulfillment.server", () => ({
  fulfillShirtCheckoutSession: mocks.fulfillShirtCheckoutSession,
}));

import { POST } from "./route";

function makeWebhookRequest() {
  return new Request("http://localhost/api/stripe/webhook", {
    body: "{}",
    headers: {
      "stripe-signature": "sig_test",
    },
    method: "POST",
  });
}

describe("POST /api/stripe/webhook", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.serverEnv.STRIPE_WEBHOOK_SECRET = "whsec_test";
    mocks.headersGet.mockReturnValue("sig_test");
    mocks.isStripeConfigured.mockReturnValue(true);
    mocks.commerceOrderFindFirst.mockResolvedValue({
      buyerEmail: null,
      buyerName: null,
      id: "order_123",
      items: [
        {
          fulfillmentKind: "MANUAL_SPONSORSHIP",
          id: "item_123",
          offerKey: "flyer-run-sponsorship",
          offerVariantKey: "flyers",
        },
      ],
      paidAt: null,
    });
    mocks.commerceOrderUpdate.mockResolvedValue({ id: "order_123" });
    mocks.commerceFulfillmentFindFirst.mockResolvedValue(null);
    mocks.commerceFulfillmentCreate.mockResolvedValue({ id: "fulfillment_123" });
    mocks.userFindUnique.mockResolvedValue({ id: "user_123" });
    mocks.activityCreate.mockResolvedValue({ id: "activity_123" });
  });

  it("marks store-offer orders paid and creates manual fulfillment on checkout completion", async () => {
    mocks.constructEvent.mockReturnValue({
      data: {
        object: {
          amount_total: 10000,
          currency: "usd",
          customer: "cus_123",
          customer_details: {
            email: "ada@example.com",
            name: "Ada",
          },
          id: "cs_test_store",
          metadata: {
            commerce_order_id: "order_123",
            donorEmail: "ada@example.com",
            donorName: "Ada",
            offer_key: "flyer-run-sponsorship",
            order_type: "store_offer",
            sourceReferrer: "http://localhost:3001/store",
            sourceUrl: "http://localhost:3001/store/flyer-run-sponsorship",
            userId: "user_123",
            variant_key: "flyers",
          },
          mode: "payment",
          payment_intent: "pi_123",
        },
      },
      type: "checkout.session.completed",
    });

    const res = await POST(makeWebhookRequest());

    expect(res.status).toBe(200);
    expect(mocks.commerceOrderFindFirst).toHaveBeenCalledWith({
      include: { items: true },
      where: {
        OR: [{ id: "order_123" }, { stripeCheckoutSessionId: "cs_test_store" }],
        deletedAt: null,
      },
    });
    expect(mocks.commerceOrderUpdate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        buyerEmail: "ada@example.com",
        buyerName: "Ada",
        lastError: null,
        status: "PAID",
        stripeCheckoutSessionId: "cs_test_store",
        stripeCustomerId: "cus_123",
        stripePaymentIntentId: "pi_123",
      }),
      where: { id: "order_123" },
    });
    expect(mocks.commerceFulfillmentCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        externalOrderId: "cs_test_store",
        orderId: "order_123",
        orderItemId: "item_123",
        provider: "MANUAL",
        status: "PENDING",
      }),
    });
    expect(mocks.activityCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        entityId: "cs_test_store",
        entityType: "StripeCheckoutSession",
        type: "DONATED",
        userId: "user_123",
      }),
    });
  });
});

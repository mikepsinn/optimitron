import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  activityCreate: vi.fn(),
  commerceFulfillmentCreate: vi.fn(),
  commerceFulfillmentFindFirst: vi.fn(),
  commerceOrderFindFirst: vi.fn(),
  commerceOrderUpdate: vi.fn(),
  constructEvent: vi.fn(),
  fulfillShirtCheckoutSession: vi.fn(),
  handlePledgeSetupSessionCompleted: vi.fn(),
  headersGet: vi.fn(),
  isStripeConfigured: vi.fn(),
  maybeChargeCallablePledges: vi.fn(),
  recordTaskFundingChargeDisputed: vi.fn(),
  recordTaskFundingChargeRefunded: vi.fn(),
  recordTaskFundingCheckoutFailed: vi.fn(),
  recordTaskFundingCheckoutPaid: vi.fn(),
  serverEnv: {
    STRIPE_WEBHOOK_SECRET: "whsec_test" as string | undefined,
  },
  settlePledgeCallPaymentIntent: vi.fn(),
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

vi.mock("@/lib/task-funding/payments.server", () => ({
  recordTaskFundingChargeDisputed: mocks.recordTaskFundingChargeDisputed,
  recordTaskFundingChargeRefunded: mocks.recordTaskFundingChargeRefunded,
  recordTaskFundingCheckoutFailed: mocks.recordTaskFundingCheckoutFailed,
  recordTaskFundingCheckoutPaid: mocks.recordTaskFundingCheckoutPaid,
  TASK_FUNDING_ORDER_TYPE: "task_funding",
}));

vi.mock("@/lib/task-funding/escrow.server", () => ({
  handlePledgeSetupSessionCompleted: mocks.handlePledgeSetupSessionCompleted,
  maybeChargeCallablePledges: mocks.maybeChargeCallablePledges,
  settlePledgeCallPaymentIntent: mocks.settlePledgeCallPaymentIntent,
  TASK_FUNDING_PLEDGE_SETUP_KIND: "task-funding-pledge-setup",
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
    // Store-offer purchases must not double-record as DONATED activities.
    expect(mocks.activityCreate).not.toHaveBeenCalled();
  });

  it("records task funding checkout completion without generic donation activity", async () => {
    const session = {
      amount_total: 2500,
      currency: "usd",
      customer: "cus_task",
      id: "cs_test_task_funding",
      metadata: {
        order_type: "task_funding",
        task_funding_payment_id: "tfp_123",
        task_id: "task_123",
      },
      mode: "payment",
      payment_intent: "pi_task",
    };
    mocks.constructEvent.mockReturnValue({
      data: {
        object: session,
      },
      type: "checkout.session.completed",
    });
    mocks.recordTaskFundingCheckoutPaid.mockResolvedValue({
      id: "tfp_123",
      targetId: "target_123",
    });
    mocks.maybeChargeCallablePledges.mockResolvedValue({
      charged: [],
      declined: [],
      fullyFunded: false,
    });

    const res = await POST(makeWebhookRequest());

    expect(res.status).toBe(200);
    expect(mocks.recordTaskFundingCheckoutPaid).toHaveBeenCalledWith(session);
    // Paid checkout money counts toward the charging threshold, so the paid
    // path must attempt to call card-backed pledges on the same target.
    expect(mocks.maybeChargeCallablePledges).toHaveBeenCalledWith("target_123");
    expect(mocks.activityCreate).not.toHaveBeenCalled();
    expect(mocks.commerceOrderFindFirst).not.toHaveBeenCalled();
  });

  it("routes setup-mode pledge sessions to the pledge setup handler", async () => {
    const session = {
      id: "cs_test_pledge_setup",
      metadata: {
        kind: "task-funding-pledge-setup",
        pledgeId: "pledge_123",
        target_id: "target_123",
        task_id: "task_123",
      },
      mode: "setup",
      setup_intent: "seti_123",
    };
    mocks.constructEvent.mockReturnValue({
      data: { object: session },
      type: "checkout.session.completed",
    });
    mocks.handlePledgeSetupSessionCompleted.mockResolvedValue({
      chargeResult: { charged: [], declined: [], fullyFunded: false },
      pledgeId: "pledge_123",
      targetId: "target_123",
    });

    const res = await POST(makeWebhookRequest());

    expect(res.status).toBe(200);
    expect(mocks.handlePledgeSetupSessionCompleted).toHaveBeenCalledWith(
      session,
    );
    expect(mocks.recordTaskFundingCheckoutPaid).not.toHaveBeenCalled();
    expect(mocks.activityCreate).not.toHaveBeenCalled();
  });

  it("settles pledge-call payment intents flagged by metadata", async () => {
    const paymentIntent = {
      id: "pi_pledge_call",
      metadata: {
        order_type: "task_funding",
        pledgeId: "pledge_123",
        task_funding_payment_id: "tfp_123",
      },
      status: "succeeded",
    };
    mocks.constructEvent.mockReturnValue({
      data: { object: paymentIntent },
      type: "payment_intent.succeeded",
    });
    mocks.settlePledgeCallPaymentIntent.mockResolvedValue({
      outcome: "succeeded",
      paymentId: "tfp_123",
      pledgeId: "pledge_123",
      targetId: "target_123",
    });

    const res = await POST(makeWebhookRequest());

    expect(res.status).toBe(200);
    expect(mocks.settlePledgeCallPaymentIntent).toHaveBeenCalledWith(
      paymentIntent,
    );
  });

  it("ignores payment intents without pledge-call metadata", async () => {
    mocks.constructEvent.mockReturnValue({
      data: {
        object: {
          id: "pi_checkout",
          metadata: {
            order_type: "task_funding",
            task_funding_payment_id: "tfp_456",
          },
          status: "succeeded",
        },
      },
      type: "payment_intent.succeeded",
    });

    const res = await POST(makeWebhookRequest());

    expect(res.status).toBe(200);
    // Pay-now checkout intents settle via checkout.session events, never here.
    expect(mocks.settlePledgeCallPaymentIntent).not.toHaveBeenCalled();
  });
});

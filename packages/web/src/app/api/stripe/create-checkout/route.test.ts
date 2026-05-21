import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getEnabledShirtVariantForCheckout: vi.fn(),
  getEnabledStoreOfferForCheckout: vi.fn(),
  commerceOrderCreate: vi.fn(),
  commerceOrderUpdate: vi.fn(),
  isCustomCatConfigured: vi.fn(),
  isObjectStorageConfigured: vi.fn(),
  isStripeConfigured: vi.fn(),
  getStripeClient: vi.fn(),
  sessionsCreate: vi.fn(),
  getBaseUrl: vi.fn(),
  getServerSession: vi.fn(),
  serverEnv: {
    SHIRT_COMMERCE_ENABLED: "true" as string | undefined,
  },
}));

vi.mock("next-auth", () => ({
  getServerSession: mocks.getServerSession,
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/stripe", () => ({
  isStripeConfigured: mocks.isStripeConfigured,
  getStripeClient: mocks.getStripeClient,
}));

vi.mock("@/lib/url", () => ({
  buildReferralUrl: (identifier?: string | null, baseUrl = "http://localhost:3001") =>
    identifier ? `${baseUrl}/vote/${identifier}` : baseUrl,
  getBaseUrl: mocks.getBaseUrl,
}));

vi.mock("@/lib/env", () => ({
  serverEnv: mocks.serverEnv,
}));

vi.mock("@/lib/commerce-catalog.server", () => ({
  getEnabledShirtVariantForCheckout: mocks.getEnabledShirtVariantForCheckout,
  getEnabledStoreOfferForCheckout: mocks.getEnabledStoreOfferForCheckout,
}));

vi.mock("@/lib/customcat.server", () => ({
  isCustomCatConfigured: mocks.isCustomCatConfigured,
}));

vi.mock("@/lib/object-storage.server", () => ({
  isObjectStorageConfigured: mocks.isObjectStorageConfigured,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    commerceOrder: {
      create: mocks.commerceOrderCreate,
      update: mocks.commerceOrderUpdate,
    },
  },
}));

import { POST } from "./route";

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/stripe/create-checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/stripe/create-checkout", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.serverEnv.SHIRT_COMMERCE_ENABLED = "true";
    mocks.isStripeConfigured.mockReturnValue(true);
    mocks.isCustomCatConfigured.mockReturnValue(true);
    mocks.isObjectStorageConfigured.mockReturnValue(true);
    mocks.getBaseUrl.mockReturnValue("http://localhost:3001");
    mocks.getServerSession.mockResolvedValue(null);
    mocks.getEnabledShirtVariantForCheckout.mockResolvedValue({
      catalogSku: "12345",
      mapping: {
        id: "mapping_123",
      },
      offer: {
        defaultFmvCents: 1500,
        id: "offer_shirt",
        key: "shirt",
        taxCode: "txcd_99999999",
        title: "War on Disease shirt",
      },
      variant: {
        fmvCents: 1500,
        fulfillmentMetadata: null,
        id: "variant_shirt_white_m",
        key: "shirt:white:M",
        label: "White / M",
        taxCode: "txcd_99999999",
        variantKey: "white:M",
      },
    });
    mocks.getEnabledStoreOfferForCheckout.mockResolvedValue({
      offer: {
        allowCustomAmount: true,
        currency: "usd",
        defaultFmvCents: 0,
        defaultUnitAmountCents: 10000,
        description: "Pay for posters, flyers, and local outreach.",
        fulfillmentKind: "MANUAL_SPONSORSHIP",
        id: "offer_flyer_run",
        isTaxDeductible: true,
        key: "flyer-run-sponsorship",
        maxUnitAmountCents: null,
        minUnitAmountCents: 2500,
        taxCode: "txcd_00000000",
        title: "Sponsor a flyer run",
      },
      variant: {
        allowCustomAmount: true,
        currency: "usd",
        fmvCents: 0,
        fulfillmentKind: "MANUAL_SPONSORSHIP",
        id: "variant_flyer_run",
        key: "flyer-run-sponsorship:flyers",
        label: "Flyers",
        maxUnitAmountCents: null,
        minUnitAmountCents: 2500,
        taxCode: "txcd_00000000",
        unitAmountCents: 10000,
        variantKey: "flyers",
      },
    });
    mocks.commerceOrderCreate.mockResolvedValue({
      id: "order_123",
      items: [{ id: "item_123" }],
    });
    mocks.commerceOrderUpdate.mockResolvedValue({ id: "order_123" });
    mocks.getStripeClient.mockReturnValue({
      checkout: { sessions: { create: mocks.sessionsCreate } },
    });
    mocks.sessionsCreate.mockResolvedValue({
      id: "cs_test_123",
      url: "https://checkout.stripe.com/c/test_123",
    });
  });

  it("returns 503 when Stripe is not configured", async () => {
    mocks.isStripeConfigured.mockReturnValue(false);
    const res = await POST(
      makeRequest({ amount: 50, donationType: "monthly", name: "Ada", email: "ada@example.com" }),
    );
    expect(res.status).toBe(503);
  });

  it("rejects amounts below $1", async () => {
    const res = await POST(
      makeRequest({ amount: 0, donationType: "monthly", name: "Ada", email: "ada@example.com" }),
    );
    expect(res.status).toBe(400);
  });

  it("rejects invalid donation type", async () => {
    const res = await POST(
      makeRequest({ amount: 50, donationType: "biannual", name: "Ada", email: "ada@example.com" }),
    );
    expect(res.status).toBe(400);
  });

  it("accepts missing name or email so Stripe can collect donor identity", async () => {
    const res = await POST(
      makeRequest({ amount: 50, donationType: "monthly" }),
    );
    expect(res.status).toBe(200);
    const call = mocks.sessionsCreate.mock.calls[0]![0];
    expect(call.customer_email).toBeUndefined();
    expect(call.metadata).not.toHaveProperty("donorName");
    expect(call.metadata).not.toHaveProperty("donorEmail");
  });

  it("rejects invalid email format", async () => {
    const res = await POST(
      makeRequest({ amount: 50, donationType: "monthly", name: "Ada", email: "not-email" }),
    );
    expect(res.status).toBe(400);
  });

  it("creates a one-time checkout session", async () => {
    const res = await POST(
      makeRequest({
        amount: 100,
        donationType: "one-time",
        name: "Ada",
        email: "ada@example.com",
        sourceUrl: "http://localhost:3001/donate",
        sourceReferrer: "http://localhost:3001/dashboard",
      }),
    );
    expect(res.status).toBe(200);
    expect(mocks.sessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "payment",
        customer_email: "ada@example.com",
        line_items: [
          expect.objectContaining({
            price_data: expect.objectContaining({
              currency: "usd",
              product_data: expect.objectContaining({
                description: expect.stringContaining("1% Treaty campaign"),
                name: "1% Treaty Donation",
              }),
              unit_amount: 10000,
            }),
          }),
        ],
        metadata: expect.objectContaining({
          donorName: "Ada",
          donorEmail: "ada@example.com",
          donationType: "one-time",
          cause: "earth-optimization-prize-and-ops",
        }),
      }),
    );
    const call = mocks.sessionsCreate.mock.calls[0]![0];
    expect(call.line_items[0].price_data.product_data.description).not.toContain(
      "Earth Optimization Points",
    );
    const body = (await res.json()) as { sessionId: string; url: string };
    expect(body.sessionId).toBe("cs_test_123");
    expect(body.url).toBe("https://checkout.stripe.com/c/test_123");
  });

  it("creates a monthly subscription checkout session with recurring price", async () => {
    const res = await POST(
      makeRequest({ amount: 25, donationType: "monthly", name: "Ada", email: "ada@example.com" }),
    );
    expect(res.status).toBe(200);
    const call = mocks.sessionsCreate.mock.calls[0]![0];
    expect(call.mode).toBe("subscription");
    expect(call.line_items[0].price_data.recurring).toEqual({ interval: "month" });
  });

  it("uses the authenticated user for Stripe email prefill and attribution", async () => {
    mocks.getServerSession.mockResolvedValue({
      user: {
        email: "grace@example.com",
        id: "user_123",
        name: "Grace",
      },
    });
    const res = await POST(makeRequest({ amount: 50, donationType: "monthly" }));

    expect(res.status).toBe(200);
    const call = mocks.sessionsCreate.mock.calls[0]![0];
    expect(call.customer_email).toBe("grace@example.com");
    expect(call.client_reference_id).toBe("user_123");
    expect(call.metadata).toEqual(
      expect.objectContaining({
        donorEmail: "grace@example.com",
        donorName: "Grace",
        userId: "user_123",
      }),
    );
  });

  it("strips query and hash from sourceUrl + sourceReferrer", async () => {
    await POST(
      makeRequest({
        amount: 50,
        donationType: "monthly",
        name: "Ada",
        email: "ada@example.com",
        sourceUrl: "http://localhost:3001/donate?token=secret#hash",
        sourceReferrer: "http://localhost:3001/?ref=abc&invite=xyz",
      }),
    );
    const call = mocks.sessionsCreate.mock.calls[0]![0];
    expect(call.metadata.sourceUrl).toBe("http://localhost:3001/donate");
    expect(call.metadata.sourceReferrer).toBe("http://localhost:3001/");
  });

  it("rejects invalid shirt sizes before creating a Checkout session", async () => {
    const res = await POST(
      makeRequest({
        donation_tier: "25",
        handle: "ada",
        order_type: "shirt",
        shirt_size: "XS",
      }),
    );

    expect(res.status).toBe(400);
    expect(mocks.sessionsCreate).not.toHaveBeenCalled();
  });

  it("returns 503 for shirt checkout when commerce is disabled", async () => {
    mocks.serverEnv.SHIRT_COMMERCE_ENABLED = "false";

    const res = await POST(
      makeRequest({
        donation_tier: "35",
        handle: "ada",
        order_type: "shirt",
        shirt_size: "M",
      }),
    );

    expect(res.status).toBe(503);
    expect(mocks.getEnabledShirtVariantForCheckout).not.toHaveBeenCalled();
    expect(mocks.sessionsCreate).not.toHaveBeenCalled();
  });

  it("returns 503 for shirt checkout when the managed catalog is not ready", async () => {
    mocks.getEnabledShirtVariantForCheckout.mockRejectedValue(
      new Error("Missing CustomCat catalog SKU for shirt:black:M."),
    );

    const res = await POST(
      makeRequest({
        donation_tier: "35",
        handle: "ada",
        order_type: "shirt",
        shirt_color: "black",
        shirt_size: "M",
      }),
    );

    expect(res.status).toBe(503);
    expect(mocks.sessionsCreate).not.toHaveBeenCalled();
  });

  it("creates a shirt checkout session with US shipping and FMV split", async () => {
    mocks.getServerSession.mockResolvedValue({
      user: {
        email: "ada@example.com",
        handle: "ada",
        id: "user_123",
        name: "Ada",
      },
    });

    const res = await POST(
      makeRequest({
        donation_tier: "35",
        handle: "ignored-public-handle",
        order_type: "shirt",
        shirt_color: "white",
        shirt_size: "M",
        sourceUrl: "http://localhost:3001/shirt?token=secret",
      }),
    );

    expect(res.status).toBe(200);
    const call = mocks.sessionsCreate.mock.calls[0]![0];
    expect(call).toEqual(
      expect.objectContaining({
        automatic_tax: { enabled: true },
        billing_address_collection: "required",
        customer_email: "ada@example.com",
        mode: "payment",
        phone_number_collection: { enabled: true },
        shipping_address_collection: { allowed_countries: ["US"] },
      }),
    );
    expect(call.line_items).toHaveLength(2);
    expect(call.line_items[0].price_data.unit_amount).toBe(1500);
    expect(call.line_items[0].price_data.product_data.tax_code).toBe("txcd_99999999");
    expect(call.line_items[1].price_data.unit_amount).toBe(2000);
    expect(call.line_items[1].price_data.product_data.tax_code).toBe("txcd_00000000");
    expect(call.metadata).toEqual(
      expect.objectContaining({
        commerce_order_id: "order_123",
        commerce_order_item_id: "item_123",
        customcat_catalog_sku: "12345",
        donation_amount_cents: "2000",
        donation_tier: "35",
        fmv_cents: "1500",
        handle: "ada",
        order_type: "shirt",
        referral_url: "https://warondisease.org/vote/ada",
        shirt_color: "white",
        shirt_size: "M",
        sourceUrl: "http://localhost:3001/shirt",
        userId: "user_123",
      }),
    );
    expect(call.success_url).toBe(
      "http://localhost:3001/shirt?ordered=1&session_id={CHECKOUT_SESSION_ID}",
    );
    expect(mocks.commerceOrderCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          buyerEmail: "ada@example.com",
          buyerName: "Ada",
          buyerUserId: "user_123",
          donationCents: 2000,
          fmvCents: 1500,
          purposeKey: "war-on-disease-shirt",
          subtotalCents: 3500,
          totalCents: 3500,
          items: {
            create: expect.objectContaining({
              offerId: "offer_shirt",
              offerKey: "shirt",
              offerVariantId: "variant_shirt_white_m",
              offerVariantKey: "white:M",
              totalAmountCents: 3500,
              totalDonationCents: 2000,
              totalFmvCents: 1500,
            }),
          },
        }),
        include: { items: true },
      }),
    );
    expect(mocks.commerceOrderUpdate).toHaveBeenCalledWith({
      data: { stripeCheckoutSessionId: "cs_test_123" },
      where: { id: "order_123" },
    });
  });

  it("rejects store offer checkout amounts below the catalog minimum", async () => {
    const res = await POST(
      makeRequest({
        custom_amount: 10,
        offer_key: "flyer-run-sponsorship",
        order_type: "store_offer",
        sourceUrl: "http://localhost:3001/store/flyer-run-sponsorship",
        variant_key: "flyers",
      }),
    );

    expect(res.status).toBe(400);
    expect(mocks.sessionsCreate).not.toHaveBeenCalled();
  });

  it("creates a generic store checkout session for manual sponsorship offers", async () => {
    mocks.getServerSession.mockResolvedValue({
      user: {
        email: "ada@example.com",
        handle: "ada",
        id: "user_123",
        name: "Ada",
      },
    });

    const res = await POST(
      makeRequest({
        custom_amount: 100,
        offer_key: "flyer-run-sponsorship",
        order_type: "store_offer",
        sourceUrl: "http://localhost:3001/store/flyer-run-sponsorship?token=secret",
        variant_key: "flyers",
      }),
    );

    expect(res.status).toBe(200);
    const call = mocks.sessionsCreate.mock.calls[0]![0];
    expect(call).toEqual(
      expect.objectContaining({
        billing_address_collection: "auto",
        cancel_url: "http://localhost:3001/store/flyer-run-sponsorship?canceled=true",
        customer_email: "ada@example.com",
        mode: "payment",
        success_url:
          "http://localhost:3001/store/flyer-run-sponsorship?ordered=1&session_id={CHECKOUT_SESSION_ID}",
      }),
    );
    expect(call.shipping_address_collection).toBeUndefined();
    expect(call.line_items).toHaveLength(1);
    expect(call.line_items[0].price_data.unit_amount).toBe(10000);
    expect(call.line_items[0].price_data.product_data.name).toBe(
      "Sponsor a flyer run - Flyers",
    );
    expect(call.metadata).toEqual(
      expect.objectContaining({
        commerce_order_id: "order_123",
        commerce_order_item_id: "item_123",
        donation_amount_cents: "10000",
        fmv_cents: "0",
        offer_key: "flyer-run-sponsorship",
        order_type: "store_offer",
        sourceUrl: "http://localhost:3001/store/flyer-run-sponsorship",
        userId: "user_123",
        variant_key: "flyers",
      }),
    );
    expect(mocks.commerceOrderCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          buyerEmail: "ada@example.com",
          buyerName: "Ada",
          buyerUserId: "user_123",
          donationCents: 10000,
          fmvCents: 0,
          purposeKey: "flyer-run-sponsorship",
          subtotalCents: 10000,
          totalCents: 10000,
          items: {
            create: expect.objectContaining({
              fulfillmentKind: "MANUAL_SPONSORSHIP",
              offerId: "offer_flyer_run",
              offerKey: "flyer-run-sponsorship",
              offerVariantId: "variant_flyer_run",
              offerVariantKey: "flyers",
              totalAmountCents: 10000,
              totalDonationCents: 10000,
              totalFmvCents: 0,
            }),
          },
        }),
        include: { items: true },
      }),
    );
  });
});

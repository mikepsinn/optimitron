import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  activityCreate: vi.fn(),
  commerceFulfillmentCreate: vi.fn(),
  commerceFulfillmentFindFirst: vi.fn(),
  commerceFulfillmentUpdate: vi.fn(),
  commerceOrderFindFirst: vi.fn(),
  commerceOrderUpdate: vi.fn(),
  composeAndUploadShirtArtwork: vi.fn(),
  submitCustomCatOrder: vi.fn(),
  userFindUnique: vi.fn(),
}));

vi.mock("@/lib/shirt-back-image.server", () => ({
  composeAndUploadShirtArtwork: mocks.composeAndUploadShirtArtwork,
}));

vi.mock("@/lib/customcat.server", () => ({
  submitCustomCatOrder: mocks.submitCustomCatOrder,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    activity: { create: mocks.activityCreate },
    commerceFulfillment: {
      create: mocks.commerceFulfillmentCreate,
      findFirst: mocks.commerceFulfillmentFindFirst,
      update: mocks.commerceFulfillmentUpdate,
    },
    commerceOrder: {
      findFirst: mocks.commerceOrderFindFirst,
      update: mocks.commerceOrderUpdate,
    },
    user: { findUnique: mocks.userFindUnique },
  },
}));

import { fulfillShirtCheckoutSession } from "../shirt-fulfillment.server";

describe("fulfillShirtCheckoutSession", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.composeAndUploadShirtArtwork.mockResolvedValue({
      backDesignUrl: "https://cdn.example/back.png",
      frontDesignUrl: "https://cdn.example/front.png",
    });
    mocks.submitCustomCatOrder.mockResolvedValue({ customCatOrderId: "cc_123" });
    mocks.userFindUnique.mockResolvedValue({ id: "user_123" });
    mocks.commerceFulfillmentFindFirst.mockResolvedValue(null);
    mocks.commerceFulfillmentCreate.mockResolvedValue({ id: "fulfillment_123" });
    mocks.commerceFulfillmentUpdate.mockResolvedValue({ id: "fulfillment_123" });
    mocks.commerceOrderFindFirst.mockResolvedValue({
      buyerUserId: "user_123",
      buyerEmail: "ada@example.com",
      buyerName: "Ada Lovelace",
      donationCents: 2000,
      fmvCents: 1500,
      id: "order_123",
      items: [
        {
          fulfillmentMetadata: {
            customCatCatalogSku: "12345",
            referralUrl: "https://warondisease.org/vote/ada",
            shirtColor: "black",
            shirtSize: "M",
          },
          id: "item_123",
        },
      ],
    });
    mocks.commerceOrderUpdate.mockResolvedValue({ id: "order_123" });
  });

  it("records fulfillment, uploads artwork, and submits the CustomCat order", async () => {
    const result = await fulfillShirtCheckoutSession({
      customer_details: {
        email: "ada@example.com",
        name: "Ada Lovelace",
        phone: "555-123-4567",
      },
      id: "cs_test_123",
      metadata: {
        donation_amount_cents: "2000",
        handle: "ada",
        order_type: "shirt",
        shirt_color: "black",
        shirt_size: "M",
        userId: "user_123",
      },
      shipping_details: {
        address: {
          city: "Austin",
          country: "US",
          line1: "123 Main St",
          line2: null,
          postal_code: "78701",
          state: "TX",
        },
        name: "Ada Lovelace",
      },
    } as any);

    expect(result).toEqual({ customCatOrderId: "cc_123", duplicate: false });
    expect(mocks.commerceFulfillmentCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          externalOrderId: "cs_test_123",
          orderId: "order_123",
          orderItemId: "item_123",
          provider: "CUSTOMCAT",
          status: "PENDING",
        }),
      }),
    );
    expect(mocks.composeAndUploadShirtArtwork).toHaveBeenCalledWith({
      checkoutSessionId: "cs_test_123",
      qrTarget: "https://warondisease.org/vote/ada",
      visibleTargetUrl: "warondisease.org/vote/ada",
    });
    expect(mocks.submitCustomCatOrder).toHaveBeenCalledWith({
      backDesignUrl: "https://cdn.example/back.png",
      catalogSku: "12345",
      externalOrderId: "cs_test_123",
      frontDesignUrl: "https://cdn.example/front.png",
      shipping: expect.objectContaining({
        country: "US",
        email: "ada@example.com",
        firstName: "Ada",
        lastName: "Lovelace",
        phone: "555-123-4567",
      }),
    });
    expect(mocks.activityCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          entityId: "cs_test_123",
          entityType: "StripeCheckoutSession",
          userId: "user_123",
        }),
      }),
    );
    expect(mocks.commerceFulfillmentUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          providerOrderId: "cc_123",
          status: "SUBMITTED",
        }),
        where: { id: "fulfillment_123" },
      }),
    );
  });

  it("does not submit CustomCat twice for duplicate Stripe webhooks", async () => {
    mocks.commerceFulfillmentFindFirst.mockResolvedValue({
      id: "fulfillment_123",
      providerOrderId: "cc_123",
      status: "SUBMITTED",
    });

    const result = await fulfillShirtCheckoutSession({
      id: "cs_test_123",
      metadata: { order_type: "shirt" },
    } as any);

    expect(result).toEqual({ customCatOrderId: "cc_123", duplicate: true });
    expect(mocks.commerceFulfillmentCreate).not.toHaveBeenCalled();
    expect(mocks.submitCustomCatOrder).not.toHaveBeenCalled();
  });

  it("retries a failed commerce fulfillment on a Stripe webhook retry", async () => {
    mocks.commerceFulfillmentFindFirst.mockResolvedValue({
      attemptCount: 1,
      id: "fulfillment_123",
      status: "FAILED",
    });

    const result = await fulfillShirtCheckoutSession({
      customer_details: {
        email: "ada@example.com",
        name: "Ada Lovelace",
        phone: "555-123-4567",
      },
      id: "cs_test_123",
      metadata: {
        commerce_order_id: "order_123",
        donation_amount_cents: "2000",
        handle: "ada",
        order_type: "shirt",
        shirt_color: "black",
        shirt_size: "M",
        userId: "user_123",
      },
      shipping_details: {
        address: {
          city: "Austin",
          country: "US",
          line1: "123 Main St",
          line2: null,
          postal_code: "78701",
          state: "TX",
        },
        name: "Ada Lovelace",
      },
    } as any);

    expect(result).toEqual({ customCatOrderId: "cc_123", duplicate: false });
    expect(mocks.submitCustomCatOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        catalogSku: "12345",
        externalOrderId: "cs_test_123",
      }),
    );
  });
});

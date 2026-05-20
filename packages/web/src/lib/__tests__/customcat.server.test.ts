import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import {
  createCustomCatWebhook,
  getCustomCatOrderStatus,
  getCustomCatShippingMethods,
  getCustomCatShippingQuote,
  listCustomCatWebhooks,
  submitCustomCatOrder,
  updateCustomCatWebhook,
  type CustomCatConfig,
} from "../customcat.server";

describe("CustomCat API client", () => {
  const config: CustomCatConfig = {
    apiToken: "cc_test_token",
    sandbox: true,
  };

  function jsonResponse(body: unknown) {
    return {
      headers: new Headers(),
      ok: true,
      text: vi.fn().mockResolvedValue(JSON.stringify(body)),
    };
  }

  function orderInput() {
    return {
      backDesignUrl: "https://cdn.example/back.png",
      catalogSku: "48146",
      externalOrderId: "cs_test_123",
      frontDesignUrl: "https://cdn.example/front.png",
      shipping: {
        city: "Austin",
        country: "US",
        email: "ada@example.com",
        firstName: "Ada",
        lastName: "Lovelace",
        line1: "123 Main St",
        phone: "555-123-4567",
        postalCode: "78701",
        state: "TX",
      },
    };
  }

  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          CUSTOMCAT_ORDER_ID: "cc_123",
          MSG: "Order added successfully",
          ORDER_ID: "cs_test_123",
        }),
      ),
    );
  });

  it("submits the front and back external designs in sandbox mode", async () => {
    const result = await submitCustomCatOrder(orderInput(), config);

    expect(result.customCatOrderId).toBe("cc_123");
    expect(result.message).toBe("Order added successfully");
    expect(result.orderId).toBe("cs_test_123");
    expect(fetch).toHaveBeenCalledWith(
      "https://customcat-beta.mylocker.net/api/v1/order/cs_test_123",
      expect.objectContaining({ method: "POST" }),
    );
    const body = JSON.parse((fetch as Mock).mock.calls[0]![1].body as string);
    expect(body).toEqual({
      api_key: "cc_test_token",
      shipping_first_name: "Ada",
      shipping_last_name: "Lovelace",
      shipping_address1: "123 Main St",
      shipping_address2: "",
      shipping_city: "Austin",
      shipping_state: "TX",
      shipping_zip: "78701",
      shipping_country: "US",
      shipping_email: "ada@example.com",
      shipping_phone: "555-123-4567",
      shipping_method: "Economy",
      items: [
        {
          catalog_sku: "48146",
          design_url: "https://cdn.example/front.png",
          design_url_back: "https://cdn.example/back.png",
          quantity: 1,
        },
      ],
      sandbox: "1",
    });
  });

  it("requires shipping_phone before submitting", async () => {
    await expect(
      submitCustomCatOrder(
        {
          ...orderInput(),
          shipping: {
            ...orderInput().shipping,
            phone: "",
          },
        },
        config,
      ),
    ).rejects.toThrow("shipping_phone is required");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("rejects an order response without the success MSG", async () => {
    (fetch as Mock).mockResolvedValueOnce(
      jsonResponse({
        CUSTOMCAT_ORDER_ID: "cc_123",
        MSG: "Order rejected",
        ORDER_ID: "cs_test_123",
      }),
    );

    await expect(submitCustomCatOrder(orderInput(), config)).rejects.toThrow(
      "unexpected MSG",
    );
  });

  it("gets order status by external id", async () => {
    (fetch as Mock).mockResolvedValueOnce(
      jsonResponse({
        CUSTOMER_CITY: "Austin",
        CUSTOMCAT_ORDER_ID: "cc_123",
        LINE_ITEMS: [{ PRODUCT_NAME: "Bella+Canvas 3001C", STATUS: "Shipped" }],
        ORDER_ID: "cs_test_123",
        ORDER_STATUS: "Shipped",
        SHIPMENTS: [{ METHOD: "Economy", TRACKING_ID: "TRACK123", VENDOR: "USPS" }],
      }),
    );

    const status = await getCustomCatOrderStatus("cs_test_123", config);

    expect(status.ORDER_STATUS).toBe("Shipped");
    expect(status.SHIPMENTS?.[0]?.TRACKING_ID).toBe("TRACK123");
    expect(fetch).toHaveBeenCalledWith(
      "https://customcat-beta.mylocker.net/api/v1/order/status/cs_test_123?api_key=cc_test_token",
      { method: "GET" },
    );
  });

  it("lists shipping methods and posts a shipping quote by method name", async () => {
    (fetch as Mock)
      .mockResolvedValueOnce(
        jsonResponse([
          { SHIPPING_ID: "1", SHIPPING_NAME: "Economy" },
          { SHIPPING_ID: "2", SHIPPING_NAME: "Ground" },
        ]),
      )
      .mockResolvedValueOnce(jsonResponse({ SHIPPING_COST: "4.99" }));

    const quote = await getCustomCatShippingQuote(
      {
        items: [{ catalogSku: "48146", quantity: 1 }],
        shipping: {
          city: "Los Angeles",
          country: "US",
          firstName: "Ada",
          lastName: "Lovelace",
          line1: "123 Main St",
          postalCode: "90001",
          state: "CA",
        },
      },
      config,
    );

    expect(quote.shippingId).toBe("1");
    expect(quote.shippingName).toBe("Economy");
    expect(quote.shippingCost).toBe("4.99");
    expect(fetch).toHaveBeenNthCalledWith(
      1,
      "https://customcat-beta.mylocker.net/api/v1/shipping?api_key=cc_test_token",
      { method: "GET" },
    );
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      "https://customcat-beta.mylocker.net/api/v1/shipping/1",
      expect.objectContaining({ method: "POST" }),
    );
    const body = JSON.parse((fetch as Mock).mock.calls[1]![1].body as string);
    expect(body).toEqual(
      expect.objectContaining({
        api_key: "cc_test_token",
        shipping_country: "US",
        shipping_state: "CA",
        items: [{ catalog_sku: "48146", quantity: 1 }],
      }),
    );
  });

  it("lists shipping methods directly", async () => {
    (fetch as Mock).mockResolvedValueOnce(
      jsonResponse([{ SHIPPING_ID: "1", SHIPPING_NAME: "Economy" }]),
    );

    await expect(getCustomCatShippingMethods(config)).resolves.toEqual([
      { SHIPPING_ID: "1", SHIPPING_NAME: "Economy" },
    ]);
  });

  it("lists, creates, and updates webhook subscriptions", async () => {
    (fetch as Mock)
      .mockResolvedValueOnce(
        jsonResponse([
          { TOPIC: "order-shipped", URL: "https://example.com/old", WEBHOOK_ID: "wh_1" },
        ]),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          TOPIC: "design-rejected",
          URL: "https://example.com/hook",
          WEBHOOK_ID: "wh_2",
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({ URL: "https://example.com/new", WEBHOOK_ID: "wh_2" }),
      );

    const list = await listCustomCatWebhooks(config);
    const created = await createCustomCatWebhook(
      "design-rejected",
      "https://example.com/hook",
      config,
    );
    const updated = await updateCustomCatWebhook("wh_2", "https://example.com/new", config);

    expect(list.webhooks).toHaveLength(1);
    expect(created.webhookId).toBe("wh_2");
    expect(updated.url).toBe("https://example.com/new");
    expect(fetch).toHaveBeenNthCalledWith(
      1,
      "https://customcat-beta.mylocker.net/api/v1/webhook?api_key=cc_test_token",
      { method: "GET" },
    );
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      "https://customcat-beta.mylocker.net/api/v1/webhook",
      expect.objectContaining({ method: "POST" }),
    );
    expect(fetch).toHaveBeenNthCalledWith(
      3,
      "https://customcat-beta.mylocker.net/api/v1/webhook/wh_2",
      expect.objectContaining({ method: "PUT" }),
    );
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  isStripeConfigured: vi.fn(),
  getStripeClient: vi.fn(),
  sessionsCreate: vi.fn(),
  getBaseUrl: vi.fn(),
}));

vi.mock("@/lib/stripe", () => ({
  isStripeConfigured: mocks.isStripeConfigured,
  getStripeClient: mocks.getStripeClient,
}));

vi.mock("@/lib/url", () => ({
  getBaseUrl: mocks.getBaseUrl,
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
    mocks.isStripeConfigured.mockReturnValue(true);
    mocks.getBaseUrl.mockReturnValue("http://localhost:3001");
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

  it("rejects missing name or email", async () => {
    const res = await POST(
      makeRequest({ amount: 50, donationType: "monthly", name: "", email: "ada@example.com" }),
    );
    expect(res.status).toBe(400);
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
                description: expect.stringContaining("global 1% Treaty referendum"),
                name: "Donation — global 1% Treaty referendum",
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
});

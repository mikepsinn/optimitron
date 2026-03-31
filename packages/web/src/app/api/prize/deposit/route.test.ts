import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  grantWishes: vi.fn(),
  checkBadgesAfterWish: vi.fn(),
  resolvePrizeDepositEvent: vi.fn(),
  publishPrizeDepositHypercert: vi.fn(),
}));

vi.mock("@/lib/auth-utils", () => ({
  requireAuth: mocks.requireAuth,
}));

vi.mock("@/lib/wishes.server", () => ({
  grantWishes: mocks.grantWishes,
}));

vi.mock("@/lib/badges.server", () => ({
  checkBadgesAfterWish: mocks.checkBadgesAfterWish,
}));

vi.mock("@/lib/prize-deposit-hypercert.server", () => ({
  resolvePrizeDepositEvent: mocks.resolvePrizeDepositEvent,
  publishPrizeDepositHypercert: mocks.publishPrizeDepositHypercert,
}));

import { POST } from "./route";

function makeRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/prize/deposit", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/prize/deposit", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.grantWishes.mockResolvedValue(null);
    mocks.checkBadgesAfterWish.mockResolvedValue(undefined);
    mocks.resolvePrizeDepositEvent.mockResolvedValue(null);
    mocks.publishPrizeDepositHypercert.mockResolvedValue({ status: "skipped", ref: null });
  });

  it("returns 401 when unauthenticated", async () => {
    mocks.requireAuth.mockRejectedValue(new Error("Unauthorized"));

    const res = await POST(makeRequest({ txHash: "0xabc", depositUsd: 500 }));

    expect(res.status).toBe(401);
  });

  it("returns 400 when txHash is missing", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user-1" });

    const res = await POST(makeRequest({ depositUsd: 500 }));

    expect(res.status).toBe(400);
    expect(mocks.grantWishes).not.toHaveBeenCalled();
  });

  it("returns 400 when depositUsd is not positive", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user-1" });

    const res = await POST(makeRequest({ txHash: "0xabc", depositUsd: -10 }));

    expect(res.status).toBe(400);
  });

  it("grants 5 wishes for $500 deposit", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user-1" });
    mocks.grantWishes.mockResolvedValue({ amount: 5 });
    mocks.resolvePrizeDepositEvent.mockResolvedValue({
      txHash: "0xabc",
      chainId: 84532,
      depositorAddress: "0x00000000000000000000000000000000000000aa",
      amount: "500000000",
      sharesReceived: "500000000",
    });

    const res = await POST(makeRequest({ txHash: "0xabc", depositUsd: 500 }));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ success: true, wishesEarned: 5 });
    expect(mocks.grantWishes).toHaveBeenCalledWith({
      userId: "user-1",
      reason: "PRIZE_DEPOSIT",
      amount: 5,
      dedupeKey: "deposit-0xabc",
      metadata: { txHash: "0xabc", depositUsd: 500 },
    });
    expect(mocks.checkBadgesAfterWish).toHaveBeenCalledWith("user-1", "PRIZE_DEPOSIT");
    expect(mocks.publishPrizeDepositHypercert).toHaveBeenCalledWith({
      txHash: "0xabc",
      chainId: 84532,
      depositorAddress: "0x00000000000000000000000000000000000000aa",
      amount: "500000000",
      sharesReceived: "500000000",
    });
  });

  it("returns 0 wishes for deposit under $100", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user-1" });

    const res = await POST(makeRequest({ txHash: "0xabc", depositUsd: 50 }));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ success: true, wishesEarned: 0 });
    expect(mocks.grantWishes).not.toHaveBeenCalled();
  });

  it("dedupes by txHash", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user-1" });
    mocks.grantWishes.mockResolvedValue(null);

    const res = await POST(makeRequest({ txHash: "0xabc", depositUsd: 500 }));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ success: true, wishesEarned: 0 });
  });

  it("falls back to client depositUsd when chain lookup is unavailable", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user-1" });
    mocks.grantWishes.mockResolvedValue({ amount: 5 });
    mocks.resolvePrizeDepositEvent.mockResolvedValue(null);

    const res = await POST(makeRequest({ txHash: "0xabc", depositUsd: 500 }));

    expect(res.status).toBe(200);
    expect(mocks.grantWishes).toHaveBeenCalledWith({
      userId: "user-1",
      reason: "PRIZE_DEPOSIT",
      amount: 5,
      dedupeKey: "deposit-0xabc",
      metadata: { txHash: "0xabc", depositUsd: 500 },
    });
    expect(mocks.publishPrizeDepositHypercert).not.toHaveBeenCalled();
  });
});

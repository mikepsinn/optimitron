import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  grantWishes: vi.fn(),
}));

vi.mock("@/lib/auth-utils", () => ({
  getCurrentUser: mocks.getCurrentUser,
}));

vi.mock("@/lib/wishes.server", () => ({
  grantWishes: mocks.grantWishes,
}));

import { POST } from "./route";

function makeRequest(body?: Record<string, unknown>) {
  return new Request("http://localhost/api/share/track", {
    method: "POST",
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

describe("POST /api/share/track", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.grantWishes.mockResolvedValue(null);
  });

  it("returns a no-op success when unauthenticated", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);

    const res = await POST(makeRequest({ templateLabel: "Impact-Focused" }));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      success: true,
      tracked: false,
      wishesEarned: 0,
    });
  });

  it("grants 1 wish on first share", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "user-1" });
    mocks.grantWishes.mockResolvedValue({ amount: 1 });

    const res = await POST(makeRequest({ templateLabel: "Impact-Focused" }));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ success: true, tracked: true, wishesEarned: 1 });
    expect(mocks.grantWishes).toHaveBeenCalledWith({
      userId: "user-1",
      reason: "SHARE_REPORT",
      amount: 1,
      dedupeKey: "share-user-1",
      metadata: { templateLabel: "Impact-Focused" },
    });
  });

  it("works with empty body", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "user-1" });
    mocks.grantWishes.mockResolvedValue({ amount: 1 });

    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(mocks.grantWishes).toHaveBeenCalledWith({
      userId: "user-1",
      reason: "SHARE_REPORT",
      amount: 1,
      dedupeKey: "share-user-1",
      metadata: undefined,
    });
  });

  it("returns 0 wishes when deduped", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "user-1" });
    mocks.grantWishes.mockResolvedValue(null);

    const res = await POST(makeRequest({ templateLabel: "The Math" }));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ success: true, tracked: true, wishesEarned: 0 });
  });
});

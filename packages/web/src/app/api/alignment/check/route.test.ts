import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  getPersonalAlignmentState: vi.fn(),
  grantWishes: vi.fn(),
  checkBadgesAfterWish: vi.fn(),
}));

vi.mock("@/lib/auth-utils", () => ({
  requireAuth: mocks.requireAuth,
}));

vi.mock("@/lib/alignment-report.server", () => ({
  getPersonalAlignmentState: mocks.getPersonalAlignmentState,
}));

vi.mock("@/lib/wishes.server", () => ({
  grantWishes: mocks.grantWishes,
}));

vi.mock("@/lib/badges.server", () => ({
  checkBadgesAfterWish: mocks.checkBadgesAfterWish,
}));

import { POST } from "./route";

describe("POST /api/alignment/check", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.grantWishes.mockResolvedValue(null);
    mocks.checkBadgesAfterWish.mockResolvedValue(undefined);
  });

  it("returns 401 when unauthenticated", async () => {
    mocks.requireAuth.mockRejectedValue(new Error("Unauthorized"));

    const res = await POST();

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns 400 when alignment state is not ready", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user-1" });
    mocks.getPersonalAlignmentState.mockResolvedValue({ status: "empty" });

    const res = await POST();

    expect(res.status).toBe(400);
    expect(mocks.grantWishes).not.toHaveBeenCalled();
  });

  it("grants 2 wishes when alignment is ready", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user-1" });
    mocks.getPersonalAlignmentState.mockResolvedValue({
      status: "ready",
      report: { topPriorities: [], ranking: [], politicians: [] },
    });
    mocks.grantWishes.mockResolvedValue({ amount: 2 });

    const res = await POST();

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ success: true, wishesEarned: 2 });
    expect(mocks.grantWishes).toHaveBeenCalledWith({
      userId: "user-1",
      reason: "ALIGNMENT_CHECK",
      amount: 2,
      dedupeKey: "alignment-user-1",
    });
    expect(mocks.checkBadgesAfterWish).toHaveBeenCalledWith("user-1", "ALIGNMENT_CHECK");
  });

  it("returns 0 wishes when already granted (dedup)", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user-1" });
    mocks.getPersonalAlignmentState.mockResolvedValue({
      status: "ready",
      report: { topPriorities: [], ranking: [], politicians: [] },
    });
    // grantWishes returns null when deduped (existing record found)
    mocks.grantWishes.mockResolvedValue(null);

    const res = await POST();

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ success: true, wishesEarned: 0 });
  });
});

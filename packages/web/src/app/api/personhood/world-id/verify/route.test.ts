import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  checkBadgesAfterWish: vi.fn(),
  grantWishes: vi.fn(),
  isPersonhoodExternalIdConflict: vi.fn(),
  isWorldIdConfigured: vi.fn(),
  requireAuth: vi.fn(),
  syncReferralPointMintsForVerifiedVoter: vi.fn(),
  verifyAndSaveWorldIdResult: vi.fn(),
}));

vi.mock("@/lib/auth-utils", () => ({
  requireAuth: mocks.requireAuth,
}));

vi.mock("@/lib/personhood.server", () => ({
  isPersonhoodExternalIdConflict: mocks.isPersonhoodExternalIdConflict,
}));

vi.mock("@/lib/world-id.server", () => ({
  isWorldIdConfigured: mocks.isWorldIdConfigured,
  verifyAndSaveWorldIdResult: mocks.verifyAndSaveWorldIdResult,
}));

vi.mock("@/lib/referral-point-mint.server", () => ({
  syncReferralPointMintsForVerifiedVoter:
    mocks.syncReferralPointMintsForVerifiedVoter,
}));

vi.mock("@/lib/wishes.server", () => ({
  grantWishes: mocks.grantWishes,
}));

vi.mock("@/lib/badges.server", () => ({
  checkBadgesAfterWish: mocks.checkBadgesAfterWish,
}));

import { POST } from "./route";

describe("world id verify route", () => {
  beforeEach(() => {
    mocks.checkBadgesAfterWish.mockReset();
    mocks.grantWishes.mockReset();
    mocks.isPersonhoodExternalIdConflict.mockReset();
    mocks.isWorldIdConfigured.mockReset();
    mocks.requireAuth.mockReset();
    mocks.syncReferralPointMintsForVerifiedVoter.mockReset();
    mocks.verifyAndSaveWorldIdResult.mockReset();
    mocks.isPersonhoodExternalIdConflict.mockReturnValue(false);
    mocks.grantWishes.mockResolvedValue({ amount: 10 });
    mocks.syncReferralPointMintsForVerifiedVoter.mockResolvedValue([]);
  });

  it("returns 401 when authentication fails", async () => {
    mocks.requireAuth.mockRejectedValue(new Error("Unauthorized"));

    const response = await POST(
      new Request("http://localhost/api/personhood/world-id/verify", {
        method: "POST",
        body: JSON.stringify({}),
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns 503 when personhood verification is not configured", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });
    mocks.isWorldIdConfigured.mockReturnValue(false);

    const response = await POST(
      new Request("http://localhost/api/personhood/world-id/verify", {
        method: "POST",
        body: JSON.stringify({}),
      }),
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ error: "Personhood verification is not configured." });
  });

  it("stores a verified proof for authenticated users", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });
    mocks.isWorldIdConfigured.mockReturnValue(true);
    mocks.verifyAndSaveWorldIdResult.mockResolvedValue({
      provider: "WORLD_ID",
      verificationLevel: "orb",
    });

    const response = await POST(
      new Request("http://localhost/api/personhood/world-id/verify", {
        method: "POST",
        body: JSON.stringify({ action: "verify-personhood" }),
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.verifyAndSaveWorldIdResult).toHaveBeenCalledWith("user_1", {
      action: "verify-personhood",
    });
    expect(mocks.syncReferralPointMintsForVerifiedVoter).toHaveBeenCalledWith(
      "user_1",
    );
    expect(mocks.grantWishes).toHaveBeenCalledWith({
      userId: "user_1",
      reason: "WORLD_ID_VERIFICATION",
      amount: 10,
    });
    expect(mocks.checkBadgesAfterWish).toHaveBeenCalledWith(
      "user_1",
      "WORLD_ID_VERIFICATION",
    );
    await expect(response.json()).resolves.toEqual({
      success: true,
      verification: {
        provider: "WORLD_ID",
        verificationLevel: "orb",
      },
      referralPointMintsQueued: 0,
      wishesEarned: 10,
    });
  });

  it("returns 409 when the proof is already linked elsewhere", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });
    mocks.isWorldIdConfigured.mockReturnValue(true);
    mocks.verifyAndSaveWorldIdResult.mockRejectedValue({ code: "P2002" });
    mocks.isPersonhoodExternalIdConflict.mockReturnValue(true);

    const response = await POST(
      new Request("http://localhost/api/personhood/world-id/verify", {
        method: "POST",
        body: JSON.stringify({ action: "verify-personhood" }),
      }),
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: "This proof is already linked to another account.",
    });
  });
});

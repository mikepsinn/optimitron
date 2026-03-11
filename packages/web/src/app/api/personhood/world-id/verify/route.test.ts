import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  isPersonhoodExternalIdConflict: vi.fn(),
  isWorldIdConfigured: vi.fn(),
  requireAuth: vi.fn(),
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

import { POST } from "./route";

describe("world id verify route", () => {
  beforeEach(() => {
    mocks.isPersonhoodExternalIdConflict.mockReset();
    mocks.isWorldIdConfigured.mockReset();
    mocks.requireAuth.mockReset();
    mocks.verifyAndSaveWorldIdResult.mockReset();
    mocks.isPersonhoodExternalIdConflict.mockReturnValue(false);
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

  it("returns 503 when World ID is not configured", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });
    mocks.isWorldIdConfigured.mockReturnValue(false);

    const response = await POST(
      new Request("http://localhost/api/personhood/world-id/verify", {
        method: "POST",
        body: JSON.stringify({}),
      }),
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ error: "World ID is not configured." });
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
    await expect(response.json()).resolves.toEqual({
      success: true,
      verification: {
        provider: "WORLD_ID",
        verificationLevel: "orb",
      },
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

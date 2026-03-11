import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createWorldIdRequestPayload: vi.fn(),
  isWorldIdConfigured: vi.fn(),
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/auth-utils", () => ({
  requireAuth: mocks.requireAuth,
}));

vi.mock("@/lib/world-id.server", () => ({
  createWorldIdRequestPayload: mocks.createWorldIdRequestPayload,
  isWorldIdConfigured: mocks.isWorldIdConfigured,
}));

import { GET } from "./route";

describe("world id request route", () => {
  beforeEach(() => {
    mocks.createWorldIdRequestPayload.mockReset();
    mocks.isWorldIdConfigured.mockReset();
    mocks.requireAuth.mockReset();
  });

  it("returns 401 when authentication fails", async () => {
    mocks.requireAuth.mockRejectedValue(new Error("Unauthorized"));

    const response = await GET();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns 503 when World ID is not configured", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });
    mocks.isWorldIdConfigured.mockReturnValue(false);

    const response = await GET();

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ error: "World ID is not configured." });
  });

  it("returns a signed request payload for authenticated users", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });
    mocks.isWorldIdConfigured.mockReturnValue(true);
    mocks.createWorldIdRequestPayload.mockReturnValue({
      app_id: "app_test",
      action: "verify-personhood",
      allow_legacy_proofs: true,
      environment: "staging",
      rp_context: {
        rp_id: "rp_test",
        nonce: "nonce_1",
        created_at: 1000,
        expires_at: 1300,
        signature: "sig_1",
      },
      signal: "personhood:user_1",
    });

    const response = await GET();

    expect(response.status).toBe(200);
    expect(mocks.createWorldIdRequestPayload).toHaveBeenCalledWith("user_1");
    await expect(response.json()).resolves.toEqual({
      app_id: "app_test",
      action: "verify-personhood",
      allow_legacy_proofs: true,
      environment: "staging",
      rp_context: {
        rp_id: "rp_test",
        nonce: "nonce_1",
        created_at: 1000,
        expires_at: 1300,
        signature: "sig_1",
      },
      signal: "personhood:user_1",
    });
  });
});

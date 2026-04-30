import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  applyPostSigninSync: vi.fn(),
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/auth-utils", () => ({
  requireAuth: mocks.requireAuth,
}));

vi.mock("@/lib/post-signin-sync.server", () => ({
  applyPostSigninSync: mocks.applyPostSigninSync,
}));

import { POST } from "./route";

describe("post-signin auth route", () => {
  beforeEach(() => {
    mocks.applyPostSigninSync.mockReset();
    mocks.requireAuth.mockReset();
  });

  it("returns 401 when authentication fails", async () => {
    mocks.requireAuth.mockRejectedValue(new Error("Unauthorized"));

    const response = await POST(
      new Request("http://localhost/api/auth/post-signin", {
        method: "POST",
        body: JSON.stringify({}),
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("syncs referral and profile data for authenticated users", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });
    mocks.applyPostSigninSync.mockResolvedValue({
      referralRecorded: true,
      userUpdated: true,
    });

    const response = await POST(
      new Request("http://localhost/api/auth/post-signin", {
        method: "POST",
        body: JSON.stringify({
          name: "Jane Doe",
          newsletterSubscribed: false,
          referralCode: "REF123",
          shareAttemptId: "sa_123",
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.applyPostSigninSync).toHaveBeenCalledWith({
      userId: "user_1",
      name: "Jane Doe",
      newsletterSubscribed: false,
      referralCode: "REF123",
      shareAttemptId: "sa_123",
      signupLandingUrl: null,
    });
    await expect(response.json()).resolves.toEqual({
      success: true,
      referralRecorded: true,
      userUpdated: true,
    });
  });
});

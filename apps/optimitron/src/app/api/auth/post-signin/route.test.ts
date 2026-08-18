import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  after: vi.fn(),
  applyPostSigninSync: vi.fn(),
  requireAuth: vi.fn(),
  seedNearbyFlyerHangTasksAfterSignin: vi.fn(),
}));

vi.mock("@/lib/auth-utils", () => ({
  requireAuth: mocks.requireAuth,
}));

vi.mock("@/lib/post-signin-sync.server", () => ({
  applyPostSigninSync: mocks.applyPostSigninSync,
  seedNearbyFlyerHangTasksAfterSignin: mocks.seedNearbyFlyerHangTasksAfterSignin,
}));

// after() only works inside a real Next.js request lifecycle; calling POST()
// directly (like every other route unit test in this repo) doesn't set that
// up, so after() itself is stubbed here. What matters for this test is that
// the flyer-hang seed is deferred via after() with the right args, not that
// after()'s own scheduling machinery runs.
vi.mock("next/server", async () => {
  const actual = await vi.importActual<typeof import("next/server")>(
    "next/server",
  );
  return { ...actual, after: mocks.after };
});

import { POST } from "./route";

describe("post-signin auth route", () => {
  beforeEach(() => {
    mocks.after.mockReset();
    mocks.applyPostSigninSync.mockReset();
    mocks.requireAuth.mockReset();
    mocks.seedNearbyFlyerHangTasksAfterSignin.mockReset();
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
      personId: "person_1",
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
      personId: "person_1",
      referralRecorded: true,
      userUpdated: true,
    });
    // Flyer-hang seeding is deferred via after(), not awaited inline —
    // it must not add Overpass's up-to-20s latency to every signin.
    expect(mocks.after).toHaveBeenCalledTimes(1);
    await mocks.after.mock.calls[0]?.[0]?.();
    expect(mocks.seedNearbyFlyerHangTasksAfterSignin).toHaveBeenCalledWith(
      "user_1",
      "person_1",
    );
  });

  it("treats an authenticated empty request body as no post-sign-in context", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });
    mocks.applyPostSigninSync.mockResolvedValue({
      personId: "person_1",
      referralRecorded: false,
      userUpdated: false,
    });

    const response = await POST(
      new Request("http://localhost/api/auth/post-signin", {
        method: "POST",
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.applyPostSigninSync).toHaveBeenCalledWith({
      userId: "user_1",
      name: null,
      newsletterSubscribed: undefined,
      referralCode: null,
      shareAttemptId: null,
      signupLandingUrl: null,
    });
    await expect(response.json()).resolves.toEqual({
      success: true,
      personId: "person_1",
      referralRecorded: false,
      userUpdated: false,
    });
  });
});

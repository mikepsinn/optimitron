import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  findUnique: vi.fn(),
  update: vi.fn(),
}));

vi.mock("@/lib/auth-utils", () => ({
  requireAuth: mocks.requireAuth,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: mocks.findUnique,
      update: mocks.update,
    },
  },
}));

import { GET, PATCH } from "./route";

describe("settings email preferences route", () => {
  beforeEach(() => {
    mocks.requireAuth.mockReset();
    mocks.findUnique.mockReset();
    mocks.update.mockReset();
  });

  it("normalizes legacy master opt-out state on GET", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });
    mocks.findUnique.mockResolvedValue({
      newsletterSubscribed: false,
      unsubscribedScopes: [],
    });

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      emailPreferences: {
        newsletterSubscribed: false,
        unsubscribedScopes: ["all"],
      },
    });
  });

  it("filters transactional scopes and persists the normalized state on PATCH", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });
    mocks.update.mockResolvedValue(null);

    const response = await PATCH(
      new Request("http://localhost/api/settings/email-preferences", {
        method: "PATCH",
        body: JSON.stringify({
          newsletterSubscribed: false,
          unsubscribedScopes: ["task_notifications", "magic_link", "referral_sequence"],
        }),
      }) as never,
    );

    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: "user_1" },
      data: {
        newsletterSubscribed: false,
        unsubscribedScopes: ["task_notifications", "all"],
      },
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      emailPreferences: {
        newsletterSubscribed: false,
        unsubscribedScopes: ["task_notifications", "all"],
      },
    });
  });
});

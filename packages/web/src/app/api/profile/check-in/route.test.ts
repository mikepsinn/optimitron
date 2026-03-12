import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  saveDailyCheckIn: vi.fn(),
}));

vi.mock("@/lib/auth-utils", () => ({
  requireAuth: mocks.requireAuth,
}));

vi.mock("@/lib/profile.server", () => ({
  saveDailyCheckIn: mocks.saveDailyCheckIn,
}));

import { POST } from "./route";

describe("profile daily check-in route", () => {
  beforeEach(() => {
    mocks.requireAuth.mockReset();
    mocks.saveDailyCheckIn.mockReset();
  });

  it("returns 401 when authentication fails", async () => {
    mocks.requireAuth.mockRejectedValue(new Error("Unauthorized"));

    const response = await POST(
      new Request("http://localhost/api/profile/check-in", {
        body: JSON.stringify({}),
        method: "POST",
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("saves the authenticated user's daily check-in", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });
    mocks.saveDailyCheckIn.mockResolvedValue({
      currentCheckIn: {
        date: "2026-03-11",
        happinessRating: 5,
        healthRating: 4,
        note: "Solid day.",
      },
      history: [],
      profile: {
        annualHouseholdIncomeUsd: null,
        birthYear: null,
        censusNotes: null,
        censusUpdatedAt: null,
        city: null,
        countryCode: null,
        educationLevel: null,
        employmentStatus: null,
        genderIdentity: null,
        householdSize: null,
        lastIncomeReportedAt: null,
        latitude: null,
        longitude: null,
        postalCode: null,
        regionCode: null,
        timeZone: null,
      },
    });

    const payload = {
      happinessRating: 5,
      healthRating: 4,
      note: "Solid day.",
    };

    const response = await POST(
      new Request("http://localhost/api/profile/check-in", {
        body: JSON.stringify(payload),
        method: "POST",
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.saveDailyCheckIn).toHaveBeenCalledWith("user_1", payload);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
    });
  });
});

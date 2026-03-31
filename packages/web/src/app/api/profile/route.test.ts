import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  saveProfileSnapshot: vi.fn(),
  grantWishes: vi.fn(),
}));

vi.mock("@/lib/auth-utils", () => ({
  requireAuth: mocks.requireAuth,
}));

vi.mock("@/lib/profile.server", () => ({
  saveProfileSnapshot: mocks.saveProfileSnapshot,
}));

vi.mock("@/lib/wishes.server", () => ({
  grantWishes: mocks.grantWishes,
}));

import { POST } from "./route";

describe("profile route", () => {
  beforeEach(() => {
    mocks.requireAuth.mockReset();
    mocks.saveProfileSnapshot.mockReset();
    mocks.grantWishes.mockReset();
    mocks.grantWishes.mockResolvedValue(null);
  });

  it("returns 401 when authentication fails", async () => {
    mocks.requireAuth.mockRejectedValue(new Error("Unauthorized"));

    const response = await POST(
      new Request("http://localhost/api/profile", {
        body: JSON.stringify({}),
        method: "POST",
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("saves the authenticated user's profile snapshot", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });
    mocks.saveProfileSnapshot.mockResolvedValue({
      currentCheckIn: {
        date: "2026-03-11",
        happinessRating: null,
        healthRating: null,
        note: null,
      },
      history: [],
      profile: {
        annualHouseholdIncomeUsd: 120000,
        birthYear: 1990,
        censusNotes: null,
        censusUpdatedAt: "2026-03-11T18:00:00.000Z",
        city: "Austin",
        countryCode: "US",
        educationLevel: "bachelors_degree",
        employmentStatus: "employed_full_time",
        genderIdentity: null,
        householdSize: 3,
        lastIncomeReportedAt: "2026-03-11T18:00:00.000Z",
        latitude: null,
        longitude: null,
        postalCode: null,
        regionCode: "US-TX",
        timeZone: "America/Chicago",
      },
    });

    const payload = {
      annualHouseholdIncomeUsd: 120000,
      city: "Austin",
      countryCode: "US",
      regionCode: "US-TX",
      timeZone: "America/Chicago",
    };

    const response = await POST(
      new Request("http://localhost/api/profile", {
        body: JSON.stringify(payload),
        method: "POST",
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.saveProfileSnapshot).toHaveBeenCalledWith("user_1", payload);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
    });
  });
});

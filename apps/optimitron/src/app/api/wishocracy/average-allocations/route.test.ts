import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getWishocracyCommunitySummary: vi.fn(),
}));

vi.mock("@/lib/wishocracy-community", () => ({
  getWishocracyCommunitySummary: mocks.getWishocracyCommunitySummary,
}));

import { GET } from "./route";

describe("wishocracy average allocations route", () => {
  beforeEach(() => {
    mocks.getWishocracyCommunitySummary.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("returns the shared community summary payload", async () => {
    mocks.getWishocracyCommunitySummary.mockResolvedValue({
      averageAllocations: {
        ADDICTION_TREATMENT: 55,
        PRAGMATIC_CLINICAL_TRIALS: 45,
      },
      totalUsers: 12,
      totalAllocations: 48,
      topCategories: [
        { categoryId: "ADDICTION_TREATMENT", percentage: 55 },
      ],
    });

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      averageAllocations: {
        ADDICTION_TREATMENT: 55,
        PRAGMATIC_CLINICAL_TRIALS: 45,
      },
      totalUsers: 12,
      totalAllocations: 48,
      topCategories: [{ categoryId: "ADDICTION_TREATMENT", percentage: 55 }],
    });
  });

  it("returns 500 when summary generation fails unexpectedly", async () => {
    mocks.getWishocracyCommunitySummary.mockRejectedValue(new Error("boom"));

    const response = await GET();

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Failed to fetch average allocations.",
    });
  });
});

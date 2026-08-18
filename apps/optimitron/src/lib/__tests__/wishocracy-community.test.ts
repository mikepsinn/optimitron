import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findManyVerifiedUsers: vi.fn(),
  findMany: vi.fn(),
  error: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    personhoodVerification: {
      findMany: mocks.findManyVerifiedUsers,
    },
    wishocraticAllocation: {
      findMany: mocks.findMany,
    },
  },
}));

vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    error: mocks.error,
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  }),
}));

import {
  buildWishocracyCommunitySummary,
  getWishocracyCommunitySummary,
  normalizeWishocraticAllocation,
} from "../wishocracy-community";

describe("wishocracy community helpers", () => {
  beforeEach(() => {
    mocks.findMany.mockReset();
    mocks.findManyVerifiedUsers.mockReset();
    mocks.error.mockReset();
    mocks.findManyVerifiedUsers.mockResolvedValue([]);
  });

  it("normalizes reversed comparison pairs", () => {
    expect(
      normalizeWishocraticAllocation({
        itemAId: "MILITARY_OPERATIONS",
        itemBId: "ADDICTION_TREATMENT",
        allocationA: 80,
        allocationB: 20,
      }),
    ).toEqual({
      itemAId: "ADDICTION_TREATMENT",
      itemBId: "MILITARY_OPERATIONS",
      allocationA: 20,
      allocationB: 80,
    });
  });

  it("dedupes each user to the latest saved pair before averaging", () => {
    const summary = buildWishocracyCommunitySummary([
      {
        userId: "user_1",
        itemAId: "ADDICTION_TREATMENT",
        itemBId: "MILITARY_OPERATIONS",
        allocationA: 40,
        allocationB: 60,
        updatedAt: new Date("2026-03-10T00:00:00.000Z"),
      },
      {
        userId: "user_1",
        itemAId: "MILITARY_OPERATIONS",
        itemBId: "ADDICTION_TREATMENT",
        allocationA: 70,
        allocationB: 30,
        updatedAt: new Date("2026-03-11T00:00:00.000Z"),
      },
      {
        userId: "user_2",
        itemAId: "ADDICTION_TREATMENT",
        itemBId: "MILITARY_OPERATIONS",
        allocationA: 100,
        allocationB: 0,
        updatedAt: new Date("2026-03-11T12:00:00.000Z"),
      },
      {
        userId: "user_3",
        itemAId: "NOT_A_CATEGORY",
        itemBId: "MILITARY_OPERATIONS",
        allocationA: 100,
        allocationB: 0,
        updatedAt: new Date("2026-03-11T12:00:00.000Z"),
      },
    ]);

    expect(summary.totalUsers).toBe(2);
    expect(summary.totalAllocations).toBe(2);
    expect(summary.averageAllocations.ADDICTION_TREATMENT).toBe(65);
    expect(summary.averageAllocations.MILITARY_OPERATIONS).toBe(35);
    expect(summary.topCategories[0]).toEqual({
      categoryId: "ADDICTION_TREATMENT",
      percentage: 65,
    });
  });

  it("returns an empty summary when the database query fails", async () => {
    mocks.findMany.mockRejectedValue(new Error("db unavailable"));

    await expect(getWishocracyCommunitySummary()).resolves.toEqual({
      averageAllocations: expect.any(Object),
      totalUsers: 0,
      verifiedUsers: 0,
      totalAllocations: 0,
      topCategories: [],
    });
    expect(mocks.error).toHaveBeenCalled();
  });
});

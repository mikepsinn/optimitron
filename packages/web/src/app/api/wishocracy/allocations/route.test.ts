import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  findMany: vi.fn(),
  deleteMany: vi.fn(),
  createMany: vi.fn(),
}));

vi.mock("@/lib/auth-utils", () => ({
  getCurrentUser: mocks.getCurrentUser,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    wishocraticAllocation: {
      findMany: mocks.findMany,
      deleteMany: mocks.deleteMany,
      createMany: mocks.createMany,
    },
  },
}));

vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  }),
}));

import { GET, PATCH } from "./route";

describe("wishocracy allocations route", () => {
  beforeEach(() => {
    mocks.getCurrentUser.mockReset();
    mocks.findMany.mockReset();
    mocks.deleteMany.mockReset();
    mocks.createMany.mockReset();
  });

  it("dedupes by pair and normalizes the latest saved orientation on GET", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "user_1" });
    mocks.findMany.mockResolvedValue([
      {
        categoryA: "ADDICTION_TREATMENT",
        categoryB: "MILITARY_OPERATIONS",
        allocationA: 40,
        allocationB: 60,
        updatedAt: new Date("2026-03-10T00:00:00.000Z"),
      },
      {
        categoryA: "MILITARY_OPERATIONS",
        categoryB: "ADDICTION_TREATMENT",
        allocationA: 70,
        allocationB: 30,
        updatedAt: new Date("2026-03-11T00:00:00.000Z"),
      },
    ]);

    const response = await GET();
    const body = (await response.json()) as { allocations: Array<Record<string, unknown>> };

    expect(body.allocations).toEqual([
      {
        categoryA: "ADDICTION_TREATMENT",
        categoryB: "MILITARY_OPERATIONS",
        allocationA: 30,
        allocationB: 70,
        timestamp: "2026-03-11T00:00:00.000Z",
      },
    ]);
  });

  it("returns 401 for unauthenticated PATCH requests", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);

    const response = await PATCH(
      new Request("http://localhost/api/wishocracy/allocations", {
        method: "PATCH",
        body: JSON.stringify({ updatedComparisons: [], deletedCategories: [] }),
      }),
    );

    expect(response.status).toBe(401);
    expect(mocks.createMany).not.toHaveBeenCalled();
  });

  it("normalizes reversed comparisons before recreating saved allocations", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "user_1" });

    const response = await PATCH(
      new Request("http://localhost/api/wishocracy/allocations", {
        method: "PATCH",
        body: JSON.stringify({
          updatedComparisons: [
            {
              categoryA: "MILITARY_OPERATIONS",
              categoryB: "ADDICTION_TREATMENT",
              allocationA: 75,
              allocationB: 25,
            },
          ],
          deletedCategories: [],
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.deleteMany).toHaveBeenCalledWith({
      where: {
        userId: "user_1",
        OR: [
          {
            categoryA: "ADDICTION_TREATMENT",
            categoryB: "MILITARY_OPERATIONS",
          },
          {
            categoryA: "MILITARY_OPERATIONS",
            categoryB: "ADDICTION_TREATMENT",
          },
        ],
      },
    });
    expect(mocks.createMany).toHaveBeenCalledWith({
      data: [
        {
          userId: "user_1",
          categoryA: "ADDICTION_TREATMENT",
          categoryB: "MILITARY_OPERATIONS",
          allocationA: 25,
          allocationB: 75,
        },
      ],
    });
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    wishocraticAllocation: {
      findMany: mocks.findMany,
    },
  },
}));

import { GET } from "./route";

describe("wishocracy average allocations route", () => {
  beforeEach(() => {
    mocks.findMany.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns zero allocations when there is no community data", async () => {
    mocks.findMany.mockResolvedValue([]);

    const response = await GET();
    const body = (await response.json()) as {
      averageAllocations: Record<string, number>;
      totalUsers: number;
    };

    expect(response.status).toBe(200);
    expect(body.totalUsers).toBe(0);
    expect(Object.values(body.averageAllocations).every((value) => value === 0)).toBe(true);
  });

  it("averages normalized user allocations across all users", async () => {
    mocks.findMany.mockResolvedValue([
      {
        userId: "user_1",
        categoryA: "PRAGMATIC_CLINICAL_TRIALS",
        categoryB: "MILITARY_OPERATIONS",
        allocationA: 100,
        allocationB: 0,
      },
      {
        userId: "user_2",
        categoryA: "PRAGMATIC_CLINICAL_TRIALS",
        categoryB: "MILITARY_OPERATIONS",
        allocationA: 0,
        allocationB: 100,
      },
    ]);

    const response = await GET();
    const body = (await response.json()) as {
      averageAllocations: Record<string, number>;
      totalUsers: number;
    };

    expect(response.status).toBe(200);
    expect(body.totalUsers).toBe(2);
    expect(body.averageAllocations.PRAGMATIC_CLINICAL_TRIALS).toBe(50);
    expect(body.averageAllocations.MILITARY_OPERATIONS).toBe(50);
    expect(body.averageAllocations.ADDICTION_TREATMENT).toBe(0);
  });

  it("returns 500 when the query fails", async () => {
    mocks.findMany.mockRejectedValue(new Error("db unavailable"));

    const response = await GET();

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Failed to fetch average allocations.",
    });
  });
});

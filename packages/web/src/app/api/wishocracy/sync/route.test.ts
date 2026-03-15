import { beforeEach, describe, expect, it, vi } from "vitest";
import { BUDGET_CATEGORIES } from "@/lib/wishocracy-data";

const mocks = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  categoryDeleteMany: vi.fn(),
  categoryCreateMany: vi.fn(),
  allocationDeleteMany: vi.fn(),
  allocationCreateMany: vi.fn(),
}));

vi.mock("@/lib/auth-utils", () => ({
  requireAuth: mocks.requireAuth,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    wishocraticCategorySelection: {
      deleteMany: mocks.categoryDeleteMany,
      createMany: mocks.categoryCreateMany,
    },
    wishocraticAllocation: {
      deleteMany: mocks.allocationDeleteMany,
      createMany: mocks.allocationCreateMany,
    },
  },
}));

import { POST } from "./route";

describe("wishocracy sync route", () => {
  beforeEach(() => {
    mocks.requireAuth.mockReset();
    mocks.categoryDeleteMany.mockReset();
    mocks.categoryCreateMany.mockReset();
    mocks.allocationDeleteMany.mockReset();
    mocks.allocationCreateMany.mockReset();
  });

  it("returns 401 when authentication fails", async () => {
    mocks.requireAuth.mockRejectedValue(new Error("Unauthorized"));

    const response = await POST(
      new Request("http://localhost/api/wishocracy/sync", {
        method: "POST",
        body: JSON.stringify({ comparisons: [], selectedCategories: [] }),
      }) as never,
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("rejects empty sync payloads", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });

    const response = await POST(
      new Request("http://localhost/api/wishocracy/sync", {
        method: "POST",
        body: JSON.stringify({ comparisons: [], selectedCategories: [] }),
      }) as never,
    );

    expect(response.status).toBe(400);
    expect(mocks.categoryCreateMany).not.toHaveBeenCalled();
    expect(mocks.allocationCreateMany).not.toHaveBeenCalled();
  });

  it("rejects invalid allocation totals", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });

    const response = await POST(
      new Request("http://localhost/api/wishocracy/sync", {
        method: "POST",
        body: JSON.stringify({
          comparisons: [
            {
              itemAId: "PRAGMATIC_CLINICAL_TRIALS",
              itemBId: "MILITARY_OPERATIONS",
              allocationA: 80,
              allocationB: 30,
              timestamp: "2026-03-11T00:00:00.000Z",
            },
          ],
        }),
      }) as never,
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Allocations must reference valid categories and sum to 100 or 0.",
    });
    expect(mocks.allocationCreateMany).not.toHaveBeenCalled();
  });

  it("syncs selections and normalized comparisons", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });
    mocks.categoryCreateMany.mockResolvedValue({
      count: Object.keys(BUDGET_CATEGORIES).length,
    });
    mocks.allocationCreateMany.mockResolvedValue({
      count: 1,
    });

    const response = await POST(
      new Request("http://localhost/api/wishocracy/sync", {
        method: "POST",
        body: JSON.stringify({
          selectedCategories: [
            "ADDICTION_TREATMENT",
            "MILITARY_OPERATIONS",
          ],
          comparisons: [
            {
              itemAId: "MILITARY_OPERATIONS",
              itemBId: "ADDICTION_TREATMENT",
              allocationA: 75,
              allocationB: 25,
              timestamp: "2026-03-11T00:00:00.000Z",
            },
          ],
        }),
      }) as never,
    );

    const body = (await response.json()) as {
      finalAllocations: Record<string, number>;
      success: boolean;
      syncedComparisons: number;
      syncedSelections: number;
    };

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.syncedSelections).toBe(2);
    expect(body.syncedComparisons).toBe(1);
    expect(body.finalAllocations.ADDICTION_TREATMENT).toBe(25);
    expect(body.finalAllocations.MILITARY_OPERATIONS).toBe(75);
    expect(mocks.categoryDeleteMany).toHaveBeenCalledWith({
      where: { userId: "user_1" },
    });
    expect(mocks.categoryCreateMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        {
          userId: "user_1",
          itemId: "ADDICTION_TREATMENT",
          selected: true,
        },
        {
          userId: "user_1",
          itemId: "PRAGMATIC_CLINICAL_TRIALS",
          selected: false,
        },
      ]),
    });
    expect(mocks.allocationDeleteMany).toHaveBeenCalledWith({
      where: { userId: "user_1" },
    });
    expect(mocks.allocationCreateMany).toHaveBeenCalledWith({
      data: [
        {
          userId: "user_1",
          itemAId: "ADDICTION_TREATMENT",
          itemBId: "MILITARY_OPERATIONS",
          allocationA: 25,
          allocationB: 75,
        },
      ],
    });
  });

  it("supports category-only syncs without writing allocations", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });
    mocks.categoryCreateMany.mockResolvedValue({
      count: Object.keys(BUDGET_CATEGORIES).length,
    });

    const response = await POST(
      new Request("http://localhost/api/wishocracy/sync", {
        method: "POST",
        body: JSON.stringify({
          selectedCategories: ["PRAGMATIC_CLINICAL_TRIALS"],
        }),
      }) as never,
    );

    const body = (await response.json()) as {
      finalAllocations: Record<string, number>;
      syncedComparisons: number;
      syncedSelections: number;
    };

    expect(response.status).toBe(200);
    expect(body.syncedSelections).toBe(1);
    expect(body.syncedComparisons).toBe(0);
    expect(body.finalAllocations).toEqual({});
    expect(mocks.allocationDeleteMany).not.toHaveBeenCalled();
    expect(mocks.allocationCreateMany).not.toHaveBeenCalled();
  });
});

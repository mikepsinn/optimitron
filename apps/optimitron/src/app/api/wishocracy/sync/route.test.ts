import { beforeEach, describe, expect, it, vi } from "vitest";
import { WISHOCRATIC_ITEMS } from "@/lib/wishocracy-data";

const mocks = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  ensureWishocraticItemsExist: vi.fn(),
  inclusionDeleteMany: vi.fn(),
  inclusionCreateMany: vi.fn(),
  allocationDeleteMany: vi.fn(),
  allocationCreateMany: vi.fn(),
}));

vi.mock("@/lib/auth-utils", () => ({
  requireAuth: mocks.requireAuth,
}));

vi.mock("@/lib/env", () => ({
  serverEnv: { WISHOCRACY_JURISDICTION_KEY: undefined },
}));

vi.mock("@optimitron/storage", () => ({
  importKey: vi.fn().mockResolvedValue("mock-key"),
  encryptJson: vi.fn().mockResolvedValue({
    ciphertext: "mock-ciphertext",
    iv: "mock-iv",
    algorithm: "AES-GCM-256",
  }),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    wishocraticItemInclusion: {
      deleteMany: mocks.inclusionDeleteMany,
      createMany: mocks.inclusionCreateMany,
    },
    wishocraticAllocation: {
      deleteMany: mocks.allocationDeleteMany,
      createMany: mocks.allocationCreateMany,
    },
  },
}));

vi.mock("@/lib/wishocracy-catalog.server", () => ({
  ensureWishocraticItemsExist: mocks.ensureWishocraticItemsExist,
}));

import { POST } from "./route";

describe("wishocracy sync route", () => {
  beforeEach(() => {
    mocks.requireAuth.mockReset();
    mocks.ensureWishocraticItemsExist.mockReset();
    mocks.ensureWishocraticItemsExist.mockResolvedValue(undefined);
    mocks.inclusionDeleteMany.mockReset();
    mocks.inclusionCreateMany.mockReset();
    mocks.allocationDeleteMany.mockReset();
    mocks.allocationCreateMany.mockReset();
  });

  it("returns 401 when authentication fails", async () => {
    mocks.requireAuth.mockRejectedValue(new Error("Unauthorized"));

    const response = await POST(
      new Request("http://localhost/api/wishocracy/sync", {
        method: "POST",
        body: JSON.stringify({ comparisons: [], includedItemIds: [] }),
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
        body: JSON.stringify({ comparisons: [], includedItemIds: [] }),
      }) as never,
    );

    expect(response.status).toBe(400);
    expect(mocks.inclusionCreateMany).not.toHaveBeenCalled();
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
      error: "Allocations must reference valid items and sum to 100 or 0.",
    });
    expect(mocks.allocationCreateMany).not.toHaveBeenCalled();
  });

  it("syncs inclusions and normalized comparisons", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });
    mocks.inclusionCreateMany.mockResolvedValue({
      count: Object.keys(WISHOCRATIC_ITEMS).length,
    });
    mocks.allocationCreateMany.mockResolvedValue({
      count: 1,
    });

    const response = await POST(
      new Request("http://localhost/api/wishocracy/sync", {
        method: "POST",
        body: JSON.stringify({
          includedItemIds: [
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
      syncedAllocations: number;
      syncedInclusions: number;
    };

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.syncedInclusions ?? body.syncedAllocations).toBeDefined();
    expect(body.syncedAllocations).toBe(1);
    expect(body.finalAllocations.ADDICTION_TREATMENT).toBe(25);
    expect(body.finalAllocations.MILITARY_OPERATIONS).toBe(75);
    expect(mocks.inclusionDeleteMany).toHaveBeenCalledWith({
      where: { userId: "user_1" },
    });
    expect(mocks.ensureWishocraticItemsExist).toHaveBeenNthCalledWith(
      1,
      Object.keys(WISHOCRATIC_ITEMS),
    );
    expect(mocks.ensureWishocraticItemsExist).toHaveBeenNthCalledWith(2, [
      "ADDICTION_TREATMENT",
      "MILITARY_OPERATIONS",
    ]);
    expect(mocks.inclusionCreateMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        {
          userId: "user_1",
          itemId: "ADDICTION_TREATMENT",
          included: true,
        },
        {
          userId: "user_1",
          itemId: "PRAGMATIC_CLINICAL_TRIALS",
          included: false,
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

  it("supports inclusion-only syncs without writing allocations", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });
    mocks.inclusionCreateMany.mockResolvedValue({
      count: Object.keys(WISHOCRATIC_ITEMS).length,
    });

    const response = await POST(
      new Request("http://localhost/api/wishocracy/sync", {
        method: "POST",
        body: JSON.stringify({
          includedItemIds: ["PRAGMATIC_CLINICAL_TRIALS"],
        }),
      }) as never,
    );

    const body = (await response.json()) as {
      finalAllocations: Record<string, number>;
      syncedAllocations: number;
    };

    expect(response.status).toBe(200);
    expect(body.syncedAllocations).toBe(0);
    expect(body.finalAllocations).toEqual({});
    expect(mocks.ensureWishocraticItemsExist).toHaveBeenCalledWith(
      Object.keys(WISHOCRATIC_ITEMS),
    );
    expect(mocks.allocationDeleteMany).not.toHaveBeenCalled();
    expect(mocks.allocationCreateMany).not.toHaveBeenCalled();
  });
});

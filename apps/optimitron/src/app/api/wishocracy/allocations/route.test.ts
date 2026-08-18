import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  requireAuth: vi.fn(),
  getCurrentUser: vi.fn(),
  ensureWishocraticItemsExist: vi.fn(),
  grantWishes: vi.fn(),
  checkBadgesAfterWish: vi.fn(),
  findFirst: vi.fn(),
  findMany: vi.fn(),
  update: vi.fn(),
  create: vi.fn(),
  deleteMany: vi.fn(),
  createMany: vi.fn(),
}));

vi.mock("next-auth", () => ({
  getServerSession: mocks.getServerSession,
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/auth-utils", () => ({
  requireAuth: mocks.requireAuth,
  getCurrentUser: mocks.getCurrentUser,
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
    wishocraticAllocation: {
      findFirst: mocks.findFirst,
      findMany: mocks.findMany,
      update: mocks.update,
      create: mocks.create,
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

vi.mock("@/lib/wishocracy-catalog.server", () => ({
  ensureWishocraticItemsExist: mocks.ensureWishocraticItemsExist,
}));

vi.mock("@/lib/wishes.server", () => ({
  grantWishes: mocks.grantWishes,
}));

vi.mock("@/lib/badges.server", () => ({
  checkBadgesAfterWish: mocks.checkBadgesAfterWish,
}));

import { GET, POST, PATCH } from "./route";

describe("wishocracy allocations route", () => {
  beforeEach(() => {
    mocks.getServerSession.mockReset();
    mocks.requireAuth.mockReset();
    mocks.getCurrentUser.mockReset();
    mocks.ensureWishocraticItemsExist.mockReset();
    mocks.ensureWishocraticItemsExist.mockResolvedValue(undefined);
    mocks.grantWishes.mockReset();
    mocks.grantWishes.mockResolvedValue(null);
    mocks.checkBadgesAfterWish.mockReset();
    mocks.findFirst.mockReset();
    mocks.findMany.mockReset();
    mocks.update.mockReset();
    mocks.create.mockReset();
    mocks.deleteMany.mockReset();
    mocks.createMany.mockReset();
  });

  it("dedupes by pair and normalizes the latest saved orientation on GET", async () => {
    mocks.getServerSession.mockResolvedValue({ user: { id: "user_1" } });
    mocks.findMany.mockResolvedValue([
      {
        itemAId: "ADDICTION_TREATMENT",
        itemBId: "MILITARY_OPERATIONS",
        allocationA: 40,
        allocationB: 60,
        updatedAt: new Date("2026-03-10T00:00:00.000Z"),
      },
      {
        itemAId: "MILITARY_OPERATIONS",
        itemBId: "ADDICTION_TREATMENT",
        allocationA: 70,
        allocationB: 30,
        updatedAt: new Date("2026-03-11T00:00:00.000Z"),
      },
    ]);

    const response = await GET();
    const body = (await response.json()) as { allocations: Array<Record<string, unknown>> };

    expect(body.allocations).toEqual([
      {
        itemAId: "ADDICTION_TREATMENT",
        itemBId: "MILITARY_OPERATIONS",
        allocationA: 30,
        allocationB: 70,
        timestamp: "2026-03-11T00:00:00.000Z",
      },
    ]);
  });

  it("returns 401 when POST authentication fails", async () => {
    mocks.requireAuth.mockRejectedValue(new Error("Unauthorized"));

    const response = await POST(
      new Request("http://localhost/api/wishocracy/allocations", {
        method: "POST",
        body: JSON.stringify({}),
      }) as never,
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("rejects invalid allocation totals on POST", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });

    const response = await POST(
      new Request("http://localhost/api/wishocracy/allocations", {
        method: "POST",
        body: JSON.stringify({
          itemAId: "MILITARY_OPERATIONS",
          itemBId: "ADDICTION_TREATMENT",
          allocationA: 80,
          allocationB: 30,
        }),
      }) as never,
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Allocations must reference valid items and sum to 100 or 0.",
    });
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("normalizes reversed category pairs before creating allocations on POST", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });
    mocks.findFirst.mockResolvedValue(null);

    const response = await POST(
      new Request("http://localhost/api/wishocracy/allocations", {
        method: "POST",
        body: JSON.stringify({
          itemAId: "MILITARY_OPERATIONS",
          itemBId: "ADDICTION_TREATMENT",
          allocationA: 80,
          allocationB: 20,
        }),
      }) as never,
    );

    expect(response.status).toBe(200);
    expect(mocks.ensureWishocraticItemsExist).toHaveBeenCalledWith([
      "ADDICTION_TREATMENT",
      "MILITARY_OPERATIONS",
    ]);
    expect(mocks.findFirst).toHaveBeenCalledWith({
      where: {
        userId: "user_1",
        itemAId: "ADDICTION_TREATMENT",
        itemBId: "MILITARY_OPERATIONS",
      },
    });
    expect(mocks.create).toHaveBeenCalledWith({
      data: {
        userId: "user_1",
        itemAId: "ADDICTION_TREATMENT",
        itemBId: "MILITARY_OPERATIONS",
        allocationA: 20,
        allocationB: 80,
      },
    });
    expect(mocks.grantWishes).toHaveBeenCalledWith({
      userId: "user_1",
      reason: "WISHOCRATIC_ALLOCATION",
      amount: 2,
    });
  });

  it("returns 401 for unauthenticated PATCH requests", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);

    const response = await PATCH(
      new Request("http://localhost/api/wishocracy/allocations", {
        method: "PATCH",
        body: JSON.stringify({ updatedAllocations: [], deletedItemIds: [] }),
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
          updatedAllocations: [
            {
              itemAId: "MILITARY_OPERATIONS",
              itemBId: "ADDICTION_TREATMENT",
              allocationA: 75,
              allocationB: 25,
            },
          ],
          deletedItemIds: [],
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.ensureWishocraticItemsExist).toHaveBeenCalledWith([
      "ADDICTION_TREATMENT",
      "MILITARY_OPERATIONS",
    ]);
    expect(mocks.deleteMany).toHaveBeenCalledWith({
      where: {
        userId: "user_1",
        OR: [
          {
            itemAId: "ADDICTION_TREATMENT",
            itemBId: "MILITARY_OPERATIONS",
          },
          {
            itemAId: "MILITARY_OPERATIONS",
            itemBId: "ADDICTION_TREATMENT",
          },
        ],
      },
    });
    expect(mocks.createMany).toHaveBeenCalledWith({
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
});

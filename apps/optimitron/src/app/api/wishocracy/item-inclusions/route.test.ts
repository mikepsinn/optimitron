import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  ensureWishocraticItemsExist: vi.fn(),
  upsert: vi.fn(),
  findMany: vi.fn(),
  deleteMany: vi.fn(),
}));

vi.mock("@/lib/auth-utils", () => ({
  requireAuth: mocks.requireAuth,
}));

vi.mock("@/lib/wishocracy-catalog.server", () => ({
  ensureWishocraticItemsExist: mocks.ensureWishocraticItemsExist,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    wishocraticItemInclusion: {
      upsert: mocks.upsert,
      findMany: mocks.findMany,
      deleteMany: mocks.deleteMany,
    },
  },
}));

import { DELETE, GET, POST } from "./route";

describe("wishocracy item inclusions route", () => {
  beforeEach(() => {
    mocks.requireAuth.mockReset();
    mocks.ensureWishocraticItemsExist.mockReset();
    mocks.ensureWishocraticItemsExist.mockResolvedValue(undefined);
    mocks.upsert.mockReset();
    mocks.findMany.mockReset();
    mocks.deleteMany.mockReset();
  });

  it("rejects invalid item ids", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });

    const response = await POST(
      new Request("http://localhost/api/wishocracy/item-inclusions", {
        method: "POST",
        body: JSON.stringify({
          inclusions: [{ itemId: "NOT_REAL_ITEM", included: true }],
        }),
      }) as never,
    );

    expect(response.status).toBe(400);
    expect(mocks.ensureWishocraticItemsExist).not.toHaveBeenCalled();
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it("ensures missing catalog items exist before saving valid inclusions", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });
    mocks.upsert.mockResolvedValue({});

    const response = await POST(
      new Request("http://localhost/api/wishocracy/item-inclusions", {
        method: "POST",
        body: JSON.stringify({
          inclusions: [
            { itemId: "PRAGMATIC_CLINICAL_TRIALS", included: true },
            { itemId: "MILITARY_OPERATIONS", included: false },
          ],
        }),
      }) as never,
    );

    expect(response.status).toBe(200);
    expect(mocks.ensureWishocraticItemsExist).toHaveBeenCalledWith([
      "PRAGMATIC_CLINICAL_TRIALS",
      "MILITARY_OPERATIONS",
    ]);
    expect(mocks.upsert).toHaveBeenCalledTimes(2);
  });

  it("loads and clears saved inclusions for authenticated users", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });
    mocks.findMany.mockResolvedValue([{ itemId: "MILITARY_OPERATIONS", included: true }]);

    const getResponse = await GET();
    await expect(getResponse.json()).resolves.toEqual({
      inclusions: [{ itemId: "MILITARY_OPERATIONS", included: true }],
    });

    const deleteResponse = await DELETE();
    await expect(deleteResponse.json()).resolves.toEqual({ success: true });
    expect(mocks.deleteMany).toHaveBeenCalledWith({ where: { userId: "user_1" } });
  });
});

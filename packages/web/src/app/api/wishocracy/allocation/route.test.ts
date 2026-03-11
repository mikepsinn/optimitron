import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  findFirst: vi.fn(),
  update: vi.fn(),
  create: vi.fn(),
}));

vi.mock("@/lib/auth-utils", () => ({
  requireAuth: mocks.requireAuth,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    wishocraticAllocation: {
      findFirst: mocks.findFirst,
      update: mocks.update,
      create: mocks.create,
    },
  },
}));

import { POST } from "./route";

describe("wishocracy allocation route", () => {
  beforeEach(() => {
    mocks.requireAuth.mockReset();
    mocks.findFirst.mockReset();
    mocks.update.mockReset();
    mocks.create.mockReset();
  });

  it("returns 401 when authentication fails", async () => {
    mocks.requireAuth.mockRejectedValue(new Error("Unauthorized"));

    const response = await POST(
      new Request("http://localhost/api/wishocracy/allocation", {
        method: "POST",
        body: JSON.stringify({}),
      }) as never,
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("rejects invalid allocation totals", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });

    const response = await POST(
      new Request("http://localhost/api/wishocracy/allocation", {
        method: "POST",
        body: JSON.stringify({
          categoryA: "MILITARY_OPERATIONS",
          categoryB: "ADDICTION_TREATMENT",
          allocationA: 80,
          allocationB: 30,
        }),
      }) as never,
    );

    expect(response.status).toBe(400);
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("normalizes reversed category pairs before creating allocations", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });
    mocks.findFirst.mockResolvedValue(null);

    const response = await POST(
      new Request("http://localhost/api/wishocracy/allocation", {
        method: "POST",
        body: JSON.stringify({
          categoryA: "MILITARY_OPERATIONS",
          categoryB: "ADDICTION_TREATMENT",
          allocationA: 80,
          allocationB: 20,
        }),
      }) as never,
    );

    expect(response.status).toBe(200);
    expect(mocks.findFirst).toHaveBeenCalledWith({
      where: {
        userId: "user_1",
        categoryA: "ADDICTION_TREATMENT",
        categoryB: "MILITARY_OPERATIONS",
      },
    });
    expect(mocks.create).toHaveBeenCalledWith({
      data: {
        userId: "user_1",
        categoryA: "ADDICTION_TREATMENT",
        categoryB: "MILITARY_OPERATIONS",
        allocationA: 20,
        allocationB: 80,
      },
    });
  });
});

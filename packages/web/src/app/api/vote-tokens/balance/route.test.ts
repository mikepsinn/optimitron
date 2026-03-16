import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  findMany: vi.fn(),
}));

vi.mock("@/lib/auth-utils", () => ({
  requireAuth: mocks.requireAuth,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    voteTokenMint: { findMany: mocks.findMany },
  },
}));

import { GET } from "./route";

describe("GET /api/vote-tokens/balance", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    mocks.requireAuth.mockRejectedValue(new Error("Unauthorized"));

    const res = await GET();

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns empty balance when user has no mints", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });
    mocks.findMany.mockResolvedValue([]);

    const res = await GET();

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.totalVotes).toBe(0);
    expect(data.totalBalance).toBe("0");
    expect(data.mints).toEqual([]);
  });

  it("sums only CONFIRMED mints for totalBalance", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });
    mocks.findMany.mockResolvedValue([
      {
        id: "mint_1",
        referendumId: "ref_1",
        walletAddress: "0xabc",
        amount: "1000000000000000000",
        txHash: "0x123",
        chainId: 84532,
        status: "CONFIRMED",
        createdAt: new Date().toISOString(),
        referendum: { title: "Test Ref", slug: "test-ref" },
      },
      {
        id: "mint_2",
        referendumId: "ref_2",
        walletAddress: "0xabc",
        amount: "1000000000000000000",
        txHash: null,
        chainId: 84532,
        status: "PENDING",
        createdAt: new Date().toISOString(),
        referendum: { title: "Test Ref 2", slug: "test-ref-2" },
      },
      {
        id: "mint_3",
        referendumId: "ref_3",
        walletAddress: "0xabc",
        amount: "1000000000000000000",
        txHash: "0x456",
        chainId: 84532,
        status: "CONFIRMED",
        createdAt: new Date().toISOString(),
        referendum: { title: "Test Ref 3", slug: "test-ref-3" },
      },
    ]);

    const res = await GET();

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.totalVotes).toBe(2);
    expect(data.totalBalance).toBe("2000000000000000000");
    expect(data.mints).toHaveLength(3);
  });

  it("queries mints for the authenticated user", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_42" });
    mocks.findMany.mockResolvedValue([]);

    await GET();

    expect(mocks.findMany).toHaveBeenCalledWith({
      where: { userId: "user_42", deletedAt: null },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        referendumId: true,
        walletAddress: true,
        amount: true,
        txHash: true,
        chainId: true,
        status: true,
        createdAt: true,
        referendum: { select: { title: true, slug: true } },
      },
    });
  });
});

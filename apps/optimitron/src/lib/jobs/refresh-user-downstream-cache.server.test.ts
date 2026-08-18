import { describe, expect, it, vi } from "vitest";
import {
  computeDownstreamCacheFromReferralEdges,
  type DownstreamCacheClient,
  normalizeDownstreamCacheRows,
  refreshUserDownstreamCache,
} from "./refresh-user-downstream-cache.server";

describe("computeDownstreamCacheFromReferralEdges", () => {
  it("counts converted employees through the full referral tree", () => {
    const summaries = computeDownstreamCacheFromReferralEdges([
      { referrerUserId: "root", convertedUserId: "a" },
      { referrerUserId: "root", convertedUserId: "b" },
      { referrerUserId: "a", convertedUserId: "c" },
      { referrerUserId: "c", convertedUserId: "d" },
      { referrerUserId: "other", convertedUserId: "x" },
    ]);

    expect(summaries.get("root")).toEqual({
      downstreamConversionCount: 4,
      userId: "root",
    });
    expect(summaries.get("a")).toEqual({
      downstreamConversionCount: 2,
      userId: "a",
    });
    expect(summaries.get("other")).toEqual({
      downstreamConversionCount: 1,
      userId: "other",
    });
  });

  it("guards cycles instead of looping forever or counting the root as downstream", () => {
    const summaries = computeDownstreamCacheFromReferralEdges([
      { referrerUserId: "a", convertedUserId: "b" },
      { referrerUserId: "b", convertedUserId: "c" },
      { referrerUserId: "c", convertedUserId: "a" },
    ]);

    expect(summaries.get("a")).toEqual({
      downstreamConversionCount: 2,
      userId: "a",
    });
  });
});

describe("refreshUserDownstreamCache", () => {
  it("normalizes bigint SQL counts before writing cached User columns", async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 3 });
    const update = vi.fn().mockResolvedValue({});
    const db: DownstreamCacheClient = {
      async $queryRaw<T = unknown>(): Promise<T> {
        return [
          {
            userId: "root",
            downstreamConversionCount: 4n,
          },
        ] as T;
      },
      $transaction: async (callback) => callback({ user: { update, updateMany } }),
    };

    const result = await refreshUserDownstreamCache({ prismaClient: db });

    expect(result).toEqual({ refreshedUsers: 1, resetUsers: 3 });
    expect(updateMany).toHaveBeenCalledWith({
      data: {
        downstreamConversionCount: 0,
      },
      where: { deletedAt: null },
    });
    expect(update).toHaveBeenCalledWith({
      data: {
        downstreamConversionCount: 4,
      },
      where: { id: "root" },
    });
  });
});

describe("normalizeDownstreamCacheRows", () => {
  it("drops rows without usable user ids", () => {
    expect(
      normalizeDownstreamCacheRows([
        { userId: "", downstreamConversionCount: 1n },
        { userId: "u1", downstreamConversionCount: 2n },
      ]),
    ).toEqual([
      {
        downstreamConversionCount: 2,
        userId: "u1",
      },
    ]);
  });
});

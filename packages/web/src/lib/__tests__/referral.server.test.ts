import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findFirst: vi.fn(),
  count: vi.fn(),
  create: vi.fn(),
  findUnique: vi.fn(),
  groupBy: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findFirst: mocks.findFirst },
    referral: {
      count: mocks.count,
      create: mocks.create,
      findUnique: mocks.findUnique,
      groupBy: mocks.groupBy,
    },
  },
}));

import {
  findUserByUsernameOrReferralCode,
  getReferralCountsByUserIds,
  getReferralVoteCount,
  recordReferralAttributionForUser,
} from "../referral.server";

describe("referral server helpers", () => {
  beforeEach(() => {
    mocks.findFirst.mockReset();
    mocks.count.mockReset();
    mocks.create.mockReset();
    mocks.findUnique.mockReset();
    mocks.groupBy.mockReset();
  });

  it("skips database lookup for blank identifiers", async () => {
    await expect(findUserByUsernameOrReferralCode("   ")).resolves.toBeNull();
    expect(mocks.findFirst).not.toHaveBeenCalled();
  });

  it("uses case-insensitive referral and username lookup", async () => {
    mocks.findFirst.mockResolvedValue({ id: "user_1" });

    await findUserByUsernameOrReferralCode(" ReF123 ");

    expect(mocks.findFirst).toHaveBeenCalledWith({
      where: {
        OR: [
          {
            referralCode: {
              equals: "ReF123",
              mode: "insensitive",
            },
          },
          {
            username: {
              equals: "ReF123",
              mode: "insensitive",
            },
          },
        ],
      },
    });
  });

  it("counts referral votes by referrer id", async () => {
    mocks.count.mockResolvedValue(4);

    await expect(getReferralVoteCount("user_9")).resolves.toBe(4);
    expect(mocks.count).toHaveBeenCalledWith({
      where: { referredByUserId: "user_9" },
    });
  });

  it("records referral attribution when the user has no vote yet", async () => {
    mocks.findFirst.mockResolvedValue({ id: "user_referrer" });
    mocks.findUnique.mockResolvedValue(null);

    await expect(recordReferralAttributionForUser("user_new", "REF123")).resolves.toBe(true);
    expect(mocks.create).toHaveBeenCalledWith({
      data: {
        userId: "user_new",
        answer: "YES",
        referredByUserId: "user_referrer",
      },
    });
  });

  it("skips referral attribution when the user already has a vote", async () => {
    mocks.findFirst.mockResolvedValue({ id: "user_referrer" });
    mocks.findUnique.mockResolvedValue({ id: "vote_1" });

    await expect(recordReferralAttributionForUser("user_new", "REF123")).resolves.toBe(false);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("groups referral counts by referrer id", async () => {
    mocks.groupBy.mockResolvedValue([
      {
        referredByUserId: "user_1",
        _count: { _all: 2 },
      },
      {
        referredByUserId: "user_2",
        _count: { _all: 5 },
      },
    ]);

    const counts = await getReferralCountsByUserIds(["user_1", "user_2"]);

    expect(mocks.groupBy).toHaveBeenCalledWith({
      by: ["referredByUserId"],
      where: {
        referredByUserId: { in: ["user_1", "user_2"] },
        deletedAt: null,
      },
      _count: {
        _all: true,
      },
    });
    expect(counts.get("user_1")).toBe(2);
    expect(counts.get("user_2")).toBe(5);
  });
});

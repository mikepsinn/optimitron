import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findFirst: vi.fn(),
  count: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findFirst: mocks.findFirst },
    vote: { count: mocks.count },
  },
}));

import {
  findUserByUsernameOrReferralCode,
  getReferralVoteCount,
} from "../referral.server";

describe("referral server helpers", () => {
  beforeEach(() => {
    mocks.findFirst.mockReset();
    mocks.count.mockReset();
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
});

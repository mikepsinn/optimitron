import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    badge: {
      createMany: vi.fn(),
    },
    wishocraticAllocation: {
      count: vi.fn(),
    },
    referral: {
      count: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import { awardBadge, checkBadgesAfterWish } from "../badges.server";

describe("awardBadge", () => {
  it("returns true when a badge row is inserted", async () => {
    vi.mocked(prisma.badge.createMany).mockResolvedValueOnce({ count: 1 } as never);

    await expect(awardBadge("user-1", "FIRST_COMPARISON")).resolves.toBe(true);
  });

  it("returns false when the badge already exists", async () => {
    vi.mocked(prisma.badge.createMany).mockResolvedValueOnce({ count: 0 } as never);

    await expect(awardBadge("user-1", "FIRST_COMPARISON")).resolves.toBe(false);
  });
});

describe("checkBadgesAfterWish", () => {
  it("awards the first comparison badge after the first allocation", async () => {
    vi.mocked(prisma.wishocraticAllocation.count).mockResolvedValueOnce(1);
    vi.mocked(prisma.badge.createMany).mockResolvedValueOnce({ count: 1 } as never);

    await checkBadgesAfterWish("user-1", "WISHOCRATIC_ALLOCATION");

    expect(prisma.badge.createMany).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        type: "FIRST_COMPARISON",
        metadata: undefined,
      },
      skipDuplicates: true,
    });
  });
});

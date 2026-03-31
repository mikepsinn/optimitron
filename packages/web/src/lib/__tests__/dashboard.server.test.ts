import { describe, expect, it, vi } from "vitest";

// Mock prisma before importing the module under test
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      count: vi.fn(),
    },
    activity: {
      count: vi.fn(),
    },
    referendumVote: {
      count: vi.fn(),
    },
    wishPoint: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}));

// Mock next-auth
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/wishes.server", () => ({
  getWishBalance: vi.fn(),
  getWishReasonLabel: vi.fn((reason: string) => reason),
  getWishReasonEmoji: vi.fn(() => "⭐"),
}))

vi.mock("@/lib/impact-receipts.server", () => ({
  getImpactReceipts: vi.fn(),
}))

// Mock auth
vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

import { prisma } from "@/lib/prisma";
import { getWishBalance } from "@/lib/wishes.server"
import { getImpactReceipts } from "@/lib/impact-receipts.server"
import { getDashboardData } from "../dashboard.server";

describe("getDashboardData", () => {
  it("throws when user is not found", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);

    await expect(getDashboardData("nonexistent")).rejects.toThrow(
      "User not found",
    );
  });

  it("returns formatted dashboard data for a valid user", async () => {
    const mockUser = {
      id: "user-1",
      name: "Test User",
      username: "testuser",
      email: "test@example.com",
      bio: "Hello",
      headline: "Dev",
      website: "https://example.com",
      coverImage: null,
      isPublic: true,
      referralCode: "ref-123",
      image: null,
      newsletterSubscribed: true,
      accounts: [
        {
          provider: "google",
        },
      ],
      badges: [
        {
          id: "badge-1",
          type: "FIRST_COMPARISON",
          earnedAt: new Date(),
          metadata: null,
          userId: "user-1",
        },
      ],
      socialAccounts: [
        {
          platform: "GITHUB",
          username: "testuser",
          walletAddress: null,
          isPrimary: false,
          verifiedAt: null,
        },
      ],
      activities: [
        {
          id: "act-1",
          type: "SUBMITTED_COMPARISON",
          metadata: null,
          createdAt: new Date(),
          description: "",
          userId: "user-1",
          entityType: null,
          entityId: null,
        },
      ],
      referrals: [{ id: "ref-1" }],
      createdOrganizations: [
        {
          id: "org-1",
          name: "Test Org",
          slug: "test-org",
          type: "NONPROFIT",
          status: "APPROVED",
          createdAt: new Date(),
          _count: { members: 5 },
        },
      ],
      notificationPreferences: [
        { type: "BADGE_EARNED", channel: "EMAIL", enabled: true },
      ],
    };

    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockUser as any);
    vi.mocked(prisma.activity.count).mockResolvedValueOnce(3);
    vi.mocked(prisma.user.count).mockResolvedValueOnce(0);
    vi.mocked(prisma.referendumVote.count).mockResolvedValueOnce(42);
    vi.mocked(getWishBalance).mockResolvedValueOnce(7);
    vi.mocked(getImpactReceipts).mockResolvedValueOnce({
      items: [],
      walletCount: 0,
    });
    vi.mocked(prisma.wishPoint.findMany).mockResolvedValueOnce([
      { reason: "DAILY_CHECKIN" },
    ] as any);
    vi.mocked(prisma.wishPoint.findFirst).mockResolvedValueOnce(null);

    const result = await getDashboardData("user-1");

    expect(result.user.name).toBe("Test User");
    expect(result.user.username).toBe("testuser");
    expect(result.stats.referrals).toBe(1);
    expect(result.stats.wishes).toBe(7);
    expect(result.stats.wishocraticAllocations).toBe(3);
    expect(result.stats.badges).toBe(1);
    expect(result.stats.rank).toBe(1);
    expect(result.badges).toHaveLength(1);
    expect(result.badges[0]?.name).toBe("First Comparison");
    expect(result.activities).toHaveLength(1);
    expect(result.organizations.created).toHaveLength(1);
    expect(result.organizations.created[0]?.memberCount).toBe(5);
    expect(result.globalProgress).toBeDefined();
    expect(result.globalProgress.current).toBeGreaterThanOrEqual(0);
    expect(result.questChecklist).toHaveLength(10);
    expect(result.impactReceipts).toEqual({ items: [], walletCount: 0 });
    // REFERRAL should be completed because referralCount > 0
    const referralQuest = result.questChecklist.find((q) => q.reason === "REFERRAL");
    expect(referralQuest?.completed).toBe(true);
    // KYC should be coming soon
    const kycQuest = result.questChecklist.find((q) => q.reason === "KYC_COMPLETION");
    expect(kycQuest?.comingSoon).toBe(true);
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

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

vi.mock("@/lib/humanity-manager-status.server", () => ({
  loadHumanityManagerStatus: vi.fn(),
}))

vi.mock("@/lib/url", () => ({
  getBaseUrl: vi.fn(() => "https://warondisease.org"),
}))

// Mock auth
vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

import { prisma } from "@/lib/prisma";
import { getWishBalance } from "@/lib/wishes.server"
import { getImpactReceipts } from "@/lib/impact-receipts.server"
import { loadHumanityManagerStatus } from "@/lib/humanity-manager-status.server"
import { getDashboardData } from "../dashboard.server";

const HUMANITY_MANAGER_STATUS_FIXTURE = {
  completedEmployees: [],
  directConversionCount: 1,
  downstreamConversionCount: 7,
  kFactor30d: 0.5,
  overdueEmployeeCount: 0,
  overdueEmployees: [],
  overduePresidentCount: 0,
  overduePresidents: [],
  reminders: [],
};

describe("getDashboardData", () => {
  beforeEach(() => {
    vi.mocked(loadHumanityManagerStatus).mockReset();
  });

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
      email: "test@example.com",
      bio: "Hello",
      referralCode: "ref-123",
      downstreamConversionCount: 7,
      image: null,
      newsletterSubscribed: true,
      person: {
        id: "person-1",
        handle: "testuser",
        displayName: "Test User",
        image: null,
        headline: "Dev",
        website: "https://example.com",
        coverImage: null,
        isPublic: true,
      },
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
    vi.mocked(loadHumanityManagerStatus).mockResolvedValueOnce(
      HUMANITY_MANAGER_STATUS_FIXTURE,
    );
    vi.mocked(prisma.wishPoint.findMany).mockResolvedValueOnce([
      { reason: "DAILY_CHECKIN" },
    ] as any);
    vi.mocked(prisma.wishPoint.findFirst).mockResolvedValueOnce(null);

    const result = await getDashboardData("user-1");

    expect(result.user.name).toBe("Test User");
    expect(result.user.handle).toBe("testuser");
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
    expect(result.questChecklist.map((item) => item.reason)).toEqual([
      "REFERENDUM_VOTE",
      "REFERRAL",
      "WISHOCRATIC_ALLOCATION",
      "PRIZE_DEPOSIT",
    ]);
    expect(result.impactReceipts).toEqual({ items: [], walletCount: 0 });
    expect(result.humanityManagerStatus).toBe(
      HUMANITY_MANAGER_STATUS_FIXTURE,
    );
    expect(loadHumanityManagerStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        baseUrl: "https://warondisease.org",
        user: expect.objectContaining({
          downstreamConversionCount: 7,
          handle: "testuser",
          referralCode: "ref-123",
        }),
        userId: "user-1",
      }),
    );
    // REFERRAL stays incomplete until the user hits the gameplay goal.
    const referralQuest = result.questChecklist.find((q) => q.reason === "REFERRAL");
    expect(referralQuest?.completed).toBe(false);
  });
});

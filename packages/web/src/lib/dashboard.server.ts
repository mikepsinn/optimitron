import { prisma } from "@/lib/prisma";
import { ActivityType } from "@optimitron/db";
import {
  getWishBalance,
  getWishReasonLabel,
  getWishReasonEmoji,
} from "@/lib/wishes.server";
import {
  getActivityDescription,
  getActivityEmoji,
  getBadgeName,
  getBadgeDescription,
} from "@/lib/activity-descriptions";
import {
  GLOBAL_POPULATION_ACTIVISM_THRESHOLD_PCT,
  GLOBAL_POPULATION_2024,
} from "@optimitron/data/parameters";
import { getImpactReceipts } from "@/lib/impact-receipts.server";
import { ROUTES } from "@/lib/routes";
import type {
  DashboardData,
  LeaderboardEntry,
  QuestItem,
} from "@/types/dashboard";

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  return `${Math.floor(seconds / 604800)} weeks ago`;
}

export async function getDashboardData(
  userId: string,
): Promise<DashboardData> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      badges: true,
      activities: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      referrals: {
        select: { id: true },
      },
      createdOrganizations: {
        where: { deletedAt: null },
        select: {
          id: true,
          name: true,
          slug: true,
          type: true,
          status: true,
          createdAt: true,
          _count: {
            select: { members: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const referralCount = user.referrals.length;

  // Count comparisons
  const allocationCount = await prisma.activity.count({
    where: {
      userId,
      type: ActivityType.SUBMITTED_COMPARISON,
    },
  });

  // Calculate rank based on referrals
  const usersAhead = await prisma.user.count({
    where: {
      referrals: {
        some: {},
      },
      isPublic: true,
      NOT: { id: userId },
    },
  });
  const rank = usersAhead + 1;

  // Global progress: total referendum votes as % of global population
  const totalReferendumVotes = await prisma.referendumVote.count();
  const globalProgressPct =
    (totalReferendumVotes / GLOBAL_POPULATION_2024.value) * 100;
  const targetPct =
    GLOBAL_POPULATION_ACTIVISM_THRESHOLD_PCT.value * 100;

  // Quest checklist: which wish reasons has this user completed?
  const todayIso = new Date().toISOString().slice(0, 10);
  const [completedReasons, todayCheckin] = await Promise.all([
    prisma.wishPoint.findMany({
      where: { userId },
      select: { reason: true },
      distinct: ["reason"],
    }),
    prisma.wishPoint.findFirst({
      where: { userId, reason: "DAILY_CHECKIN", metadata: { contains: todayIso } },
    }),
  ]);
  const completedSet = new Set(completedReasons.map((r) => r.reason));
  const [wishBalance, impactReceipts] = await Promise.all([
    getWishBalance(userId),
    getImpactReceipts(userId),
  ]);

  const questChecklist: QuestItem[] = [
    {
      reason: "WORLD_ID_VERIFICATION",
      label: getWishReasonLabel("WORLD_ID_VERIFICATION"),
      emoji: getWishReasonEmoji("WORLD_ID_VERIFICATION"),
      wishesLabel: "10",
      completed: completedSet.has("WORLD_ID_VERIFICATION"),
      href: ROUTES.profile,
      anchor: null,
      comingSoon: false,
    },
    {
      reason: "KYC_COMPLETION",
      label: getWishReasonLabel("KYC_COMPLETION"),
      emoji: getWishReasonEmoji("KYC_COMPLETION"),
      wishesLabel: "5",
      completed: completedSet.has("KYC_COMPLETION"),
      href: null,
      anchor: null,
      comingSoon: true,
    },
    {
      reason: "CENSUS_SNAPSHOT",
      label: getWishReasonLabel("CENSUS_SNAPSHOT"),
      emoji: getWishReasonEmoji("CENSUS_SNAPSHOT"),
      wishesLabel: "5",
      completed: completedSet.has("CENSUS_SNAPSHOT"),
      href: ROUTES.census,
      anchor: null,
      comingSoon: false,
    },
    {
      reason: "DAILY_CHECKIN",
      label: getWishReasonLabel("DAILY_CHECKIN"),
      emoji: getWishReasonEmoji("DAILY_CHECKIN"),
      wishesLabel: "1/day",
      completed: todayCheckin !== null,
      href: ROUTES.checkIn,
      anchor: null,
      comingSoon: false,
    },
    {
      reason: "WISHOCRATIC_ALLOCATION",
      label: getWishReasonLabel("WISHOCRATIC_ALLOCATION"),
      emoji: getWishReasonEmoji("WISHOCRATIC_ALLOCATION"),
      wishesLabel: "2",
      completed: allocationCount >= 10,
      href: ROUTES.wishocracy,
      anchor: null,
      comingSoon: false,
    },
    {
      reason: "REFERENDUM_VOTE",
      label: getWishReasonLabel("REFERENDUM_VOTE"),
      emoji: getWishReasonEmoji("REFERENDUM_VOTE"),
      wishesLabel: "2",
      completed: completedSet.has("REFERENDUM_VOTE"),
      href: ROUTES.referendum,
      anchor: null,
      comingSoon: false,
    },
    {
      reason: "ALIGNMENT_CHECK",
      label: getWishReasonLabel("ALIGNMENT_CHECK"),
      emoji: getWishReasonEmoji("ALIGNMENT_CHECK"),
      wishesLabel: "2",
      completed: completedSet.has("ALIGNMENT_CHECK"),
      href: ROUTES.alignment,
      anchor: null,
      comingSoon: false,
    },
    {
      reason: "REFERRAL",
      label: getWishReasonLabel("REFERRAL"),
      emoji: getWishReasonEmoji("REFERRAL"),
      wishesLabel: "1",
      completed: referralCount > 0,
      href: null,
      anchor: "#referral",
      comingSoon: false,
    },
    {
      reason: "PRIZE_DEPOSIT",
      label: getWishReasonLabel("PRIZE_DEPOSIT"),
      emoji: getWishReasonEmoji("PRIZE_DEPOSIT"),
      wishesLabel: "1/$100",
      completed: completedSet.has("PRIZE_DEPOSIT"),
      href: ROUTES.prize,
      anchor: null,
      comingSoon: false,
    },
    {
      reason: "SHARE_REPORT",
      label: getWishReasonLabel("SHARE_REPORT"),
      emoji: getWishReasonEmoji("SHARE_REPORT"),
      wishesLabel: "1",
      completed: completedSet.has("SHARE_REPORT"),
      href: null,
      anchor: "#share-templates",
      comingSoon: false,
    },
  ];

  return {
    user: {
      id: user.id,
      name: user.name || "User",
      username: user.username || null,
      email: user.email,
      bio: user.bio || "",
      headline: user.headline || null,
      website: user.website || null,
      coverImage: user.coverImage || null,
      isPublic: user.isPublic,
      referralCode: user.referralCode,
      image: user.image || null,
      newsletterSubscribed: user.newsletterSubscribed,
    },
    stats: {
      wishes: wishBalance,
      referrals: referralCount,
      wishocraticAllocations: allocationCount,
      badges: user.badges.length,
      rank,
    },
    badges: user.badges.map((badge) => ({
      id: badge.id,
      name: getBadgeName(badge.type),
      description: getBadgeDescription(badge.type),
      earned: true,
    })),
    activities: user.activities.map((activity) => ({
      id: activity.id,
      type: activity.type,
      text: getActivityDescription(
        activity.type,
        activity.metadata || undefined,
      ),
      time: formatTimeAgo(activity.createdAt),
      emoji: getActivityEmoji(activity.type),
    })),
    organizations: {
      created: user.createdOrganizations.map((org) => ({
        id: org.id,
        name: org.name,
        slug: org.slug || null,
        type: org.type,
        status: org.status,
        memberCount: org._count.members,
        createdAt: org.createdAt,
      })),
    },
    globalProgress: {
      current: globalProgressPct,
      target: targetPct,
    },
    questChecklist,
    impactReceipts,
  };
}

export async function getTopReferrers(): Promise<LeaderboardEntry[]> {
  const topUsers = await prisma.user.findMany({
    where: {
      isPublic: true,
      referrals: { some: {} },
    },
    select: {
      id: true,
      name: true,
      username: true,
      image: true,
      _count: {
        select: { referrals: true },
      },
    },
    orderBy: {
      referrals: { _count: "desc" },
    },
    take: 10,
  });

  return topUsers.map((user, index) => ({
    rank: index + 1,
    userId: user.id,
    name: user.username || user.name || "Anonymous User",
    image: user.image,
    referrals: user._count.referrals,
  }));
}

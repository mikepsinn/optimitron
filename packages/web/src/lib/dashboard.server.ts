import { prisma } from "@/lib/prisma";
import { ActivityType } from "@optimitron/db";
import {
  getActivityDescription,
  getActivityEmoji,
  getBadgeName,
  getBadgeDescription,
} from "@/lib/activity-descriptions";
import {
  GLOBAL_POPULATION_ACTIVISM_THRESHOLD_PCT,
} from "@/lib/parameters-calculations-citations";
import type { DashboardData, LeaderboardEntry } from "@/types/dashboard";

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
      socialAccounts: true,
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
      notificationPreferences: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const referralCount = user.referrals.length;

  // Count comparisons
  const comparisonCount = await prisma.activity.count({
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
  const WORLD_POPULATION = 8_000_000_000;
  const globalProgressPct =
    (totalReferendumVotes / WORLD_POPULATION) * 100;
  const targetPct =
    GLOBAL_POPULATION_ACTIVISM_THRESHOLD_PCT.value * 100;

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
      referrals: referralCount,
      comparisons: comparisonCount,
      badges: user.badges.length,
      rank,
    },
    badges: user.badges.map((badge) => ({
      id: badge.id,
      name: getBadgeName(badge.type),
      description: getBadgeDescription(badge.type),
      earned: true,
    })),
    socialAccounts: user.socialAccounts.map((sa) => ({
      platform: sa.platform,
      username: sa.username,
      walletAddress: sa.walletAddress,
      isPrimary: sa.isPrimary,
      verifiedAt: sa.verifiedAt,
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
    notificationPreferences: user.notificationPreferences.map((pref) => ({
      type: pref.type,
      channel: pref.channel,
      enabled: pref.enabled,
    })),
    globalProgress: {
      current: globalProgressPct,
      target: targetPct,
    },
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

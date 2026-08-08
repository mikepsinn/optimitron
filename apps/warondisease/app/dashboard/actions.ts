"use server"

import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { requireAuth, getCurrentUser, getEnabledProviders } from "@/lib/auth-utils"
import { calculateUserRank } from "@/lib/user"
import { SocialPlatform, ActivityType, type ReferralInvitationStatus } from "@optimitron/db"
import {
  getActivityDescription,
  getActivityEmoji,
  getBadgeName,
  getBadgeDescription,
} from "@/lib/activity-descriptions"
import { searchOrganizations as searchOrgsLogic, createOrganizationLogic } from "@/lib/organizations"
import { getReferralTreeStats } from "@/lib/referral.server"
import { GLOBAL_COORDINATION_TARGET_PCT, GLOBAL_POPULATION_2024 } from "@/lib/parameters-calculations-citations"
import { validateUsername } from "@/lib/username"
import { buildUserInviteReferralUrl } from "@/lib/url"
import { countTreatyVotes, getUserTreatyVote } from "@/lib/treaty-votes.server"

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)

  if (seconds < 60) return "just now"
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`
  return `${Math.floor(seconds / 604800)} weeks ago`
}

function mapInvitationStatus(
  status: ReferralInvitationStatus,
): "PENDING" | "REMINDED" | "VOTED" | "DECLINED" {
  switch (status) {
    case "CONVERTED":
      return "VOTED"
    case "DECLINED":
    case "CANCELLED":
      return "DECLINED"
    case "SENT":
    case "COPIED":
      return "REMINDED"
    default:
      return "PENDING"
  }
}

function findSocialUsername(
  accounts: { platform: SocialPlatform; username: string | null }[],
  platform: SocialPlatform,
): string | null {
  return accounts.find((a) => a.platform === platform)?.username || null
}

export async function getDashboardData() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/signin")
  }

  const userWithDashboardData = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      badges: true,
      socialAccounts: true,
      organizationMemberships: {
        include: { organization: { select: { id: true, name: true } } },
        take: 1,
        orderBy: { joinedAt: "desc" },
      },
      activities: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      createdOrganizations: {
        where: {
          deletedAt: null,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          createdAt: true,
          _count: {
            select: {
              referendumVotes: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!userWithDashboardData) {
    redirect("/auth/signin")
  }

  const referralCount = await countTreatyVotes({
    referredByUserId: userWithDashboardData.id,
  })

  const organizationVotesCount = userWithDashboardData.createdOrganizations.reduce(
    (total, org) => total + org._count.referendumVotes,
    0,
  )

  const shareCount = await prisma.activity.count({
    where: {
      userId: userWithDashboardData.id,
      type: ActivityType.SHARED_LINK,
    },
  })

  const totalImpact = referralCount + organizationVotesCount

  const referralTree = await getReferralTreeStats(userWithDashboardData.id, {
    publicRecruitsLimit: 20,
  })

  const referralInvitations = await prisma.referralInvitation.findMany({
    where: { referrerUserId: userWithDashboardData.id, deletedAt: null },
    orderBy: { createdAt: "desc" },
  })

  const actualReach =
    shareCount > 0 ? shareCount * 265 : totalImpact * 265

  const rank = await calculateUserRank(totalImpact)
  const totalVotes = await countTreatyVotes()
  await getUserTreatyVote(user.id)

  const enabledProviders = getEnabledProviders()
  const primaryMembership = userWithDashboardData.organizationMemberships[0]
  const socials = userWithDashboardData.socialAccounts

  return {
    user: {
      id: userWithDashboardData.id,
      name: userWithDashboardData.name || "User",
      username: userWithDashboardData.username || null,
      email: userWithDashboardData.email,
      bio: userWithDashboardData.bio || "",
      location: userWithDashboardData.location || "",
      country: userWithDashboardData.country || null,
      isPublic: userWithDashboardData.isPublic,
      referralCode: userWithDashboardData.referralCode,
      organization: primaryMembership?.organization.name || null,
      organizationId: primaryMembership?.organizationId ?? null,
      image: userWithDashboardData.image || null,
      weeklyDigest: userWithDashboardData.weeklyDigest,
      emailNotifications: userWithDashboardData.emailNotifications,
      newsletterSubscribed: userWithDashboardData.newsletterSubscribed,
      website: userWithDashboardData.website || null,
      headline: userWithDashboardData.headline || null,
      coverImage: userWithDashboardData.coverImage || null,
    },
    stats: {
      referrals: referralCount,
      shares: shareCount || referralCount * 3,
      reach: actualReach,
      rank,
    },
    referralTree: {
      directCount: referralTree.directCount,
      totalDownstreamCount: referralTree.totalDownstreamCount,
      maxDepth: referralTree.maxDepth,
      publicRecruits: referralTree.publicRecruits,
    },
    referralInvitations: referralInvitations.map((c) => ({
      id: c.id,
      recipientName: c.recipientName,
      inviteeContact: c.recipientEmail,
      contactMethod:
        c.contactMethod === "EMAIL" || c.contactMethod === "SMS"
          ? c.contactMethod
          : c.contactMethod
            ? ("IN_PERSON" as const)
            : null,
      inviteToken: c.inviteToken,
      referralUrl: buildUserInviteReferralUrl(userWithDashboardData, c.inviteToken),
      messageText: c.messageText,
      status: mapInvitationStatus(c.status),
      votedAt: c.convertedAt,
      copiedAt: c.copiedAt,
      sentAt: c.sentAt,
      remindersSent: 0,
      lastRemindedAt: null as Date | null,
      confirmedAt: c.convertedAt,
      createdAt: c.createdAt,
    })),
    badges: userWithDashboardData.badges.map((badge) => ({
      id: badge.id,
      name: getBadgeName(badge.type),
      description: getBadgeDescription(badge.type),
      earned: true,
    })),
    socialAccounts: {
      google: null,
      github: findSocialUsername(socials, SocialPlatform.GITHUB),
      twitter: findSocialUsername(socials, SocialPlatform.TWITTER),
      discord: findSocialUsername(socials, SocialPlatform.DISCORD),
      linkedin: null,
      facebook: null,
    },
    enabledProviders,
    activities: userWithDashboardData.activities.map((activity) => ({
      id: activity.id,
      type: activity.type.toLowerCase(),
      text: getActivityDescription(activity.type, activity.metadata || undefined),
      time: formatTimeAgo(activity.createdAt),
      emoji: getActivityEmoji(activity.type),
    })),
    globalProgress: {
      current: (totalVotes / GLOBAL_POPULATION_2024.value) * 100,
      target: GLOBAL_COORDINATION_TARGET_PCT.value * 100,
    },
    // militaryAllocationPercent is DIH-only; ReferendumVote has no allocation column
    allocation: {
      user: null as number | null,
      average: 50,
    },
    campaigns: {
      created: [] as {
        id: string
        slug: string
        title: string
        status: string
        goalAmount: number
        currentAmount: number
        backerCount: number
        currency: string
      }[],
      pledged: [] as {
        id: string
        amount: number
        currency: string
        createdAt: Date
        campaign: {
          id: string
          slug: string
          title: string
          status: string
        }
      }[],
    },
    organizations: {
      created: userWithDashboardData.createdOrganizations.map((org) => ({
        id: org.id,
        name: org.name,
        slug: org.slug || null,
        status: org.status,
        voteCount: org._count.referendumVotes,
        createdAt: org.createdAt,
      })),
    },
  }
}

export async function getTopReferrers() {
  const top = await prisma.referendumVote.groupBy({
    by: ["referredByUserId"],
    where: {
      referredByUserId: { not: null },
      deletedAt: null,
    },
    _count: { _all: true },
    orderBy: { _count: { referredByUserId: "desc" } },
    take: 30,
  })

  const userIds = top
    .map((row) => row.referredByUserId)
    .filter((id): id is string => !!id)

  const users = await prisma.user.findMany({
    where: {
      id: { in: userIds },
      isPublic: true,
    },
    select: {
      id: true,
      name: true,
      username: true,
      image: true,
    },
  })
  const byId = new Map(users.map((u) => [u.id, u]))

  const ranked = top
    .map((row) => {
      const u = row.referredByUserId ? byId.get(row.referredByUserId) : null
      if (!u) return null
      return {
        userId: u.id,
        name: u.username || u.name || "Anonymous User",
        image: u.image,
        referrals: row._count._all,
      }
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)
    .slice(0, 10)

  return ranked.map((user, index) => ({
    rank: index + 1,
    ...user,
  }))
}

export async function updateUserProfile(data: {
  name?: string
  username?: string | null
  bio?: string
  organization?: string
  organizationId?: string | null
  country?: string | null
  isPublic?: boolean
  weeklyDigest?: boolean
  emailNotifications?: boolean
  newsletterSubscribed?: boolean
  website?: string | null
  headline?: string | null
  coverImage?: string | null
}) {
  const { userId } = await requireAuth()

  let normalizedUsername: string | null | undefined = undefined

  if ("username" in data) {
    const raw = (data.username ?? "").trim()

    if (raw === "") {
      normalizedUsername = null
    } else {
      const handle = raw

      const usernameValidationError = validateUsername(handle)
      if (usernameValidationError) {
        throw new Error(usernameValidationError)
      }

      const existingHandle = await prisma.user.findFirst({
        where: {
          username: {
            equals: handle,
            mode: "insensitive",
          },
          NOT: { id: userId },
        },
        select: { id: true },
      })

      if (existingHandle) {
        throw new Error("That handle is already taken. Please choose another.")
      }

      normalizedUsername = handle
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      name: data.name,
      bio: data.bio,
      country: data.country,
      isPublic: data.isPublic,
      weeklyDigest: data.weeklyDigest,
      emailNotifications: data.emailNotifications,
      newsletterSubscribed: data.newsletterSubscribed,
      website: data.website,
      headline: data.headline,
      coverImage: data.coverImage,
      ...(normalizedUsername !== undefined ? { username: normalizedUsername } : {}),
    },
  })

  // Org membership via OrganizationMember (no User.organizationId on optimitron)
  if (data.organizationId !== undefined) {
    await prisma.organizationMember.deleteMany({ where: { userId } })
    if (data.organizationId) {
      await prisma.organizationMember.create({
        data: {
          userId,
          organizationId: data.organizationId,
        },
      })
    }
  }

  return { success: true }
}

export async function searchOrganizations(query: string) {
  const orgs = await searchOrgsLogic(query)
  return orgs
}

export async function createOrganization(data: {
  name: string
  website?: string
  description?: string
}) {
  const { userId, userEmail } = await requireAuth()

  const organization = await createOrganizationLogic(data, {
    id: userId,
    email: userEmail,
  })

  return { success: true, organization }
}

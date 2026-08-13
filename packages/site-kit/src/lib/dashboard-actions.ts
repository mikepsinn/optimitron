"use server"

import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { requireAuth, getCurrentUser, getEnabledProviders } from "@/lib/auth-utils"
import { calculateUserRank } from "@/lib/user"
import { SocialPlatform, type ReferralInvitationStatus } from "@optimitron/db"
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
import { ensurePersonForUser } from "@/lib/person.server"
import {
  getUserDisplayAvatar,
  getUserDisplayHandle,
  getUserDisplayName,
} from "@/lib/user-display"

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
      person: {
        select: {
          handle: true,
          displayName: true,
          image: true,
          bio: true,
          headline: true,
          website: true,
          coverImage: true,
          isPublic: true,
          countryCode: true,
        },
      },
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

  const shareCount = await prisma.shareAttempt.count({
    where: {
      userId: userWithDashboardData.id,
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
  const person = userWithDashboardData.person
  const handle = getUserDisplayHandle(userWithDashboardData)
  const location =
    [userWithDashboardData.city, userWithDashboardData.countryCode ?? person?.countryCode]
      .filter(Boolean)
      .join(", ") || ""

  return {
    user: {
      id: userWithDashboardData.id,
      name: getUserDisplayName(userWithDashboardData) || "User",
      username: handle,
      handle,
      email: userWithDashboardData.email,
      bio: person?.bio || "",
      location,
      country: userWithDashboardData.countryCode || person?.countryCode || null,
      isPublic: person?.isPublic ?? false,
      referralCode: userWithDashboardData.referralCode,
      organization: primaryMembership?.organization.name || null,
      organizationId: primaryMembership?.organizationId ?? null,
      image: getUserDisplayAvatar(userWithDashboardData),
      newsletterSubscribed: userWithDashboardData.newsletterSubscribed,
      website: person?.website || null,
      headline: person?.headline || null,
      coverImage: person?.coverImage || null,
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
      referralUrl: buildUserInviteReferralUrl(
        {
          handle: person?.handle,
          referralCode: userWithDashboardData.referralCode,
        },
        c.inviteToken,
      ),
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
    allocation: {
      user: null as number | null,
      average: 50,
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
      person: { isPublic: true },
    },
    select: {
      id: true,
      person: {
        select: {
          handle: true,
          displayName: true,
          image: true,
        },
      },
    },
  })
  const byId = new Map(users.map((u) => [u.id, u]))

  const ranked = top
    .map((row) => {
      const u = row.referredByUserId ? byId.get(row.referredByUserId) : null
      if (!u) return null
      return {
        userId: u.id,
        name: getUserDisplayHandle(u) || getUserDisplayName(u) || "Anonymous User",
        image: getUserDisplayAvatar(u),
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
  handle?: string | null
  /** @deprecated Prefer `handle` */
  username?: string | null
  bio?: string
  organization?: string
  organizationId?: string | null
  country?: string | null
  isPublic?: boolean
  newsletterSubscribed?: boolean
  website?: string | null
  headline?: string | null
  coverImage?: string | null
}) {
  const { userId } = await requireAuth()

  const handleInput =
    "handle" in data ? data.handle : "username" in data ? data.username : undefined

  let normalizedHandle: string | null | undefined = undefined

  if (handleInput !== undefined) {
    const raw = (handleInput ?? "").trim()

    if (raw === "") {
      normalizedHandle = null
    } else {
      const usernameValidationError = validateUsername(raw)
      if (usernameValidationError) {
        throw new Error(usernameValidationError)
      }

      const existingHandle = await prisma.person.findFirst({
        where: {
          handle: {
            equals: raw,
            mode: "insensitive",
          },
          user: { NOT: { id: userId } },
        },
        select: { id: true },
      })

      if (existingHandle) {
        throw new Error("That handle is already taken. Please choose another.")
      }

      normalizedHandle = raw.toLowerCase()
    }
  }

  await ensurePersonForUser(userId, {
    displayName: typeof data.name === "string" ? data.name : undefined,
  })

  const userRecord = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { personId: true },
  })

  if (userRecord.personId) {
    await prisma.person.update({
      where: { id: userRecord.personId },
      data: {
        ...(typeof data.name === "string" ? { displayName: data.name } : {}),
        ...(normalizedHandle !== undefined ? { handle: normalizedHandle } : {}),
        ...(typeof data.bio === "string" ? { bio: data.bio } : {}),
        ...(data.website !== undefined ? { website: data.website } : {}),
        ...(data.headline !== undefined ? { headline: data.headline } : {}),
        ...(data.coverImage !== undefined ? { coverImage: data.coverImage } : {}),
        ...(typeof data.isPublic === "boolean" ? { isPublic: data.isPublic } : {}),
        ...(data.country !== undefined ? { countryCode: data.country } : {}),
      },
    })
  }

  const newsletterSubscribed =
    typeof data.newsletterSubscribed === "boolean"
      ? data.newsletterSubscribed
      : undefined

  if (newsletterSubscribed !== undefined || data.country !== undefined) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        ...(newsletterSubscribed !== undefined ? { newsletterSubscribed } : {}),
        ...(data.country !== undefined ? { countryCode: data.country } : {}),
      },
    })
  }

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

  if (!userEmail) {
    throw new Error("Authenticated user is missing an email address")
  }

  const organization = await createOrganizationLogic(data, {
    id: userId,
    email: userEmail,
  })

  return { success: true, organization }
}

/// <reference path="../types/next-auth.d.ts" />
import { getServerSession } from "next-auth"
import { authOptions } from "./auth"
import { prisma } from "./prisma"
import { env } from "./env"

/**
 * Check which OAuth providers are enabled based on environment variables
 */
export function getEnabledProviders() {
  return {
    email: !!env.RESEND_API_KEY,
    google: !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
    github: !!(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET),
    twitter: !!(env.TWITTER_CLIENT_ID && env.TWITTER_CLIENT_SECRET),
    discord: !!(env.DISCORD_CLIENT_ID && env.DISCORD_CLIENT_SECRET),
  }
}

export type EnabledProviders = ReturnType<typeof getEnabledProviders>

/**
 * Get current user from session with full user data
 */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      person: {
        select: {
          id: true,
          handle: true,
          displayName: true,
          image: true,
          bio: true,
          headline: true,
          website: true,
          coverImage: true,
          isPublic: true,
        },
      },
      socialAccounts: true,
      badges: true,
      organizationMemberships: {
        include: { organization: true },
        take: 1,
        orderBy: { joinedAt: "desc" },
      },
    },
  })

  return user
}

/** The session user's id, or null when signed out. No DB query. */
export async function getSessionUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions)
  return session?.user?.id ?? null
}

/**
 * Require authentication (lightweight) - throws error if not authenticated
 * Returns just session data (userId, email) without DB query
 * Use in API routes for fast auth checks
 */
export async function requireAuth() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    throw new Error("Unauthorized - authentication required")
  }

  return {
    userId: session.user.id,
    userEmail: session.user.email,
  }
}

/**
 * Require authentication with full user data - throws error if not authenticated
 * Returns complete user object with relations (socialAccounts, badges, organization memberships)
 * Use in server actions where you need user data
 */
export async function requireUser() {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error("Unauthorized - authentication required")
  }

  return user
}

/**
 * Require admin privileges - throws error if not admin
 * Returns complete user object with admin verification
 * Use in admin pages and admin API routes
 */
export async function requireAdmin() {
  const user = await requireUser()

  if (!user.isAdmin) {
    throw new Error("Unauthorized - admin access required")
  }

  return user
}

/**
 * Require organization access - throws error if user is not the creator
 * Returns the organization with creator verification
 * Use in organization dashboard and management pages
 */
export async function requireOrganizationAccess(organizationId: string) {
  const user = await requireUser()

  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      creator: true,
      referendumVotes: {
        where: { deletedAt: null },
        select: {
          id: true,
          answer: true,
          createdAt: true,
        },
      },
      members: true,
    },
  })

  if (!organization) {
    throw new Error("Organization not found")
  }

  if (organization.creatorId !== user.id && !user.isAdmin) {
    throw new Error("Unauthorized - you don't have access to this organization")
  }

  return { organization, user }
}

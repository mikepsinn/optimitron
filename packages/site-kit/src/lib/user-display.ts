import type { Prisma } from "@optimitron/db"
import { buildRoute } from "./routes"

/**
 * Prisma select fragment for rendering a user from Person-owned fields.
 */
export const userDisplaySelect = {
  id: true,
  email: true,
  person: {
    select: {
      id: true,
      handle: true,
      displayName: true,
      image: true,
    },
  },
} satisfies Prisma.UserSelect

export interface UserForDisplay {
  id: string
  email?: string | null
  person?: {
    id?: string
    handle?: string | null
    displayName?: string | null
    image?: string | null
  } | null
}

export function getUserDisplayName(user: UserForDisplay | null | undefined): string {
  if (!user) return "Anonymous"
  return user.person?.displayName?.trim() || user.email?.trim() || "Anonymous"
}

export function getUserDisplayHandle(
  user: UserForDisplay | null | undefined,
): string | null {
  if (!user) return null
  return user.person?.handle ?? null
}

/**
 * Link to a user's public profile, or null when there is nothing to link to.
 *
 * Optimitron's version resolves `/people/{handle}`, which stays in Optimitron
 * per #238. The campaign apps have their own `/u/[username]` route, so this
 * builds that instead of sending readers to another domain.
 */
export function getUserDisplayHref(
  user: UserForDisplay | null | undefined,
): string | null {
  const identifier = user?.person?.handle
  if (!identifier) return null
  return buildRoute.userProfile(identifier)
}

export function getUserDisplayAvatar(
  user: UserForDisplay | null | undefined,
): string | null {
  if (!user) return null
  return user.person?.image ?? null
}

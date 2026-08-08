import type { Prisma } from "@optimitron/db"

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
    id: string
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

export function getUserDisplayAvatar(
  user: UserForDisplay | null | undefined,
): string | null {
  if (!user) return null
  return user.person?.image ?? null
}

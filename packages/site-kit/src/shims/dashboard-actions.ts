/** Shim for package typecheck; real module lives in each app. */
export async function updateUserProfile(_data: {
  name?: string
  handle?: string | null
  /** @deprecated Prefer `handle` */
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
}): Promise<{ success: boolean }> {
  return { success: true }
}

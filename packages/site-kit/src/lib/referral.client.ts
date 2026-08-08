type ReferralUser = {
  handle?: string | null
  /** @deprecated Prefer `handle` (Person.handle). Kept for gradual UI migration. */
  username?: string | null
  referralCode?: string | null
}

/**
 * Prefer Person.handle, then deprecated username alias, then referralCode.
 */
export function getHandleOrReferralCode(user: ReferralUser | null | undefined): string | null {
  if (!user) return null
  const handle = user.handle?.trim() || user.username?.trim()
  if (handle && handle.length > 0) {
    return handle
  }
  return user.referralCode ?? null
}

/** @deprecated Prefer getHandleOrReferralCode */
export function getUsernameOrReferralCode(
  user: ReferralUser | null | undefined,
): string | null {
  return getHandleOrReferralCode(user)
}

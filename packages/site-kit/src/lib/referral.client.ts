type ReferralUser = {
  username?: string | null
  referralCode?: string | null
}

export function getUsernameOrReferralCode(user: ReferralUser | null | undefined): string | null {
  if (!user) return null
  const handle = user.username?.trim()
  if (handle && handle.length > 0) {
    return handle
  }
  return user.referralCode ?? null
}


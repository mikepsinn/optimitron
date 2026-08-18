type ReferralUser = {
  handle?: string | null;
  referralCode?: string | null;
};

export function getHandleOrReferralCode(user: ReferralUser | null | undefined): string | null {
  const handle = user?.handle?.trim();
  if (handle) {
    return handle;
  }

  return user?.referralCode ?? null;
}

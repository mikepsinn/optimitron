type ReferralUser = {
  username?: string | null;
  referralCode?: string | null;
};

export function getUsernameOrReferralCode(user: ReferralUser | null | undefined): string | null {
  const username = user?.username?.trim();
  if (username) {
    return username;
  }

  return user?.referralCode ?? null;
}

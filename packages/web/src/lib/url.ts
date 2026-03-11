import { getUsernameOrReferralCode } from "@/lib/referral.client";

export function getBaseUrl(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }

  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }

  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL;
  }

  return "http://localhost:3000";
}

export function buildReferralUrl(identifier?: string | null, baseUrl: string = getBaseUrl()): string {
  return identifier ? `${baseUrl}/vote/${identifier}` : `${baseUrl}/vote`;
}

export function buildUserReferralUrl(
  user: { username?: string | null; referralCode?: string | null } | null | undefined,
  baseUrl: string = getBaseUrl(),
): string {
  return buildReferralUrl(getUsernameOrReferralCode(user), baseUrl);
}

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

  return "http://localhost:3001";
}

export function buildReferralUrl(identifier?: string | null, baseUrl: string = getBaseUrl()): string {
  return identifier ? `${baseUrl}/wishocracy/${identifier}` : `${baseUrl}/wishocracy`;
}

export function buildUserReferralUrl(
  user: { username?: string | null; referralCode?: string | null } | null | undefined,
  baseUrl: string = getBaseUrl(),
): string {
  return buildReferralUrl(getUsernameOrReferralCode(user), baseUrl);
}

export function buildAlignmentUrl(
  identifier?: string | null,
  baseUrl: string = getBaseUrl(),
): string {
  return identifier ? `${baseUrl}/alignment/${identifier}` : `${baseUrl}/alignment`;
}

export function buildUserAlignmentUrl(
  user: { username?: string | null; referralCode?: string | null } | null | undefined,
  baseUrl: string = getBaseUrl(),
): string {
  return buildAlignmentUrl(getUsernameOrReferralCode(user), baseUrl);
}

export function buildCivicVoteUrl(
  shareIdentifier?: string | null,
  baseUrl: string = getBaseUrl(),
): string {
  return shareIdentifier
    ? `${baseUrl}/civic/wishocracys/${shareIdentifier}`
    : `${baseUrl}/civic/wishocracys`;
}

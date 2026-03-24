import { getUsernameOrReferralCode } from "@/lib/referral.client";
import { clientEnv } from "@/lib/env";
import { ROUTES } from "@/lib/routes";

export function getBaseUrl(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }

  if (clientEnv.NEXT_PUBLIC_BASE_URL) {
    return clientEnv.NEXT_PUBLIC_BASE_URL;
  }

  return "http://localhost:3001";
}

/** Build a referral link: /r/identifier — clean URL, redirects to homepage with ref stored */
export function buildReferralUrl(identifier?: string | null, baseUrl: string = getBaseUrl()): string {
  return identifier ? `${baseUrl}/r/${identifier}` : baseUrl;
}

export function buildUserReferralUrl(
  user: { username?: string | null; referralCode?: string | null } | null | undefined,
  baseUrl: string = getBaseUrl(),
): string {
  return buildReferralUrl(getUsernameOrReferralCode(user), baseUrl);
}

/** Build an alignment sharing link: /agencies/dfec/alignment/identifier */
export function buildAlignmentUrl(
  identifier?: string | null,
  baseUrl: string = getBaseUrl(),
): string {
  const base = `${baseUrl}${ROUTES.alignment}`;
  return identifier ? `${base}/${identifier}` : base;
}

export function buildUserAlignmentUrl(
  user: { username?: string | null; referralCode?: string | null } | null | undefined,
  baseUrl: string = getBaseUrl(),
): string {
  return buildAlignmentUrl(getUsernameOrReferralCode(user), baseUrl);
}

/** Build a civic vote sharing link */
export function buildCivicVoteUrl(
  shareIdentifier?: string | null,
  baseUrl: string = getBaseUrl(),
): string {
  return shareIdentifier
    ? `${baseUrl}/civic/votes/${shareIdentifier}`
    : `${baseUrl}/civic/votes`;
}

/** Build a referendum referral link: /agencies/dcongress/referendums/slug?ref=identifier */
export function buildReferendumReferralUrl(
  slug: string,
  identifier?: string | null,
  baseUrl: string = getBaseUrl(),
): string {
  const base = `${baseUrl}${ROUTES.referendum}/${slug}`;
  return identifier ? `${base}?ref=${identifier}` : base;
}

/** Build a prize referral link: /prize?ref=identifier */
export function buildPrizeReferralUrl(
  identifier?: string | null,
  baseUrl: string = getBaseUrl(),
): string {
  const base = `${baseUrl}${ROUTES.prize}`;
  return identifier ? `${base}?ref=${identifier}` : base;
}

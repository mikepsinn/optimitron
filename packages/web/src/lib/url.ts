import { getUsernameOrReferralCode } from "@/lib/referral.client";
import { clientEnv } from "@/lib/env";
import { ROUTES } from "@/lib/routes";
import { getConfiguredSiteOrigin } from "@/lib/site";

export function getBaseUrl(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }

  if (clientEnv.NEXT_PUBLIC_BASE_URL) {
    return clientEnv.NEXT_PUBLIC_BASE_URL;
  }

  return getConfiguredSiteOrigin({ allowLocalFallback: true });
}

/** Build a referral link: /vote/identifier — clean URL, redirects to focused vote flow with ref stored */
export function buildReferralUrl(identifier?: string | null, baseUrl: string = getBaseUrl()): string {
  return identifier ? `${baseUrl}/vote/${identifier}` : baseUrl;
}

export function buildInviteReferralUrl(
  identifier?: string | null,
  inviteToken?: string | null,
  baseUrl: string = getBaseUrl(),
): string {
  const url = buildReferralUrl(identifier, baseUrl);
  if (!identifier || !inviteToken) return url;

  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}invite=${encodeURIComponent(inviteToken)}`;
}

export function buildUserReferralUrl(
  user: { username?: string | null; referralCode?: string | null } | null | undefined,
  baseUrl: string = getBaseUrl(),
): string {
  return buildReferralUrl(getUsernameOrReferralCode(user), baseUrl);
}

export function buildUserInviteReferralUrl(
  user: { username?: string | null; referralCode?: string | null } | null | undefined,
  inviteToken?: string | null,
  baseUrl: string = getBaseUrl(),
): string {
  return buildInviteReferralUrl(getUsernameOrReferralCode(user), inviteToken, baseUrl);
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

export function buildTaskUrl(
  taskId: string,
  baseUrl: string = getBaseUrl(),
  referralId?: string | null,
): string {
  const base = `${baseUrl}${ROUTES.tasks}/${taskId}`;
  return referralId ? `${base}?ref=${referralId}` : base;
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

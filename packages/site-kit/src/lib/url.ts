import { getUsernameOrReferralCode } from "./referral.client"
import { env } from "./env"

/**
 * Resolve the application's base URL in any runtime.
 * - Browser: window.location.origin
 * - Server (priority order):
 *   1. NEXT_PUBLIC_BASE_URL (for site variant support)
 *   2. NEXT_PUBLIC_APP_URL (legacy)
 *   3. NEXTAUTH_URL (from NextAuth config)
 *   4. VERCEL_URL (Vercel deployment)
 *   5. http://localhost:3000 (local dev)
 */
export function getBaseUrl(): string {
  // Browser: use current origin
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin
  }

  // Server: check env vars in priority order
  if (env.NEXT_PUBLIC_BASE_URL) return env.NEXT_PUBLIC_BASE_URL
  if (env.NEXT_PUBLIC_APP_URL) return env.NEXT_PUBLIC_APP_URL
  if (env.NEXTAUTH_URL) return env.NEXTAUTH_URL
  if (env.VERCEL_URL) return `https://${env.VERCEL_URL}`

  return "http://localhost:3000"
}

export function buildReferralUrl(
  identifier?: string | null,
  baseUrl: string = getBaseUrl(),
): string {
  return identifier ? `${baseUrl}/vote/${identifier}` : baseUrl
}

export function buildInviteReferralUrl(
  identifier?: string | null,
  inviteToken?: string | null,
  baseUrl: string = getBaseUrl(),
): string {
  const url = buildReferralUrl(identifier, baseUrl)
  if (!identifier || !inviteToken) return url

  const separator = url.includes("?") ? "&" : "?"
  return `${url}${separator}invite=${encodeURIComponent(inviteToken)}`
}

export function buildUserReferralUrl(
  user:
    | {
        handle?: string | null
        username?: string | null
        referralCode?: string | null
      }
    | null
    | undefined,
  baseUrl: string = getBaseUrl(),
): string {
  const identifier = getUsernameOrReferralCode(user)
  return buildReferralUrl(identifier, baseUrl)
}

export function buildUserInviteReferralUrl(
  user:
    | {
        handle?: string | null
        username?: string | null
        referralCode?: string | null
      }
    | null
    | undefined,
  inviteToken?: string | null,
  baseUrl: string = getBaseUrl(),
): string {
  const identifier = getUsernameOrReferralCode(user)
  return buildInviteReferralUrl(identifier, inviteToken, baseUrl)
}


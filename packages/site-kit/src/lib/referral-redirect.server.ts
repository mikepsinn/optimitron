import { prisma } from "./prisma"
import { findUserByHandleOrReferralCode } from "./referral.server"

/**
 * Query params the referral landing routes consume and re-emit themselves.
 * Everything else (utm_*, source, etc.) is passed through verbatim so
 * analytics attribution survives the redirect.
 */
const OWNED_REDIRECT_PARAMS = new Set([
  "ref",
  "sa",
  "invite",
  "treatyFlow",
  "flowVariant",
])

export function buildReferralRedirectUrl(input: {
  code: string
  flowVariant?: string | null
  inviteToken?: string | null
  shareAttemptId?: string | null
  treatyFlow?: string | null
  /** Remaining query params (e.g. utm_*) forwarded unchanged after the referral params. */
  passthroughParams?: URLSearchParams | null
}) {
  const redirectParams = new URLSearchParams({ ref: input.code })
  if (input.shareAttemptId) redirectParams.set("sa", input.shareAttemptId)
  if (input.inviteToken) redirectParams.set("invite", input.inviteToken)
  if (input.treatyFlow) redirectParams.set("treatyFlow", input.treatyFlow)
  if (input.flowVariant) redirectParams.set("flowVariant", input.flowVariant)
  if (input.passthroughParams) {
    for (const [key, value] of input.passthroughParams) {
      if (OWNED_REDIRECT_PARAMS.has(key)) continue
      redirectParams.append(key, value)
    }
  }
  return `/vote?${redirectParams.toString()}`
}

/** Both fields are diagnostic only — nothing reads them for logic. */
const MAX_USER_AGENT_LENGTH = 512

/**
 * Referer URLs can carry invite tokens or user identifiers in their query
 * string, so only the origin + path is kept. Unparseable values are dropped
 * rather than stored raw.
 */
function sanitizeRefererUrl(value: string | null): string | null {
  if (!value) return null
  try {
    const url = new URL(value)
    return `${url.origin}${url.pathname}`
  } catch {
    return null
  }
}

export async function logReferralRedirectClick(input: {
  code: string
  refererUrl: string | null
  shareAttemptId: string | null
  userAgent: string | null
}) {
  try {
    const referrer = await findUserByHandleOrReferralCode(input.code)

    await prisma.referralClick.create({
      data: {
        code: input.code,
        referrerUserId: referrer?.id ?? null,
        refererUrl: sanitizeRefererUrl(input.refererUrl),
        userAgent: input.userAgent?.slice(0, MAX_USER_AGENT_LENGTH) ?? null,
        shareAttemptId: input.shareAttemptId,
      },
    })

    if (input.shareAttemptId) {
      await prisma.shareAttempt
        .updateMany({
          where: { id: input.shareAttemptId, firstReferralClickAt: null },
          data: { firstReferralClickAt: new Date() },
        })
        .catch(() => {})
    }
  } catch {
    // Click logging is best-effort; referral redirects should never fail closed.
  }
}

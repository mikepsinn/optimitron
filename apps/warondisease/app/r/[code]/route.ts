import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import {
  buildReferralRedirectUrl,
  logReferralRedirectClick,
} from "@/lib/referral-redirect.server"

interface RouteContext {
  params: Promise<{ code: string }>
}

export const dynamic = "force-dynamic"

/**
 * Compatibility referral landing route: /r/jane or /r/REF123
 *
 * Captures the HTTP Referer header and user-agent into ReferralClick so we
 * can trace where shares originated (e.g. official social accounts). Also
 * captures `?sa=<shareAttemptId>` so we can tie this click (and any signup
 * that follows) back to the specific ShareAttempt row that generated this
 * outbound message. Then redirects to the focused /vote flow. Directed
 * invitations also preserve ?invite=<token> for conversion, and remaining
 * query params (utm_* etc.) pass through unchanged.
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  const { code } = await params
  const url = new URL(request.url)
  const shareAttemptId = url.searchParams.get("sa")
  const inviteToken = url.searchParams.get("invite")
  const treatyFlow = url.searchParams.get("treatyFlow")
  const flowVariant = url.searchParams.get("flowVariant")

  await logReferralRedirectClick({
    code,
    refererUrl: request.headers.get("referer"),
    shareAttemptId,
    userAgent: request.headers.get("user-agent"),
  })

  const redirectPath = buildReferralRedirectUrl({
    code,
    flowVariant,
    inviteToken,
    shareAttemptId,
    treatyFlow,
    passthroughParams: url.searchParams,
  })

  return NextResponse.redirect(new URL(redirectPath, url), 307)
}

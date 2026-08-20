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
 * Canonical treaty referral landing route: /vote/jane or /vote/REF123.
 *
 * Redirects to the focused vote surface with ?ref= and preserves directed
 * invitation tokens for named invite conversion. Remaining query params
 * (utm_* etc.) pass through unchanged.
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

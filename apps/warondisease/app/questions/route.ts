import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

/**
 * /questions was the context-first treaty walkthrough variant on the legacy
 * host. The peer app has one native vote surface, so shared /questions links
 * land there instead — query params (ref, invite, utm_*) pass through
 * unchanged so referral attribution survives the redirect.
 */
export function GET(request: NextRequest) {
  const url = new URL(request.url)
  const redirectUrl = new URL(`/vote${url.search}`, url)
  return NextResponse.redirect(redirectUrl, 307)
}

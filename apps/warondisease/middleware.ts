import { createAuthMiddleware } from "@/lib/create-middleware"

// This app owns the canonical /vote/[code] referral landing route (with
// ReferralClick logging), so the shared middleware must not intercept
// /vote/<identifier> share links before the route handler sees them.
export default createAuthMiddleware({ handleVoteShare: false })

export const config = {
  // `api/webhooks` is excluded because next.config.mjs rewrites
  // /api/webhooks/resend to Optimitron, which owns the signature check.
  // Middleware runs before `afterFiles` rewrites, so without this the auth
  // redirect answers the webhook first and the rewrite never happens —
  // Resend's POSTs would get a 302 to sign-in and its events would be
  // dropped silently.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth|api/stripe|api/webhooks).*)",
  ],
}

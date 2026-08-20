import { createAuthMiddleware } from "@/lib/create-middleware"

// This app owns the canonical /vote/[code] referral landing route (with
// ReferralClick logging), so the shared middleware must not intercept
// /vote/<identifier> share links before the route handler sees them.
export default createAuthMiddleware({ handleVoteShare: false })

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth|api/stripe).*)"],
}

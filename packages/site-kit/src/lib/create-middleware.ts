import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { withAuth } from "next-auth/middleware"
import { getSiteConfigForVariant, getSiteVariantForHost } from "./site-config"
import { getCanonicalRedirect } from "./canonical-routes"
import { ROUTES } from "./routes"
import { VARIANTS, VARIANT_DOMAINS, type SiteVariant } from "./site-variant-types"

function isLocalHost(host: string): boolean {
  const normalizedHost = host.toLowerCase()
  return (
    normalizedHost.startsWith("localhost") ||
    normalizedHost.startsWith("127.0.0.1") ||
    normalizedHost.startsWith("[::1]")
  )
}

function isPageRequest(pathname: string, options?: { skipAuthPaths?: boolean }): boolean {
  if (pathname === ROUTES.home) return false
  if (pathname === "/api" || pathname.startsWith("/api/")) return false
  if (options?.skipAuthPaths !== false) {
    if (pathname === "/auth" || pathname.startsWith("/auth/")) return false
  }
  if (pathname.startsWith("/_next/")) return false
  return !/\.[a-z0-9]+$/i.test(pathname)
}

function resolveVariant(hostname: string): SiteVariant {
  if (process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_SITE_VARIANT) {
    return process.env.NEXT_PUBLIC_SITE_VARIANT as SiteVariant
  }
  return getSiteVariantForHost(hostname)
}

function applyVariantCookie(response: NextResponse, variant: SiteVariant): NextResponse {
  response.cookies.set("site-variant", variant, {
    sameSite: "lax",
    path: "/",
    httpOnly: false,
  })
  response.headers.set("x-site-variant", variant)
  return response
}

function runSharedRedirects(req: NextRequest, options: { handleVoteShare?: boolean }) {
  const { pathname } = req.nextUrl
  const hostname = req.headers.get("host") || VARIANT_DOMAINS[VARIANTS.WAR_ON_DISEASE]
  const variant = resolveVariant(hostname)
  const variantConfig = getSiteConfigForVariant(variant)
  const redirectTarget = variantConfig.routing?.nonLandingPageRedirectTarget

  if (
    redirectTarget &&
    !isLocalHost(hostname) &&
    isPageRequest(pathname, { skipAuthPaths: options.handleVoteShare })
  ) {
    const url = req.nextUrl.clone()
    url.protocol = "https:"
    url.hostname = VARIANT_DOMAINS[redirectTarget]
    url.port = ""
    return { response: NextResponse.redirect(url, 308), variant }
  }

  if (pathname.startsWith("/docs/")) {
    const docsPath = pathname.replace("/docs/", "")
    const wikiUrl = `https://wiki.dfda.earth/${docsPath}${docsPath && !docsPath.endsWith("/") ? "/" : ""}`
    return { response: NextResponse.redirect(wikiUrl, 308), variant }
  }

  if (options.handleVoteShare && pathname.startsWith("/vote/")) {
    const identifier = pathname.replace("/vote/", "")
    if (identifier) {
      const url = req.nextUrl.clone()
      url.pathname = "/"
      url.searchParams.set("ref", identifier)
      const response = applyVariantCookie(NextResponse.redirect(url), variant)
      return { response, variant }
    }
  }

  const canonicalRedirectUrl = getCanonicalRedirect(pathname, variant)
  if (canonicalRedirectUrl) {
    const redirectUrl = new URL(canonicalRedirectUrl)
    redirectUrl.search = req.nextUrl.search
    return { response: NextResponse.redirect(redirectUrl), variant }
  }

  return { response: null as NextResponse | null, variant }
}

export type AuthMiddlewareOptions = {
  /** Paths that require a session token. Defaults to dashboard + vote/profile APIs. */
  authPaths?: string[]
}

/**
 * Full brand middleware: site variant cookie + next-auth gate on protected paths.
 */
export function createAuthMiddleware(options: AuthMiddlewareOptions = {}) {
  const authPaths = options.authPaths ?? ["/dashboard", "/api/vote", "/api/profile"]

  return withAuth(
    function middleware(req: NextRequest) {
      const shared = runSharedRedirects(req, { handleVoteShare: true })
      if (shared.response) return shared.response
      return applyVariantCookie(NextResponse.next(), shared.variant)
    },
    {
      callbacks: {
        authorized: ({ req, token }) => {
          const requiresAuth = authPaths.some((path) =>
            req.nextUrl.pathname.startsWith(path),
          )
          if (requiresAuth) return !!token
          return true
        },
      },
    },
  )
}

/**
 * Landing / donate satellites: variant routing only, no auth.
 */
export function createLandingMiddleware() {
  return function middleware(req: NextRequest) {
    const shared = runSharedRedirects(req, { handleVoteShare: false })
    if (shared.response) return shared.response
    return applyVariantCookie(NextResponse.next(), shared.variant)
  }
}

export const authMiddlewareMatcher = [
  "/((?!_next/static|_next/image|favicon.ico|api/auth|api/stripe).*)",
]

export const landingMiddlewareMatcher = [
  "/((?!_next/static|_next/image|favicon.ico|api/stripe).*)",
]

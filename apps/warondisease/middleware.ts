import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { withAuth } from "next-auth/middleware"
import { getSiteConfigForVariant, getSiteVariantForHost } from "@/lib/site-config"
import { getCanonicalRedirect } from "@/lib/canonical-routes"
import { ROUTES } from "@/lib/routes"
import { VARIANTS, VARIANT_DOMAINS, type SiteVariant } from "@/lib/site-variant-types"

function isLocalHost(host: string): boolean {
  const normalizedHost = host.toLowerCase()
  return normalizedHost.startsWith('localhost') ||
    normalizedHost.startsWith('127.0.0.1') ||
    normalizedHost.startsWith('[::1]')
}

function isPageRequest(pathname: string): boolean {
  if (pathname === ROUTES.home) return false
  if (pathname === '/api' || pathname.startsWith('/api/')) return false
  if (pathname === '/auth' || pathname.startsWith('/auth/')) return false
  if (pathname.startsWith('/_next/')) return false

  return !/\.[a-z0-9]+$/i.test(pathname)
}

// Middleware function that handles domain detection, redirects, and auth
export default withAuth(
  function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl

    // 1. Domain-based Variant Detection
    const hostname = req.headers.get('host') || VARIANT_DOMAINS[VARIANTS.WAR_ON_DISEASE]

    // In development, respect NEXT_PUBLIC_SITE_VARIANT env var (used by dev:* scripts)
    // In production, always use domain-based detection
    let variant: SiteVariant
    if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_SITE_VARIANT) {
      variant = process.env.NEXT_PUBLIC_SITE_VARIANT as SiteVariant
    } else {
      variant = getSiteVariantForHost(hostname)
    }

    const variantConfig = getSiteConfigForVariant(variant)
    const redirectTarget = variantConfig.routing?.nonLandingPageRedirectTarget

    if (redirectTarget && !isLocalHost(hostname) && isPageRequest(pathname)) {
      const url = req.nextUrl.clone()
      url.protocol = 'https:'
      url.hostname = VARIANT_DOMAINS[redirectTarget]
      url.port = ''
      return NextResponse.redirect(url, 308)
    }

    // 2. Redirect /docs/* paths to wiki.dfda.earth if they don't exist in the app
    // Since there's no /app/docs/ directory, all /docs/* paths should redirect to the wiki
    if (pathname.startsWith("/docs/")) {
      const docsPath = pathname.replace("/docs/", "")
      const wikiUrl = `https://wiki.dfda.earth/${docsPath}${docsPath && !docsPath.endsWith('/') ? '/' : ''}`
      return NextResponse.redirect(wikiUrl, 308) // 308 = permanent redirect
    }

    // 3. Redirect /vote/[identifier] URLs to /?ref=[identifier]
    // This keeps the clean /vote/ URL for sharing while showing full landing page
    if (pathname.startsWith("/vote/")) {
      const identifier = pathname.replace("/vote/", "")
      if (identifier) {
        const url = req.nextUrl.clone()
        url.pathname = "/"
        url.searchParams.set("ref", identifier)
        const response = NextResponse.redirect(url)

        // Set variant cookie on redirect
        response.cookies.set('site-variant', variant, {
          sameSite: 'lax',
          path: '/',
          httpOnly: false,
        })
        response.headers.set('x-site-variant', variant)

        return response
      }
    }

    // 4. Canonical Route Redirect
    // If this route isn't available for the current variant, redirect to canonical variant
    const canonicalRedirectUrl = getCanonicalRedirect(pathname, variant)
    if (canonicalRedirectUrl) {
      // Preserve query string
      const redirectUrl = new URL(canonicalRedirectUrl)
      redirectUrl.search = req.nextUrl.search
      return NextResponse.redirect(redirectUrl)
    }

    // 5. Continue with request and set variant cookie
    const response = NextResponse.next()

    // Set variant cookie for consistent access throughout the app
    response.cookies.set('site-variant', variant, {
      sameSite: 'lax',
      path: '/',
      httpOnly: false, // Allow client-side access if needed
    })

    // Also set as header for server components that can't access cookies in some contexts
    response.headers.set('x-site-variant', variant)

    return response
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        // Only require auth for these paths
        const authPaths = ["/dashboard", "/api/vote", "/api/profile"]
        const requiresAuth = authPaths.some((path) => req.nextUrl.pathname.startsWith(path))

        if (requiresAuth) {
          return !!token
        }

        // Allow all other requests
        return true
      },
    },
  }
)

export const config = {
  matcher: [
    // Match all routes except static files and API routes that don't need auth
    "/((?!_next/static|_next/image|favicon.ico|api/auth|api/stripe).*)",
  ],
}

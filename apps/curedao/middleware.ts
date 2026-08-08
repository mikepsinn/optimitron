import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getSiteConfigForVariant, getSiteVariantForHost } from "@/lib/site-config"
import { getCanonicalRedirect } from "@/lib/canonical-routes"
import { ROUTES } from "@/lib/routes"
import { VARIANTS, VARIANT_DOMAINS, type SiteVariant } from "@/lib/site-variant-types"

function isLocalHost(host: string): boolean {
  const normalizedHost = host.toLowerCase()
  return (
    normalizedHost.startsWith("localhost") ||
    normalizedHost.startsWith("127.0.0.1") ||
    normalizedHost.startsWith("[::1]")
  )
}

function isPageRequest(pathname: string): boolean {
  if (pathname === ROUTES.home) return false
  if (pathname === "/api" || pathname.startsWith("/api/")) return false
  if (pathname.startsWith("/_next/")) return false
  return !/\.[a-z0-9]+$/i.test(pathname)
}

/** Landing/donate middleware — no auth. Sets site-variant for brand config. */
export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const hostname = req.headers.get("host") || VARIANT_DOMAINS[VARIANTS.WAR_ON_DISEASE]

  let variant: SiteVariant
  if (process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_SITE_VARIANT) {
    variant = process.env.NEXT_PUBLIC_SITE_VARIANT as SiteVariant
  } else {
    variant = getSiteVariantForHost(hostname)
  }

  const variantConfig = getSiteConfigForVariant(variant)
  const redirectTarget = variantConfig.routing?.nonLandingPageRedirectTarget

  if (redirectTarget && !isLocalHost(hostname) && isPageRequest(pathname)) {
    const url = req.nextUrl.clone()
    url.protocol = "https:"
    url.hostname = VARIANT_DOMAINS[redirectTarget]
    url.port = ""
    return NextResponse.redirect(url, 308)
  }

  if (pathname.startsWith("/docs/")) {
    const docsPath = pathname.replace("/docs/", "")
    const wikiUrl = `https://wiki.dfda.earth/${docsPath}${docsPath && !docsPath.endsWith("/") ? "/" : ""}`
    return NextResponse.redirect(wikiUrl, 308)
  }

  const canonicalRedirectUrl = getCanonicalRedirect(pathname, variant)
  if (canonicalRedirectUrl) {
    const redirectUrl = new URL(canonicalRedirectUrl)
    redirectUrl.search = req.nextUrl.search
    return NextResponse.redirect(redirectUrl)
  }

  const response = NextResponse.next()
  response.cookies.set("site-variant", variant, {
    sameSite: "lax",
    path: "/",
    httpOnly: false,
  })
  response.headers.set("x-site-variant", variant)
  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/stripe).*)"],
}

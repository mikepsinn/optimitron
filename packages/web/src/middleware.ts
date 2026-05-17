import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { classifyAiCrawler } from "@/lib/agent-readable/ai-crawler-detection";
import { ROUTES } from "@/lib/routes";
import { getSiteStaticAssetRedirectPath } from "@/lib/site-assets";
import {
  SITE_VARIANT_OVERRIDE_COOKIE,
  SITE_VARIANT_OVERRIDE_HEADER,
  SITE_VARIANT_OVERRIDE_QUERY_PARAM,
  getSiteFromHeaders,
  getSiteFromHost,
  getSiteRouteDisposition,
  isSiteRouteAllowed,
} from "@/lib/site";
import { resolveLocalSiteVariantOverride } from "@/lib/site-dev-override";

const LOCAL_SITE_VARIANT_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const AI_CRAWLER_LOG_PRIVATE_PREFIXES = [
  "/admin",
  "/auth",
  ROUTES.dashboard,
  ROUTES.profile,
  ROUTES.settings,
  "/_next",
];

export function isMicrositeAllowed(pathname: string): boolean {
  return isSiteRouteAllowed(getSiteFromHost("warondisease.org"), pathname);
}

function syncLocalSiteVariantCookie(
  response: NextResponse,
  resolution: ReturnType<typeof resolveLocalSiteVariantOverride>,
) {
  if (resolution.persistSiteKey) {
    response.cookies.set(
      SITE_VARIANT_OVERRIDE_COOKIE,
      resolution.persistSiteKey,
      {
        maxAge: LOCAL_SITE_VARIANT_COOKIE_MAX_AGE_SECONDS,
        path: "/",
        sameSite: "lax",
      },
    );
  } else if (resolution.clearCookie) {
    response.cookies.delete(SITE_VARIANT_OVERRIDE_COOKIE);
  }

  return response;
}

function getHeadersWithLocalSiteVariantOverride(
  headers: Headers,
  resolution: ReturnType<typeof resolveLocalSiteVariantOverride>,
) {
  const requestHeaders = new Headers(headers);

  if (resolution.siteKey) {
    requestHeaders.set(SITE_VARIANT_OVERRIDE_HEADER, resolution.siteKey);
  } else {
    requestHeaders.delete(SITE_VARIANT_OVERRIDE_HEADER);
  }

  return requestHeaders;
}

function isPublicAiCrawlerLogPath(
  site: ReturnType<typeof getSiteFromHeaders>,
  pathname: string,
) {
  if (pathname === "/api/agent" || pathname.startsWith("/api/agent/")) {
    return true;
  }

  if (pathname.startsWith("/api/")) {
    return false;
  }

  if (
    AI_CRAWLER_LOG_PRIVATE_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    )
  ) {
    return false;
  }

  return isSiteRouteAllowed(site, pathname);
}

function getReferrerOrigin(referrer: string | null) {
  if (!referrer) return null;
  try {
    return new URL(referrer).origin;
  } catch {
    return null;
  }
}

function getCoarseIsoHour() {
  const date = new Date();
  date.setUTCMinutes(0, 0, 0);
  return date.toISOString();
}

function logAiCrawlerRequest(
  req: import("next/server").NextRequest,
  site: ReturnType<typeof getSiteFromHeaders>,
) {
  if (req.method !== "GET" && req.method !== "HEAD") return;
  if (!isPublicAiCrawlerLogPath(site, req.nextUrl.pathname)) return;

  const classification = classifyAiCrawler(req.headers.get("user-agent"));
  const logUnknown = process.env.LOG_UNKNOWN_AI_CRAWLERS === "1";
  if (!classification.isKnownAiCrawler && !logUnknown) return;

  console.info(
    "[ai-crawler-request]",
    JSON.stringify({
      aiCrawlerFamily: classification.provider,
      aiCrawlerPurpose: classification.purpose,
      botToken: classification.token,
      host: req.headers.get("host")?.split(":")[0]?.toLowerCase() ?? null,
      pathname: req.nextUrl.pathname,
      referrerOrigin: getReferrerOrigin(req.headers.get("referer")),
      timestamp: getCoarseIsoHour(),
    }),
  );
}

// `?login=demo` and `?logout=1` query params let preview-deploy
// reviewers flip between useful auth states by tweaking the URL. Login params
// are env-gated to non-production via the API
// route itself. `?logout=1` is harmless on any environment.
//
// Middleware redirects to the matching `/api/dev/*` route (which does
// the actual cookie work) with the original URL minus the param as
// `?next=...` so the user lands back where they started after the auth
// state flip.
function handleDevAuthQueryParams(req: import("next/server").NextRequest) {
  const params = req.nextUrl.searchParams;
  const loginAs = params.get("login");
  const logout = params.get("logout");

  if (loginAs === "demo") {
    // Allow-list, NOT deny-list. Vercel sets NODE_ENV=production on BOTH
    // preview and production deploys, so a deny-list check breaks the
    // feature on previews (the exact env it's designed for). Mirror the
    // `isPreviewOrDev()` allow-list in /api/dev/login-as-demo/route.ts.
    const isPreviewOrDev =
      process.env.VERCEL_ENV === "preview" ||
      process.env.VERCEL_ENV === "development" ||
      process.env.NODE_ENV === "development";
    if (!isPreviewOrDev) return null;
    const stripped = req.nextUrl.clone();
    stripped.searchParams.delete("login");
    const next = `${stripped.pathname}${stripped.search}${stripped.hash}`;
    const target = req.nextUrl.clone();
    target.pathname = "/api/dev/login-as-demo";
    target.search = `?next=${encodeURIComponent(next || "/")}`;
    return NextResponse.redirect(target, 307);
  }

  if (logout === "1") {
    const stripped = req.nextUrl.clone();
    stripped.searchParams.delete("logout");
    const next = `${stripped.pathname}${stripped.search}${stripped.hash}`;
    const target = req.nextUrl.clone();
    target.pathname = "/api/dev/logout";
    target.search = `?next=${encodeURIComponent(next || "/")}`;
    return NextResponse.redirect(target, 307);
  }

  return null;
}

export default withAuth(
  function middleware(req) {
    const devAuthRedirect = handleDevAuthQueryParams(req);
    if (devAuthRedirect) return devAuthRedirect;

    const overrideResolution = resolveLocalSiteVariantOverride({
      cookieSiteKey: req.cookies.get(SITE_VARIANT_OVERRIDE_COOKIE)?.value,
      host: req.headers.get("host"),
      querySiteKey: req.nextUrl.searchParams.has(SITE_VARIANT_OVERRIDE_QUERY_PARAM)
        ? req.nextUrl.searchParams.get(SITE_VARIANT_OVERRIDE_QUERY_PARAM)
        : null,
    });
    const requestHeaders = getHeadersWithLocalSiteVariantOverride(
      req.headers,
      overrideResolution,
    );
    const site = getSiteFromHeaders(requestHeaders);
    logAiCrawlerRequest(req, site);

    if (overrideResolution.stripQueryParam) {
      const url = req.nextUrl.clone();
      url.searchParams.delete(SITE_VARIANT_OVERRIDE_QUERY_PARAM);
      return syncLocalSiteVariantCookie(
        NextResponse.redirect(url, 307),
        overrideResolution,
      );
    }

    const assetRedirectPath = getSiteStaticAssetRedirectPath(
      site,
      req.nextUrl.pathname,
    );
    if (assetRedirectPath) {
      const url = req.nextUrl.clone();
      const [pathname, search = ""] = assetRedirectPath.split("?");
      url.pathname = pathname;
      url.search = search ? `?${search}` : "";
      return syncLocalSiteVariantCookie(
        NextResponse.redirect(url, 308),
        overrideResolution,
      );
    }

    const disposition = getSiteRouteDisposition(site, req.nextUrl.pathname);
    if (disposition.type !== "allow") {
      if (disposition.type === "redirect") {
        const url = new URL(disposition.url);
        url.search = req.nextUrl.search;
        // 307 keeps method semantics and avoids long-lived browser/CDN caching of
        // host-routing rules that may flip when site config changes.
        return syncLocalSiteVariantCookie(
          NextResponse.redirect(url, 307),
          overrideResolution,
        );
      }

      const url = req.nextUrl.clone();
      url.pathname = "/_site-not-found";
      url.search = "";
      return syncLocalSiteVariantCookie(
        NextResponse.rewrite(url, { request: { headers: requestHeaders } }),
        overrideResolution,
      );
    }
    return syncLocalSiteVariantCookie(
      NextResponse.next({ request: { headers: requestHeaders } }),
      overrideResolution,
    );
  },
  {
    secret: process.env.NEXTAUTH_SECRET,
    pages: {
      signIn: ROUTES.signIn,
    },
    callbacks: {
      authorized: ({ req, token }) => {
        // Let dev-auth query-param flows through to the middleware body even
        // when the target path is auth-protected. Otherwise withAuth bounces
        // `/dashboard?login=demo` to /auth/signin BEFORE our
        // handleDevAuthQueryParams handler runs — the redirect to
        // /api/dev/login-as-demo never gets the chance to mint the cookie.
        // `?logout=1` doesn't need this branch (logout from auth pages is
        // expected to redirect to sign-in if you're already logged out).
        const params = req.nextUrl.searchParams;
        const loginAs = params.get("login");
        if (loginAs === "demo") return true;

        const authPaths = [
          ROUTES.dashboard,
          ROUTES.profile,
          ROUTES.census,
          ROUTES.settings,
          "/admin",
        ];
        const requiresAuth = authPaths.some((p) =>
          req.nextUrl.pathname.startsWith(p),
        );
        return requiresAuth ? !!token : true;
      },
    },
  },
);

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|sitemap.xml|robots.txt|icon|apple-icon|opengraph-image|_error).*)",
    "/api/agent/:path*",
  ],
};

import { withAuth } from "next-auth/middleware";
import type { NextRequestWithAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import { classifyAiCrawler } from "@/lib/agent-readable/ai-crawler-detection";
import { ROUTES } from "@/lib/routes";
import { applyOAuthConsentFlowHeader } from "@/lib/oauth-consent-flow";
import { getSiteStaticAssetRedirectPath } from "@/lib/site-assets";
import { getSiteFromHeaders } from "@/lib/site";

const AI_CRAWLER_LOG_PRIVATE_PREFIXES = [
  "/admin",
  "/auth",
  ROUTES.dashboard,
  ROUTES.profile,
  ROUTES.settings,
  "/_next",
];

function isPublicAiCrawlerLogPath(pathname: string) {
  if (pathname === "/api/agent" || pathname.startsWith("/api/agent/")) {
    return true;
  }

  if (pathname.startsWith("/api/")) {
    return false;
  }

  return !AI_CRAWLER_LOG_PRIVATE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
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

function logAiCrawlerRequest(req: import("next/server").NextRequest) {
  if (req.method !== "GET" && req.method !== "HEAD") return;
  if (!isPublicAiCrawlerLogPath(req.nextUrl.pathname)) return;

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

/** Everything this middleware does for a request, apart from withAuth's gate. */
function handleRequest(req: NextRequest) {
  const devAuthRedirect = handleDevAuthQueryParams(req);
  if (devAuthRedirect) return devAuthRedirect;

  const requestHeaders = new Headers(req.headers);
  applyOAuthConsentFlowHeader(requestHeaders, req.nextUrl);
  logAiCrawlerRequest(req);

  const assetRedirectPath = getSiteStaticAssetRedirectPath(
    getSiteFromHeaders(requestHeaders),
    req.nextUrl.pathname,
  );
  if (assetRedirectPath) {
    const url = req.nextUrl.clone();
    const [pathname, search = ""] = assetRedirectPath.split("?");
    url.pathname = pathname;
    url.search = search ? `?${search}` : "";
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

const authMiddleware = withAuth(handleRequest, {
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
});

// withAuth returns before it calls the wrapped function when the request is for
// its own sign-in page, so handleRequest never saw ROUTES.signIn: no
// consent-flow header. That page needs no auth gate, so it
// goes to the handler directly.
export default function middleware(req: NextRequest, event: NextFetchEvent) {
  if (req.nextUrl.pathname === ROUTES.signIn) return handleRequest(req);
  return authMiddleware(req as NextRequestWithAuth, event);
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|sitemap.xml|robots.txt|icon|apple-icon|opengraph-image|_error).*)",
    "/api/agent/:path*",
  ],
};

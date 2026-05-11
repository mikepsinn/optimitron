import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
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

// `?login=demo` and `?logout=1` query params let preview-deploy reviewers
// flip between authed (as the demo user) and unauthed views by tweaking
// the URL. `?login=demo` is env-gated to non-production via the API
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
  ],
};

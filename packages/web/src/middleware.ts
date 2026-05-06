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

export default withAuth(
  function middleware(req) {
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

      return syncLocalSiteVariantCookie(
        new NextResponse("Not found", { status: 404 }),
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

import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { ROUTES } from "@/lib/routes";
import { getSiteStaticAssetRedirectPath } from "@/lib/site-assets";
import {
  getSiteFromHeaders,
  getSiteFromHost,
  getSiteRouteDisposition,
  isSiteRouteAllowed,
} from "@/lib/site";

export function isMicrositeAllowed(pathname: string): boolean {
  return isSiteRouteAllowed(getSiteFromHost("1percenttreaty.org"), pathname);
}

export default withAuth(
  function middleware(req) {
    const site = getSiteFromHeaders(req.headers);
    const assetRedirectPath = getSiteStaticAssetRedirectPath(
      site,
      req.nextUrl.pathname,
    );
    if (assetRedirectPath) {
      const url = req.nextUrl.clone();
      const [pathname, search = ""] = assetRedirectPath.split("?");
      url.pathname = pathname;
      url.search = search ? `?${search}` : "";
      return NextResponse.redirect(url, 308);
    }

    const disposition = getSiteRouteDisposition(site, req.nextUrl.pathname);
    if (disposition.type !== "allow") {
      if (disposition.type === "redirect") {
        const url = new URL(disposition.url);
        url.search = req.nextUrl.search;
        // 307 keeps method semantics and avoids long-lived browser/CDN caching of
        // host-routing rules that may flip when site config changes.
        return NextResponse.redirect(url, 307);
      }

      return new NextResponse("Not found", { status: 404 });
    }
    return NextResponse.next();
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

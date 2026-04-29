import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { ROUTES } from "@/lib/routes";
import { getSiteFromHost, isSiteRouteAllowed } from "@/lib/site";

export function isMicrositeAllowed(pathname: string): boolean {
  return isSiteRouteAllowed(getSiteFromHost("1percenttreaty.org"), pathname);
}

export default withAuth(
  function middleware(req) {
    const host = req.headers.get("host");
    const site = getSiteFromHost(host);
    if (!isSiteRouteAllowed(site, req.nextUrl.pathname)) {
      const url = req.nextUrl.clone();
      url.pathname = "/_coalition-404";
      return NextResponse.rewrite(url);
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
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|manifest.json|icon|apple-icon|opengraph-image|twitter-image|_error).*)",
  ],
};

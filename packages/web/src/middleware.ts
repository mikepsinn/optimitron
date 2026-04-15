import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { ROUTES } from "@/lib/routes";
import { isOnePercentTreatyHost } from "@/lib/site";

// Public pages the microsite exposes. Closed-by-default: anything not in
// this list or MICROSITE_OPERATIONAL_PREFIXES is rewritten to /_coalition-404.
const MICROSITE_PUBLIC_PREFIXES = [
  "/treaty",
  "/tasks",
  "/declaration",
  "/endorse",
  "/coalition",
  "/why",
  "/legal",
  "/impact",
  "/organizations",
];

// Operational prefixes that must keep working on the microsite host.
// Note: /api, /_next/*, favicon, etc. are already excluded by the matcher.
const MICROSITE_OPERATIONAL_PREFIXES = [
  "/r",
  "/auth",
  "/dashboard",
  "/profile",
  "/settings",
  "/_coalition-404",
];

const PUBLIC_FILE_PATH_REGEX = /\.[^/]+$/;

function isMicrositeAllowed(pathname: string): boolean {
  if (pathname === "/") return true;
  if (PUBLIC_FILE_PATH_REGEX.test(pathname)) return true;
  const matches = (prefix: string) =>
    pathname === prefix || pathname.startsWith(`${prefix}/`);
  return (
    MICROSITE_PUBLIC_PREFIXES.some(matches) ||
    MICROSITE_OPERATIONAL_PREFIXES.some(matches)
  );
}

export default withAuth(
  function middleware(req) {
    const host = req.headers.get("host");
    if (isOnePercentTreatyHost(host)) {
      if (!isMicrositeAllowed(req.nextUrl.pathname)) {
        const url = req.nextUrl.clone();
        url.pathname = "/_coalition-404";
        return NextResponse.rewrite(url);
      }
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

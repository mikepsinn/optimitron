import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/vote/")) {
    const identifier = pathname.replace("/vote/", "");
    if (identifier) {
      const url = req.nextUrl.clone();
      url.pathname = "/vote";
      url.search = `?ref=${encodeURIComponent(identifier)}`;
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"],
};

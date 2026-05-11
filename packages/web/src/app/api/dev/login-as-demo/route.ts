import { NextResponse } from "next/server";
import { encode } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

// `/api/dev/login-as-demo?next=/some-path` — server-side mints a NextAuth
// session JWT for the demo user (`demo@thinkbynumbers.org`) and sets the
// session cookie, then redirects to `next`. Triggered by the middleware
// when a request arrives with `?login=demo` query param (see
// `packages/web/src/middleware.ts`).
//
// Gated to non-production: returns 404 on prod to ensure the auth-bypass
// surface only exists on preview / dev environments. Preview deploys are
// already auth-gated by Vercel's bypass-cookie system, so the additional
// auth-bypass-as-demo only works for people you've shared a preview with.
//
// Demo user is created on every deploy by managed-data's `syncManagedDemoUser`
// (`packages/db/src/managed-data/managed-demo-user.ts`).

const DEMO_EMAIL = "demo@thinkbynumbers.org";

function isPreviewOrDev(): boolean {
  // Allow-list, not deny-list. Vercel sets NODE_ENV=production on BOTH
  // preview and production deploys, so a "block if NODE_ENV=production"
  // check breaks the feature on the exact environment it's designed for.
  // The only safe approach: explicitly allow only environments we know
  // are non-prod.
  //
  // - Vercel preview deploys: VERCEL_ENV === "preview"
  // - Vercel dev: VERCEL_ENV === "development"
  // - Localhost / generic dev: NODE_ENV === "development" (VERCEL_ENV unset)
  //
  // Anything else (Vercel production, self-hosted prod where neither is
  // explicitly preview/dev) is blocked.
  return (
    process.env.VERCEL_ENV === "preview" ||
    process.env.VERCEL_ENV === "development" ||
    process.env.NODE_ENV === "development"
  );
}

function sanitizeNext(raw: string | null): string {
  if (!raw) return "/";
  // Only relative paths — prevent open-redirect to arbitrary external URLs.
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}

function cookieName(req: Request): string {
  // NextAuth uses `__Secure-next-auth.session-token` over HTTPS,
  // `next-auth.session-token` over HTTP (localhost dev).
  return new URL(req.url).protocol === "https:"
    ? "__Secure-next-auth.session-token"
    : "next-auth.session-token";
}

export async function GET(request: Request) {
  if (!isPreviewOrDev()) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    return new NextResponse(
      "Server misconfiguration: NEXTAUTH_SECRET not set",
      { status: 500, headers: { "content-type": "text/plain" } },
    );
  }

  const url = new URL(request.url);
  const next = sanitizeNext(url.searchParams.get("next"));

  const user = await prisma.user.findUnique({
    where: { email: DEMO_EMAIL },
    select: {
      id: true,
      email: true,
      isAdmin: true,
      personId: true,
      person: {
        select: { displayName: true, handle: true, image: true },
      },
    },
  });
  if (!user) {
    return new NextResponse(
      `Demo user ${DEMO_EMAIL} not found in DB. Managed-data sync should have created it; run \`pnpm db:sync:managed-data --apply\` against this environment's database.`,
      { status: 500, headers: { "content-type": "text/plain" } },
    );
  }

  // Token shape mirrors the jwt callback in src/lib/auth.ts so the session
  // callback reads the same fields a real signed-in user has.
  const token = {
    sub: user.id,
    id: user.id,
    email: user.email,
    name: user.person?.displayName ?? null,
    picture: user.person?.image ?? null,
    handle: user.person?.handle ?? null,
    personId: user.personId,
    isAdmin: user.isAdmin,
  };

  const jwt = await encode({
    token,
    secret,
    maxAge: 30 * 24 * 60 * 60, // 30 days, NextAuth default
  });

  const name = cookieName(request);
  const response = NextResponse.redirect(new URL(next, request.url), 307);
  response.cookies.set({
    name,
    value: jwt,
    httpOnly: true,
    sameSite: "lax",
    secure: name.startsWith("__Secure-"),
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });
  return response;
}

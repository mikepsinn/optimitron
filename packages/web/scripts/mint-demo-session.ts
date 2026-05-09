#!/usr/bin/env tsx
/**
 * mint-demo-session.ts
 *
 * Helper for the copy:preview script. Mints a NextAuth session JWT
 * for the demo user (`m@thinkbynumbers.org` by default) using the
 * NEXTAUTH_SECRET already in .env, so the Playwright script can
 * capture authenticated views without an interactive sign-in.
 *
 * No runtime endpoint involved — JWT is signed offline with the
 * same secret the Next.js app uses to verify it. Zero auth-bypass
 * surface in production.
 *
 * Usage (programmatic):
 *   import { mintDemoSessionCookie } from "./mint-demo-session";
 *   const cookie = await mintDemoSessionCookie();
 *
 * Override the user via env: COPY_PREVIEW_USER_EMAIL=other@example.com
 */

import "./load-env";
import { encode } from "next-auth/jwt";
import { prisma } from "../src/lib/prisma";

const DEMO_EMAIL =
  process.env.COPY_PREVIEW_USER_EMAIL ?? "m@thinkbynumbers.org";

const COOKIE_NAME =
  process.env.NEXTAUTH_URL?.startsWith("https://")
    ? "__Secure-next-auth.session-token"
    : "next-auth.session-token";

export async function mintDemoSessionCookie() {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error(
      "NEXTAUTH_SECRET not set; cannot mint demo session JWT.",
    );
  }

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
    throw new Error(
      `Demo user ${DEMO_EMAIL} not found in DB. Set COPY_PREVIEW_USER_EMAIL or seed the user first.`,
    );
  }

  // Token shape mirrors what the jwt callback in src/lib/auth.ts populates,
  // so the session callback can read everything it expects.
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

  return { name: COOKIE_NAME, value: jwt };
}

// CLI: print the cookie line so you can paste it into curl/devtools.
async function main() {
  const cookie = await mintDemoSessionCookie();
  console.log(`${cookie.name}=${cookie.value}`);
  await prisma.$disconnect();
}

if (
  import.meta.url ===
  `file://${process.argv[1]?.replace(/\\/g, "/")}`
) {
  main().catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
}

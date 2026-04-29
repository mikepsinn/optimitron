/**
 * Single source of truth for static page paths used across e2e tests.
 * Derived from the Next.js app directory so newly added page files are
 * automatically included even if ROUTES has not been updated yet.
 */
import * as fs from "fs";
import * as path from "path";
import { ROUTES } from "@/lib/routes";

const APP_DIR = path.resolve(__dirname, "..", "..", "src", "app");

/** Routes that require authentication (redirect to sign-in when unauthenticated) */
export const AUTH_REQUIRED_PATHS: Set<string> = new Set([
  ROUTES.profile,
  ROUTES.dashboard,
  ROUTES.census,
  ROUTES.checkIn,
  ROUTES.settings,
  ROUTES.transmit,
  "/mcp/authorize",
]);

/** Routes to skip entirely (auth forms, not content pages) */
const SKIP_PATHS: Set<string> = new Set([ROUTES.signIn]);

/**
 * Routes that exist only on the 1percenttreaty.org host. They call
 * `requireReferendumSiteContent(site)` which legitimately 404s on the default
 * Optimitron host (where `contentKey` is `null`). Smoke tests run against
 * 127.0.0.1 which resolves to the Optimitron host, so these routes must be
 * excluded — they're tested separately when host emulation is configured.
 *
 * Keep in sync with `grep -rln requireReferendumSiteContent src/app`.
 */
const REFERENDUM_SITE_ONLY_PATHS: Set<string> = new Set([
  "/coalition",
  "/endorse",
  "/impact",
  "/legal",
  "/why",
]);

function discoverStaticAppPages(
  dir: string,
  segments: string[] = [],
): string[] {
  const pages: string[] = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (
      entry.name.startsWith(".") ||
      entry.name.startsWith("@") ||
      entry.name.startsWith("_")
    ) {
      continue;
    }

    if (entry.isDirectory()) {
      if (entry.name === "api") {
        continue;
      }

      const nextSegments =
        isRouteGroup(entry.name)
          ? segments
          : [...segments, entry.name];

      pages.push(
        ...discoverStaticAppPages(path.join(dir, entry.name), nextSegments),
      );
      continue;
    }

    if (entry.isFile() && entry.name === "page.tsx") {
      if (segments.some(isDynamicSegment)) {
        continue;
      }

      const route = segments.length === 0 ? "/" : `/${segments.join("/")}`;
      pages.push(route);
    }
  }

  return pages;
}

function isDynamicSegment(segment: string): boolean {
  return segment.startsWith("[") && segment.endsWith("]");
}

function isRouteGroup(segment: string): boolean {
  return segment.startsWith("(") && segment.endsWith(")");
}

/** All testable static page paths derived from src/app (excludes sign-in
 * and referendum-site-only pages that 404 on the default Optimitron host) */
export const ALL_PAGE_PATHS: string[] = [...new Set(discoverStaticAppPages(APP_DIR))]
  .filter(
    (pagePath) =>
      !SKIP_PATHS.has(pagePath) && !REFERENDUM_SITE_ONLY_PATHS.has(pagePath),
  )
  .sort((left, right) => left.localeCompare(right));

/** Public page paths only — no authentication required */
export const PUBLIC_PAGE_PATHS: string[] = ALL_PAGE_PATHS.filter(
  (pagePath) => !AUTH_REQUIRED_PATHS.has(pagePath),
);

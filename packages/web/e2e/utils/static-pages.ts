/**
 * Single source of truth for static page paths used across e2e tests.
 * Derived from the Next.js app directory so newly added page files are
 * automatically included even if ROUTES has not been updated yet.
 */
import * as fs from "fs";
import * as path from "path";
import { ROUTES } from "@/lib/routes";
import {
  getEnabledStaticPathsForSite,
  getSiteFromHeaders,
} from "@/lib/site";

const APP_DIR = path.resolve(__dirname, "..", "..", "src", "app");

function getSmokeTestHost() {
  if (!process.env.BASE_URL) return "127.0.0.1:3001";

  try {
    return new URL(process.env.BASE_URL).host;
  } catch {
    return null;
  }
}

const SMOKE_TEST_SITE = getSiteFromHeaders(
  new Headers({ host: getSmokeTestHost() ?? "" }),
);

/** Routes that require authentication (redirect to sign-in when unauthenticated) */
export const AUTH_REQUIRED_PATHS: Set<string> = new Set([
  ROUTES.profile,
  ROUTES.dashboard,
  ROUTES.census,
  ROUTES.checkIn,
  ROUTES.organizations,
  ROUTES.peopleManage,
  ROUTES.plaintiffsManage,
  ROUTES.settings,
  ROUTES.transmit,
  "/mcp/authorize",
]);

const CANDIDATE_REDIRECT_ONLY_PATHS = [ROUTES.impact, ROUTES.politicians];

/** Routes that redirect off-app and should be tested as redirects, not pages. */
export const REDIRECT_ONLY_PATHS: Set<string> = new Set(
  getEnabledStaticPathsForSite(SMOKE_TEST_SITE, CANDIDATE_REDIRECT_ONLY_PATHS),
);

/** Routes to skip entirely (auth forms, redirects, not content pages) */
const SKIP_PATHS: Set<string> = new Set([
  ROUTES.signIn,
  ...REDIRECT_ONLY_PATHS,
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

/** All static page paths enabled for the site under test. */
export const ALL_PAGE_PATHS: string[] = getEnabledStaticPathsForSite(
  SMOKE_TEST_SITE,
  discoverStaticAppPages(APP_DIR).filter(
    (pagePath) => !SKIP_PATHS.has(pagePath),
  ),
);

/** Public page paths only — no authentication required */
export const PUBLIC_PAGE_PATHS: string[] = ALL_PAGE_PATHS.filter(
  (pagePath) => !AUTH_REQUIRED_PATHS.has(pagePath),
);

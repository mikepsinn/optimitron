/**
 * Single source of truth for static page paths used across e2e tests.
 * Derived from ROUTES in routes.ts — add a route there and it's automatically tested.
 */
import { ROUTES } from "@/lib/routes";

/** Routes that require authentication (redirect to sign-in when unauthenticated) */
export const AUTH_REQUIRED_PATHS: Set<string> = new Set([
  ROUTES.profile,
  ROUTES.dashboard,
  ROUTES.census,
  ROUTES.checkIn,
  ROUTES.settings,
  ROUTES.transmit,
]);

/** Routes to skip entirely (auth forms, not content pages) */
const SKIP_PATHS: Set<string> = new Set([ROUTES.signIn]);

/** All testable page paths derived from ROUTES (excludes sign-in) */
export const ALL_PAGE_PATHS: string[] = (
  Object.values(ROUTES) as string[]
).filter((path) => !SKIP_PATHS.has(path));

/** Public page paths only — no authentication required */
export const PUBLIC_PAGE_PATHS: string[] = ALL_PAGE_PATHS.filter(
  (path) => !AUTH_REQUIRED_PATHS.has(path),
);

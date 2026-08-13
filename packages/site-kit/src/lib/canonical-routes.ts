/**
 * Canonical Route Mapping
 *
 * Defines which routes belong to which canonical variant.
 * When a user visits a route that isn't enabled for their current variant,
 * they get redirected to the canonical variant for that content.
 *
 * ARCHITECTURE:
 * - Nav items with routing info are the source of truth (see lib/nav-items.ts)
 * - This file auto-generates canonical routes from nav items
 * - Wildcard patterns and non-nav routes are defined manually below
 *
 * This ensures:
 * 1. Clean separation of specialized content
 * 2. Good SEO (War on Disease is the default public canonical surface)
 * 3. Consistent user experience (clinical content on dfda, advocacy on warondisease)
 */

import { type SiteVariant, VARIANTS, VARIANT_DOMAINS } from './site-variant-types'
import { ROUTES, ROUTE_PATTERNS } from './routes'
import { NAV_ITEMS_MAP, type NavItem } from './nav-items'
import { getSiteConfigForVariant } from './site-config'

/**
 * Routes that are available on ALL variants (never redirect)
 */
const universalRoutes = [
  ROUTES.home,
  ROUTES.about,
  ROUTES.faq,
  ROUTES.privacy,
  ROUTES.terms,
  ROUTES.contact,
  '/auth', // Auth routes are always available
  ROUTES.dashboard,
  // ROUTES.donate - Removed: donate is canonical to acceleratedmedicine.org (see nav-items.ts)
  '/api', // API routes are always available
  ROUTES.stupidQuestions,
]

/**
 * Route patterns and their canonical variants
 */
interface CanonicalRoute {
  /** Route pattern (exact match or prefix with *) */
  pattern: string
  /** The canonical variant for this route */
  canonical: SiteVariant
  /** Which variants are allowed to show this route (including canonical) */
  allowedVariants: readonly SiteVariant[]
}

/**
 * Auto-generate canonical routes from nav items that have routing defined
 */
function getNavItemCanonicalRoutes(): CanonicalRoute[] {
  const routes: CanonicalRoute[] = []

  for (const item of Object.values(NAV_ITEMS_MAP) as NavItem[]) {
    if (item.canonicalVariant && item.allowedVariants) {
      routes.push({
        pattern: item.path,
        canonical: item.canonicalVariant,
        allowedVariants: item.allowedVariants,
      })
    }
  }

  return routes
}

/**
 * Wildcard patterns and non-nav routes (manually defined)
 * These handle dynamic routes like /conditions/[slug] that aren't nav items
 */
const wildcardAndSpecialRoutes: CanonicalRoute[] = [
  // Individual condition/treatment pages → dfda only (list pages defined in nav-items)
  {
    pattern: ROUTE_PATTERNS.conditionsWildcard,
    canonical: VARIANTS.DFDA,
    allowedVariants: [VARIANTS.DFDA],
  },
  {
    pattern: ROUTE_PATTERNS.treatmentsWildcard,
    canonical: VARIANTS.DFDA,
    allowedVariants: [VARIANTS.DFDA],
  },

  // Institutes subpages consolidate on the default public surface
  {
    pattern: ROUTE_PATTERNS.institutesWildcard,
    canonical: VARIANTS.WAR_ON_DISEASE,
    allowedVariants: [VARIANTS.WAR_ON_DISEASE],
  },

  // Campaigns subpages consolidate on the default public surface
  {
    pattern: ROUTE_PATTERNS.campaignsWildcard,
    canonical: VARIANTS.WAR_ON_DISEASE,
    allowedVariants: [VARIANTS.WAR_ON_DISEASE],
  },

  // Wishocracy subpages
  {
    pattern: ROUTE_PATTERNS.wishocracyWildcard,
    canonical: VARIANTS.WISHOCRACY,
    allowedVariants: [VARIANTS.WISHOCRACY],
  },

  // User profiles live on the default public surface
  {
    pattern: ROUTE_PATTERNS.userProfileWildcard,
    canonical: VARIANTS.WAR_ON_DISEASE,
    allowedVariants: [VARIANTS.WAR_ON_DISEASE, VARIANTS.USER],
  },
]

/**
 * All canonical routes (nav items + wildcards + special routes)
 * Wildcards are checked first since they're more specific
 */
const canonicalRoutes: CanonicalRoute[] = [
  ...wildcardAndSpecialRoutes,
  ...getNavItemCanonicalRoutes(),
]

/**
 * Get the base URL for a variant (derived from VARIANT_DOMAINS)
 */
function getVariantBaseUrl(variant: SiteVariant): string {
  return `https://${VARIANT_DOMAINS[variant]}`
}

/**
 * Check if a path matches a pattern
 */
function matchesPattern(path: string, pattern: string): boolean {
  if (pattern.endsWith('*')) {
    // Prefix match
    const prefix = pattern.slice(0, -1)
    return path === prefix || path.startsWith(prefix)
  }
  // Exact match
  return path === pattern
}

/**
 * Check if a route is universal (available on all variants)
 */
function isUniversalRoute(path: string): boolean {
  return universalRoutes.some((route) => {
    if (route.endsWith('*')) {
      return path.startsWith(route.slice(0, -1))
    }
    return path === route || path.startsWith(route + '/')
  })
}

/**
 * Get redirect information for a path on a given variant
 *
 * @param path - The URL path being accessed
 * @param currentVariant - The current site variant
 * @returns Redirect URL if needed, null if route is allowed
 */
export function getCanonicalRedirect(
  path: string,
  currentVariant: SiteVariant
): string | null {
  if (getSiteConfigForVariant(currentVariant).routing?.skipCanonicalRedirects) {
    return null
  }

  // Universal routes never redirect
  if (isUniversalRoute(path)) {
    return null
  }

  // Find matching canonical route
  const matchingRoute = canonicalRoutes.find((route) =>
    matchesPattern(path, route.pattern)
  )

  // If no canonical route defined, allow access (fallback to permissive)
  if (!matchingRoute) {
    return null
  }

  // If current variant is allowed, no redirect needed
  if (matchingRoute.allowedVariants.includes(currentVariant)) {
    return null
  }

  // Redirect to canonical variant
  const canonicalBaseUrl = getVariantBaseUrl(matchingRoute.canonical)
  return `${canonicalBaseUrl}${path}`
}

/**
 * Check if a route is allowed for a variant (for use in sitemap generation)
 */
export function isRouteAllowedForVariant(
  path: string,
  variant: SiteVariant
): boolean {
  if (getSiteConfigForVariant(variant).routing?.skipCanonicalRedirects) {
    return true
  }

  if (isUniversalRoute(path)) {
    return true
  }

  const matchingRoute = canonicalRoutes.find((route) =>
    matchesPattern(path, route.pattern)
  )

  if (!matchingRoute) {
    return true // No restriction defined
  }

  return matchingRoute.allowedVariants.includes(variant)
}

/**
 * Get the canonical variant for a route
 */
export function getCanonicalVariant(path: string): SiteVariant | null {
  const matchingRoute = canonicalRoutes.find((route) =>
    matchesPattern(path, route.pattern)
  )
  return matchingRoute?.canonical || null
}

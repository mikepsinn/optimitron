/**
 * Route Registry - Single Source of Truth
 *
 * All route paths are defined here. Other files (nav-items, sitemap-routes,
 * canonical-routes, components) should import from this file instead of
 * using string literals.
 *
 * This ensures:
 * 1. Type safety - TypeScript catches typos and missing routes
 * 2. Single source of truth - change a path in one place
 * 3. Refactoring support - rename routes with IDE support
 * 4. Build-time validation - catch broken links before production
 */

// =============================================================================
// STATIC ROUTES
// =============================================================================

/**
 * All static (non-parameterized) routes in the application
 */
export const ROUTES = {
  // Core pages
  home: '/',
  about: '/about',
  faq: '/faq',
  privacy: '/privacy',
  terms: '/terms',
  contact: '/contact',

  // Clinical / Treatment pages
  conditions: '/conditions',
  treatments: '/treatments',
  findTrials: '/find-trials',

  // Research / Evidence
  impact: '/impact',
  research: '/research',
  references: '/references',

  // Universal Right to Try education
  montana: '/montana',
  modelAct: '/model-act',
  states: '/states',
  survey: '/survey',

  // Campaign surfaces (warondisease.org)
  // Note: HASH_LINKS.vote ('/#vote') is the sidebar anchor into the home page's
  // vote box; `vote` here is the dedicated vote page, which is where campaign
  // copy links when it says "take 30 seconds".
  vote: '/vote',
  treaty: '/treaty',
  shirt: '/shirt',
  joke: '/joke',
  poster: '/poster',
  doorToDoor: '/door-to-door',
  love: '/love',
  missions: '/missions',
  foundations: '/foundations',
  fixAi: '/fix-ai',
  employees: '/employees',
  signatories: '/signatories',
  join: '/join',
  coalition: '/coalition',
  campaign: '/campaign',
  organizations: '/organizations',
  tasks: '/tasks',
  feedback: '/feedback',
  search: '/search',

  // Movement / Advocacy
  thePlan: '/the-plan',
  soldiers: '/soldiers',
  divisions: '/divisions',
  team: '/team',
  institutes: '/institutes',

  // Court of Humanity (courtofhumanity.org)
  court: '/court',
  humanityVGovernment: '/humanity-v-government',
  plaintiffs: '/plaintiffs',
  plaintiffsManage: '/plaintiffs/manage',

  // Media / Manual
  manual: '/manual',

  // Features
  donate: '/donate',
  donateSuccess: '/donate/success',
  campaigns: '/campaigns',
  campaignsCreate: '/campaigns/create',
  wishocracy: '/wishocracy',
  dfda: '/dfda',
  mcp: '/mcp',
  developers: '/developers',
  developersTools: '/developers/tools',
  surveyDemo: '/survey/demo',

  // Studies (dfda)
  megaStudies: '/mega-studies',
  observationalStudies: '/observational-studies',

  // User / Auth
  dashboard: '/dashboard',
  dashboardSettings: '/dashboard/settings',
  send: '/send',
  profileEdit: '/profile/edit',
  signIn: '/auth/signin',
  signInError: '/auth/error',
  verifyRequest: '/auth/verify-request',
  completeSignup: '/auth/complete-signup',

  // Admin
  adminOrganizations: '/admin/organizations',
  adminUsers: '/admin/users',

  // Other
  presentation: '/presentation',
  webDesign: '/services/web-design',
  stupidQuestions: '/stupid-questions',
} as const

/**
 * Type for all static route paths
 */
export type StaticRoute = (typeof ROUTES)[keyof typeof ROUTES]

/**
 * Type for route keys (useful for iteration)
 */
export type RouteKey = keyof typeof ROUTES

// =============================================================================
// DYNAMIC ROUTE BUILDERS
// =============================================================================

/**
 * Builders for parameterized routes
 * These return properly typed paths with parameters filled in
 */
export const buildRoute = {
  /** /conditions/[conditionSlug] */
  condition: (slug: string) => `${ROUTES.conditions}/${slug}` as const,

  /** /treatments/[treatmentSlug] */
  treatment: (slug: string) => `${ROUTES.treatments}/${slug}` as const,

  /** /conditions/[conditionSlug]/treatments/[treatmentSlug] */
  conditionTreatment: (conditionSlug: string, treatmentSlug: string) =>
    `${ROUTES.conditions}/${conditionSlug}/treatments/${treatmentSlug}` as const,

  /** /campaigns/[slug] */
  campaign: (slug: string) => `${ROUTES.campaigns}/${slug}` as const,

  /** /campaigns/[slug]/edit */
  campaignEdit: (slug: string) => `${ROUTES.campaigns}/${slug}/edit` as const,

  /** /campaigns/[slug]/manage */
  campaignManage: (slug: string) => `${ROUTES.campaigns}/${slug}/manage` as const,

  /** /campaigns/[slug]/pledge */
  campaignPledge: (slug: string) => `${ROUTES.campaigns}/${slug}/pledge` as const,

  /** /u/[username] */
  userProfile: (username: string) => `/u/${username}` as const,

  /** /survey/[slug] */
  survey: (slug: string) => `/survey/${slug}` as const,

  /** /states/[state] */
  state: (slug: string) => `${ROUTES.states}/${slug}` as const,

  /** /organizations/[slug] */
  organization: (slug: string) => `/organizations/${slug}` as const,

  /** /team/[member] */
  teamMember: (member: string) => `${ROUTES.team}/${member}` as const,

  /** /institutes/success */
  institutesSuccess: () => `${ROUTES.institutes}/success` as const,
}

/**
 * Public content pages that should be discoverable on the consolidated
 * warondisease.org surface. This intentionally excludes auth, dashboard,
 * admin, success, and edit/create workflow routes.
 */
export const PUBLIC_PAGE_ROUTES = [
  ROUTES.home,
  ROUTES.about,
  ROUTES.faq,
  ROUTES.privacy,
  ROUTES.terms,
  ROUTES.contact,
  ROUTES.conditions,
  ROUTES.treatments,
  ROUTES.findTrials,
  ROUTES.research,
  ROUTES.references,
  ROUTES.thePlan,
  ROUTES.soldiers,
  ROUTES.divisions,
  ROUTES.team,
  buildRoute.teamMember('mike-p-sinn'),
  ROUTES.institutes,
  ROUTES.manual,
  ROUTES.donate,
  ROUTES.campaigns,
  ROUTES.wishocracy,
  ROUTES.dfda,
  ROUTES.megaStudies,
  ROUTES.observationalStudies,
  ROUTES.presentation,
  ROUTES.webDesign,
  ROUTES.surveyDemo,
] as const

// =============================================================================
// ROUTE PATTERNS (for canonical routing and middleware)
// =============================================================================

/**
 * Pattern constants for route matching
 * Used in canonical-routes.ts for redirect rules
 *
 * These derive from ROUTES to ensure consistency.
 * - Exact patterns: same as ROUTES values
 * - Wildcard patterns: ROUTES value + '*' or '/*'
 */
export const ROUTE_PATTERNS = {
  // Exact matches - derive from ROUTES
  conditions: ROUTES.conditions,
  treatments: ROUTES.treatments,
  findTrials: ROUTES.findTrials,
  research: ROUTES.research,
  references: ROUTES.references,
  thePlan: ROUTES.thePlan,
  soldiers: ROUTES.soldiers,
  divisions: ROUTES.divisions,
  team: ROUTES.team,
  institutes: ROUTES.institutes,
  wishocracy: ROUTES.wishocracy,
  campaigns: ROUTES.campaigns,

  // Wildcard patterns (for matching dynamic segments)
  conditionsWildcard: `${ROUTES.conditions}/*`,
  treatmentsWildcard: `${ROUTES.treatments}/*`,
  institutesWildcard: `${ROUTES.institutes}*`,
  campaignsWildcard: `${ROUTES.campaigns}*`,
  wishocracyWildcard: `${ROUTES.wishocracy}*`,
  userProfileWildcard: '/u/*',
} as const

/**
 * Type for route patterns
 */
export type RoutePattern = (typeof ROUTE_PATTERNS)[keyof typeof ROUTE_PATTERNS]

// =============================================================================
// HASH LINKS (anchor links on pages)
// =============================================================================

/**
 * Hash links that scroll to sections on pages
 */
export const HASH_LINKS = {
  vote: '/#vote',
} as const

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export const NONPROFIT_COALITION_STRATEGY_URL =
  'https://manual.warondisease.org/knowledge/strategy/nonprofit-coalition-strategy'

/**
 * Sign-in URL that returns the visitor to `callbackUrl` afterwards. Used by
 * server components that have to bounce an anonymous visitor, such as the
 * plaintiff-management page.
 */
export function getSignInPath(callbackUrl: string = ROUTES.dashboard): string {
  return `${ROUTES.signIn}?${new URLSearchParams({ callbackUrl }).toString()}`
}

/** `/organizations/{slug}` — an organization's public page. */
export function getOrganizationPath(identifier: string): string {
  return `${ROUTES.organizations}/${identifier}`
}

/**
 * Check if a path is a hash link (contains #)
 */
export function isHashLink(path: string): boolean {
  return path.includes('#')
}

/**
 * Get the base path without hash
 */
export function getBasePath(path: string): string {
  return path.split('#')[0] || '/'
}

/**
 * Check if a path matches a pattern
 * Supports exact match and wildcard (*) suffix
 */
export function matchesPattern(path: string, pattern: string): boolean {
  if (pattern.endsWith('*')) {
    const prefix = pattern.slice(0, -1)
    return path === prefix || path.startsWith(prefix)
  }
  return path === pattern
}

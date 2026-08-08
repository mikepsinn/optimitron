/**
 * Site Variant Type Definitions
 *
 * Minimal file with no dependencies to avoid circular imports.
 * Both site-config.ts, nav-items.ts, and env.ts can safely import from here.
 */

/**
 * Named constants for each variant (for better autocomplete and refactoring)
 */
export const VARIANTS = {
  DIH: 'dih.earth',
  WAR_ON_DISEASE: 'warondisease.org',
  SURVEY: 'trialabundancesurvey.org',
  WISHOCRACY: 'wishocracy.org',
  DFDA: 'dfda',
  USER: 'user',
  CUREDAO: 'curedao.org',
  ACCELERATED_MEDICINE: 'acceleratedmedicine.org',
} as const

/**
 * Site variant type - derived from VARIANTS values
 */
export type SiteVariant = typeof VARIANTS[keyof typeof VARIANTS]

/**
 * All available site variants as array (for validation)
 */
export const SITE_VARIANTS = [
  VARIANTS.DIH,
  VARIANTS.WAR_ON_DISEASE,
  VARIANTS.DFDA,
  VARIANTS.USER,
  VARIANTS.SURVEY,
  VARIANTS.WISHOCRACY,
  VARIANTS.CUREDAO,
  VARIANTS.ACCELERATED_MEDICINE,
] as const

/**
 * Default site variant (used as fallback)
 */
export const DEFAULT_VARIANT: SiteVariant = VARIANTS.WAR_ON_DISEASE

/**
 * Domain for each variant (used for canonical URLs and redirects)
 * This is the public-facing domain, not the variant key.
 */
export const VARIANT_DOMAINS: Record<SiteVariant, string> = {
  [VARIANTS.DIH]: 'dih.earth',
  [VARIANTS.WAR_ON_DISEASE]: 'warondisease.org',
  [VARIANTS.DFDA]: 'dfda.earth',
  [VARIANTS.WISHOCRACY]: 'wishocracy.org',
  [VARIANTS.SURVEY]: 'trialabundancesurvey.org',
  [VARIANTS.CUREDAO]: 'curedao.org',
  [VARIANTS.USER]: 'warondisease.org', // User profiles are on warondisease.org
  [VARIANTS.ACCELERATED_MEDICINE]: 'acceleratedmedicine.org',
}

/**
 * Get the public domain for a variant
 */
export function getVariantDomain(variant: SiteVariant): string {
  return VARIANT_DOMAINS[variant]
}

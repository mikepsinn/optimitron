import { getSiteConfig, getSiteConfigForVariant, SITE_FEATURES } from './site-config'
import { VARIANTS } from './site-variant-types'

/**
 * Check if current variant has voting enabled
 * @returns true if voting is available on this variant
 */
export function hasVotingEnabled(): boolean {
  const config = getSiteConfig()
  return config.enabledFeatures.includes(SITE_FEATURES.VOTING) ||
         config.enabledFeatures.includes(SITE_FEATURES.SURVEY)
}

/**
 * Get the URL to the vote section (homepage with #vote anchor)
 *
 * Returns the appropriate vote destination:
 * - For variants with voting enabled: local homepage (/)
 * - For other variants: redirect to warondisease.org with preserved query params + source tracking
 *
 * This ensures all "Vote" buttons work regardless of which variant you're on.
 *
 * @returns Homepage URL with vote section (either local or warondisease.org) with preserved query params
 */
export function getVoteSectionUrl(): string {
  const config = getSiteConfig()

  // Check if this variant supports voting directly
  const hasVoting = config.enabledFeatures.includes(SITE_FEATURES.VOTING) ||
                    config.enabledFeatures.includes(SITE_FEATURES.SURVEY)

  if (hasVoting) {
    // Same domain - return homepage with #vote anchor and query params preserved
    if (typeof window !== 'undefined') {
      return '/' + window.location.search + '#vote'
    }
    return '/#vote'
  }

  // For variants without voting (dfda, director, user), redirect to War on Disease vote section
  const baseUrl = getSiteConfigForVariant(VARIANTS.WAR_ON_DISEASE).baseUrl + '/'

  // Preserve query params and add source domain for tracking
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search)

    // Add source domain if not already present
    if (!params.has('source')) {
      params.set('source', window.location.hostname)
    }

    if (params.toString()) {
      return baseUrl + '?' + params.toString() + '#vote'
    }
  }

  return baseUrl + '#vote'
}

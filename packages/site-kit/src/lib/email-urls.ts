import { getBaseUrl } from './url'

/**
 * Standard email URLs derived from the current base URL.
 *
 * Use this inside email templates instead of accepting dashboardLink/unsubscribeLink as props.
 * Only user-specific URLs (like referralLink) should remain as props.
 */
export function getEmailUrls() {
  const baseUrl = getBaseUrl()
  return {
    baseUrl,
    dashboardLink: `${baseUrl}/dashboard`,
    unsubscribeLink: `${baseUrl}/unsubscribe`,
  }
}

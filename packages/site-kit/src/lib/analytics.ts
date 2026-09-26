/**
 * Google Analytics 4 event tracking utility
 *
 * Usage:
 *   import { trackEvent } from './analytics'
 *   trackEvent('donation_completed', { amount: 50, type: 'one_time' })
 */

// Extend window type for gtag
declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (
      command: 'event' | 'config' | 'set',
      targetId: string,
      config?: Record<string, unknown>
    ) => void
  }
}

type EventParams = Record<string, string | number | boolean | undefined>

function getGtag(): Window['gtag'] {
  if (typeof window === 'undefined') return undefined
  if (!window.gtag && process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim()) {
    // Preserve early effects until the layout's afterInteractive GA loader runs.
    window.dataLayer = window.dataLayer || []
    window.gtag = function () { window.dataLayer!.push(arguments) }
  }
  return window.gtag
}

/**
 * Track a custom event in Google Analytics
 */
export function trackEvent(eventName: string, params?: EventParams): void {
  try {
    getGtag()?.('event', eventName, params)
  } catch {
    // Analytics delivery must not interrupt the action being measured.
  }
}

// ============================================
// Donation Events
// ============================================

export function trackDonationStarted(params: {
  amount: number
  type: 'one_time' | 'monthly'
  currency?: string
}): void {
  trackEvent('donation_started', {
    value: params.amount,
    donation_type: params.type,
    currency: params.currency || 'USD',
  })
}

export function trackDonationCompleted(params: {
  amount: number
  type: 'one_time' | 'monthly'
  currency?: string
  transactionId?: string
}): void {
  trackEvent('donation_completed', {
    value: params.amount,
    donation_type: params.type,
    currency: params.currency || 'USD',
    transaction_id: params.transactionId,
  })

  // Also track as a purchase for revenue tracking (uses gtag directly for items array)
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'purchase', {
      value: params.amount,
      currency: params.currency || 'USD',
      transaction_id: params.transactionId,
      items: [{
        item_name: params.type === 'monthly' ? 'Monthly Donation' : 'One-Time Donation',
        price: params.amount,
        quantity: 1,
      }],
    })
  }
}

// ============================================
// Vote Events
// ============================================

export type TreatyFunnelStep =
  | 'viewed'
  | 'allocation_submitted'
  | 'answer_selected'
  | 'details_opened'
  | 'verification_requested'

/** UI stages measure intent, never a verified response or a new account. */
export function trackTreatyFunnelStep(step: TreatyFunnelStep): void {
  trackEvent(`treaty_${step}`, { survey_id: 'one-percent-treaty' })
}

type TreatyCompletion = { id: string; response: boolean; referred: boolean }
const completionStorageKey = 'treaty_funnel_completions_v1'
const completionLimit = 100
let recentCompletions: TreatyCompletion[] = []

/**
 * Only the vote API's persisted receipt can complete this funnel. IDs stay in
 * this browser for deduplication; custom event parameters contain no identity,
 * answer, or referral. GA's existing automatic page metadata is separate.
 * Keep at most 100 receipts across reloads/tabs; Web Locks serialize tabs when
 * supported. Private/blocked storage falls back to this page's memory.
 * GA is an observed browser funnel, not the canonical participant count: other
 * devices, cleared/evicted storage, absent GA, and unsupported cross-tab locks
 * limit deduplication/delivery. Use distinct GA users for the view denominator
 * and the existing ReferendumVote/referral database counts for durable totals.
 */
export async function trackTreatyResponseSaved(receipt: {
  responseId: string
  verifiedResponseSaved: boolean
  verifiedReferredParticipant: boolean
}): Promise<void> {
  if (!getGtag() || !receipt.verifiedResponseSaved) return

  const recordCompletion = () => {
    try {
      const stored: unknown = JSON.parse(window.localStorage.getItem(completionStorageKey) || '[]')
      if (Array.isArray(stored)) {
        const valid = stored.filter((item): item is TreatyCompletion =>
          typeof item?.id === 'string' && typeof item.response === 'boolean' && typeof item.referred === 'boolean',
        ).slice(-completionLimit)
        const combined = new Map(recentCompletions.map((item) => [item.id, item]))
        for (const item of valid) {
          const previous = combined.get(item.id)
          combined.set(item.id, {
            id: item.id,
            response: item.response || Boolean(previous?.response),
            referred: item.referred || Boolean(previous?.referred),
          })
        }
        recentCompletions = [...combined.values()].slice(-completionLimit)
      }
    } catch {
      // Analytics storage must never block saving the response.
    }

    const previous = recentCompletions.find(({ id }) => id === receipt.responseId)
    const sendResponse = !previous?.response
    const sendReferral = receipt.verifiedReferredParticipant && !previous?.referred
    const completion = {
      id: receipt.responseId,
      response: true,
      referred: Boolean(previous?.referred || receipt.verifiedReferredParticipant),
    }
    recentCompletions = [...recentCompletions.filter(({ id }) => id !== receipt.responseId), completion]
      .slice(-completionLimit)
    try {
      window.localStorage.setItem(completionStorageKey, JSON.stringify(recentCompletions))
    } catch {
      // Memory still prevents repeated events in this page when storage is blocked.
    }
    if (sendResponse) trackEvent('treaty_response_saved', { survey_id: 'one-percent-treaty' })
    if (sendReferral) trackEvent('treaty_referred_participant', { survey_id: 'one-percent-treaty' })
  }

  try {
    if (window.navigator.locks) {
      await window.navigator.locks.request(completionStorageKey, recordCompletion)
    } else {
      recordCompletion()
    }
  } catch {
    // A blocked analytics transport must not turn a persisted vote into a failed save.
  }
}

export function trackVoteSubmitted(params: {
  voteType: string
  answer: string
  authenticated: boolean
}): void {
  trackEvent('vote_submitted', {
    vote_type: params.voteType,
    answer: params.answer,
    authenticated: params.authenticated,
  })
}

export function trackVoteSynced(params: {
  voteCount: number
}): void {
  trackEvent('vote_synced', {
    vote_count: params.voteCount,
  })
}

// ============================================
// Auth Events
// ============================================

export function trackSignUp(params: {
  method: string
}): void {
  trackEvent('sign_up', {
    method: params.method,
  })
}

export function trackLogin(params: {
  method: string
}): void {
  trackEvent('login', {
    method: params.method,
  })
}

export function trackSocialAccountLinked(params: {
  provider: string
  totalConnected: number
}): void {
  trackEvent('social_account_linked', {
    provider: params.provider,
    total_connected: params.totalConnected,
  })
}

// ============================================
// Sharing Events
// ============================================

export function trackShare(params: {
  method: string
  contentType: string
  itemId?: string
}): void {
  trackEvent('share', {
    method: params.method,
    content_type: params.contentType,
    item_id: params.itemId,
  })
}

export function trackCopyLink(params: {
  contentType: string
  url?: string
}): void {
  trackEvent('copy_link', {
    content_type: params.contentType,
    url: params.url,
  })
}

// ============================================
// Survey/Form Events
// ============================================

export function trackSurveyStarted(params: {
  surveyId: string
  surveyName?: string
}): void {
  trackEvent('survey_started', {
    survey_id: params.surveyId,
    survey_name: params.surveyName,
  })
}

export function trackSurveyCompleted(params: {
  surveyId: string
  surveyName?: string
  responseCount?: number
}): void {
  trackEvent('survey_completed', {
    survey_id: params.surveyId,
    survey_name: params.surveyName,
    response_count: params.responseCount,
  })
}

export function trackFormSubmitted(params: {
  formName: string
  formId?: string
}): void {
  trackEvent('form_submitted', {
    form_name: params.formName,
    form_id: params.formId,
  })
}

// ============================================
// Navigation/Engagement Events
// ============================================

export function trackOutboundLink(params: {
  url: string
  linkText?: string
}): void {
  trackEvent('outbound_link', {
    url: params.url,
    link_text: params.linkText,
  })
}

export function trackCtaClick(params: {
  ctaName: string
  location: string
}): void {
  trackEvent('cta_click', {
    cta_name: params.ctaName,
    location: params.location,
  })
}

export function trackPageScroll(params: {
  percentScrolled: number
  pagePath: string
}): void {
  trackEvent('scroll', {
    percent_scrolled: params.percentScrolled,
    page_path: params.pagePath,
  })
}

// ============================================
// Campaign Events
// ============================================

export function trackCampaignPledge(params: {
  campaignId: string
  campaignName: string
  amount?: number
}): void {
  trackEvent('campaign_pledge', {
    campaign_id: params.campaignId,
    campaign_name: params.campaignName,
    value: params.amount,
  })
}

export function trackCampaignCreated(params: {
  campaignId: string
  campaignName: string
}): void {
  trackEvent('campaign_created', {
    campaign_id: params.campaignId,
    campaign_name: params.campaignName,
  })
}

// ============================================
// Treatment/Condition Search Events
// ============================================

export function trackSearch(params: {
  searchTerm: string
  searchType: 'condition' | 'treatment' | 'trial' | 'general'
  resultsCount?: number
}): void {
  trackEvent('search', {
    search_term: params.searchTerm,
    search_type: params.searchType,
    results_count: params.resultsCount,
  })
}

export function trackTreatmentViewed(params: {
  treatmentId: string
  treatmentName: string
  conditionId?: string
}): void {
  trackEvent('treatment_viewed', {
    treatment_id: params.treatmentId,
    treatment_name: params.treatmentName,
    condition_id: params.conditionId,
  })
}

export function trackConditionViewed(params: {
  conditionId: string
  conditionName: string
}): void {
  trackEvent('condition_viewed', {
    condition_id: params.conditionId,
    condition_name: params.conditionName,
  })
}

// ============================================
// Institute/Partner Events
// ============================================

export function trackInstituteSignupStarted(): void {
  trackEvent('institute_signup_started', {})
}

export function trackInstituteSignupCompleted(params: {
  instituteName: string
}): void {
  trackEvent('institute_signup_completed', {
    institute_name: params.instituteName,
  })
}

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
    gtag?: (
      command: 'event' | 'config' | 'set',
      targetId: string,
      config?: Record<string, unknown>
    ) => void
  }
}

type EventParams = Record<string, string | number | boolean | undefined>

/**
 * Track a custom event in Google Analytics
 */
export function trackEvent(eventName: string, params?: EventParams): void {
  if (typeof window === 'undefined' || !window.gtag) {
    return
  }

  window.gtag('event', eventName, params)
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

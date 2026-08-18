/**
 * Google Analytics 4 event tracking utility
 *
 * Usage:
 *   import { trackEvent } from '@/lib/analytics'
 *   trackEvent('deposit_completed', { amount: 50 })
 */

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

export function trackEvent(eventName: string, params?: EventParams): void {
  if (typeof window === 'undefined' || !window.gtag) {
    return
  }

  window.gtag('event', eventName, params)
}

// ============================================
// Deposit / Prize Events
// ============================================

export function trackDepositStarted(params: {
  amount: number
  currency?: string
}): void {
  trackEvent('deposit_started', {
    value: params.amount,
    currency: params.currency || 'USDC',
  })
}

export function trackDepositCompleted(params: {
  amount: number
  currency?: string
  transactionId?: string
}): void {
  trackEvent('deposit_completed', {
    value: params.amount,
    currency: params.currency || 'USDC',
    transaction_id: params.transactionId,
  })
}

// ============================================
// Vote Events
// ============================================

export function trackSliderSubmitted(params: {
  militaryAllocationPercent: number
  flowVariant?: string
}): void {
  trackEvent('slider_submitted', {
    military_allocation_percent: params.militaryAllocationPercent,
    flow_variant: params.flowVariant,
  })
}

export function trackVoteSubmitted(params: {
  voteType: string
  answer: string
  authenticated: boolean
  flowVariant?: string
  surface?: string
}): void {
  trackEvent('vote_submitted', {
    vote_type: params.voteType,
    answer: params.answer,
    authenticated: params.authenticated,
    flow_variant: params.flowVariant,
    surface: params.surface,
  })
}

// ============================================
// Referral Events
// ============================================

export function trackReferralLinkCopied(params: {
  referralCode: string
}): void {
  trackEvent('referral_link_copied', {
    referral_code: params.referralCode,
  })
}

export function trackReferralShared(params: {
  method: string
  referralCode: string
}): void {
  trackEvent('referral_shared', {
    method: params.method,
    referral_code: params.referralCode,
  })
}

// ============================================
// Treaty Post-Vote Share Flow Events
// ============================================

export function trackTreatyPostVoteScreenAdvanced(params: {
  from: string
  to: string
  dismissive: boolean
  dismissiveCount: number
  sentCount: number
  flowVariant?: string
}): void {
  trackEvent('treaty_post_vote_screen_advanced', {
    from_screen: params.from,
    to_screen: params.to,
    dismissive: params.dismissive,
    dismissive_count: params.dismissiveCount,
    sent_count: params.sentCount,
    flow_variant: params.flowVariant,
  })
}

export function trackTreatyPostVoteDetailsExpanded(params: {
  screen: string
  detailId: string
  flowVariant?: string
}): void {
  trackEvent('treaty_post_vote_details_expanded', {
    screen: params.screen,
    detail_id: params.detailId,
    flow_variant: params.flowVariant,
  })
}

export function trackTreatyPostVoteInvitationAction(params: {
  action: 'copy' | 'send_email' | 'sent_confirmed'
  messageFormat: string
  hasEmail: boolean
  sentCount: number
  flowVariant?: string
}): void {
  trackEvent('treaty_post_vote_invitation_action', {
    action: params.action,
    message_format: params.messageFormat,
    has_email: params.hasEmail,
    sent_count: params.sentCount,
    flow_variant: params.flowVariant,
  })
}

export function trackTreatyPostVoteFormatChoice(params: {
  messageFormat: string
  sentCount: number
  switched: boolean
  flowVariant?: string
}): void {
  trackEvent('treaty_post_vote_format_choice', {
    message_format: params.messageFormat,
    sent_count: params.sentCount,
    switched: params.switched,
    flow_variant: params.flowVariant,
  })
}

export function trackTreatyPostVotePromotion(params: {
  wantsReminder: boolean
  sentCount: number
  flowVariant?: string
}): void {
  trackEvent('treaty_post_vote_promotion', {
    wants_reminder: params.wantsReminder,
    sent_count: params.sentCount,
    flow_variant: params.flowVariant,
  })
}

export function trackTreatyPostVoteFeedback(params: {
  submitted: boolean
  sentCount: number
  characterCount?: number
  flowVariant?: string
}): void {
  trackEvent('treaty_post_vote_feedback', {
    submitted: params.submitted,
    sent_count: params.sentCount,
    character_count: params.characterCount,
    flow_variant: params.flowVariant,
  })
}

export function trackTreatyFlowScreenAdvanced(params: {
  from: string
  to: string
  dismissive: boolean
  dismissiveCount: number
  flowVariant?: string
}): void {
  trackEvent('treaty_flow_screen_advanced', {
    from_screen: params.from,
    to_screen: params.to,
    dismissive: params.dismissive,
    dismissive_count: params.dismissiveCount,
    flow_variant: params.flowVariant,
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
// Comparison / RAPPA Events
// ============================================

export function trackComparisonSubmitted(params: {
  itemA: string
  itemB: string
  winner: string
}): void {
  trackEvent('comparison_submitted', {
    item_a: params.itemA,
    item_b: params.itemB,
    winner: params.winner,
  })
}

export function trackComparisonSessionCompleted(params: {
  allocationCount: number
  jurisdictionId?: string
}): void {
  trackEvent('comparison_session_completed', {
    comparison_count: params.allocationCount,
    jurisdiction_id: params.jurisdictionId,
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

// ============================================
// Search Events
// ============================================

export function trackSearch(params: {
  searchTerm: string
  searchType: 'policy' | 'organization' | 'jurisdiction' | 'general'
  resultsCount?: number
}): void {
  trackEvent('search', {
    search_term: params.searchTerm,
    search_type: params.searchType,
    results_count: params.resultsCount,
  })
}

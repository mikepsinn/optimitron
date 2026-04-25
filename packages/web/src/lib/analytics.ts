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
}): void {
  trackEvent('slider_submitted', {
    military_allocation_percent: params.militaryAllocationPercent,
  })
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
}): void {
  trackEvent('treaty_post_vote_screen_advanced', {
    from_screen: params.from,
    to_screen: params.to,
    dismissive: params.dismissive,
    dismissive_count: params.dismissiveCount,
    sent_count: params.sentCount,
  })
}

export function trackTreatyPostVoteDetailsExpanded(params: {
  screen: string
  detailId: string
}): void {
  trackEvent('treaty_post_vote_details_expanded', {
    screen: params.screen,
    detail_id: params.detailId,
  })
}

export function trackTreatyPostVoteInvitationAction(params: {
  action: 'copy' | 'send_email' | 'sent_confirmed'
  messageFormat: string
  hasEmail: boolean
  sentCount: number
}): void {
  trackEvent('treaty_post_vote_invitation_action', {
    action: params.action,
    message_format: params.messageFormat,
    has_email: params.hasEmail,
    sent_count: params.sentCount,
  })
}

export function trackTreatyPostVoteFormatChoice(params: {
  messageFormat: string
  sentCount: number
  switched: boolean
}): void {
  trackEvent('treaty_post_vote_format_choice', {
    message_format: params.messageFormat,
    sent_count: params.sentCount,
    switched: params.switched,
  })
}

export function trackTreatyPostVoteDepthHook(params: {
  wantsNudge: boolean
  sentCount: number
}): void {
  trackEvent('treaty_post_vote_depth_hook', {
    wants_nudge: params.wantsNudge,
    sent_count: params.sentCount,
  })
}

export function trackTreatyPostVoteFeedback(params: {
  submitted: boolean
  sentCount: number
  characterCount?: number
}): void {
  trackEvent('treaty_post_vote_feedback', {
    submitted: params.submitted,
    sent_count: params.sentCount,
    character_count: params.characterCount,
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

// ============================================
// Reasoning Events
// ============================================

type ReasoningBaseContext = {
  variantSetId: string
  policyDecisionId: string
  localeKey: string
  hostKey: string
  surface: string
}

export function trackReasoningSurveyStarted(params: ReasoningBaseContext & {
  referredBy?: string | null
  relationshipBucket?: string | null
}): void {
  trackEvent('reasoning_survey_started', {
    ...params,
    referredBy: params.referredBy ?? undefined,
    relationshipBucket: params.relationshipBucket ?? undefined,
  })
}

export function trackReasoningChainNodeAdvanced(params: ReasoningBaseContext & {
  nodeId: string
  timeOnNodeMs: number
}): void {
  trackEvent('reasoning_node_advanced', { ...params })
}

export function trackReasoningChainNodeExited(params: ReasoningBaseContext & {
  nodeId: string
  answer: 'yes' | 'no' | 'end-this'
}): void {
  trackEvent('reasoning_node_exited', { ...params })
}

export function trackReasoningObjectionShown(params: ReasoningBaseContext & {
  objectionId: string
}): void {
  trackEvent('reasoning_objection_shown', { ...params })
}

export function trackReasoningObjectionResolved(params: ReasoningBaseContext & {
  objectionId: string
  resolution: 'accepted' | 'still-disagree'
}): void {
  trackEvent('reasoning_objection_resolved', { ...params })
}

export function trackReasoningProbabilityChanged(params: ReasoningBaseContext & {
  nodeId: string
  from: number
  to: number
}): void {
  trackEvent('reasoning_probability_changed', { ...params })
}

export function trackReasoningVote(params: ReasoningBaseContext & {
  chainLength: '90s' | 'deep'
}): void {
  trackEvent('reasoning_vote', { ...params })
}

export function trackReasoningReplicationSendInitiated(params: ReasoningBaseContext & {
  bucket: string
  channel: string
}): void {
  trackEvent('reasoning_replication_send_initiated', { ...params })
}

export function trackReasoningReplicationSendConfirmed(params: ReasoningBaseContext & {
  bucket: string
  channel: string
  msSinceVote: number
}): void {
  trackEvent('reasoning_replication_send_confirmed', { ...params })
}

export function trackReasoningChainReachedFromShare(params: ReasoningBaseContext & {
  attributedToUserId: string | null
  bucket: string | null
}): void {
  trackEvent('reasoning_chain_reached_from_share', {
    ...params,
    attributedToUserId: params.attributedToUserId ?? undefined,
    bucket: params.bucket ?? undefined,
  })
}

export function trackReasoningWalkAway(params: ReasoningBaseContext & {
  exitNodeId: string
}): void {
  trackEvent('reasoning_walk_away', { ...params })
}

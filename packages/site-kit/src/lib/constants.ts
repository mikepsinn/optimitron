import { buildShareMessage, SHARE_COPY } from "./share-copy"

/**
 * LocalStorage key constants
 * ALWAYS use these constants instead of string literals
 */
export const STORAGE_KEYS = {
  SIGNUP_NAME: "signup_name",
  SIGNUP_REFERRAL: "signup_referral",
  SIGNUP_INVITE_TOKEN: "signup_invite_token",
  PENDING_VOTE: "pendingVote",
  PENDING_TRIAL_ABUNDANCE_RESPONSE: "pendingTrialAbundanceResponse",
  MILITARY_ALLOCATION: "militaryAllocation",
  PENDING_ORGANIZATION: "pendingOrganization",
  PENDING_WISHOCRACY: "pendingWishocracy",
  SIGNUP_SUBSCRIBE: "signup_subscribe",
  PUBLIC_PROMPT_DISMISSED: "publicPromptDismissed",
  POST_VOTE_FLOW_STATE: "postVoteFlowState",
  // Key strings match Optimitron's so a reader who endorsed there and then
  // lands on the campaign domain does not lose a queued draft.
  PENDING_ORGANIZATION_ENDORSEMENTS: "pending_organization_endorsements",
  PENDING_ORGANIZATION_ENDORSEMENTS_SYNC_LOCK:
    "pending_organization_endorsements_sync_lock",
  PENDING_REPRESENTED_PEOPLE: "pending_represented_people",
  PENDING_REPRESENTED_PEOPLE_SYNC_LOCK: "pending_represented_people_sync_lock",
} as const

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS]

/**
 * Page element IDs for navigation
 */
export const REFERENDUM_FORM_ID = "vote"

/**
 * Social sharing constants
 * Use these for all share text across the application
 */
export const SHARE_TEXT = {
  /** Default share text (used on dashboard) */
  DEFAULT: SHARE_COPY.socialShareText,
  /** Landing page share text (more descriptive, educational) */
  LANDING: SHARE_COPY.socialShareText,
  /** Default hashtags for social sharing */
  HASHTAGS: "1PercentTreaty,DecentralizedInstitutesOfHealth,WarOnDisease",
  /** Email subject fallback */
  EMAIL_SUBJECT: SHARE_COPY.subject,
  /** Email body fallback (when no text provided) */
  EMAIL_BODY_FALLBACK: (url: string) => buildShareMessage(url),
} as const

/**
 * Email configuration constants
 * Use these for all email-related configuration
 */
export const EMAIL_CONFIG = {
  /** Fallback email address when EMAIL_FROM_ADDRESS env var is not set */
  DEFAULT_FROM_ADDRESS: "no-reply@updates.dfda.earth",
  /** Default display name when EMAIL_FROM_NAME env var is not set */
  DEFAULT_FROM_NAME: "Decentralized Institutes of Health",
} as const

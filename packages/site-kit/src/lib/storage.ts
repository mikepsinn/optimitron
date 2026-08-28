import { STORAGE_KEYS, type StorageKey } from "./constants"

export type PendingOrganizationEndorsementDraft = {
  clientDraftId: string
  description?: string
  organizationName: string
  originUrl?: string
  referendumSlug: string
  statement?: string
  timestamp: string
  version: 1
  website?: string
}

export type PendingOrganizationEndorsementsSyncLock = {
  expiresAt: number
  ownerId: string
}

/**
 * Type-safe localStorage utilities
 * ALWAYS use these instead of calling localStorage directly
 */

/**
 * Get item from localStorage with type safety
 */
export function getStorageItem<T = string>(key: StorageKey): T | null {
  if (typeof window === "undefined") return null

  try {
    const item = localStorage.getItem(key)
    if (!item) return null

    // Try to parse as JSON, otherwise return as string
    try {
      return JSON.parse(item) as T
    } catch {
      return item as T
    }
  } catch (error) {
    console.error(`Error reading from localStorage (${key}):`, error)
    return null
  }
}

/**
 * Set item in localStorage with type safety
 */
export function setStorageItem<T>(key: StorageKey, value: T): void {
  if (typeof window === "undefined") return

  try {
    const stringValue = typeof value === "string" ? value : JSON.stringify(value)
    localStorage.setItem(key, stringValue)
  } catch (error) {
    console.error(`Error writing to localStorage (${key}):`, error)
  }
}

/**
 * Remove item from localStorage
 */
export function removeStorageItem(key: StorageKey): void {
  if (typeof window === "undefined") return

  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.error(`Error removing from localStorage (${key}):`, error)
  }
}

/**
 * Clear all items from localStorage
 */
export function clearStorage(): void {
  if (typeof window === "undefined") return

  try {
    localStorage.clear()
  } catch (error) {
    console.error("Error clearing localStorage:", error)
  }
}

/**
 * Check if a key exists in localStorage
 */
export function hasStorageItem(key: StorageKey): boolean {
  if (typeof window === "undefined") return false

  try {
    return localStorage.getItem(key) !== null
  } catch (error) {
    console.error(`Error checking localStorage (${key}):`, error)
    return false
  }
}

// Typed helper functions for specific storage items

/**
 * A vote staged in localStorage until it can be synced to /api/votes/sync.
 * displayName/firstName/middleName/lastName/makePublic come from the treaty
 * signature box; the sync API updates the voter's Person when present.
 */
export interface PendingVote {
  answer: string
  referredBy: string | null
  inviteToken?: string | null
  timestamp: string
  militaryAllocationPercent?: number
  organizationId?: string | null
  sourceUrl?: string | null
  sourceReferrer?: string | null
  displayName?: string | null
  firstName?: string | null
  middleName?: string | null
  lastName?: string | null
  makePublic?: boolean
}

export const storage = {
  // Signup flow
  getPendingOrganizationEndorsements: () =>
    getStorageItem<PendingOrganizationEndorsementDraft[]>(
      STORAGE_KEYS.PENDING_ORGANIZATION_ENDORSEMENTS,
    ) ?? [],
  setPendingOrganizationEndorsements: (
    data: PendingOrganizationEndorsementDraft[],
  ) => setStorageItem(STORAGE_KEYS.PENDING_ORGANIZATION_ENDORSEMENTS, data),
  addPendingOrganizationEndorsement: (
    draft: PendingOrganizationEndorsementDraft,
  ) => {
    const drafts =
      getStorageItem<PendingOrganizationEndorsementDraft[]>(
        STORAGE_KEYS.PENDING_ORGANIZATION_ENDORSEMENTS,
      ) ?? [];
    setStorageItem(STORAGE_KEYS.PENDING_ORGANIZATION_ENDORSEMENTS, [
      ...drafts.filter((item) => item.clientDraftId !== draft.clientDraftId),
      draft,
    ]);
  },
  removePendingOrganizationEndorsements: (clientDraftIds: string[]) => {
    const ids = new Set(clientDraftIds);
    const drafts =
      getStorageItem<PendingOrganizationEndorsementDraft[]>(
        STORAGE_KEYS.PENDING_ORGANIZATION_ENDORSEMENTS,
      ) ?? [];
    const remaining = drafts.filter((draft) => !ids.has(draft.clientDraftId));
    if (remaining.length > 0) {
      setStorageItem(STORAGE_KEYS.PENDING_ORGANIZATION_ENDORSEMENTS, remaining);
    } else {
      removeStorageItem(STORAGE_KEYS.PENDING_ORGANIZATION_ENDORSEMENTS);
    }
  },
  clearPendingOrganizationEndorsements: () =>
    removeStorageItem(STORAGE_KEYS.PENDING_ORGANIZATION_ENDORSEMENTS),
  getPendingOrganizationEndorsementsSyncLock: () =>
    getStorageItem<PendingOrganizationEndorsementsSyncLock>(
      STORAGE_KEYS.PENDING_ORGANIZATION_ENDORSEMENTS_SYNC_LOCK,
    ),
  setPendingOrganizationEndorsementsSyncLock: (
    lock: PendingOrganizationEndorsementsSyncLock,
  ) =>
    setStorageItem(STORAGE_KEYS.PENDING_ORGANIZATION_ENDORSEMENTS_SYNC_LOCK, lock),
  clearPendingOrganizationEndorsementsSyncLock: () =>
    removeStorageItem(STORAGE_KEYS.PENDING_ORGANIZATION_ENDORSEMENTS_SYNC_LOCK),

  getSignupName: () => getStorageItem<string>(STORAGE_KEYS.SIGNUP_NAME),
  setSignupName: (name: string) => setStorageItem(STORAGE_KEYS.SIGNUP_NAME, name),
  removeSignupName: () => removeStorageItem(STORAGE_KEYS.SIGNUP_NAME),

  getSignupReferral: () => getStorageItem<string>(STORAGE_KEYS.SIGNUP_REFERRAL),
  setSignupReferral: (code: string) => setStorageItem(STORAGE_KEYS.SIGNUP_REFERRAL, code),
  removeSignupReferral: () => removeStorageItem(STORAGE_KEYS.SIGNUP_REFERRAL),

  getSignupInviteToken: () => getStorageItem<string>(STORAGE_KEYS.SIGNUP_INVITE_TOKEN),
  setSignupInviteToken: (token: string) => setStorageItem(STORAGE_KEYS.SIGNUP_INVITE_TOKEN, token),
  removeSignupInviteToken: () => removeStorageItem(STORAGE_KEYS.SIGNUP_INVITE_TOKEN),

  // Subscribe preference
  getSignupSubscribe: () => getStorageItem<boolean>(STORAGE_KEYS.SIGNUP_SUBSCRIBE),
  setSignupSubscribe: (subscribe: boolean) => setStorageItem(STORAGE_KEYS.SIGNUP_SUBSCRIBE, subscribe),
  removeSignupSubscribe: () => removeStorageItem(STORAGE_KEYS.SIGNUP_SUBSCRIBE),

  clearSignupData: () => {
    removeStorageItem(STORAGE_KEYS.SIGNUP_NAME)
    removeStorageItem(STORAGE_KEYS.SIGNUP_REFERRAL)
    removeStorageItem(STORAGE_KEYS.SIGNUP_INVITE_TOKEN)
    removeStorageItem(STORAGE_KEYS.SIGNUP_SUBSCRIBE)
  },

  // Vote flow
  getPendingVote: () => getStorageItem<PendingVote>(STORAGE_KEYS.PENDING_VOTE),
  setPendingVote: (voteData: PendingVote) =>
    setStorageItem(STORAGE_KEYS.PENDING_VOTE, voteData),
  removePendingVote: () => removeStorageItem(STORAGE_KEYS.PENDING_VOTE),

  getPostVoteFlowState: () => getStorageItem<{ dismissedVerification?: boolean; screen?: number; sentCount?: number }>(STORAGE_KEYS.POST_VOTE_FLOW_STATE),
  setPostVoteFlowState: (data: { dismissedVerification?: boolean; screen?: number; sentCount?: number }) =>
    setStorageItem(STORAGE_KEYS.POST_VOTE_FLOW_STATE, data),

  // Vote status cache for logged-in users (expires after 1 hour)
  setVoteStatusCache: (data: { hasVoted: boolean; VotePosition?: string; referralCode?: string }) => {
    if (typeof window === "undefined") return
    try {
      const cacheData = {
        ...data,
        timestamp: Date.now(),
      }
      localStorage.setItem("voteStatusCache", JSON.stringify(cacheData))
    } catch (error) {
      console.error("Failed to cache vote status:", error)
    }
  },

  getVoteStatusCache: () => {
    if (typeof window === "undefined") return null
    try {
      const item = localStorage.getItem("voteStatusCache")
      if (!item) return null

      const cache = JSON.parse(item)
      const ONE_HOUR = 60 * 60 * 1000

      // Check if cache is expired (1 hour)
      if (Date.now() - cache.timestamp > ONE_HOUR) {
        localStorage.removeItem("voteStatusCache")
        return null
      }

      return cache
    } catch (error) {
      console.error("Failed to get vote status cache:", error)
      return null
    }
  },

  clearVoteStatusCache: () => {
    if (typeof window === "undefined") return
    try {
      localStorage.removeItem("voteStatusCache")
    } catch (error) {
      console.error("Failed to clear vote status cache:", error)
    }
  },

  // Post-vote public-profile prompt — once handled (accepted or declined), never show again.
  isPublicPromptDismissed: () => getStorageItem<boolean>(STORAGE_KEYS.PUBLIC_PROMPT_DISMISSED) === true,
  setPublicPromptDismissed: () => setStorageItem(STORAGE_KEYS.PUBLIC_PROMPT_DISMISSED, true),

  // Military allocation
  getMilitaryAllocation: () => getStorageItem<number>(STORAGE_KEYS.MILITARY_ALLOCATION),
  setMilitaryAllocation: (allocation: number) => setStorageItem(STORAGE_KEYS.MILITARY_ALLOCATION, allocation),
  removeMilitaryAllocation: () => removeStorageItem(STORAGE_KEYS.MILITARY_ALLOCATION),

  // Pending organization (for form-first flow)
  getPendingOrganization: () =>
    getStorageItem<{
      name: string
      website?: string
      description?: string
      timestamp: string
    }>(STORAGE_KEYS.PENDING_ORGANIZATION),
  setPendingOrganization: (data: { name: string; website?: string; description?: string; timestamp: string }) =>
    setStorageItem(STORAGE_KEYS.PENDING_ORGANIZATION, data),
  removePendingOrganization: () => removeStorageItem(STORAGE_KEYS.PENDING_ORGANIZATION),

  // Wishocracy flow
  getPendingWishocracy: () =>
    getStorageItem<{
      comparisons: Array<{
        categoryA: string
        categoryB: string
        allocationA: number
        allocationB: number
        timestamp: string
      }>
      currentPairIndex: number
      shuffledPairs: Array<[string, string]> // Store pairs directly as JSON array
      selectedCategories?: string[] // Category IDs user has selected
      startedAt: string
    }>(STORAGE_KEYS.PENDING_WISHOCRACY),
  setPendingWishocracy: (data: {
    comparisons: Array<{
      categoryA: string
      categoryB: string
      allocationA: number
      allocationB: number
      timestamp: string
    }>
    currentPairIndex: number
    shuffledPairs: Array<[string, string]>
    selectedCategories?: string[] // Category IDs user has selected
    startedAt?: string
  }) => setStorageItem(STORAGE_KEYS.PENDING_WISHOCRACY, data),
  removePendingWishocracy: () => removeStorageItem(STORAGE_KEYS.PENDING_WISHOCRACY),
}

import type { WishocraticAllocationInput } from "@/lib/wishocracy-allocation";

const STORAGE_KEYS = {
  signupName: "signup_name",
  signupReferral: "signup_referral",
  signupShareAttempt: "signup_share_attempt",
  signupInviteToken: "signup_invite_token",
  signupSubscribe: "signup_subscribe",
  /// First URL the user landed on, captured ONCE on first page load.
  /// Posted to applyPostSigninSync at first signin and stored as
  /// `User.signupLandingUrl`. Survives the magic-link round-trip because
  /// localStorage persists across page navigations.
  signupLandingUrl: "signup_landing_url",
  pendingWishocracy: "pendingWishocracy",
  pendingTreatyVote: "pending_treaty_vote",
  pendingRepresentedPeople: "pending_represented_people",
  pendingRepresentedPeopleSyncLock: "pending_represented_people_sync_lock",
  voteStatusCache: "vote_status_cache",
  chatApiKey: "opto-chat-api-key",
  chatProvider: "opto-chat-provider",
  declarationSigned: "declaration_signed",
  pendingDeclarationVote: "pending_declaration_vote",
  pendingCourtOfHumanityVote: "pending_court_of_humanity_vote",
  reasoningState: "reasoning_state",
  treatyFlowVariant: "treaty_flow_variant",
} as const;

export type PendingWishocraticAllocation = WishocraticAllocationInput & {
  timestamp: string;
};

export type PendingTreatyVoteState = {
  answer: string;
  referredBy: string | null;
  timestamp: string;
  wishocraticAllocation?: PendingWishocraticAllocation;
  organizationId: string | null;
  orgContextToken?: string | null;
  inviteToken?: string | null;
};

export type VoteStatusCache = {
  hasVoted: boolean;
  voteAnswer: string;
  referralCode: string;
};

export type DeclarationSignedState = {
  signedAt: string;
  name?: string;
};

export type PendingDeclarationVoteState = {
  answer: string;
  timestamp: string;
};

export type PendingCourtOfHumanityVoteState = {
  answer: string;
  referredBy: string | null;
  timestamp: string;
};

export type PendingRepresentedPersonDraft = {
  clientDraftId: string;
  conditionName?: string;
  displayName: string;
  isPublic: boolean;
  lifeStatus?: "DECEASED" | "LIVING" | "UNKNOWN";
  originUrl?: string;
  publicComment?: string;
  referendumSlug: string;
  relationshipType?: string;
  timestamp: string;
  version: 1;
};

export type PendingRepresentedPeopleSyncLock = {
  expiresAt: number;
  ownerId: string;
};

type PendingWishocracyState = {
  allocations: Array<{
    itemAId: string;
    itemBId: string;
    allocationA: number;
    allocationB: number;
    timestamp: string;
  }>;
  currentPairIndex: number;
  shuffledPairs: Array<[string, string]>;
  includedItemIds?: string[];
  startedAt?: string;
};

function getStorageItem<T>(key: string): T | null {
  if (typeof window === "undefined") return null;

  try {
    const item = localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : null;
  } catch {
    return null;
  }
}

function getStringItem(key: string): string | null {
  if (typeof window === "undefined") return null;

  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function getBooleanItem(key: string): boolean | null {
  const value = getStringItem(key);
  if (value === null) {
    return null;
  }

  return value === "true";
}

function setStorageItem<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage failures silently.
  }
}

function setStringItem(key: string, value: string): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore storage failures silently.
  }
}

function setBooleanItem(key: string, value: boolean): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(key, String(value));
  } catch {
    // Ignore storage failures silently.
  }
}

function removeStorageItem(key: string): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore storage failures silently.
  }
}

export const storage = {
  getSignupName: () => getStringItem(STORAGE_KEYS.signupName),
  setSignupName: (name: string) => setStringItem(STORAGE_KEYS.signupName, name),
  clearSignupName: () => removeStorageItem(STORAGE_KEYS.signupName),

  getSignupReferral: () => getStringItem(STORAGE_KEYS.signupReferral),
  setSignupReferral: (code: string) => setStringItem(STORAGE_KEYS.signupReferral, code),
  clearSignupReferral: () => removeStorageItem(STORAGE_KEYS.signupReferral),

  getSignupShareAttempt: () => getStringItem(STORAGE_KEYS.signupShareAttempt),
  setSignupShareAttempt: (shareAttemptId: string) =>
    setStringItem(STORAGE_KEYS.signupShareAttempt, shareAttemptId),
  clearSignupShareAttempt: () => removeStorageItem(STORAGE_KEYS.signupShareAttempt),

  getSignupInviteToken: () => getStringItem(STORAGE_KEYS.signupInviteToken),
  setSignupInviteToken: (inviteToken: string) =>
    setStringItem(STORAGE_KEYS.signupInviteToken, inviteToken),
  clearSignupInviteToken: () => removeStorageItem(STORAGE_KEYS.signupInviteToken),

  getSignupSubscribe: () => getBooleanItem(STORAGE_KEYS.signupSubscribe),
  setSignupSubscribe: (subscribe: boolean) => setBooleanItem(STORAGE_KEYS.signupSubscribe, subscribe),
  clearSignupSubscribe: () => removeStorageItem(STORAGE_KEYS.signupSubscribe),

  /// Returns the FIRST landing URL stored for this browser. Setter is
  /// idempotent: calling setSignupLandingUrl after the value is already
  /// present is a no-op so we never overwrite the original landing.
  getSignupLandingUrl: () => getStringItem(STORAGE_KEYS.signupLandingUrl),
  setSignupLandingUrlIfMissing: (url: string) => {
    if (typeof window === "undefined") return;
    if (getStringItem(STORAGE_KEYS.signupLandingUrl)) return;
    setStringItem(STORAGE_KEYS.signupLandingUrl, url);
  },
  clearSignupLandingUrl: () => removeStorageItem(STORAGE_KEYS.signupLandingUrl),

  clearSignupData: () => {
    removeStorageItem(STORAGE_KEYS.signupName);
    removeStorageItem(STORAGE_KEYS.signupReferral);
    removeStorageItem(STORAGE_KEYS.signupShareAttempt);
    removeStorageItem(STORAGE_KEYS.signupInviteToken);
    removeStorageItem(STORAGE_KEYS.signupSubscribe);
    removeStorageItem(STORAGE_KEYS.signupLandingUrl);
  },

  getChatApiKey: () => getStringItem(STORAGE_KEYS.chatApiKey),
  setChatApiKey: (key: string) => setStringItem(STORAGE_KEYS.chatApiKey, key),

  getChatProvider: () => getStringItem(STORAGE_KEYS.chatProvider),
  setChatProvider: (provider: string) => setStringItem(STORAGE_KEYS.chatProvider, provider),

  getPendingWishocracy: () => getStorageItem<PendingWishocracyState>(STORAGE_KEYS.pendingWishocracy),
  setPendingWishocracy: (data: PendingWishocracyState) =>
    setStorageItem(STORAGE_KEYS.pendingWishocracy, data),
  removePendingWishocracy: () => removeStorageItem(STORAGE_KEYS.pendingWishocracy),

  getPendingTreatyVote: () =>
    getStorageItem<PendingTreatyVoteState>(STORAGE_KEYS.pendingTreatyVote),
  setPendingTreatyVote: (data: PendingTreatyVoteState) =>
    setStorageItem(STORAGE_KEYS.pendingTreatyVote, data),
  removePendingTreatyVote: () => removeStorageItem(STORAGE_KEYS.pendingTreatyVote),

  getPendingRepresentedPeople: () =>
    getStorageItem<PendingRepresentedPersonDraft[]>(
      STORAGE_KEYS.pendingRepresentedPeople,
    ) ?? [],
  setPendingRepresentedPeople: (data: PendingRepresentedPersonDraft[]) =>
    setStorageItem(STORAGE_KEYS.pendingRepresentedPeople, data),
  addPendingRepresentedPerson: (draft: PendingRepresentedPersonDraft) => {
    const drafts =
      getStorageItem<PendingRepresentedPersonDraft[]>(
        STORAGE_KEYS.pendingRepresentedPeople,
      ) ?? [];
    setStorageItem(STORAGE_KEYS.pendingRepresentedPeople, [
      ...drafts.filter((item) => item.clientDraftId !== draft.clientDraftId),
      draft,
    ]);
  },
  removePendingRepresentedPeople: (clientDraftIds: string[]) => {
    const ids = new Set(clientDraftIds);
    const drafts =
      getStorageItem<PendingRepresentedPersonDraft[]>(
        STORAGE_KEYS.pendingRepresentedPeople,
      ) ?? [];
    const remaining = drafts.filter((draft) => !ids.has(draft.clientDraftId));
    if (remaining.length > 0) {
      setStorageItem(STORAGE_KEYS.pendingRepresentedPeople, remaining);
    } else {
      removeStorageItem(STORAGE_KEYS.pendingRepresentedPeople);
    }
  },
  clearPendingRepresentedPeople: () =>
    removeStorageItem(STORAGE_KEYS.pendingRepresentedPeople),
  getPendingRepresentedPeopleSyncLock: () =>
    getStorageItem<PendingRepresentedPeopleSyncLock>(
      STORAGE_KEYS.pendingRepresentedPeopleSyncLock,
    ),
  setPendingRepresentedPeopleSyncLock: (
    lock: PendingRepresentedPeopleSyncLock,
  ) => setStorageItem(STORAGE_KEYS.pendingRepresentedPeopleSyncLock, lock),
  clearPendingRepresentedPeopleSyncLock: () =>
    removeStorageItem(STORAGE_KEYS.pendingRepresentedPeopleSyncLock),

  getDeclarationSigned: () =>
    getStorageItem<DeclarationSignedState>(STORAGE_KEYS.declarationSigned),
  setDeclarationSigned: (data: DeclarationSignedState) =>
    setStorageItem(STORAGE_KEYS.declarationSigned, data),
  removeDeclarationSigned: () => removeStorageItem(STORAGE_KEYS.declarationSigned),

  getPendingDeclarationVote: () =>
    getStorageItem<PendingDeclarationVoteState>(STORAGE_KEYS.pendingDeclarationVote),
  setPendingDeclarationVote: (data: PendingDeclarationVoteState) =>
    setStorageItem(STORAGE_KEYS.pendingDeclarationVote, data),
  removePendingDeclarationVote: () =>
    removeStorageItem(STORAGE_KEYS.pendingDeclarationVote),

  getPendingCourtOfHumanityVote: () =>
    getStorageItem<PendingCourtOfHumanityVoteState>(
      STORAGE_KEYS.pendingCourtOfHumanityVote,
    ),
  setPendingCourtOfHumanityVote: (data: PendingCourtOfHumanityVoteState) =>
    setStorageItem(STORAGE_KEYS.pendingCourtOfHumanityVote, data),
  removePendingCourtOfHumanityVote: () =>
    removeStorageItem(STORAGE_KEYS.pendingCourtOfHumanityVote),

  getVoteStatusCache: () => getStorageItem<VoteStatusCache>(STORAGE_KEYS.voteStatusCache),
  setVoteStatusCache: (data: VoteStatusCache) =>
    setStorageItem(STORAGE_KEYS.voteStatusCache, data),
  clearVoteStatusCache: () => removeStorageItem(STORAGE_KEYS.voteStatusCache),

  getTreatyFlowVariant: () => getStringItem(STORAGE_KEYS.treatyFlowVariant),
  setTreatyFlowVariant: (variant: string) =>
    setStringItem(STORAGE_KEYS.treatyFlowVariant, variant),
  clearTreatyFlowVariant: () => removeStorageItem(STORAGE_KEYS.treatyFlowVariant),

  getReasoningState: () =>
    getStorageItem<ReasoningPersistedState>(STORAGE_KEYS.reasoningState),
  setReasoningState: (data: ReasoningPersistedState) =>
    setStorageItem(STORAGE_KEYS.reasoningState, data),
  clearReasoningState: () =>
    removeStorageItem(STORAGE_KEYS.reasoningState),
};

/**
 * Persisted shape for /reasoning flow state. Mirrors URL params where
 * resumable; URL wins on conflict.
 */
export type ReasoningPersistedState = {
  sessionId: string;
  currentNodeId: string;
  chainDepth: "90s" | "deep";
  answers: Record<string, "yes" | "no">;
  claimProbabilities: Record<string, number>;
  conversionP: number;
  firstSendConfirmed: boolean;
  sendCount: number;
  startedAt: string;
  policyDecisionId: string;
  variantSetId: string;
  variantArmIds: Record<string, string>;
  organizationId: string | null;
  orgContextVerified: boolean;
  orgContextToken: string | null;
  surface: "hosted" | "embed" | "direct-share" | "system-generated-share";
  localeKey: string;
  hostKey: string;
  device: string | null;
  returningVsFirst: "returning" | "first";
  relationshipBucket:
    | "family-partner"
    | "close-friend"
    | "professional"
    | "weak-tie"
    | null;
  referralSource: string | null;
  referredByUserId: string | null;
  shareAttemptId: string | null;
  isControlHoldout: boolean;
  holdoutResolutionLevel:
    | "GLOBAL"
    | "LOCALE"
    | "HOST"
    | "ORG"
    | "BUCKET"
    | "SEGMENT"
    | null;
  audienceTag: string | null;
};

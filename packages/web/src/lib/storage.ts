import type { WishocraticAllocationInput } from "@/lib/wishocracy-allocation";

const STORAGE_KEYS = {
  signupName: "signup_name",
  signupReferral: "signup_referral",
  signupShareAttempt: "signup_share_attempt",
  signupSubscribe: "signup_subscribe",
  pendingWishocracy: "pendingWishocracy",
  pendingTreatyVote: "pending_treaty_vote",
  voteStatusCache: "vote_status_cache",
  chatApiKey: "opto-chat-api-key",
  chatProvider: "opto-chat-provider",
  declarationSigned: "declaration_signed",
  pendingDeclarationVote: "pending_declaration_vote",
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

  getSignupSubscribe: () => getBooleanItem(STORAGE_KEYS.signupSubscribe),
  setSignupSubscribe: (subscribe: boolean) => setBooleanItem(STORAGE_KEYS.signupSubscribe, subscribe),
  clearSignupSubscribe: () => removeStorageItem(STORAGE_KEYS.signupSubscribe),

  clearSignupData: () => {
    removeStorageItem(STORAGE_KEYS.signupName);
    removeStorageItem(STORAGE_KEYS.signupReferral);
    removeStorageItem(STORAGE_KEYS.signupShareAttempt);
    removeStorageItem(STORAGE_KEYS.signupSubscribe);
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

  getVoteStatusCache: () => getStorageItem<VoteStatusCache>(STORAGE_KEYS.voteStatusCache),
  setVoteStatusCache: (data: VoteStatusCache) =>
    setStorageItem(STORAGE_KEYS.voteStatusCache, data),
  clearVoteStatusCache: () => removeStorageItem(STORAGE_KEYS.voteStatusCache),
};

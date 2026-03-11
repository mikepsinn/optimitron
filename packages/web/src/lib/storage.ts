const STORAGE_KEYS = {
  signupName: "signup_name",
  signupReferral: "signup_referral",
  signupSubscribe: "signup_subscribe",
  pendingWishocracy: "pendingWishocracy",
} as const;

type PendingWishocracyState = {
  comparisons: Array<{
    categoryA: string;
    categoryB: string;
    allocationA: number;
    allocationB: number;
    timestamp: string;
  }>;
  currentPairIndex: number;
  shuffledPairs: Array<[string, string]>;
  selectedCategories?: string[];
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
    // Ignore storage failures to keep the vote flow usable.
  }
}

function setStringItem(key: string, value: string): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore storage failures to keep the vote flow usable.
  }
}

function setBooleanItem(key: string, value: boolean): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(key, String(value));
  } catch {
    // Ignore storage failures to keep the vote flow usable.
  }
}

function removeStorageItem(key: string): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore storage failures to keep the vote flow usable.
  }
}

export const storage = {
  getSignupName: () => getStringItem(STORAGE_KEYS.signupName),
  setSignupName: (name: string) => setStringItem(STORAGE_KEYS.signupName, name),
  clearSignupName: () => removeStorageItem(STORAGE_KEYS.signupName),

  getSignupReferral: () => getStringItem(STORAGE_KEYS.signupReferral),
  setSignupReferral: (code: string) => setStringItem(STORAGE_KEYS.signupReferral, code),
  clearSignupReferral: () => removeStorageItem(STORAGE_KEYS.signupReferral),

  getSignupSubscribe: () => getBooleanItem(STORAGE_KEYS.signupSubscribe),
  setSignupSubscribe: (subscribe: boolean) => setBooleanItem(STORAGE_KEYS.signupSubscribe, subscribe),
  clearSignupSubscribe: () => removeStorageItem(STORAGE_KEYS.signupSubscribe),

  clearSignupData: () => {
    removeStorageItem(STORAGE_KEYS.signupName);
    removeStorageItem(STORAGE_KEYS.signupReferral);
    removeStorageItem(STORAGE_KEYS.signupSubscribe);
  },

  getPendingWishocracy: () => getStorageItem<PendingWishocracyState>(STORAGE_KEYS.pendingWishocracy),
  setPendingWishocracy: (data: PendingWishocracyState) =>
    setStorageItem(STORAGE_KEYS.pendingWishocracy, data),
  removePendingWishocracy: () => removeStorageItem(STORAGE_KEYS.pendingWishocracy),
};

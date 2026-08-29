"use client";

/**
 * localStorage staging for a Court of Humanity join started while signed
 * out. Mirrors the monolith's `storage.setPendingCourtOfHumanityVote`
 * contract (same key) so the flow behaves identically: stage the YES vote,
 * send the visitor through email auth, then sync on the next
 * authenticated visit to /court.
 */

const PENDING_COURT_VOTE_KEY = "pending_court_of_humanity_vote";

export interface PendingCourtVote {
  answer: "YES" | "NO";
  displayName?: string;
  makePublic?: boolean;
  referredBy: string | null;
  timestamp: string;
}

export function getPendingCourtVote(): PendingCourtVote | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PENDING_COURT_VOTE_KEY);
    return raw ? (JSON.parse(raw) as PendingCourtVote) : null;
  } catch {
    return null;
  }
}

export function setPendingCourtVote(vote: PendingCourtVote): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PENDING_COURT_VOTE_KEY, JSON.stringify(vote));
  } catch {
    // Storage unavailable (private mode); the visitor re-signs after auth.
  }
}

export function removePendingCourtVote(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(PENDING_COURT_VOTE_KEY);
  } catch {
    // Ignore.
  }
}

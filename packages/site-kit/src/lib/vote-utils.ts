"use client"

import { storage, type PendingVote } from "./storage"
import type { Session } from "next-auth"
import { getUsernameOrReferralCode } from "./referral.client"
import { createLogger } from "./logger"
import { trackTreatyResponseSaved } from "./analytics"

const log = createLogger("vote-utils")
let inFlight: { body: string; promise: Promise<boolean> } | null = null

/**
 * Sync pending vote from localStorage to database
 * 
 * @param session - NextAuth session (optional, used for cache updates)
 * @param onSuccess - Optional callback when sync succeeds
 * @returns Promise that resolves to true if vote was synced, false if no pending vote
 */
export async function syncPendingVote(
  session?: Session | null,
  onSuccess?: () => void
): Promise<boolean> {
  const pendingVote = storage.getPendingVote()
  if (!pendingVote || !["YES", "NO"].includes(pendingVote.answer)) return false

  const body = JSON.stringify(pendingVote)
  if (inFlight) {
    const current = inFlight
    const synced = await current.promise
    if (current.body !== body) return syncPendingVote(session, onSuccess)
    if (synced) onSuccess?.()
    return synced
  }

  const promise = persistPendingVote(pendingVote, body, session)
  inFlight = { body, promise }
  try {
    const synced = await promise
    if (synced) onSuccess?.()
    return synced
  } finally {
    if (inFlight?.promise === promise) inFlight = null
  }
}

async function persistPendingVote(
  pendingVote: PendingVote,
  body: string,
  session?: Session | null,
): Promise<boolean> {
  try {
    const response = await fetch("/api/votes/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    })

    if (response.ok) {
      const result = await response.json()
      // A transport-level success alone is not evidence of a persisted vote.
      if (typeof result?.vote?.id !== "string" || !result.vote.id) return false

      // Do not erase a newer answer entered while this request was in flight.
      if (JSON.stringify(storage.getPendingVote()) === body) storage.removePendingVote()

      const receipt = result.analytics
      if (
        receipt?.responseId === result.vote.id &&
        receipt.verifiedResponseSaved === true &&
        typeof receipt.verifiedReferredParticipant === "boolean"
      ) {
        await trackTreatyResponseSaved(receipt)
      }

      // Update cache with synced vote
      const referralIdentifier = getUsernameOrReferralCode(session?.user)
      if (referralIdentifier) {
        storage.setVoteStatusCache({
          hasVoted: true,
          VotePosition: pendingVote.answer,
          referralCode: referralIdentifier,
        })
      }

      return true
    } else {
      const errorData = await response.json().catch(() => ({}))
      log.error("Failed to sync vote", { error: errorData.error || "Unknown error" })
      return false
    }
  } catch (error) {
    log.error("Failed to sync vote", { error })
    return false
  }
}

"use client"

import { storage } from "./storage"
import type { Session } from "next-auth"
import { getUsernameOrReferralCode } from "./referral.client"
import { createLogger } from "./logger"

const log = createLogger("vote-utils")

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
  if (!pendingVote) return false

  try {
    const response = await fetch("/api/votes/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pendingVote),
    })

    if (response.ok) {
      // Clear pending vote after successful sync
      storage.removePendingVote()

      // Update cache with synced vote
      const referralIdentifier = getUsernameOrReferralCode(session?.user)
      if (referralIdentifier) {
        storage.setVoteStatusCache({
          hasVoted: true,
          VotePosition: pendingVote.answer,
          referralCode: referralIdentifier,
        })
      }

      // Call success callback if provided
      onSuccess?.()

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


"use client"

import type { Session } from "next-auth"

import { createLogger } from "./logger"
import { storage } from "./storage"

const log = createLogger("trial-abundance-survey")

/**
 * Sync the locally staged response after authentication. The server persists
 * the referendum position and allocation in one request. Keep the local copy
 * whenever that request fails so a later page load can retry safely.
 */
export async function syncPendingTrialAbundanceResponse(
  _session?: Session | null,
): Promise<boolean> {
  const pending = storage.getPendingTrialAbundanceResponse()
  if (!pending) return false

  try {
    const response = await fetch("/api/votes/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pending),
    })

    if (!response.ok) {
      const body = await response.json().catch(() => ({}))
      log.error("Failed to sync Trial Abundance response", {
        error: body.error || "Unknown error",
      })
      return false
    }

    storage.removePendingTrialAbundanceResponse()
    return true
  } catch (error) {
    log.error("Failed to sync Trial Abundance response", { error })
    return false
  }
}

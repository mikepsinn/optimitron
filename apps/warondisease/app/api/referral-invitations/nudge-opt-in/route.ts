import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-utils"
import { createLogger } from "@/lib/logger"

const log = createLogger("referral-invitations-nudge-opt-in-api")

/**
 * Sender-nudge cadence fields are not on optimitron ReferralInvitation.
 * Accept the opt-in for dashboard UX; no-op persist.
 */
export async function POST() {
  try {
    await requireAuth()
    return NextResponse.json({ updated: 0, accepted: true }, { status: 200 })
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    log.error("Failed to opt into sender nudges", { error })
    return NextResponse.json({ error: "Failed to save nudge preference" }, { status: 500 })
  }
}

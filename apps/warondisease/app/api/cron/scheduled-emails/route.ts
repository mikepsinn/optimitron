import { NextResponse } from "next/server"
import { createLogger } from "@/lib/logger"
import { env } from "@/lib/env"

export const dynamic = "force-dynamic"
const log = createLogger("scheduled-emails-cron")

/**
 * Cron job for scheduled emails.
 *
 * Full DIH drip (recipientEmailStep, sender nudges, EmailType taxonomy) is not
 * mapped onto optimitron EmailLog (templateId + EmailLogStatus only) yet.
 * Endpoint stays auth-gated and returns a safe no-op until rewritten.
 */
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    log.info("scheduled-emails cron invoked (no-op until drip maps to EmailLog.templateId)")

    return NextResponse.json({
      success: true,
      skipped: true,
      reason:
        "Drip fields / EmailType map deferred; see apps/SCHEMA-GAPS.md and optimitron EmailLog",
      emailsSent: 0,
    })
  } catch (error) {
    log.error("scheduled-emails cron failed", { error })
    return NextResponse.json({ error: "Cron failed" }, { status: 500 })
  }
}

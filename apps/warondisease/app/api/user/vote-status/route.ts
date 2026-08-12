import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth-utils"
import { createLogger } from "@/lib/logger"
import { getUsernameOrReferralCode } from "@/lib/referral.client"
import { getUserTreatyVote } from "@/lib/treaty-votes.server"

const logger = createLogger("api:vote-status")

export async function GET(_req: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({
        hasVoted: false,
        VotePosition: null,
        referralCode: null,
      })
    }

    const vote = await getUserTreatyVote(user.id)

    logger.debug("Vote status check", {
      userId: user.id,
      hasVoted: !!vote,
      answer: vote?.answer,
    })

    return NextResponse.json({
      hasVoted: !!vote,
      VotePosition: vote?.answer || null,
      referralCode: getUsernameOrReferralCode(user),
      votedAt: vote?.createdAt || null,
    })
  } catch (error) {
    logger.error("Error checking vote status:", error)

    return NextResponse.json(
      { error: "Failed to check vote status" },
      { status: 500 },
    )
  }
}

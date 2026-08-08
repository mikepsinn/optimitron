import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendWeeklyUpdate } from "@/lib/email"
import { createLogger } from "@/lib/logger"
import { buildUserReferralUrl, getBaseUrl } from "@/lib/url"
import { getReferralVoteCount } from "@/lib/referral.server"
import { env } from "@/lib/env"
import { GLOBAL_COORDINATION_TARGET_PCT, GLOBAL_POPULATION_2024 } from "@/lib/parameters-calculations-citations"

const logger = createLogger("weekly-emails-cron")

// Verify the request is from Vercel Cron
function isValidCronRequest(request: Request) {
  const authHeader = request.headers.get("authorization")
  const cronSecret = env.CRON_SECRET

  // In production, verify the cron secret
  if (env.NODE_ENV === "production") {
    if (!cronSecret) {
      logger.error("CRON_SECRET not configured")
      return false
    }
    return authHeader === `Bearer ${cronSecret}`
  }

  // In development, allow requests without auth for testing
  return true
}

export async function GET(request: Request) {
  try {
    // Verify this is a legitimate cron request
    if (!isValidCronRequest(request)) {
      logger.warn("Unauthorized cron request attempt")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    logger.info("Starting weekly email cron job")

    // Get all users who have weekly digest enabled and email notifications on
    const users = await prisma.user.findMany({
      where: {
        emailNotifications: true,
        weeklyDigest: true,
        email: {
          not: null as any,
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        referralCode: true,
        _count: {
          select: {
            referrals: true,
          },
        },
      },
    })

    logger.info(`Found ${users.length} users to send weekly emails`)

    // Get global progress
    const totalVotes = await prisma.referendumVote.count()
    const globalPopulation = GLOBAL_POPULATION_2024.value
    const currentProgress = (totalVotes / globalPopulation) * 100
    const targetProgress = GLOBAL_COORDINATION_TARGET_PCT.value * 100

    // Track results
    const results = {
      total: users.length,
      sent: 0,
      failed: 0,
      errors: [] as string[],
    }

    const baseUrl = getBaseUrl()

    // Send emails
    for (const user of users) {
      try {
        // Calculate stats - referrals are Vote records where referredByUserId = user.id
        const totalReferrals = await getReferralVoteCount(user.id)

        // Get referrals from last 7 days
        const oneWeekAgo = new Date()
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
        const newReferrals = await prisma.referendumVote.count({
          where: {
            referredByUserId: user.id,
            createdAt: {
              gte: oneWeekAgo,
            },
          },
        })

        // Calculate rank (simplified - you might want to optimize this)
        const rank = await prisma.user.count({
          where: {
            referrals: {
              some: {},
            },
          },
        })

        const totalShares = await prisma.activity.count({
          where: {
            userId: user.id,
            type: "SHARED_LINK",
          },
        })
        const reach = totalReferrals * 265 // Average social media impressions per referral

        // Generate links
        const referralLink = buildUserReferralUrl(user, baseUrl)
        // Send email
        const result = await sendWeeklyUpdate({
          to: user.email!,
          userName: user.name || "Warrior",
          userEmail: user.email!,
          stats: {
            referrals: totalReferrals,
            newReferrals,
            rank,
            shares: totalShares,
            reach,
          },
          referralLink,
          globalProgress: {
            current: currentProgress,
            target: targetProgress,
          },
        })

        if (result.success) {
          results.sent++
          logger.info(`Sent weekly email to ${user.email}`)
        } else {
          results.failed++
          results.errors.push(`${user.email}: ${result.error}`)
          logger.error(`Failed to send to ${user.email}:`, result.error)
        }
      } catch (error) {
        results.failed++
        const errorMessage = error instanceof Error ? error.message : "Unknown error"
        results.errors.push(`${user.email}: ${errorMessage}`)
        logger.error(`Error processing ${user.email}:`, error)
      }
    }

    logger.info(`Weekly email cron completed: ${results.sent} sent, ${results.failed} failed`)

    return NextResponse.json({
      success: true,
      ...results,
    })
  } catch (error) {
    logger.error("Fatal error in weekly email cron:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

// Allow POST as well (Vercel cron can use either)
export async function POST(request: Request) {
  return GET(request)
}

import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"
import {
  findUserByUsernameOrReferralCode,
  getReferralVoteCount,
} from "@/lib/referral.server"
import { sendReferralConfirmedEmail } from "@/lib/email"
import { getBaseUrl } from "@/lib/url"
import { formatParameter } from "@/lib/format-parameter"
import { VOTER_LIVES_SAVED } from "@/lib/parameters-calculations-citations"
import { createLogger } from "@/lib/logger"
import {
  VotePosition,
  ActivityType,
  NotificationType,
  BadgeType,
  EmailLogStatus,
  ReferralInvitationStatus,
} from "@optimitron/db"
import {
  getUserTreatyVote,
  upsertTreatyVote,
} from "@/lib/treaty-votes.server"
import { applySignatureProfile } from "@/lib/signature-profile.server"

const log = createLogger("votes-sync-api")

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireAuth()

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found - please sign in again" },
        { status: 404 },
      )
    }

    const body = await req.json()
    const {
      answer,
      referredBy,
      inviteToken,
      organizationId,
      sourceUrl,
      sourceReferrer,
      makePublic,
    } = body

    if (!answer || ![VotePosition.YES, VotePosition.NO].includes(answer)) {
      return NextResponse.json({ error: "Invalid vote answer" }, { status: 400 })
    }

    const voteIsPublic = typeof makePublic === "boolean" ? makePublic : undefined

    const existingVote = await getUserTreatyVote(userId)
    const referralInvitation = await findReferralInvitation(inviteToken)

    if (existingVote) {
      const updateData: {
        referredByUserId?: string
        organizationId?: string | null
        isPublic?: boolean
      } = {}

      if ((referredBy || referralInvitation) && !existingVote.referredByUserId) {
        const referrer =
          referralInvitation?.referrer ||
          (await findUserByUsernameOrReferralCode(referredBy))
        if (referrer?.id && referrer.id !== userId) {
          updateData.referredByUserId = referrer.id
        }
      }

      if (organizationId && !existingVote.organizationId) {
        updateData.organizationId = organizationId
      }

      if (voteIsPublic !== undefined && existingVote.isPublic !== voteIsPublic) {
        updateData.isPublic = voteIsPublic
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.referendumVote.update({
          where: { id: existingVote.id },
          data: updateData,
        })
      }

      await applySignatureProfile(userId, body)

      if (
        referralInvitation &&
        referralInvitation.referrerUserId !== userId
      ) {
        await markReferralInvitationConverted({
          referralInvitationId: referralInvitation.id,
          voteId: existingVote.id,
          referrerUserId: referralInvitation.referrerUserId,
        })
      }

      return NextResponse.json(
        { message: "Vote already recorded", vote: existingVote },
        { status: 200 },
      )
    }

    const referrer =
      referralInvitation?.referrer ||
      (await findUserByUsernameOrReferralCode(referredBy))
    const referrerUserId =
      referrer?.id && referrer.id !== userId ? referrer.id : null
    const canUseInvitation =
      referralInvitation &&
      referralInvitation.referrerUserId !== userId

    const cleanUrl =
      typeof sourceUrl === "string"
        ? sourceUrl.split(/[?#]/)[0].slice(0, 512)
        : null
    // Prefer full origin URL for forensics when present
    const originUrl =
      cleanUrl ||
      (typeof sourceReferrer === "string"
        ? sourceReferrer.split(/[?#]/)[0].slice(0, 512)
        : null)

    const vote = await upsertTreatyVote({
      userId,
      answer: answer as VotePosition,
      referredByUserId: referrerUserId,
      organizationId: organizationId || null,
      originUrl,
      isPublic: voteIsPublic,
    })

    await applySignatureProfile(userId, body)

    await prisma.activity.create({
      data: {
        userId,
        type: ActivityType.VOTED_REFERENDUM,
        description: "",
        metadata: JSON.stringify({
          answer,
          referredBy: referredBy || null,
          inviteToken: inviteToken || null,
        }),
      },
    })

    if (canUseInvitation && referrerUserId) {
      await markReferralInvitationConverted({
        referralInvitationId: referralInvitation!.id,
        voteId: vote.id,
        referrerUserId,
      })
    }

    if (referrerUserId) {
      await prisma.activity.create({
        data: {
          userId: referrerUserId,
          type: ActivityType.RECRUITED_VOTER,
          description: "",
          metadata: JSON.stringify({ answer, referredUserId: userId }),
        },
      })

      await prisma.notification.create({
        data: {
          userId: referrerUserId,
          type: NotificationType.REFERRAL_SIGNUP,
          title: "New Referral!",
          message: `Someone signed up using your referral link and voted ${answer}!`,
          link: "/dashboard",
        },
      })

      const referralCount = await getReferralVoteCount(referrerUserId)
      const badgeMilestones = [
        { count: 1, type: BadgeType.FIRST_RECRUIT, name: "First Referral" },
        { count: 10, type: BadgeType.TEN_RECRUITS, name: "Ten Referrals" },
      ]

      for (const milestone of badgeMilestones) {
        if (referralCount === milestone.count) {
          await prisma.badge.create({
            data: {
              userId: referrerUserId,
              type: milestone.type,
            },
          })

          await prisma.notification.create({
            data: {
              userId: referrerUserId,
              type: NotificationType.BADGE_EARNED,
              title: "Service Medal Earned!",
              message: `Congratulations! You've earned the ${milestone.name} medal!`,
              link: "/dashboard",
            },
          })

          await prisma.activity.create({
            data: {
              userId: referrerUserId,
              type: ActivityType.EARNED_BADGE,
              description: "",
              metadata: JSON.stringify({ badgeType: milestone.type }),
            },
          })
        }
      }
    }

    return NextResponse.json({ success: true, vote }, { status: 200 })
  } catch (error) {
    log.error("Error syncing vote", { error })

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const errorMessage =
      error instanceof Error ? error.message : "Failed to sync vote"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

async function findReferralInvitation(inviteToken: unknown) {
  if (typeof inviteToken !== "string" || inviteToken.length === 0) {
    return null
  }

  return prisma.referralInvitation.findUnique({
    where: { inviteToken },
    include: {
      referrer: {
        select: {
          id: true,
          email: true,
          newsletterSubscribed: true,
          person: {
            select: {
              displayName: true,
            },
          },
        },
      },
    },
  })
}

async function markReferralInvitationConverted({
  referralInvitationId,
  voteId,
  referrerUserId,
}: {
  referralInvitationId: string
  voteId: string
  referrerUserId: string
}) {
  const invitation = await prisma.referralInvitation.findUnique({
    where: { id: referralInvitationId },
    include: {
      referrer: {
        select: {
          email: true,
          newsletterSubscribed: true,
          person: {
            select: {
              displayName: true,
            },
          },
        },
      },
    },
  })

  if (
    !invitation ||
    invitation.status === ReferralInvitationStatus.CONVERTED ||
    invitation.convertedVoteId
  ) {
    return
  }

  await prisma.referralInvitation.update({
    where: { id: referralInvitationId },
    data: {
      status: ReferralInvitationStatus.CONVERTED,
      convertedAt: new Date(),
      convertedVoteId: voteId,
    },
  })

  if (invitation.referrer.email && invitation.referrer.newsletterSubscribed) {
    const confirmedVotes = await getReferralVoteCount(referrerUserId)
    const pendingInvitations = await prisma.referralInvitation.count({
      where: {
        referrerUserId: referrerUserId,
        status: {
          in: [
            ReferralInvitationStatus.PENDING,
            ReferralInvitationStatus.COPIED,
            ReferralInvitationStatus.SENT,
          ],
        },
      },
    })
    const confirmedLives = formatParameter(
      {
        ...VOTER_LIVES_SAVED,
        value: VOTER_LIVES_SAVED.value * confirmedVotes,
      },
      { precision: 1 },
    )
    const pendingLives = formatParameter(
      {
        ...VOTER_LIVES_SAVED,
        value: VOTER_LIVES_SAVED.value * pendingInvitations,
      },
      { precision: 1 },
    )
    const dashboardUrl = `${getBaseUrl()}/dashboard`
    const result = await sendReferralConfirmedEmail({
      to: invitation.referrer.email,
      recipientName: invitation.recipientName,
      confirmedLives,
      pendingLives,
      dashboardUrl,
    })

    if (result.success && result.data) {
      await prisma.emailLog
        .create({
          data: {
            userId: referrerUserId,
            toAddress: invitation.referrer.email,
            subject: `${invitation.recipientName} just voted`,
            templateId: "referral-confirmed",
            status: EmailLogStatus.SENT,
            providerMessageId:
              (result.data as { data?: { id?: string }; id?: string }).data
                ?.id ??
              (result.data as { id?: string }).id ??
              null,
          },
        })
        .catch((error: unknown) => {
          log.warn("Failed to log referral confirmation email", {
            error,
            referralInvitationId,
          })
        })
    }
  }
}

import {
  ActivityType,
  ensureWishocraticItemsExist,
  ReferendumStatus,
  ReferendumVoteSource,
  ReferralInvitationStatus,
  TRIAL_ABUNDANCE_REFERENDUM_SLUG,
  VotePosition,
} from "@optimitron/db"

import { requireAuth } from "@/lib/auth-utils"
import { ensurePersonForUser } from "@/lib/person.server"
import { prisma } from "@/lib/prisma"
import { findUserByUsernameOrReferralCode } from "@/lib/referral.server"
import type { TrialAbundanceResponseInput } from "./trial-abundance-response"

const MILITARY_ITEM_ID = "MILITARY_OPERATIONS"
const PRAGMATIC_TRIALS_ITEM_ID = "PRAGMATIC_CLINICAL_TRIALS"

function cleanOriginUrl(value: string | null | undefined): string | null {
  if (!value) return null

  try {
    const url = new URL(value)
    return `${url.origin}${url.pathname}`.slice(0, 512)
  } catch {
    return null
  }
}

export async function saveTrialAbundanceResponse(
  input: TrialAbundanceResponseInput,
) {
  const { userId } = await requireAuth()
  const referendum = await prisma.referendum.findUnique({
    where: { slug: TRIAL_ABUNDANCE_REFERENDUM_SLUG },
  })

  if (!referendum || referendum.deletedAt) {
    throw new Error("Trial Abundance referendum is not available")
  }
  if (referendum.status !== ReferendumStatus.ACTIVE) {
    throw new Error("Trial Abundance referendum is not accepting responses")
  }

  await ensureWishocraticItemsExist(prisma, [
    MILITARY_ITEM_ID,
    PRAGMATIC_TRIALS_ITEM_ID,
  ])

  const person = await ensurePersonForUser(userId)
  const existingVote = await prisma.referendumVote.findUnique({
    where: {
      referendumId_personId: {
        referendumId: referendum.id,
        personId: person.id,
      },
    },
  })
  const invitation = input.inviteToken
    ? await prisma.referralInvitation.findUnique({
        where: { inviteToken: input.inviteToken },
        select: {
          convertedVoteId: true,
          id: true,
          referendumId: true,
          referrerUserId: true,
          status: true,
        },
      })
    : null
  const usableInvitation =
    invitation &&
    (invitation.referendumId === null ||
      invitation.referendumId === referendum.id) &&
    invitation.referrerUserId !== userId
      ? invitation
      : null
  const directReferrer = await findUserByUsernameOrReferralCode(input.referredBy)
  const referredByUserId =
    usableInvitation?.referrerUserId ??
    (directReferrer?.id && directReferrer.id !== userId
      ? directReferrer.id
      : null)
  const organization = input.organizationId
    ? await prisma.organization.findUnique({
        where: { id: input.organizationId },
        select: { id: true },
      })
    : null
  const originUrl =
    cleanOriginUrl(input.sourceUrl) ?? cleanOriginUrl(input.sourceReferrer)

  const vote = await prisma.$transaction(async (transaction) => {
    const savedVote = await transaction.referendumVote.upsert({
      where: {
        referendumId_personId: {
          referendumId: referendum.id,
          personId: person.id,
        },
      },
      update: {
        answer: input.answer as VotePosition,
        deletedAt: null,
        userId,
        voteSource: ReferendumVoteSource.SELF,
        ...(!existingVote?.referredByUserId && referredByUserId
          ? { referredByUserId }
          : {}),
        ...(!existingVote?.organizationId && organization
          ? { organizationId: organization.id }
          : {}),
      },
      create: {
        answer: input.answer as VotePosition,
        organizationId: organization?.id ?? null,
        originUrl,
        personId: person.id,
        referendumId: referendum.id,
        referredByUserId,
        userId,
        voteSource: ReferendumVoteSource.SELF,
      },
    })

    await transaction.wishocraticAllocation.upsert({
      where: {
        userId_itemAId_itemBId: {
          itemAId: MILITARY_ITEM_ID,
          itemBId: PRAGMATIC_TRIALS_ITEM_ID,
          userId,
        },
      },
      update: {
        allocationA: input.militaryAllocationPercent,
        allocationB: 100 - input.militaryAllocationPercent,
        deletedAt: null,
      },
      create: {
        allocationA: input.militaryAllocationPercent,
        allocationB: 100 - input.militaryAllocationPercent,
        itemAId: MILITARY_ITEM_ID,
        itemBId: PRAGMATIC_TRIALS_ITEM_ID,
        userId,
      },
    })

    if (!existingVote) {
      await transaction.activity.create({
        data: {
          description: "Completed the Trial Abundance Survey",
          metadata: JSON.stringify({
            answer: input.answer,
            militaryAllocationPercent: input.militaryAllocationPercent,
          }),
          type: ActivityType.VOTED_REFERENDUM,
          userId,
        },
      })
    }

    if (
      usableInvitation &&
      usableInvitation.status !== ReferralInvitationStatus.CONVERTED &&
      !usableInvitation.convertedVoteId
    ) {
      await transaction.referralInvitation.update({
        where: { id: usableInvitation.id },
        data: {
          convertedAt: new Date(),
          convertedVoteId: savedVote.id,
          status: ReferralInvitationStatus.CONVERTED,
        },
      })
    }

    return savedVote
  })

  return { vote }
}

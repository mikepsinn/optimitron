import {
  ActivityType,
  ensureWishocraticItemsExist,
  ReferendumStatus,
  ReferendumVoteSource,
  ReferralInvitationStatus,
  TRIAL_ABUNDANCE_REFERENDUM_SLUG,
  TRIAL_ABUNDANCE_SELF_FUNDED_ACCESS_REFERENDUM_SLUG,
  VotePosition,
} from "@optimitron/db"

import { requireAuth } from "./auth-utils"
import { ensurePersonForUser } from "./person.server"
import { prisma } from "./prisma"
import { findUserByUsernameOrReferralCode } from "./referral.server"
import type { TrialAbundanceResponseInput } from "./trial-abundance-response"
import { getTrialAbundanceFormRevision, getSurveySubmissionIdentity, saveSurveySubmission } from "./trial-abundance-submission.server"

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
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { id: true, email: true } })
  const referendums = await prisma.referendum.findMany({
    where: {
      slug: {
        in: [
          TRIAL_ABUNDANCE_REFERENDUM_SLUG,
          TRIAL_ABUNDANCE_SELF_FUNDED_ACCESS_REFERENDUM_SLUG,
        ],
      },
    },
  })
  const patientAccessReferendum = referendums.find(
    ({ slug }) => slug === TRIAL_ABUNDANCE_REFERENDUM_SLUG,
  )
  const selfFundedAccessReferendum = referendums.find(
    ({ slug }) =>
      slug === TRIAL_ABUNDANCE_SELF_FUNDED_ACCESS_REFERENDUM_SLUG,
  )

  if (
    !patientAccessReferendum ||
    patientAccessReferendum.deletedAt ||
    !selfFundedAccessReferendum ||
    selfFundedAccessReferendum.deletedAt
  ) {
    throw new Error("Trial Abundance referendums are not available")
  }
  if (
    patientAccessReferendum.status !== ReferendumStatus.ACTIVE ||
    selfFundedAccessReferendum.status !== ReferendumStatus.ACTIVE
  ) {
    throw new Error("Trial Abundance referendums are not accepting responses")
  }

  await ensureWishocraticItemsExist(prisma, [
    MILITARY_ITEM_ID,
    PRAGMATIC_TRIALS_ITEM_ID,
  ])

  const person = await ensurePersonForUser(userId)
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
      invitation.referendumId === patientAccessReferendum.id ||
      invitation.referendumId === selfFundedAccessReferendum.id) &&
    invitation.referrerUserId !== userId
      ? invitation
      : null
  const directReferrer = await findUserByUsernameOrReferralCode(input.referredBy)
  const directReferrerUserId =
    directReferrer?.id && directReferrer.id !== userId
      ? directReferrer.id
      : null
  const organization = input.organizationId
    ? await prisma.organization.findUnique({
        where: { id: input.organizationId },
        select: { id: true },
      })
    : null
  const originUrl =
    cleanOriginUrl(input.sourceUrl) ?? cleanOriginUrl(input.sourceReferrer)
  const revision = await getTrialAbundanceFormRevision()
  const identity = getSurveySubmissionIdentity(input)

  const votes = await prisma.$transaction(async (transaction) => {
    await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`trial-abundance:${userId}`}, 0))`
    const existingSubmission = await transaction.formSubmission.findUnique({
      where: { createdByUserId_idempotencyKey: { createdByUserId: userId, idempotencyKey: identity.idempotencyKey } },
    })
    if (existingSubmission) {
      if (existingSubmission.requestHash !== identity.requestHash) throw new Error("Submission key already used")
      return { submissionId: existingSubmission.id }
    }
    const existingVotes = await transaction.referendumVote.findMany({
      where: {
        personId: person.id,
        referendumId: { in: [patientAccessReferendum.id, selfFundedAccessReferendum.id] },
      },
    })
    const existingPatientAccessVote = existingVotes.find(
      ({ referendumId }) => referendumId === patientAccessReferendum.id,
    )
    const existingSelfFundedAccessVote = existingVotes.find(
      ({ referendumId }) => referendumId === selfFundedAccessReferendum.id,
    )
    const claimedInvitation =
      usableInvitation &&
      usableInvitation.status !== ReferralInvitationStatus.CONVERTED &&
      !usableInvitation.convertedVoteId &&
      (
        await transaction.referralInvitation.updateMany({
          where: {
            convertedVoteId: null,
            id: usableInvitation.id,
            status: { not: ReferralInvitationStatus.CONVERTED },
          },
          data: {
            convertedAt: new Date(),
            status: ReferralInvitationStatus.CONVERTED,
          },
        })
      ).count === 1
    const referredByUserId = claimedInvitation
      ? usableInvitation.referrerUserId
      : directReferrerUserId

    const patientAccessVote = await transaction.referendumVote.upsert({
      where: {
        referendumId_personId: {
          referendumId: patientAccessReferendum.id,
          personId: person.id,
        },
      },
      update: {
        answer: input.patientAccessAnswer as VotePosition,
        deletedAt: null,
        userId,
        voteSource: ReferendumVoteSource.SELF,
        ...(!existingPatientAccessVote?.referredByUserId && referredByUserId
          ? { referredByUserId }
          : {}),
        ...(!existingPatientAccessVote?.organizationId && organization
          ? { organizationId: organization.id }
          : {}),
      },
      create: {
        answer: input.patientAccessAnswer as VotePosition,
        organizationId: organization?.id ?? null,
        originUrl,
        personId: person.id,
        referendumId: patientAccessReferendum.id,
        referredByUserId,
        userId,
        voteSource: ReferendumVoteSource.SELF,
      },
    })
    const selfFundedAccessVote = await transaction.referendumVote.upsert({
      where: {
        referendumId_personId: {
          referendumId: selfFundedAccessReferendum.id,
          personId: person.id,
        },
      },
      update: {
        answer: input.selfFundedAccessAnswer as VotePosition,
        deletedAt: null,
        userId,
        voteSource: ReferendumVoteSource.SELF,
        ...(!existingSelfFundedAccessVote?.referredByUserId && referredByUserId
          ? { referredByUserId }
          : {}),
        ...(!existingSelfFundedAccessVote?.organizationId && organization
          ? { organizationId: organization.id }
          : {}),
      },
      create: {
        answer: input.selfFundedAccessAnswer as VotePosition,
        organizationId: organization?.id ?? null,
        originUrl,
        personId: person.id,
        referendumId: selfFundedAccessReferendum.id,
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

    if (!existingPatientAccessVote && !existingSelfFundedAccessVote) {
      await transaction.activity.create({
        data: {
          description: "Completed the Trial Abundance Survey",
          metadata: JSON.stringify({
            militaryAllocationPercent: input.militaryAllocationPercent,
            patientAccessAnswer: input.patientAccessAnswer,
            selfFundedAccessAnswer: input.selfFundedAccessAnswer,
          }),
          type: ActivityType.VOTED_REFERENDUM,
          userId,
        },
      })
    }

    if (claimedInvitation) {
      await transaction.referralInvitation.update({
        where: { id: usableInvitation.id },
        data: {
          convertedVoteId:
            usableInvitation.referendumId === selfFundedAccessReferendum.id
              ? selfFundedAccessVote.id
              : patientAccessVote.id,
        },
      })
    }

    const submission = await saveSurveySubmission(transaction, input, user, person, revision)
    return { patientAccessVote, selfFundedAccessVote, submissionId: submission.id }
  })

  return { votes }
}

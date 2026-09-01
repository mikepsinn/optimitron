import {
  TRIAL_ABUNDANCE_REFERENDUM_SLUG,
  TRIAL_ABUNDANCE_SELF_FUNDED_ACCESS_REFERENDUM_SLUG,
} from "@optimitron/db"

import { prisma } from "./prisma"

const MILITARY_ITEM_ID = "MILITARY_OPERATIONS"
const PRAGMATIC_TRIALS_ITEM_ID = "PRAGMATIC_CLINICAL_TRIALS"

export async function getUserTrialAbundanceVote(userId: string) {
  const referendum = await prisma.referendum.findUnique({
    where: { slug: TRIAL_ABUNDANCE_REFERENDUM_SLUG },
    select: { id: true },
  })
  if (!referendum) return null

  return prisma.referendumVote.findFirst({
    where: {
      deletedAt: null,
      referendumId: referendum.id,
      userId,
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function getUserTrialAbundanceSelfFundedAccessVote(
  userId: string,
) {
  const referendum = await prisma.referendum.findUnique({
    where: { slug: TRIAL_ABUNDANCE_SELF_FUNDED_ACCESS_REFERENDUM_SLUG },
    select: { id: true },
  })
  if (!referendum) return null

  return prisma.referendumVote.findFirst({
    where: {
      deletedAt: null,
      referendumId: referendum.id,
      userId,
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function getUserTrialAbundanceAllocation(userId: string) {
  return prisma.wishocraticAllocation.findUnique({
    where: {
      userId_itemAId_itemBId: {
        itemAId: MILITARY_ITEM_ID,
        itemBId: PRAGMATIC_TRIALS_ITEM_ID,
        userId,
      },
    },
  })
}

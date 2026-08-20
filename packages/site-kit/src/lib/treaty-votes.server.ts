import {
  type VotePosition,
  ReferendumStatus,
  ReferendumVoteSource,
} from "@optimitron/db"
import { prisma } from "./prisma"
import { ensurePersonForUser } from "./person.server"
import { TREATY_REFERENDUM_SLUG } from "./treaty"

export async function getTreatyReferendum() {
  const referendum = await prisma.referendum.findUnique({
    where: { slug: TREATY_REFERENDUM_SLUG },
  })
  if (!referendum || referendum.deletedAt) {
    throw new Error(
      `Treaty referendum "${TREATY_REFERENDUM_SLUG}" is not seeded in the database`,
    )
  }
  return referendum
}

export async function getUserTreatyVote(userId: string) {
  const referendum = await prisma.referendum.findUnique({
    where: { slug: TREATY_REFERENDUM_SLUG },
    select: { id: true },
  })
  if (!referendum) return null

  return prisma.referendumVote.findFirst({
    where: {
      userId,
      referendumId: referendum.id,
      deletedAt: null,
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function countTreatyVotes(where: {
  referredByUserId?: string
  organizationId?: string
} = {}) {
  const referendum = await prisma.referendum.findUnique({
    where: { slug: TREATY_REFERENDUM_SLUG },
    select: { id: true },
  })
  if (!referendum) return 0

  return prisma.referendumVote.count({
    where: {
      referendumId: referendum.id,
      deletedAt: null,
      voteSource: ReferendumVoteSource.SELF,
      ...(where.referredByUserId
        ? { referredByUserId: where.referredByUserId }
        : {}),
      ...(where.organizationId ? { organizationId: where.organizationId } : {}),
    },
  })
}

export async function upsertTreatyVote(input: {
  userId: string
  answer: VotePosition
  referredByUserId?: string | null
  organizationId?: string | null
  originUrl?: string | null
  /** Signature-surface consent; omitted keeps the existing default (public). */
  isPublic?: boolean
}) {
  const referendum = await getTreatyReferendum()
  if (referendum.status !== ReferendumStatus.ACTIVE) {
    throw new Error("Treaty referendum is not accepting votes")
  }

  const person = await ensurePersonForUser(input.userId)

  return prisma.referendumVote.upsert({
    where: {
      referendumId_personId: {
        referendumId: referendum.id,
        personId: person.id,
      },
    },
    update: {
      answer: input.answer,
      deletedAt: null,
      userId: input.userId,
      voteSource: ReferendumVoteSource.SELF,
      ...(input.isPublic === undefined ? {} : { isPublic: input.isPublic }),
    },
    create: {
      userId: input.userId,
      personId: person.id,
      referendumId: referendum.id,
      answer: input.answer,
      voteSource: ReferendumVoteSource.SELF,
      referredByUserId: input.referredByUserId ?? null,
      organizationId: input.organizationId ?? null,
      originUrl: input.originUrl ?? null,
      isPublic: input.isPublic ?? true,
    },
  })
}

import { prisma } from "./prisma"
import { resolveUsernameAlias } from "./user"
import { countTreatyVotes } from "./treaty-votes.server"
import { TREATY_REFERENDUM_SLUG } from "./treaty"

/**
 * Finds a user by username (handle) or referral code.
 */
export async function findUserByUsernameOrReferralCode(
  identifier: string | null | undefined,
) {
  if (!identifier) return null

  const effectiveIdentifier = resolveUsernameAlias(identifier)
  const normalizedHandle = effectiveIdentifier.toLowerCase()

  return prisma.user.findFirst({
    where: {
      OR: [
        { referralCode: identifier },
        { username: normalizedHandle },
      ],
    },
  })
}

export async function getReferralVoteCount(userId: string): Promise<number> {
  return countTreatyVotes({ referredByUserId: userId })
}

export interface ReferralTreeStats {
  directCount: number
  totalDownstreamCount: number
  maxDepth: number
  publicRecruits: Array<{
    id: string
    name: string | null
    username: string | null
    image: string | null
    depth: number
  }>
}

/**
 * Referral tree over ReferendumVote for the 1% Treaty referendum.
 */
export async function getReferralTreeStats(
  userId: string,
  options: { publicRecruitsLimit?: number } = {},
): Promise<ReferralTreeStats> {
  const limit = options.publicRecruitsLimit ?? 20

  const referendum = await prisma.referendum.findUnique({
    where: { slug: TREATY_REFERENDUM_SLUG },
    select: { id: true },
  })

  if (!referendum) {
    return {
      directCount: 0,
      totalDownstreamCount: 0,
      maxDepth: 0,
      publicRecruits: [],
    }
  }

  const referendumId = referendum.id

  const depthRows = await prisma.$queryRaw<
    Array<{ total: bigint; max_depth: number | null }>
  >`
    WITH RECURSIVE tree AS (
      SELECT v."userId" AS voter_id, 1 AS depth
      FROM "ReferendumVote" v
      WHERE v."referredByUserId" = ${userId}
        AND v."referendumId" = ${referendumId}
        AND v."deletedAt" IS NULL

      UNION ALL

      SELECT v."userId" AS voter_id, t.depth + 1
      FROM "ReferendumVote" v
      INNER JOIN tree t ON v."referredByUserId" = t.voter_id
      WHERE v."referendumId" = ${referendumId}
        AND v."deletedAt" IS NULL
        AND t.depth < 20
    )
    SELECT COUNT(*)::bigint AS total, COALESCE(MAX(depth), 0)::int AS max_depth
    FROM tree
  `

  const directCount = await countTreatyVotes({ referredByUserId: userId })
  const totalDownstreamCount = Number(depthRows[0]?.total ?? 0)
  const maxDepth = depthRows[0]?.max_depth ?? 0

  const publicRecruits = await prisma.referendumVote.findMany({
    where: {
      referredByUserId: userId,
      referendumId,
      deletedAt: null,
      user: {
        OR: [{ person: { isPublic: true } }, { username: { not: null } }],
      },
    },
    take: limit,
    orderBy: { createdAt: "desc" },
    select: {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
        },
      },
    },
  })

  return {
    directCount,
    totalDownstreamCount,
    maxDepth,
    publicRecruits: publicRecruits.map((row) => ({
      id: row.user.id,
      name: row.user.name,
      username: row.user.username,
      image: row.user.image,
      depth: 1,
    })),
  }
}

import "server-only"
import { prisma } from "./prisma"
import { TREATY_REFERENDUM_SLUG } from "./treaty"

const USERNAME_ALIASES: Record<string, string> = {
  mikepsinn: "WarOnDisease",
}

export function resolveUsernameAlias(username: string): string {
  if (!username) return username

  const lowerName = username.toLowerCase()
  const alias = USERNAME_ALIASES[lowerName]

  return alias || username
}

/**
 * Calculate user's rank based on referred treaty (ReferendumVote) count
 */
export async function calculateUserRank(referralCount: number): Promise<number> {
  if (referralCount > 0) {
    const result = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count
      FROM (
        SELECT u."id"
        FROM "User" u
        INNER JOIN "Referendum" r ON r."slug" = ${TREATY_REFERENDUM_SLUG}
        LEFT JOIN "ReferendumVote" v
          ON v."referredByUserId" = u."id"
          AND v."referendumId" = r."id"
          AND v."deletedAt" IS NULL
        GROUP BY u."id"
        HAVING COUNT(v."id") > ${referralCount}
      ) subquery
    `
    const count = result.length > 0 ? Number(result[0].count) : 0
    return count + 1
  }

  const usersWithReferrals = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(DISTINCT v."referredByUserId") as count
    FROM "ReferendumVote" v
    INNER JOIN "Referendum" r ON r."id" = v."referendumId" AND r."slug" = ${TREATY_REFERENDUM_SLUG}
    WHERE v."referredByUserId" IS NOT NULL AND v."deletedAt" IS NULL
  `
  return Number(usersWithReferrals[0]?.count ?? 0) + 1
}

export async function getPublicUserProfile(username: string) {
  const effectiveUsername = resolveUsernameAlias(username)

  const user = await prisma.user.findFirst({
    where: {
      username: {
        equals: effectiveUsername,
        mode: "insensitive",
      },
    },
    include: {
      badges: true,
      userSkills: {
        include: {
          skill: true,
        },
        orderBy: { createdAt: "desc" },
      },
      userLinks: {
        orderBy: { order: "asc" },
      },
    },
  })

  if (!user) {
    return null
  }

  if (!user.isPublic) {
    return { isPrivate: true as const }
  }

  const referralCount = await prisma.referendumVote.count({
    where: {
      referredByUserId: user.id,
      deletedAt: null,
      referendum: { slug: TREATY_REFERENDUM_SLUG },
    },
  })

  const rank = await calculateUserRank(referralCount)

  return {
    isPrivate: false as const,
    id: user.id,
    name: user.name || "Anonymous Soldier",
    username: user.username,
    image: user.image,
    bio: user.bio,
    headline: user.headline,
    website: user.website,
    coverImage: user.coverImage,
    location: user.location,
    isPublic: user.isPublic,
    referralCode: user.referralCode,
    referralCount,
    rank,
    badges: user.badges,
    skills: user.userSkills.map((us) => ({
      id: us.skill.id,
      name: us.skill.name,
      category: us.skill.category,
      endorsements: us.endorsements,
    })),
    links: user.userLinks,
    joinedAt: user.createdAt,
  }
}

export type PublicUserProfile = Exclude<
  Awaited<ReturnType<typeof getPublicUserProfile>>,
  null | { isPrivate: true }
>

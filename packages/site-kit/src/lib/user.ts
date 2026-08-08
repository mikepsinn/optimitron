import "server-only"
import type { Prisma } from "@optimitron/db"
import { prisma } from "./prisma"
import { TREATY_REFERENDUM_SLUG } from "./treaty"

export type PublicProfileLink = {
  id: string
  title: string
  url: string
  description: string | null
  imageUrl: string | null
}

/** Person.links is Json — normalize object or array shapes into a display list. */
export function parsePersonLinks(
  links: Prisma.JsonValue | null | undefined,
): PublicProfileLink[] {
  if (!links) return []

  if (Array.isArray(links)) {
    return links.flatMap((item, index) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return []
      const record = item as Record<string, unknown>
      const url = typeof record.url === "string" ? record.url : null
      if (!url) return []
      return [
        {
          id: typeof record.id === "string" ? record.id : `link-${index}`,
          title:
            typeof record.title === "string"
              ? record.title
              : typeof record.name === "string"
                ? record.name
                : url,
          url,
          description: typeof record.description === "string" ? record.description : null,
          imageUrl:
            typeof record.imageUrl === "string"
              ? record.imageUrl
              : typeof record.image === "string"
                ? record.image
                : null,
        },
      ]
    })
  }

  if (typeof links === "object") {
    return Object.entries(links as Record<string, unknown>).flatMap(([key, value]) => {
      const url =
        typeof value === "string"
          ? value
          : value &&
              typeof value === "object" &&
              !Array.isArray(value) &&
              typeof (value as { url?: unknown }).url === "string"
            ? (value as { url: string }).url
            : null
      if (!url) return []
      return [{ id: key, title: key, url, description: null, imageUrl: null }]
    })
  }

  return []
}


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

export async function getPublicUserProfile(handleOrUsername: string) {
  const effectiveHandle = resolveUsernameAlias(handleOrUsername)

  const user = await prisma.user.findFirst({
    where: {
      person: {
        handle: {
          equals: effectiveHandle,
          mode: "insensitive",
        },
      },
    },
    include: {
      badges: true,
      person: {
        select: {
          id: true,
          handle: true,
          displayName: true,
          image: true,
          bio: true,
          headline: true,
          website: true,
          coverImage: true,
          isPublic: true,
          links: true,
          countryCode: true,
        },
      },
    },
  })

  if (!user || !user.person) {
    return null
  }

  const person = user.person

  if (!person.isPublic) {
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
  const handle = person.handle

  return {
    isPrivate: false as const,
    id: user.id,
    name: person.displayName || "Anonymous Soldier",
    handle,
    /** @deprecated Prefer `handle` */
    username: handle,
    image: person.image,
    bio: person.bio,
    headline: person.headline,
    website: person.website,
    coverImage: person.coverImage,
    location: person.countryCode,
    isPublic: person.isPublic,
    referralCode: user.referralCode,
    referralCount,
    rank,
    badges: user.badges,
    skills: [] as Array<{
      id: string
      name: string
      category: string | null
      endorsements: number
    }>,
    links: parsePersonLinks(person.links),
    joinedAt: user.createdAt,
  }
}

export type PublicUserProfile = Exclude<
  Awaited<ReturnType<typeof getPublicUserProfile>>,
  null | { isPrivate: true }
>

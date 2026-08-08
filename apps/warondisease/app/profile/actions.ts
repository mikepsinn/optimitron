"use server"

import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-utils"
import { ensurePersonForUser } from "@/lib/person.server"
import type { Prisma } from "@optimitron/db"

type ProfileLink = {
  id: string
  title: string
  url: string
  description: string | null
  imageUrl: string | null
  order: number
}

function parsePersonLinks(links: Prisma.JsonValue | null | undefined): ProfileLink[] {
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
          order: typeof record.order === "number" ? record.order : index,
        },
      ]
    })
  }

  if (typeof links === "object") {
    return Object.entries(links as Record<string, unknown>).flatMap(([key, value], index) => {
      const url =
        typeof value === "string"
          ? value
          : value && typeof value === "object" && !Array.isArray(value) && typeof (value as { url?: unknown }).url === "string"
            ? ((value as { url: string }).url)
            : null
      if (!url) return []
      return [
        {
          id: key,
          title: key,
          url,
          description: null,
          imageUrl: null,
          order: index,
        },
      ]
    })
  }

  return []
}

// Skills Management — tables removed; stubbed no-ops
export async function addUserSkill(_skillId: string) {
  await requireAuth()
  return { success: true }
}

export async function removeUserSkill(_skillId: string) {
  await requireAuth()
  return { success: true }
}

export async function searchSkills(_query: string) {
  return [] as Array<{ id: string; name: string; slug: string; category: string | null }>
}

export async function createSkill(_data: { name: string; category?: string }) {
  await requireAuth()
  return {
    success: true,
    skill: { id: "", name: "", slug: "", category: null as string | null },
  }
}

// Links Management — UserLink removed; Person.links is Json (read-only here for now)
export async function addUserLink(_data: {
  title: string
  url: string
  description?: string
  imageUrl?: string
}) {
  await requireAuth()
  return {
    success: true,
    link: {
      id: "",
      title: "",
      url: "",
      description: null as string | null,
      imageUrl: null as string | null,
      order: 0,
    },
  }
}

export async function updateUserLink(
  _linkId: string,
  _data: {
    title?: string
    url?: string
    description?: string
    imageUrl?: string
  },
) {
  await requireAuth()
  return { success: true }
}

export async function deleteUserLink(_linkId: string) {
  await requireAuth()
  return { success: true }
}

export async function reorderUserLinks(_linkIds: string[]) {
  await requireAuth()
  return { success: true }
}

// Get profile data from Person-owned identity fields
export async function getProfileData() {
  const { userId } = await requireAuth()

  await ensurePersonForUser(userId)

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      person: {
        select: {
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
      organizationMemberships: {
        include: {
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        take: 1,
        orderBy: { joinedAt: "desc" },
      },
    },
  })

  if (!user) {
    throw new Error("User not found")
  }

  const person = user.person
  const membership = user.organizationMemberships[0]
  const location =
    [user.city, user.countryCode ?? person?.countryCode].filter(Boolean).join(", ") || ""

  return {
    user: {
      id: user.id,
      name: person?.displayName || "",
      username: person?.handle || "",
      email: user.email,
      bio: person?.bio || "",
      headline: person?.headline || "",
      website: person?.website || "",
      coverImage: person?.coverImage || "",
      location,
      country: user.countryCode || person?.countryCode || "",
      image: person?.image ?? null,
      isPublic: person?.isPublic ?? false,
      organization: membership?.organization.name || null,
      organizationId: membership?.organizationId ?? null,
    },
    links: parsePersonLinks(person?.links),
  }
}

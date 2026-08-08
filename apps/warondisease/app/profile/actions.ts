"use server"

import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-utils"
import { revalidatePath } from "next/cache"

// Skills Management
export async function addUserSkill(skillId: string) {
  const { userId } = await requireAuth()

  // Verify skill exists
  const skill = await prisma.skill.findUnique({ where: { id: skillId } })
  if (!skill) {
    throw new Error("Skill not found")
  }

  await prisma.userSkill.create({
    data: {
      userId,
      skillId,
      endorsements: 0,
    },
  })

  revalidatePath("/profile/edit")
  return { success: true }
}

export async function removeUserSkill(skillId: string) {
  const { userId } = await requireAuth()

  await prisma.userSkill.delete({
    where: {
      userId_skillId: {
        userId,
        skillId,
      },
    },
  })

  revalidatePath("/profile/edit")
  return { success: true }
}

export async function searchSkills(query: string) {
  if (!query || query.length < 2) {
    return []
  }

  const skills = await prisma.skill.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { slug: { contains: query, mode: "insensitive" } },
      ],
    },
    take: 10,
    orderBy: { name: "asc" },
  })

  return skills
}

export async function createSkill(data: { name: string; category?: string }) {
  const { userId } = await requireAuth()

  // Create slug from name
  const slug = data.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")

  // Check if skill already exists
  const existing = await prisma.skill.findFirst({
    where: {
      OR: [{ name: data.name }, { slug }],
    },
  })

  if (existing) {
    // Add existing skill to user
    await prisma.userSkill.create({
      data: { userId, skillId: existing.id, endorsements: 0 },
    })
    revalidatePath("/profile/edit")
    return { success: true, skill: existing }
  }

  // Create new skill
  const skill = await prisma.skill.create({
    data: {
      name: data.name,
      slug,
      category: data.category,
    },
  })

  // Add to user
  await prisma.userSkill.create({
    data: { userId, skillId: skill.id, endorsements: 0 },
  })

  revalidatePath("/profile/edit")
  return { success: true, skill }
}

// Links Management
export async function addUserLink(data: {
  title: string
  url: string
  description?: string
  imageUrl?: string
}) {
  const { userId } = await requireAuth()

  // Get current max order
  const maxOrder = await prisma.userLink.findFirst({
    where: { userId },
    orderBy: { order: "desc" },
    select: { order: true },
  })

  const link = await prisma.userLink.create({
    data: {
      userId,
      title: data.title,
      url: data.url,
      description: data.description,
      imageUrl: data.imageUrl,
      order: (maxOrder?.order ?? -1) + 1,
    },
  })

  revalidatePath("/profile/edit")
  return { success: true, link }
}

export async function updateUserLink(
  linkId: string,
  data: {
    title?: string
    url?: string
    description?: string
    imageUrl?: string
  }
) {
  const { userId } = await requireAuth()

  // Verify ownership
  const link = await prisma.userLink.findUnique({ where: { id: linkId } })
  if (!link || link.userId !== userId) {
    throw new Error("Link not found or unauthorized")
  }

  await prisma.userLink.update({
    where: { id: linkId },
    data,
  })

  revalidatePath("/profile/edit")
  return { success: true }
}

export async function deleteUserLink(linkId: string) {
  const { userId } = await requireAuth()

  // Verify ownership
  const link = await prisma.userLink.findUnique({ where: { id: linkId } })
  if (!link || link.userId !== userId) {
    throw new Error("Link not found or unauthorized")
  }

  await prisma.userLink.delete({ where: { id: linkId } })

  revalidatePath("/profile/edit")
  return { success: true }
}

export async function reorderUserLinks(linkIds: string[]) {
  const { userId } = await requireAuth()

  // Update order for each link
  await Promise.all(
    linkIds.map((linkId, index) =>
      prisma.userLink.updateMany({
        where: { id: linkId, userId }, // Verify ownership
        data: { order: index },
      })
    )
  )

  revalidatePath("/profile/edit")
  return { success: true }
}

// Get profile data
export async function getProfileData() {
  const { userId } = await requireAuth()

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      userSkills: {
        include: {
          skill: true,
        },
        orderBy: { createdAt: "desc" },
      },
      userLinks: {
        orderBy: { order: "asc" },
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

  const membership = user.organizationMemberships[0]

  return {
    user: {
      id: user.id,
      name: user.name || "",
      username: user.username || "",
      email: user.email,
      bio: user.bio || "",
      headline: user.headline || "",
      website: user.website || "",
      coverImage: user.coverImage || "",
      location: user.location || "",
      country: user.country || "",
      image: user.image,
      isPublic: user.isPublic,
      organization: membership?.organization.name || null,
      organizationId: membership?.organizationId ?? null,
    },
    skills: user.userSkills.map((us) => ({
      id: us.skill.id,
      name: us.skill.name,
      slug: us.skill.slug,
      category: us.skill.category,
      endorsements: us.endorsements,
      addedAt: us.createdAt,
    })),
    links: user.userLinks.map((link) => ({
      id: link.id,
      title: link.title,
      url: link.url,
      description: link.description,
      imageUrl: link.imageUrl,
      order: link.order,
    })),
  }
}

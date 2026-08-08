import type { Person } from "@optimitron/db"
import { PersonLifeStatus } from "@optimitron/db"
import { prisma } from "./prisma"

export interface EnsurePersonOptions {
  /** Display name for a freshly-created Person (from OAuth profile or signup). */
  displayName?: string | null
  /** Avatar image URL for a freshly-created Person (from OAuth profile). */
  image?: string | null
}

/**
 * Ensure the signed-in user has a Person row (required for ReferendumVote).
 * SELF votes require Person.lifeStatus = LIVING (DB trigger).
 *
 * Person owns every public-display field — this helper does NOT read
 * name / image / bio off User (those columns do not exist).
 */
export async function ensurePersonForUser(
  userId: string,
  options: EnsurePersonOptions = {},
): Promise<Person> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      personId: true,
    },
  })

  if (user.personId) {
    const existing = await prisma.person.findUnique({
      where: { id: user.personId },
    })
    if (existing && !existing.deletedAt) {
      if (existing.lifeStatus !== PersonLifeStatus.LIVING) {
        return prisma.person.update({
          where: { id: existing.id },
          data: { lifeStatus: PersonLifeStatus.LIVING },
        })
      }
      return existing
    }
  }

  const email = user.email.trim().toLowerCase()
  const byEmail = email
    ? await prisma.person.findUnique({ where: { email } })
    : null

  if (byEmail && !byEmail.deletedAt) {
    await prisma.user.update({
      where: { id: userId },
      data: { personId: byEmail.id },
    })
    if (byEmail.lifeStatus !== PersonLifeStatus.LIVING) {
      return prisma.person.update({
        where: { id: byEmail.id },
        data: { lifeStatus: PersonLifeStatus.LIVING },
      })
    }
    return byEmail
  }

  const displayName = (
    options.displayName?.trim() ||
    email ||
    `Person ${userId.slice(0, 8)}`
  ).slice(0, 200)

  const person = await prisma.person.create({
    data: {
      displayName,
      email: email || null,
      image: options.image ?? null,
      createdByUserId: userId,
      sourceRef: `user:${userId}`,
      lifeStatus: PersonLifeStatus.LIVING,
    },
  })

  await prisma.user.update({
    where: { id: userId },
    data: { personId: person.id },
  })

  return person
}

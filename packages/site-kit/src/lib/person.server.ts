import type { Person } from "@optimitron/db"
import { PersonLifeStatus } from "@optimitron/db"
import { prisma } from "./prisma"

/**
 * Ensure the signed-in user has a Person row (required for ReferendumVote).
 * SELF votes require Person.lifeStatus = LIVING (DB trigger).
 */
export async function ensurePersonForUser(userId: string): Promise<Person> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
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

  const person = await prisma.person.create({
    data: {
      displayName: (user.name?.trim() || email || `Person ${userId.slice(0, 8)}`).slice(
        0,
        200,
      ),
      email: email || null,
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

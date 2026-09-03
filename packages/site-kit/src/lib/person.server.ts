import type { Person, Prisma } from "@optimitron/db"
import { PersonLifeStatus } from "@optimitron/db"
import { prisma } from "./prisma"

/**
 * The subset of the client this helper touches. Accepting it lets a caller
 * already inside `prisma.$transaction` reuse that transaction instead of
 * opening a second connection that cannot see its uncommitted writes.
 */
type PersonWriteClient = Pick<Prisma.TransactionClient, "person" | "user">

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
 *
 * Pass `db` to run inside an open transaction; it defaults to the shared
 * client.
 */
export async function ensurePersonForUser(
  userId: string,
  options: EnsurePersonOptions = {},
  db: PersonWriteClient = prisma,
): Promise<Person> {
  const user = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      personId: true,
    },
  })

  if (user.personId) {
    const existing = await db.person.findUnique({
      where: { id: user.personId },
    })
    if (existing && !existing.deletedAt) {
      if (existing.lifeStatus !== PersonLifeStatus.LIVING) {
        return db.person.update({
          where: { id: existing.id },
          data: { lifeStatus: PersonLifeStatus.LIVING },
        })
      }
      return existing
    }
  }

  const email = user.email.trim().toLowerCase()
  const byEmail = email
    ? await db.person.findUnique({ where: { email } })
    : null

  if (byEmail && !byEmail.deletedAt) {
    await db.user.update({
      where: { id: userId },
      data: { personId: byEmail.id },
    })
    if (byEmail.lifeStatus !== PersonLifeStatus.LIVING) {
      return db.person.update({
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

  const person = await db.person.create({
    data: {
      displayName,
      email: email || null,
      image: options.image ?? null,
      createdByUserId: userId,
      sourceRef: `user:${userId}`,
      lifeStatus: PersonLifeStatus.LIVING,
    },
  })

  await db.user.update({
    where: { id: userId },
    data: { personId: person.id },
  })

  return person
}

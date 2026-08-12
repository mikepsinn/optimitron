"use server"

import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-utils"
import { validateUsername } from "@/lib/username"
import { ensurePersonForUser } from "@/lib/person.server"

/** Minimal profile updates for survey post-vote referral loop. */
export async function updateUserProfile(data: {
  name?: string
  handle?: string | null
  /** @deprecated Prefer `handle` */
  username?: string | null
}) {
  const { userId } = await requireAuth()

  const handleInput =
    "handle" in data ? data.handle : "username" in data ? data.username : undefined

  let normalizedHandle: string | null | undefined = undefined

  if (handleInput !== undefined) {
    const raw = (handleInput ?? "").trim()

    if (raw === "") {
      normalizedHandle = null
    } else {
      const usernameValidationError = validateUsername(raw)
      if (usernameValidationError) {
        throw new Error(usernameValidationError)
      }

      const existingHandle = await prisma.person.findFirst({
        where: {
          handle: {
            equals: raw,
            mode: "insensitive",
          },
          user: { NOT: { id: userId } },
        },
        select: { id: true },
      })

      if (existingHandle) {
        throw new Error("That handle is already taken. Please choose another.")
      }

      normalizedHandle = raw.toLowerCase()
    }
  }

  await ensurePersonForUser(userId, {
    displayName: typeof data.name === "string" ? data.name : undefined,
  })

  const userRecord = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { personId: true },
  })

  if (userRecord.personId) {
    await prisma.person.update({
      where: { id: userRecord.personId },
      data: {
        ...(typeof data.name === "string" ? { displayName: data.name } : {}),
        ...(normalizedHandle !== undefined ? { handle: normalizedHandle } : {}),
      },
    })
  }

  return { success: true }
}

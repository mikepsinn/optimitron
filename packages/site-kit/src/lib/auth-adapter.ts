import { PrismaAdapter } from "@auth/prisma-adapter"
import type { Adapter } from "next-auth/adapters"
import { nanoid } from "nanoid"
import { prisma } from "./prisma"
import { ensurePersonForUser } from "./person.server"

/**
 * NextAuth adapter that writes only fields that exist on User.
 * Display identity (name/image) lives on Person — never on User.
 */
export function createAuthAdapter(): Adapter {
  const adapter = PrismaAdapter(prisma)

  return {
    ...adapter,
    async createUser(user: Parameters<NonNullable<Adapter["createUser"]>>[0]) {
      const referralCode = nanoid(8).toUpperCase()

      const createdUser = await prisma.user.create({
        data: {
          email: user.email,
          emailVerified: user.emailVerified ?? null,
          referralCode,
        },
      })

      await ensurePersonForUser(createdUser.id, {
        displayName: user.name ?? null,
        image: user.image ?? null,
      })

      return createdUser
    },
  }
}

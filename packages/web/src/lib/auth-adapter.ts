import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { Adapter } from "next-auth/adapters";
import { prisma } from "@/lib/prisma";
import {
  createUniqueReferralCode,
  createUniqueUsername,
  getUserHandleSeed,
} from "@/lib/user-identity.server";

export function createAuthAdapter(): Adapter {
  const adapter = PrismaAdapter(prisma);

  return {
    ...adapter,
    async createUser(user) {
      const username = await createUniqueUsername(getUserHandleSeed(user.name, user.email));
      const referralCode = await createUniqueReferralCode();

      return prisma.user.create({
        data: {
          email: user.email,
          emailVerified: user.emailVerified ?? null,
          image: user.image ?? null,
          name: user.name ?? null,
          username,
          referralCode,
        },
      });
    },
  };
}

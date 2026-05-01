import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { headers } from "next/headers";
import type { Adapter } from "next-auth/adapters";
import { readVercelGeo } from "@/lib/geo/vercel-geo";
import { ensurePersonForUser } from "@/lib/person.server";
import { prisma } from "@/lib/prisma";
import { createUniqueReferralCode } from "@/lib/user-identity.server";

async function readGeoFromRequestHeaders() {
  try {
    const requestHeaders = await headers();
    return readVercelGeo(requestHeaders);
  } catch {
    // headers() throws outside of a request context. Adapter callbacks
    // initiated by background jobs will land here — a quiet no-op is fine.
    return {};
  }
}

export function createAuthAdapter(): Adapter {
  const adapter = PrismaAdapter(prisma);

  return {
    ...adapter,
    async createUser(user: Parameters<NonNullable<Adapter["createUser"]>>[0]) {
      const referralCode = await createUniqueReferralCode();
      const geo = await readGeoFromRequestHeaders();

      const createdUser = await prisma.user.create({
        data: {
          email: user.email,
          emailVerified: user.emailVerified ?? null,
          referralCode,
          ...(geo.countryCode ? { countryCode: geo.countryCode } : {}),
          ...(geo.regionCode ? { regionCode: geo.regionCode } : {}),
          ...(geo.city ? { city: geo.city } : {}),
          ...(geo.latitude != null ? { latitude: geo.latitude } : {}),
          ...(geo.longitude != null ? { longitude: geo.longitude } : {}),
          ...(geo.timeZone ? { timeZone: geo.timeZone } : {}),
        },
      });

      // Pass the OAuth-provided display fields straight through to Person —
      // they never live on User.
      await ensurePersonForUser(createdUser.id, {
        displayName: user.name ?? null,
        image: user.image ?? null,
      });

      return createdUser;
    },
  };
}

/**
 * Wishonia user lookup helper.
 *
 * Wishonia is a system User in the database with
 * a linked Person record. She authors task comments, can be assigned tasks,
 * and shows up on /people/wishonia like any public figure.
 */

import { WISHONIA_EMAIL } from "@optimitron/db/system-identities";
import { prisma } from "@/lib/prisma";

let cachedUserId: string | null = null;

/** Returns Wishonia's user ID. Cached in-process because it never changes. */
export async function getWishoniaUserId(): Promise<string> {
  if (cachedUserId) return cachedUserId;

  const user = await prisma.user.findUnique({
    where: { email: WISHONIA_EMAIL },
    select: { id: true },
  });

  if (!user) {
    throw new Error(
      `Wishonia user not seeded. Run: npx tsx packages/db/prisma/seed.ts --scope tasks`,
    );
  }

  cachedUserId = user.id;
  return user.id;
}

/** Convenience: check whether a given user ID is Wishonia's. */
export async function isWishoniaUserId(userId: string | null | undefined): Promise<boolean> {
  if (!userId) return false;
  try {
    const wishoniaId = await getWishoniaUserId();
    return userId === wishoniaId;
  } catch {
    return false;
  }
}

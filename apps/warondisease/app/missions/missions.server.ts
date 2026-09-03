import type { DatingProfileStatus } from "@optimitron/db";
import { prisma } from "@/lib/prisma";

/**
 * The one slice of Optimitron's `src/lib/dating.server.ts` this page needs.
 *
 * Optimitron's `getOwnDatingProfile` returns the whole profile because its
 * profile editor, discovery feed, and messaging all read from it. This page
 * prints one line about whether the visitor's own missions are on, so it
 * selects the status alone and leaves the rest — photos, blocks, matches,
 * interactions — on optimitron.com with the surfaces that use them.
 */
export async function getOwnMissionProfileStatus(
  userId: string,
): Promise<DatingProfileStatus | null> {
  const profile = await prisma.datingProfile.findFirst({
    select: { status: true },
    where: {
      deletedAt: null,
      userId,
    },
  });

  return profile?.status ?? null;
}

import { prisma } from "@/lib/prisma";
import { buildUserReferralUrl } from "@/lib/url";

/**
 * Look up a user's personal referral URL by id. Returns null when the user
 * is missing or the caller passed null. Used by transactional notification
 * builders (task assignment, task comment, etc.) to embed a share footer at
 * the bottom of every engaged-user email.
 *
 * Lives in its own module because it's referenced by two notification
 * pipelines (`task-assignment-notifications.server.ts`,
 * `task-comment-notifications.server.ts`) and copy-pasting it twice
 * invited divergence.
 */
export async function getRecipientReferralUrl(
  userId: string | null,
): Promise<string | null> {
  if (!userId) return null;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      referralCode: true,
      person: { select: { handle: true } },
    },
  });
  if (!user) return null;
  return buildUserReferralUrl({
    handle: user.person?.handle ?? null,
    referralCode: user.referralCode,
  });
}

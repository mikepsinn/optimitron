import { prisma } from "@/lib/prisma";
import { findUserByHandleOrReferralCode } from "@/lib/referral.server";

export function buildReferralRedirectUrl(input: {
  code: string;
  flowVariant?: string | null;
  inviteToken?: string | null;
  shareAttemptId?: string | null;
  treatyFlow?: string | null;
}) {
  const redirectParams = new URLSearchParams({ ref: input.code });
  if (input.shareAttemptId) redirectParams.set("sa", input.shareAttemptId);
  if (input.inviteToken) redirectParams.set("invite", input.inviteToken);
  if (input.treatyFlow) redirectParams.set("treatyFlow", input.treatyFlow);
  if (input.flowVariant) redirectParams.set("flowVariant", input.flowVariant);
  return `/vote?${redirectParams.toString()}`;
}

export async function logReferralRedirectClick(input: {
  code: string;
  refererUrl: string | null;
  shareAttemptId: string | null;
  userAgent: string | null;
}) {
  try {
    const referrer = await findUserByHandleOrReferralCode(input.code);

    await prisma.referralClick.create({
      data: {
        code: input.code,
        referrerUserId: referrer?.id ?? null,
        refererUrl: input.refererUrl,
        userAgent: input.userAgent,
        shareAttemptId: input.shareAttemptId,
      },
    });

    if (input.shareAttemptId) {
      await prisma.shareAttempt
        .updateMany({
          where: { id: input.shareAttemptId, firstReferralClickAt: null },
          data: { firstReferralClickAt: new Date() },
        })
        .catch(() => {});
    }
  } catch {
    // Click logging is best-effort; referral redirects should never fail closed.
  }
}

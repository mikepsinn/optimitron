import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { findUserByUsernameOrReferralCode } from "@/lib/referral.server";

interface PageProps {
  params: Promise<{ code: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Referral landing route: /r/jane or /r/REF123
 *
 * Captures the HTTP Referer header and user-agent into ReferralClick so we
 * can trace where shares originated (e.g. official social accounts). Also
 * captures `?sa=<shareAttemptId>` so we can tie this click (and any signup
 * that follows) back to the specific ShareAttempt row that generated this
 * outbound message. Then redirects to the homepage with ?ref= for the vote
 * flow.
 */
export default async function ReferralRedirectPage({ params, searchParams }: PageProps) {
  const { code } = await params;
  const query = await searchParams;
  const headerStore = await headers();
  const refererUrl = headerStore.get("referer") ?? null;
  const userAgent = headerStore.get("user-agent") ?? null;
  const rawSa = query.sa;
  const shareAttemptId = typeof rawSa === "string" ? rawSa : Array.isArray(rawSa) ? rawSa[0] ?? null : null;

  // Fire-and-forget: log the click without blocking the redirect.
  void logReferralClick(code, refererUrl, userAgent, shareAttemptId);

  const redirectUrl = shareAttemptId
    ? `/?ref=${encodeURIComponent(code)}&sa=${encodeURIComponent(shareAttemptId)}#vote`
    : `/?ref=${encodeURIComponent(code)}#vote`;

  redirect(redirectUrl);
}

async function logReferralClick(
  code: string,
  refererUrl: string | null,
  userAgent: string | null,
  shareAttemptId: string | null,
) {
  try {
    const referrer = await findUserByUsernameOrReferralCode(code);

    await prisma.referralClick.create({
      data: {
        code,
        referrerUserId: referrer?.id ?? null,
        refererUrl,
        userAgent,
        shareAttemptId,
      },
    });

    // If the sa= matches a real row and we haven't already marked it as
    // activated, stamp firstReferralClickAt. Best-effort.
    if (shareAttemptId) {
      await prisma.shareAttempt
        .updateMany({
          where: { id: shareAttemptId, firstReferralClickAt: null },
          data: { firstReferralClickAt: new Date() },
        })
        .catch(() => {});
    }
  } catch {
    // Click logging is best-effort — never block the redirect or throw.
  }
}

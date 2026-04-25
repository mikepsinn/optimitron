import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  buildReferralRedirectUrl,
  logReferralRedirectClick,
} from "@/lib/referral-redirect.server";

interface PageProps {
  params: Promise<{ code: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Compatibility referral landing route: /r/jane or /r/REF123
 *
 * Captures the HTTP Referer header and user-agent into ReferralClick so we
 * can trace where shares originated (e.g. official social accounts). Also
 * captures `?sa=<shareAttemptId>` so we can tie this click (and any signup
 * that follows) back to the specific ShareAttempt row that generated this
 * outbound message. Then redirects to the homepage with ?ref= for the vote
 * flow. Directed invitations also preserve ?invite=<token> for conversion.
 */
export default async function ReferralRedirectPage({ params, searchParams }: PageProps) {
  const { code } = await params;
  const query = await searchParams;
  const headerStore = await headers();
  const refererUrl = headerStore.get("referer") ?? null;
  const userAgent = headerStore.get("user-agent") ?? null;
  const rawSa = query.sa;
  const shareAttemptId = typeof rawSa === "string" ? rawSa : Array.isArray(rawSa) ? rawSa[0] ?? null : null;
  const rawInvite = query.invite;
  const inviteToken = typeof rawInvite === "string" ? rawInvite : Array.isArray(rawInvite) ? rawInvite[0] ?? null : null;

  await logReferralRedirectClick({ code, refererUrl, shareAttemptId, userAgent });

  redirect(buildReferralRedirectUrl({ code, inviteToken, shareAttemptId }));
}

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
 * Canonical treaty referral landing route: /vote/jane or /vote/REF123.
 *
 * Redirects to the vote surface with ?ref= and preserves directed invitation
 * tokens for named invite conversion.
 */
export default async function VoteReferralRedirectPage({ params, searchParams }: PageProps) {
  const { code } = await params;
  const query = await searchParams;
  const headerStore = await headers();
  const refererUrl = headerStore.get("referer") ?? null;
  const userAgent = headerStore.get("user-agent") ?? null;
  const rawSa = query.sa;
  const shareAttemptId =
    typeof rawSa === "string" ? rawSa : Array.isArray(rawSa) ? rawSa[0] ?? null : null;
  const rawInvite = query.invite;
  const inviteToken =
    typeof rawInvite === "string" ? rawInvite : Array.isArray(rawInvite) ? rawInvite[0] ?? null : null;

  await logReferralRedirectClick({ code, refererUrl, shareAttemptId, userAgent });

  redirect(buildReferralRedirectUrl({ code, inviteToken, shareAttemptId }));
}

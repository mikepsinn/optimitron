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

function firstQueryValue(value: string | string[] | undefined) {
  if (typeof value === "string") return value;
  return Array.isArray(value) ? value[0] ?? null : null;
}

/**
 * Canonical treaty referral landing route: /vote/jane or /vote/REF123.
 *
 * Redirects to the focused vote surface with ?ref= and preserves directed
 * invitation tokens for named invite conversion.
 */
export default async function VoteReferralRedirectPage({ params, searchParams }: PageProps) {
  const { code } = await params;
  const query = await searchParams;
  const headerStore = await headers();
  const refererUrl = headerStore.get("referer") ?? null;
  const userAgent = headerStore.get("user-agent") ?? null;
  const shareAttemptId = firstQueryValue(query.sa);
  const inviteToken = firstQueryValue(query.invite);
  const treatyFlow = firstQueryValue(query.treatyFlow);
  const flowVariant = firstQueryValue(query.flowVariant);

  await logReferralRedirectClick({ code, refererUrl, shareAttemptId, userAgent });

  redirect(
    buildReferralRedirectUrl({
      code,
      flowVariant,
      inviteToken,
      shareAttemptId,
      treatyFlow,
    }),
  );
}

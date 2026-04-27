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
 * Compatibility referral landing route: /r/jane or /r/REF123
 *
 * Captures the HTTP Referer header and user-agent into ReferralClick so we
 * can trace where shares originated (e.g. official social accounts). Also
 * captures `?sa=<shareAttemptId>` so we can tie this click (and any signup
 * that follows) back to the specific ShareAttempt row that generated this
 * outbound message. Then redirects to the focused /vote flow. Directed
 * invitations also preserve ?invite=<token> for conversion.
 */
export default async function ReferralRedirectPage({ params, searchParams }: PageProps) {
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

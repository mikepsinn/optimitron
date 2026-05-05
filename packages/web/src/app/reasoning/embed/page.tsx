/**
 * /reasoning/embed — embeddable reasoning surface using the same runtime prep
 * as the hosted route. Signed org tokens add attribution; missing or invalid
 * tokens fall back to neutral public context so embeds keep propagating.
 */

import { headers } from "next/headers";
import { verifyOrgContextToken } from "@/lib/organization-context-token.server";
import { resolveLocale } from "@/lib/reasoning/locale.server";
import { prepareReasoningSession } from "@/lib/reasoning/session.server";
import { ReasoningFlow } from "@/components/reasoning/ReasoningFlow";
import {
  CALL_SCRIPT_TOPOLOGY,
  ENTRY_NODE_ID,
} from "@/lib/reasoning/call-script";
import type { NodeId } from "@/lib/reasoning/types";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function EmbedPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const token = firstString(params.token);
  const verification = token ? verifyOrgContextToken(token) : null;
  const organizationId = verification?.ok ? verification.organizationId : null;
  const orgContextToken = verification?.ok ? token : null;

  const hdrs = await headers();
  const prepared = await prepareReasoningSession({
    hostRaw: hdrs.get("host"),
    organizationId,
    orgContextVerified: Boolean(verification?.ok),
    orgContextToken,
    localeKey: (
      await resolveLocale({
        urlLocale: firstString(params.locale),
        userProfileLocale: null,
        acceptLanguageHeader: hdrs.get("accept-language"),
      })
    ).localeKey,
    relationshipBucket: null,
    referralSource: firstString(params.ref),
    surface: "embed",
    audienceTag: null,
    initialNodeId: parseNodeId(firstString(params.at)),
    shareAttemptId: firstString(params.sa),
    referredByUserId: null,
    userAgent: hdrs.get("user-agent"),
  });

  if (!prepared) {
    return (
      <div className="border-2 border-foreground bg-background p-4 text-foreground">
        <p className="text-sm font-bold text-muted-foreground">
          This persuasion flow is not live yet.
        </p>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4">
      <ReasoningFlow
        initialReferrer={null}
        arms={prepared.arms}
        session={prepared.session}
        signatureCount={prepared.signatureCount}
        thresholdTotal={280_000_000}
      />
    </div>
  );
}

function firstString(v: string | string[] | undefined): string | null {
  if (Array.isArray(v)) return v[0] ?? null;
  return v ?? null;
}

function parseNodeId(v: string | null): NodeId {
  if (v && CALL_SCRIPT_TOPOLOGY[v]) return v;
  return ENTRY_NODE_ID;
}

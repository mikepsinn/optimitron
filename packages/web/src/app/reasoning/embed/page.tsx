/**
 * /reasoning/embed — embeddable reasoning surface using the same runtime prep
 * as the hosted route. Public organization slugs add attribution; missing or
 * unknown slugs fall back to neutral public context so embeds keep propagating.
 */

import { headers } from "next/headers";
import { getApprovedOrganizationForSurveySlug } from "@/lib/organization.server";
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
  const organizationSlug =
    firstString(params.organizationSlug) ?? firstString(params.org);
  const organization = organizationSlug
    ? await getApprovedOrganizationForSurveySlug(organizationSlug)
    : null;

  const hdrs = await headers();
  const prepared = await prepareReasoningSession({
    hostRaw: hdrs.get("host"),
    organizationId: organization?.id ?? null,
    organizationResolved: Boolean(organization),
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

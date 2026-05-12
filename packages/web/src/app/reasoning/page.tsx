/**
 * /reasoning — allocator-driven hosted reasoning flow.
 */

import Link from "next/link";
import { headers } from "next/headers";
import { resolveOrgFromHost } from "@/lib/reasoning/host-resolution.server";
import { resolveLocale } from "@/lib/reasoning/locale.server";
import { getApprovedOrganizationForSurveySlug } from "@/lib/organization.server";
import { prepareReasoningSession } from "@/lib/reasoning/session.server";
import { ReasoningFlow } from "@/components/reasoning/ReasoningFlow";
import {
  CALL_SCRIPT_TOPOLOGY,
  ENTRY_NODE_ID,
} from "@/lib/reasoning/call-script";
import { ROUTES } from "@/lib/routes";
import type { NodeId, RelationshipBucket } from "@/lib/reasoning/types";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function ReasoningPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const hdrs = await headers();
  const hostRaw = hdrs.get("host");

  const hostResolution = await resolveOrgFromHost(hostRaw);
  const organizationSlug =
    firstString(params.organizationSlug) ?? firstString(params.org);
  const publicOrganization = organizationSlug
    ? await getApprovedOrganizationForSurveySlug(organizationSlug)
    : null;
  let organizationId = hostResolution.organizationId;
  let organizationResolved = hostResolution.verified;
  if (!organizationId && publicOrganization) {
    organizationId = publicOrganization.id;
    organizationResolved = true;
  }

  const locale = await resolveLocale({
    urlLocale: firstString(params.locale),
    userProfileLocale: null,
    acceptLanguageHeader: hdrs.get("accept-language"),
  });

  const prepared = await prepareReasoningSession({
    hostRaw,
    organizationId,
    organizationResolved,
    localeKey: locale.localeKey,
    relationshipBucket: parseBucket(firstString(params.rel)),
    referralSource: firstString(params.ref),
    surface: "hosted",
    audienceTag: null,
    initialNodeId: parseNodeId(firstString(params.at)),
    shareAttemptId: firstString(params.sa),
    referredByUserId: null,
    userAgent: hdrs.get("user-agent"),
  });

  if (!prepared) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
        <div className="max-w-xl border-2 border-foreground p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Not live yet
          </p>
          <h1 className="mt-3 text-4xl font-black uppercase sm:text-5xl md:text-6xl">
            This persuasion flow is still loading.
          </h1>
          <p className="mt-4 text-base font-bold leading-7 text-muted-foreground">
            Vote on the treaty now, then use your share link to bring in the
            next human.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={ROUTES.vote}
              className="border-2 border-foreground bg-foreground px-4 py-2 text-sm font-bold text-background"
            >
              Vote
            </Link>
            <Link
              href={ROUTES.dashboard}
              className="border-2 border-foreground px-4 py-2 text-sm font-bold"
            >
              Share
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ReasoningFlow
      initialReferrer={firstString(params.from)}
      arms={prepared.arms}
      session={prepared.session}
      signatureCount={prepared.signatureCount}
      thresholdTotal={280_000_000}
    />
  );
}

function firstString(v: string | string[] | undefined): string | null {
  if (Array.isArray(v)) return v[0] ?? null;
  return v ?? null;
}

function parseBucket(v: string | null): RelationshipBucket | null {
  if (!v) return null;
  if (
    v === "family-partner" ||
    v === "close-friend" ||
    v === "professional" ||
    v === "weak-tie"
  ) {
    return v;
  }
  return null;
}

function parseNodeId(v: string | null): NodeId {
  if (v && CALL_SCRIPT_TOPOLOGY[v]) return v;
  return ENTRY_NODE_ID;
}

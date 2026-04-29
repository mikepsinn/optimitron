/**
 * /reasoning — allocator-driven hosted reasoning flow.
 */

import { headers } from "next/headers";
import { resolveOrgFromHost } from "@/lib/reasoning/host-resolution.server";
import { resolveLocale } from "@/lib/reasoning/locale.server";
import { verifyOrgContextToken } from "@/lib/organization-context-token.server";
import { prepareReasoningSession } from "@/lib/reasoning/session.server";
import { ReasoningFlow } from "@/components/reasoning/ReasoningFlow";
import { CALL_SCRIPT_TOPOLOGY, ENTRY_NODE_ID } from "@/lib/reasoning/call-script";
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
  const token = firstString(params.token);
  let organizationId = hostResolution.organizationId;
  let orgContextVerified = hostResolution.verified;
  if (token) {
    const verification = verifyOrgContextToken(token);
    if (verification.ok) {
      organizationId = verification.organizationId;
      orgContextVerified = true;
    }
  }

  const locale = await resolveLocale({
    urlLocale: firstString(params.locale),
    userProfileLocale: null,
    acceptLanguageHeader: hdrs.get("accept-language"),
  });

  const prepared = await prepareReasoningSession({
    hostRaw,
    organizationId,
    orgContextVerified,
    orgContextToken: token,
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
      <div className="min-h-screen flex items-center justify-center p-6">
        <p className="text-lg font-black uppercase">
          Convince-me is not yet seeded. Run the seed script.
        </p>
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

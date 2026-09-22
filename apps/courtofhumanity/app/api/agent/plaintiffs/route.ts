import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { courtUrl } from "@optimitron/site-kit/lib/court-links";
import { ROUTES } from "@/lib/routes";
import { AGENT_CACHE_CONTROL } from "@/lib/court-agent-readable";
import { getHumanityVGovernmentPlaintiffCount, getHumanityVGovernmentVerdictStats } from "@/lib/humanity-v-government-case.server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const [plaintiffCount, verdict] = await Promise.all([
    getHumanityVGovernmentPlaintiffCount(), getHumanityVGovernmentVerdictStats(null),
  ]);
  const payload = {
    name: "Humanity v Government plaintiffs",
    sourceUrls: [courtUrl("/plaintiffs"), courtUrl(ROUTES.humanityVGovernment)],
    plaintiffCount,
    humanityVGovernmentVerdict: {
      referendumSlug: verdict.referendumSlug, yesCount: verdict.yesCount,
      noCount: verdict.noCount, abstainCount: verdict.abstainCount,
    },
    registerUrl: courtUrl("/plaintiffs"), caseUrl: courtUrl(ROUTES.humanityVGovernment),
    publicDataPolicy: "Only intentionally public plaintiff/case data belongs in public agent surfaces. Private account details, emails, cookies, and auth state are excluded.",
    cacheSeconds: 3600,
  };
  return NextResponse.json({ ...payload, generatedAt: new Date().toISOString(),
    contentHash: `sha256:${createHash("sha256").update(JSON.stringify(payload)).digest("hex")}`,
  }, { headers: { "Cache-Control": AGENT_CACHE_CONTROL } });
}

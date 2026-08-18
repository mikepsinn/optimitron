import { headers } from "next/headers";
import { NextResponse } from "next/server";
import {
  buildAgentCampaignState,
} from "@/lib/agent-readable/agent-api.server";
import { AGENT_CACHE_CONTROL } from "@/lib/agent-readable/campaign-canon";
import { getSiteFromHeaders } from "@/lib/site";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const hdrs = await headers();
  const site = getSiteFromHeaders(hdrs);
  return NextResponse.json(await buildAgentCampaignState(site), {
    headers: { "Cache-Control": AGENT_CACHE_CONTROL },
  });
}

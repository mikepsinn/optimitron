import { NextResponse } from "next/server";
import { buildAgentParameters } from "@/lib/agent-readable/agent-api.server";
import { AGENT_CACHE_CONTROL } from "@/lib/agent-readable/campaign-canon";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(await buildAgentParameters(), {
    headers: { "Cache-Control": AGENT_CACHE_CONTROL },
  });
}

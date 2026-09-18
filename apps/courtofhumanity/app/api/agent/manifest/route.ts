import { NextResponse } from "next/server";
import { AGENT_CACHE_CONTROL, buildCourtAgentManifest } from "@/lib/court-agent-readable";
export function GET() {
  return NextResponse.json(buildCourtAgentManifest(), { headers: { "Cache-Control": AGENT_CACHE_CONTROL } });
}

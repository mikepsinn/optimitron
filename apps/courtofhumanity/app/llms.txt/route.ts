import { AGENT_CACHE_CONTROL, buildCourtLlmsTxt } from "@/lib/court-agent-readable";
export function GET() {
  return new Response(buildCourtLlmsTxt(), { headers: {
    "Cache-Control": AGENT_CACHE_CONTROL, "Content-Type": "text/plain; charset=utf-8",
  } });
}

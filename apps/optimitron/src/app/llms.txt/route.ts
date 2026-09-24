import { AGENT_CACHE_CONTROL } from "@/lib/agent-readable/campaign-canon";
import { buildLlmsTxt } from "@/lib/agent-readable/llms-text";

export const dynamic = "force-dynamic";

export async function GET() {
  return new Response(buildLlmsTxt(), {
    headers: {
      "Cache-Control": AGENT_CACHE_CONTROL,
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}

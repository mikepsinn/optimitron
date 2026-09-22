import { AGENT_CACHE_CONTROL } from "@/lib/court-agent-readable";
import { buildCourtMarkdownMirror } from "@/lib/court-agent-readable";

export const dynamic = "force-dynamic";

export async function GET() {

  return new Response(buildCourtMarkdownMirror("humanity-v-government"), {
    headers: {
      "Cache-Control": AGENT_CACHE_CONTROL,
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
}

import { AGENT_CACHE_CONTROL } from "@/lib/agent-readable/campaign-canon";
import { buildMarkdownMirror } from "@/lib/agent-readable/markdown-mirrors";

export const dynamic = "force-dynamic";

export async function GET() {
  return new Response(buildMarkdownMirror("faq"), {
    headers: {
      "Cache-Control": AGENT_CACHE_CONTROL,
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
}

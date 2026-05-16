import { headers } from "next/headers";
import { AGENT_CACHE_CONTROL } from "@/lib/agent-readable/campaign-canon";
import { buildMarkdownMirror } from "@/lib/agent-readable/markdown-mirrors";
import { getSiteFromHeaders } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function GET() {
  const hdrs = await headers();
  const site = getSiteFromHeaders(hdrs);

  return new Response(buildMarkdownMirror("faq", site), {
    headers: {
      "Cache-Control": AGENT_CACHE_CONTROL,
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
}

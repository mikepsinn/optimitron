import { AGENT_CACHE_CONTROL } from "@/lib/agent-readable/campaign-canon";
import { buildMarkdownMirror } from "@/lib/agent-readable/markdown-mirrors";
import { getReferendumPageContent } from "@/lib/referendum-content.server";
import { TREATY_REFERENDUM_SLUG } from "@/lib/treaty";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const content = await getReferendumPageContent(TREATY_REFERENDUM_SLUG);

  return new Response(
    buildMarkdownMirror("treaty", {
      treatyMarkdown: content?.bodyMarkdown,
    }),
    {
      headers: {
        "Cache-Control": AGENT_CACHE_CONTROL,
        "Content-Type": "text/markdown; charset=utf-8",
      },
    },
  );
}

import { AGENT_CACHE_CONTROL } from "@/lib/court-agent-readable";
import { buildCourtMarkdownMirror } from "@/lib/court-agent-readable";
import { COURT_OF_HUMANITY_SLUG } from "@/lib/court-of-humanity";
import { getReferendumPageContent } from "@/lib/referendum-content.server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const content = await getReferendumPageContent(COURT_OF_HUMANITY_SLUG);

  return new Response(
    buildCourtMarkdownMirror("court", {
      courtMarkdown: content?.bodyMarkdown,
    }),
    {
      headers: {
        "Cache-Control": AGENT_CACHE_CONTROL,
        "Content-Type": "text/markdown; charset=utf-8",
      },
    },
  );
}

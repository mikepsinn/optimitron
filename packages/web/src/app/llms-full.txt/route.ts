import { headers } from "next/headers";
import { AGENT_CACHE_CONTROL } from "@/lib/agent-readable/campaign-canon";
import { buildLlmsFullTxt } from "@/lib/agent-readable/llms-text";
import { getSiteFromHeaders } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function GET() {
  const hdrs = await headers();
  const site = getSiteFromHeaders(hdrs);

  return new Response(buildLlmsFullTxt(site), {
    headers: {
      "Cache-Control": AGENT_CACHE_CONTROL,
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}

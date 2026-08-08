import type { Metadata } from "next";
import { EXPECTED_VALUE_METHODOLOGY_MARKDOWN } from "@optimitron/data/parameters";
import { RichMarkdown } from "@/components/markdown/rich-markdown";
import { getRouteMetadata } from "@/lib/metadata";
import { methodologyLink } from "@/lib/routes";

export const metadata: Metadata = getRouteMetadata(methodologyLink);

/**
 * Renders the expected-value rules straight from the parameter catalog, so the
 * page cannot describe numbers the code no longer uses. Same source the MCP
 * tools quote to agents.
 */
export default function MethodologyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <RichMarkdown markdown={EXPECTED_VALUE_METHODOLOGY_MARKDOWN} />
    </main>
  );
}

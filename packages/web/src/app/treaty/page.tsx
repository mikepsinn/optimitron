import type { Metadata } from "next";
import { headers } from "next/headers";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getOptionalReferendumSiteContent } from "@/content/referendum-sites";
import { readerMarkdownComponents } from "@/components/referendum/reader-markdown-components";
import { TreatyNameSignatureBox } from "@/components/treaty/TreatyNameSignatureBox";
import { getRouteMetadata, getSiteMetadata } from "@/lib/metadata";
import { getReferendumPageContent } from "@/lib/referendum-content.server";
import { ROUTES, treatyLink } from "@/lib/routes";
import { getSiteFromHeaders } from "@/lib/site";
import { TREATY_REFERENDUM_SLUG } from "@/lib/treaty";

export async function generateMetadata(): Promise<Metadata> {
  const hdrs = await headers();
  const site = getSiteFromHeaders(hdrs);

  if (site.primaryReferendumSlug) {
    const content = getOptionalReferendumSiteContent(site.contentKey);
    if (content) {
      return getSiteMetadata(site, content.metadata.treaty, ROUTES.treaty);
    }
  }

  return getRouteMetadata(treatyLink);
}

/**
 * `/treaty` — the original skim-and-sign surface from before the stepper
 * + Court-CTA era. One centered headline, the treaty body rendered as a
 * single continuous markdown document, and a single signature box at the
 * bottom. No multi-step prelude, no slide split, no decorative dividers,
 * no competing CTAs.
 *
 * Restored to match the commit-`1c58293e` landing-page treaty layout
 * after multiple ad-hoc additions buried the signature box behind a wall
 * of interactions.
 */
export default async function TreatyPage() {
  const referendumContent = await getReferendumPageContent(
    TREATY_REFERENDUM_SLUG,
  );
  const treatyMarkdown = referendumContent?.bodyMarkdown ?? "";

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <section className="space-y-10">
        <h2 className="text-center text-3xl font-black uppercase tracking-[0.08em] text-[var(--treaty-ink)] [font-family:var(--v0-font-libre-baskerville)] sm:text-4xl md:text-5xl">
          Please quickly skim and sign to end war and disease.
        </h2>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={readerMarkdownComponents}
        >
          {treatyMarkdown}
        </ReactMarkdown>
      </section>

      <section id="sign-below-treaty" className="mt-12">
        <TreatyNameSignatureBox />
      </section>
    </main>
  );
}

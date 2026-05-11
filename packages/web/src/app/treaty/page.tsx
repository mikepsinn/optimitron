import type { Metadata } from "next";
import { headers } from "next/headers";
import { getOptionalReferendumSiteContent } from "@/content/referendum-sites";
import { TreatyContent } from "@/components/treaty/TreatyContent";
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
 * `/treaty` — the lightweight "skim and sign" surface. Previously rendered
 * the full multi-step stepper (prelude → grandma → apocalypse → slides →
 * vote) which buried the signature box behind a forced narrative. Reverted
 * to the document-then-sign layout: one short call-to-action on top, the
 * treaty body in the middle, the signature box at the bottom.
 */
export default async function TreatyPage() {
  const referendumContent = await getReferendumPageContent(
    TREATY_REFERENDUM_SLUG,
  );

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <TreatyContent bodyMarkdown={referendumContent?.bodyMarkdown} />
    </main>
  );
}

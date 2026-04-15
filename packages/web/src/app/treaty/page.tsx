import type { Metadata } from "next";
import { headers } from "next/headers";
import { getReferendumSiteContent } from "@/content/referendum-sites";
import { ReferendumStepperPage } from "@/components/referendum/ReferendumStepperPage";
import { getRouteMetadata, getSiteMetadata } from "@/lib/metadata";
import { treatyLink } from "@/lib/routes";
import { getSiteFromHost } from "@/lib/site";
import { TREATY_REFERENDUM_SLUG } from "@/lib/treaty";

export async function generateMetadata(): Promise<Metadata> {
  const hdrs = await headers();
  const site = getSiteFromHost(hdrs.get("host"));

  if (site.primaryReferendumSlug) {
    const content = getReferendumSiteContent(site.contentKey);
    return getSiteMetadata(site, content.metadata.treaty);
  }

  return getRouteMetadata(treatyLink);
}

interface TreatyPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function TreatyPage({ searchParams }: TreatyPageProps) {
  const params = await searchParams;
  const referralCode = typeof params.ref === "string" ? params.ref : null;

  return (
    <div className="min-h-screen bg-background">
      <ReferendumStepperPage
        slug={TREATY_REFERENDUM_SLUG}
        referralCode={referralCode}
      />
    </div>
  );
}

import type { Metadata } from "next";
import { headers } from "next/headers";
import { getOptionalReferendumSiteContent } from "@/content/referendum-sites";
import { ReferendumStepperPage } from "@/components/referendum/ReferendumStepperPage";
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

interface TreatyPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function TreatyPage({ searchParams }: TreatyPageProps) {
  const params = await searchParams;
  const hdrs = await headers();
  const site = getSiteFromHeaders(hdrs);
  const referralCode = typeof params.ref === "string" ? params.ref : null;
  const treatyDashboardUrl =
    site.key === "onePercentTreaty" ? "/dashboard?welcome=1" : undefined;
  const referendumContent = await getReferendumPageContent(TREATY_REFERENDUM_SLUG);

  return (
    <div className="min-h-screen bg-background">
      <ReferendumStepperPage
        slug={TREATY_REFERENDUM_SLUG}
        referralCode={referralCode}
        question={referendumContent?.question}
        bodyMarkdown={referendumContent?.bodyMarkdown}
        authCallbackUrl={treatyDashboardUrl}
        postSignRedirectUrl={treatyDashboardUrl}
      />
    </div>
  );
}

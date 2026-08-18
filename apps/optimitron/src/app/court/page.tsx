import type { Metadata } from "next";
import { headers } from "next/headers";
import { ReferendumStepperPage } from "@/components/referendum/ReferendumStepperPage";
import { JsonLdScript } from "@/components/site/JsonLdScript";
import { TreatyNameSignatureBox } from "@/components/treaty/TreatyNameSignatureBox";
import { buildCourtStructuredData } from "@/lib/campaign-structured-data";
import { COURT_OF_HUMANITY_SLUG } from "@/lib/court-of-humanity";
import { getRouteMetadata } from "@/lib/metadata";
import { getReferendumPageContent } from "@/lib/referendum-content.server";
import { courtLink } from "@/lib/routes";
import { getSiteFromHeaders } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  return getRouteMetadata(courtLink);
}

interface CourtPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Court of Humanity referendum page. The shared referendum config supplies
 * the Court-specific "join/member" action copy and referral URL behavior.
 */
export default async function CourtPage({ searchParams }: CourtPageProps) {
  const params = await searchParams;
  const hdrs = await headers();
  const site = getSiteFromHeaders(hdrs);
  const referralCode = typeof params.ref === "string" ? params.ref : null;
  const dashboardUrl =
    site.primaryReferendumSlug ? "/dashboard?welcome=1" : undefined;
  const referendumContent = await getReferendumPageContent(COURT_OF_HUMANITY_SLUG);

  return (
    <div className="min-h-screen bg-background">
      <JsonLdScript data={buildCourtStructuredData(site)} />
      <ReferendumStepperPage
        slug={COURT_OF_HUMANITY_SLUG}
        referralCode={referralCode}
        question={referendumContent?.question}
        bodyMarkdown={referendumContent?.bodyMarkdown}
        authCallbackUrl={dashboardUrl}
        postSignRedirectUrl={dashboardUrl}
      />
      <section id="sign-below-court" className="px-4 pb-16">
        <TreatyNameSignatureBox
          authCallbackUrl="/court"
          referralCode={referralCode}
          referendumSlug={COURT_OF_HUMANITY_SLUG}
        />
      </section>
    </div>
  );
}

import type { Metadata } from "next";
import { headers } from "next/headers";
import { ReferendumStepperPage } from "@/components/referendum/ReferendumStepperPage";
import { COURT_OF_HUMANITY_SLUG } from "@/lib/court-of-humanity";
import { getRouteMetadata } from "@/lib/metadata";
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
    site.key === "onePercentTreaty" ? "/dashboard?welcome=1" : undefined;

  return (
    <div className="min-h-screen bg-background">
      <ReferendumStepperPage
        slug={COURT_OF_HUMANITY_SLUG}
        referralCode={referralCode}
        authCallbackUrl={dashboardUrl}
        postSignRedirectUrl={dashboardUrl}
      />
    </div>
  );
}

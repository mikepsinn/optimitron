import { EosInvestLandingPage } from "@/components/invest/EosInvestLandingPage";
import { getRouteMetadata } from "@/lib/metadata";
import { investLink } from "@/lib/routes";

export const metadata = getRouteMetadata(investLink);

// Scroll-driven investor/governance pitch (Mike 2026-07-26 brief): the
// status-quo numbers, the universal-shareholder thesis, Class A/B shares,
// and the Optimitron engine, ending in the treaty vote flow.
export default function InvestPage() {
  return <EosInvestLandingPage />;
}

import { EosRetroLandingPage } from "@/components/eos-retro/EosRetroLandingPage";
import { getRouteMetadata } from "@/lib/metadata";
import { eosLink } from "@/lib/routes";

export const metadata = getRouteMetadata(eosLink);

// Phase A of the retro-futurist investor landing (Mike 2026-07-11 directive).
// The previous EarthOptimizationServicesLandingPage remains intact in
// components/site/ pending the homepage-variant decision.
export default function EosPage() {
  return <EosRetroLandingPage />;
}

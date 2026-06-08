import { EarthOptimizationServicesLandingPage } from "@/components/site/EarthOptimizationServicesLandingPage";
import { getRouteMetadata } from "@/lib/metadata";
import { eosLink } from "@/lib/routes";

export const metadata = getRouteMetadata(eosLink);

export default function EosPage() {
  return <EarthOptimizationServicesLandingPage />;
}

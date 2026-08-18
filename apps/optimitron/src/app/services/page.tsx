import { EarthOptimizationServicesLandingPage } from "@/components/site/EarthOptimizationServicesLandingPage";
import { getRouteMetadata } from "@/lib/metadata";
import { servicesLink } from "@/lib/routes";

export const metadata = getRouteMetadata(servicesLink);

export default function ServicesPage() {
  return <EarthOptimizationServicesLandingPage />;
}

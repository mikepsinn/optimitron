import { PoliticalDysfunctionTaxSection } from "@/components/landing/PoliticalDysfunctionTaxSection";
import { getRouteMetadata } from "@/lib/metadata";
import { dysfunctionTaxLink } from "@/lib/routes";

export const metadata = getRouteMetadata(dysfunctionTaxLink);

export default function DysfunctionTaxPage() {
  return <PoliticalDysfunctionTaxSection />;
}

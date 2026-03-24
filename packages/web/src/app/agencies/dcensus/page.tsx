import type { Metadata } from "next";
import { WishoniaAgencyPage } from "@/components/wishonia-agency/WishoniaAgencyPage";
import { getWishoniaAgency } from "@optimitron/data";

const agency = getWishoniaAgency("dcensus")!;

export const metadata: Metadata = {
  title: `${agency.dName}: ${agency.replacesAgencyName} — DEPRECATED | Optimitron`,
  description: agency.tagline,
};

export default function DCensusPage() {
  return <WishoniaAgencyPage agency={agency} />;
}

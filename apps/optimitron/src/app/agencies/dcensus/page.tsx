import type { Metadata } from "next";
import { WishoniaAgencyPage } from "@/components/wishonia-agency/WishoniaAgencyPage";
import { AGENCIES } from "@optimitron/data/datasets/wishonia-agencies";

const agency = AGENCIES.dcensus;

export const metadata: Metadata = {
  title: `${agency.dName}: ${agency.replacesAgencyName} — DEPRECATED | Optimitron`,
  description: agency.description,
};

export default function DCensusPage() {
  return <WishoniaAgencyPage agency={agency} />;
}

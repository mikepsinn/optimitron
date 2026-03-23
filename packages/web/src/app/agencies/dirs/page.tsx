import type { Metadata } from "next";
import { DeprecatedAgencyPage } from "@/components/deprecated-agency/DeprecatedAgencyPage";
import { getAgencyById } from "@/lib/deprecated-agencies-data";

const agency = getAgencyById("dirs")!;

export const metadata: Metadata = {
  title: `${agency.dName}: ${agency.agencyName} — DEPRECATED | Optimitron`,
  description: agency.tagline,
};

export default function DIrsPage() {
  return <DeprecatedAgencyPage agency={agency} />;
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WishoniaAgencyPage } from "@/components/wishonia-agency/WishoniaAgencyPage";
import {
  getWishoniaAgency,
  getWishoniaAgencies,
} from "@optimitron/data/datasets/wishonia-agencies";

interface PageProps {
  params: Promise<{ agencyId: string }>;
}

export function generateStaticParams() {
  return getWishoniaAgencies().map((agency) => ({
    agencyId: agency.id,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { agencyId } = await params;
  const agency = getWishoniaAgency(agencyId);

  if (!agency) {
    return { title: "Agency Not Found" };
  }

  return {
    title: `${agency.dName}: ${agency.replacesAgencyName} | Optimitron`,
    description: agency.description,
  };
}

export default async function WishoniaAgencyDetailPage({ params }: PageProps) {
  const { agencyId } = await params;
  const agency = getWishoniaAgency(agencyId);

  if (!agency) {
    notFound();
  }

  return <WishoniaAgencyPage agency={agency} />;
}

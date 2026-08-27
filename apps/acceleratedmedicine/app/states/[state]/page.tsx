import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import { StateCampaignPage } from "@/components/state-campaign-page";
import { getStateCampaign, STATE_CAMPAIGNS } from "@/lib/right-to-try";

export const dynamicParams = false;

interface StatePageProps {
  params: Promise<{ state: string }>;
}

export function generateStaticParams() {
  return STATE_CAMPAIGNS.filter(
    (campaign) => campaign.name !== "Missouri" && campaign.name !== "Montana",
  ).map((campaign) => ({ state: campaign.slug }));
}

export async function generateMetadata({
  params,
}: StatePageProps): Promise<Metadata> {
  const { state } = await params;
  if (state === "montana") return {};

  const campaign = getStateCampaign(state);
  if (!campaign) return {};

  return {
    title: `${campaign.name} Right to Trial`,
    description: campaign.summary,
    alternates: {
      canonical: `https://acceleratedmedicine.org/states/${campaign.slug}`,
    },
  };
}

export default async function StatePage({ params }: StatePageProps) {
  const { state } = await params;
  if (state === "montana") permanentRedirect("/montana");

  const campaign = getStateCampaign(state);
  if (!campaign) notFound();

  return <StateCampaignPage campaign={campaign} />;
}

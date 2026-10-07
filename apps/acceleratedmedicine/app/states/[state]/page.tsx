import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { StateCampaignPage } from "@/components/state-campaign-page";
import { getStateCampaign, STATE_CAMPAIGNS } from "@/lib/right-to-try";
import { rightToTrialMetadata } from "@/lib/right-to-trial-metadata";
import { getSupportSummary } from "@/lib/support-store";

export const dynamicParams = false;
// The supporting organizations refresh every few minutes, and at once when one is approved.
export const revalidate = 300;

interface StatePageProps {
  params: Promise<{ state: string }>;
}

export function generateStaticParams() {
  return STATE_CAMPAIGNS.filter(
    (campaign) => campaign.name !== "Montana",
  ).map((campaign) => ({ state: campaign.slug }));
}

export async function generateMetadata({
  params,
}: StatePageProps): Promise<Metadata> {
  const { state } = await params;
  const campaign = getStateCampaign(state);
  if (!campaign) return {};

  return rightToTrialMetadata({
    title: `${campaign.name}: Care-Integrated Clinical Trials`,
    description: campaign.summary,
    path: `/states/${campaign.slug}`,
  });
}

export default async function StatePage({ params }: StatePageProps) {
  const { state } = await params;
  const campaign = getStateCampaign(state);
  if (!campaign) notFound();
  const { organizations } = await getSupportSummary();

  return (
    <StateCampaignPage
      campaign={campaign}
      organizations={organizations.filter((organization) => organization.state === campaign.name)}
    />
  );
}

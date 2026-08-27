import type { Metadata } from "next";

import { StateCampaignPage } from "@/components/state-campaign-page";
import { getStateCampaign } from "@/lib/right-to-try";

export const metadata: Metadata = {
  title: "Missouri Right to Trial",
  description:
    "Help bring Right to Trial to every Missouri patient through pragmatic clinical trials and shared outcome evidence.",
  alternates: {
    canonical: "https://acceleratedmedicine.org/states/missouri",
  },
};

export default async function MissouriPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const campaign = getStateCampaign("missouri");
  if (!campaign) return null;
  const { role } = await searchParams;

  return (
    <StateCampaignPage
      campaign={campaign}
      initialRole={role === "clinician" ? "clinician" : undefined}
    />
  );
}

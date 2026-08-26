import type { Metadata } from "next";

import { StateCampaignPage } from "@/components/state-campaign-page";
import { getStateCampaign } from "@/lib/right-to-try";

export const metadata: Metadata = {
  title: "Missouri Universal Right to Try",
  description:
    "Missouri patients, clinicians, researchers, and public educators can help shape a responsible Universal Right to Try proposal.",
  alternates: {
    canonical: "https://acceleratedmedicine.org/states/missouri",
  },
};

export default function MissouriPage() {
  const campaign = getStateCampaign("missouri");
  if (!campaign) return null;

  return <StateCampaignPage campaign={campaign} />;
}

import type { Metadata } from "next";

import { AcceleratedMedicinePage } from "@/components/accelerated-medicine-chrome";
import { RightToTrialImpactExplorer } from "@/components/impact/right-to-trial-impact-explorer";
import { rightToTrialMetadata } from "@/lib/right-to-trial-metadata";

export const metadata: Metadata = rightToTrialMetadata({
  title: "Impact Model | Care-Integrated Clinical Trials Initiative",
  description:
    "A model of how much sooner treatments could arrive if every state adopted the Care-Integrated Clinical Trials Act, with every assumption you can change.",
  path: "/impact",
});

export default function ImpactPage() {
  return (
    <AcceleratedMedicinePage>
      <RightToTrialImpactExplorer />
    </AcceleratedMedicinePage>
  );
}

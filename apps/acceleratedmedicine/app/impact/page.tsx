import type { Metadata } from "next";

import Layout from "@/components/layout";
import { RightToTrialImpactExplorer } from "@/components/impact/right-to-trial-impact-explorer";
import DecentralizedFDASection from "@/components/landing/decentralized-fda-section";

export const metadata: Metadata = {
  alternates: {
    canonical: "/impact",
  },
  description:
    "Explore how Right to Trial, pragmatic clinical trials, and shared evidence could accelerate first treatments and include more patients in research.",
  title: "Right to Trial Impact | Institute for Accelerated Medicine",
};

export default function RightToTrialImpactPage() {
  return (
    <Layout>
      <RightToTrialImpactExplorer />
      <DecentralizedFDASection showDisclaimer={false} />
    </Layout>
  );
}

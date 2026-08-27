import type { Metadata } from "next";

import Layout from "@/components/layout";
import { RightToTrialImpactExplorer } from "@/components/impact/right-to-trial-impact-explorer";
import DecentralizedFDASection from "@/components/landing/decentralized-fda-section";

export const metadata: Metadata = {
  alternates: {
    canonical: "/impact",
  },
  description:
    "See how Right to Trial can help patients join low-cost clinical trials, find effective treatments sooner, and show which treatments work.",
  title: "Right to Trial Impact | Right to Trial Initiative",
};

export default function RightToTrialImpactPage() {
  return (
    <Layout>
      <RightToTrialImpactExplorer />
      <DecentralizedFDASection showDisclaimer={false} />
    </Layout>
  );
}

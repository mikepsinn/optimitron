import type { Metadata } from "next";

import Layout from "@/components/layout";
import { RightToTrialImpactExplorer } from "@/components/impact/right-to-trial-impact-explorer";
import DecentralizedFDASection from "@/components/landing/decentralized-fda-section";
import { rightToTrialMetadata } from "@/lib/right-to-trial-metadata";

export const metadata: Metadata = rightToTrialMetadata({
  title: "Right to Trial Impact | Right to Trial Initiative",
  description:
    "See how Right to Trial can help patients join low-cost clinical trials, find effective treatments sooner, and show which treatments work.",
  path: "/impact",
});

export default function RightToTrialImpactPage() {
  return (
    <Layout>
      <RightToTrialImpactExplorer />
      <DecentralizedFDASection showDisclaimer={false} />
    </Layout>
  );
}

import type { Metadata } from "next";
import { EosDesignBPage } from "@/components/eos-design-b/EosDesignBPage";

export const metadata: Metadata = {
  title: "EOS Landing — Version B (The Press Kit)",
  description:
    "Competing visual direction B for the Earth Optimization Services landing page: a 1962 NASA press kit.",
  robots: { index: false, follow: false },
};

export default function DesignBPage() {
  return <EosDesignBPage />;
}

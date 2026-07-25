import type { Metadata } from "next";
import { EosLandingPreviewPage } from "@/components/eos-preview/EosLandingPreviewPage";

// First vertical slice of the EOS landing page v2 (optimitron:dev:
// eos-landing-page-v2). Built at a NEW path so the existing /eos retro page is
// untouched; Mike decides cutover later. Metadata is defined inline (rather
// than via getRouteMetadata) because this is an unlisted preview route, not a
// nav destination.
export const metadata: Metadata = {
  title: "Earth Optimization Services (preview)",
  description:
    "Work-in-progress rebuild of the Earth Optimization Services landing page: the charge sheet against your government, and the side-by-side bid to replace it.",
  robots: { index: false, follow: false },
};

export default function EosPreviewPage() {
  return <EosLandingPreviewPage />;
}

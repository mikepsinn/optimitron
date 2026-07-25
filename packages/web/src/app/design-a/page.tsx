import type { Metadata } from "next";
import { DesignACatalogPage } from "@/components/design-a/DesignACatalogPage";

// Version A of three competing visual directions for the Earth Optimization
// Services landing page. Unlisted preview route: not in nav, not in the
// sitemap, noindex. Sibling directions live at their own /design-* routes.
export const metadata: Metadata = {
  title: "EOS Catalog — Design A",
  description:
    "Version A of the Earth Optimization Services landing page: the mail-order catalog.",
  robots: { index: false, follow: false },
};

export default function DesignAPage() {
  return <DesignACatalogPage />;
}

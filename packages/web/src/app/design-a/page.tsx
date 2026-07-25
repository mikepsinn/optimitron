import { designACatalogLink } from "@/lib/routes";
import { getRouteMetadata } from "@/lib/metadata";
import { DesignACatalogPage } from "@/components/design-a/DesignACatalogPage";

// Version A of three competing visual directions for the Earth Optimization
// Services landing page. Unlisted preview route: not in nav, not in the
// sitemap, noindex. Sibling directions live at their own /design-* routes.
// Metadata is derived from the canonical route registry (designACatalogLink)
// for a self-canonical URL + route-specific social card, then forced
// noindex — mirrors the /eos-preview pattern (PR #143).
export const metadata = getRouteMetadata(designACatalogLink, {
  robots: { index: false, follow: false },
});

export default function DesignAPage() {
  return <DesignACatalogPage />;
}

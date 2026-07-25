import { eosPreviewLink } from "@/lib/routes";
import { getRouteMetadata } from "@/lib/metadata";
import { EosLandingPreviewPage } from "@/components/eos-preview/EosLandingPreviewPage";

// First vertical slice of the EOS landing page v2 (optimitron:dev:
// eos-landing-page-v2). Built at a NEW path so the existing /eos retro page is
// untouched; Mike decides cutover later. Metadata is derived from the canonical
// route registry (eosPreviewLink) for a self-canonical URL + route-specific
// social card, then forced noindex — this is an unlisted preview, not a nav
// destination, so eosPreviewLink is intentionally absent from nav + sitemap.
export const metadata = getRouteMetadata(eosPreviewLink, {
  robots: { index: false, follow: false },
});

export default function EosPreviewPage() {
  return <EosLandingPreviewPage />;
}

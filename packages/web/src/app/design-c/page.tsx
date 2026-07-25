import { eosDesignCLink } from "@/lib/routes";
import { getRouteMetadata } from "@/lib/metadata";
import { DesignCPage } from "@/components/eos-design-c/DesignCPage";

// Version C of the EOS landing page bake-off: "The Educational Film".
// A new path so /eos and /eos-preview are untouched; Mike picks a winner
// later. Metadata comes from the canonical route registry so a shared link
// gets a self-canonical URL and its own social card, then forced noindex —
// this is an unlisted design candidate, not a nav destination.
export const metadata = getRouteMetadata(eosDesignCLink, {
  robots: { index: false, follow: false },
});

export default function DesignCRoute() {
  return <DesignCPage />;
}

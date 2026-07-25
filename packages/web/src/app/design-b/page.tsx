import { EosDesignBPage } from "@/components/eos-design-b/EosDesignBPage";
import { getRouteMetadata } from "@/lib/metadata";
import { designBLink } from "@/lib/routes";

export const metadata = getRouteMetadata(designBLink, {
  robots: { index: false, follow: false },
});

export default function DesignBPage() {
  return <EosDesignBPage />;
}

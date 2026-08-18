import { EosShareholderLandingPage } from "@/components/eos-shareholder/EosShareholderLandingPage";
import { getRouteMetadata } from "@/lib/metadata";
import { eosShareholdersLink } from "@/lib/routes";

export const metadata = getRouteMetadata(eosShareholdersLink);

export default function EosShareholdersPage() {
  return <EosShareholderLandingPage />;
}

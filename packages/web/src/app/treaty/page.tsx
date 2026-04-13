import { ReferendumStepperPage } from "@/components/referendum/ReferendumStepperPage";
import { getRouteMetadata } from "@/lib/metadata";
import { treatyLink } from "@/lib/routes";
import { TREATY_REFERENDUM_SLUG } from "@/lib/treaty";

export const metadata = getRouteMetadata(treatyLink);

interface TreatyPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function TreatyPage({ searchParams }: TreatyPageProps) {
  const params = await searchParams;
  const referralCode = typeof params.ref === "string" ? params.ref : null;

  return (
    <div className="min-h-screen bg-background">
      <ReferendumStepperPage
        slug={TREATY_REFERENDUM_SLUG}
        referralCode={referralCode}
      />
    </div>
  );
}

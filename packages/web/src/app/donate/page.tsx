import { Suspense } from "react";
import { ChaplinReference } from "@/components/donate/ChaplinReference";
import { DonationImpactCalculator } from "@/components/donate/DonationImpactCalculator";
import { WaysToGiveCard } from "@/components/donate/WaysToGiveCard";
import { getRouteMetadata } from "@/lib/metadata";
import { donateLink } from "@/lib/routes";

export const metadata = getRouteMetadata(donateLink);

export default function DonatePage() {
  return (
    <div className="min-h-screen bg-white text-black">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <h1 className="sr-only">Buy human life</h1>

        <Suspense
          fallback={
            <div className="border border-black p-6 text-sm">
              Loading calculator…
            </div>
          }
        >
          <DonationImpactCalculator />
        </Suspense>

        <div className="mt-10">
          <WaysToGiveCard />
        </div>

        <div className="mt-12">
          <ChaplinReference />
        </div>
      </div>
    </div>
  );
}

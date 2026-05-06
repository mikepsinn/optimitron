import { Suspense } from "react";
import {
  DFDA_QUEUE_CLEARANCE_YEARS,
  GLOBAL_MILITARY_SPENDING_ANNUAL_2024,
  STATUS_QUO_QUEUE_CLEARANCE_YEARS,
  TREATY_REDUCTION_PCT,
} from "@optimitron/data/parameters";
import { headers } from "next/headers";
import { ChaplinReference } from "@/components/donate/ChaplinReference";
import { DonationImpactCalculator } from "@/components/donate/DonationImpactCalculator";
import { WaysToGiveCard } from "@/components/donate/WaysToGiveCard";
import { TreatyTradeThesis } from "@/components/referendum/TreatyTradeThesis";
import { ParameterValue } from "@/components/shared/ParameterValue";
import { getSiteMetadata } from "@/lib/metadata";
import { donateLink, ROUTES } from "@/lib/routes";
import { getSiteFromHeaders } from "@/lib/site";
import { FLOW_NUCLEAR_WINTER_OVERKILL_FACTOR } from "@/lib/treaty-share-flow-parameters";

export async function generateMetadata() {
  const hdrs = await headers();
  const site = getSiteFromHeaders(hdrs);
  return getSiteMetadata(
    site,
    {
      title: `${donateLink.label} | ${site.name}`,
      description: donateLink.description,
    },
    ROUTES.donate,
    { robots: { index: true, follow: true } },
  );
}

export default function DonatePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <section className="mb-4 border-2 border-foreground p-5 sm:p-6">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
            The 1% Treaty
          </p>
          <h1 className="mt-2 text-3xl font-black uppercase leading-tight sm:text-5xl">
            Trade one of humanity&apos;s{" "}
            <ParameterValue
              className="font-black"
              figures={3}
              param={FLOW_NUCLEAR_WINTER_OVERKILL_FACTOR}
            />{" "}
            apocalypses for disease eradication in{" "}
            <ParameterValue
              className="font-black"
              figures={2}
              param={DFDA_QUEUE_CLEARANCE_YEARS}
            />{" "}
            years.
          </h1>
          <div className="mt-4 max-w-4xl space-y-3 text-base font-bold leading-7 sm:text-lg sm:leading-8">
            <p>
              Humans spend{" "}
              <ParameterValue
                className="font-black"
                display="withUnit"
                figures={3}
                param={GLOBAL_MILITARY_SPENDING_ANNUAL_2024}
              />{" "}
              every year on stuff designed specifically to make humans stop
              being alive. The 1% Treaty redirects{" "}
              <ParameterValue
                className="font-black"
                figures={1}
                param={TREATY_REDUCTION_PCT}
              />{" "}
              of that spending to clinical trials.
            </p>
            <p>
              The current queue to not die is{" "}
              <ParameterValue
                className="font-black"
                figures={3}
                param={STATUS_QUO_QUEUE_CLEARANCE_YEARS}
              />{" "}
              years long. The proposal is simple: <TreatyTradeThesis />.
            </p>
            <p>
              Your donation helps reach the humans needed to prove humanity
              wants this.
            </p>
          </div>
        </section>

        <Suspense
          fallback={
            <div className="border border-foreground p-6 text-sm">
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

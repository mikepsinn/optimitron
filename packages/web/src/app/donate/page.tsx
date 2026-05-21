import Link from "next/link";
import { Suspense } from "react";
import {
  DISEASES_WITHOUT_EFFECTIVE_TREATMENT,
  GLOBAL_MILITARY_SPENDING_ANNUAL_2024,
  NEW_DISEASE_FIRST_TREATMENTS_PER_YEAR,
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
import { donateLink, onePercentTreatyPaperLink, ROUTES } from "@/lib/routes";
import { getSiteFromHeaders } from "@/lib/site";

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
          <h1 className="text-3xl font-black uppercase leading-tight sm:text-5xl">
            Trade one apocalypse for disease eradication
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
                figures={3}
                param={TREATY_REDUCTION_PCT}
              />{" "}
              of that spending to high-efficiency pragmatic clinical trials.
            </p>
            <p>
              Under the current system, only{" "}
              <ParameterValue
                className="font-black"
                figures={3}
                param={NEW_DISEASE_FIRST_TREATMENTS_PER_YEAR}
              />{" "}
              diseases get their first effective treatment each year while{" "}
              <ParameterValue
                className="font-black"
                figures={3}
                param={DISEASES_WITHOUT_EFFECTIVE_TREATMENT}
              />{" "}
              diseases are still waiting. That is why the disease-eradication
              timeline is{" "}
              <ParameterValue
                className="font-black"
                figures={3}
                param={STATUS_QUO_QUEUE_CLEARANCE_YEARS}
              />{" "}
              years. The proposal is simple: <TreatyTradeThesis />.
            </p>
            <p>
              Your donation helps reach the humans needed to prove humanity
              wants this.
            </p>
            <p>
              For the full economic analysis, read the{" "}
              <Link
                className="underline underline-offset-4 hover:no-underline"
                href={onePercentTreatyPaperLink.href}
                rel="noreferrer"
                target="_blank"
              >
                1% Treaty impact analysis
              </Link>
              .
            </p>
          </div>
        </section>

        <div id="donate-calculator" className="scroll-mt-6">
          <Suspense
            fallback={
              <div className="border border-foreground p-6 text-sm">
                Loading calculator…
              </div>
            }
          >
            <DonationImpactCalculator />
          </Suspense>
        </div>

        <div className="mt-10">
          <WaysToGiveCard />
        </div>

        <div className="mt-12">
          <ChaplinReference />
        </div>

        <p className="mt-8 text-center text-sm font-bold text-foreground">
          Foundations: distributing the shirt to every human on Earth costs
          roughly 3% of the global annual philanthropy budget.{" "}
          <Link href={ROUTES.foundations} className="font-black underline">
            See the case →
          </Link>
        </p>
      </div>
    </div>
  );
}

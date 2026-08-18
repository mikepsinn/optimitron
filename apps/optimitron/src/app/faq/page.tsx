import type { Metadata } from "next";
import { headers } from "next/headers";
import { JsonLdScript } from "@/components/site/JsonLdScript";
import { CAMPAIGN_FAQ_ITEMS } from "@/lib/agent-readable/campaign-canon";
import { buildCampaignFaqStructuredData } from "@/lib/campaign-structured-data";
import { getRouteMetadata } from "@/lib/metadata";
import { faqLink } from "@/lib/routes";
import { getSiteFromHeaders } from "@/lib/site";

export const metadata: Metadata = getRouteMetadata(faqLink);

export default async function FaqPage() {
  const hdrs = await headers();
  const site = getSiteFromHeaders(hdrs);

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <JsonLdScript data={buildCampaignFaqStructuredData(site)} />
      <h1 className="text-4xl font-black uppercase leading-tight text-foreground sm:text-5xl">
        Campaign FAQ
      </h1>
      <div className="mt-8 space-y-8">
        {CAMPAIGN_FAQ_ITEMS.map((item) => (
          <section
            className="border-t border-foreground pt-5"
            key={item.question}
          >
            <h2 className="text-xl font-black uppercase leading-tight text-foreground">
              {item.question}
            </h2>
            <p className="mt-3 text-base font-bold leading-7 text-muted-foreground">
              {item.answer}
            </p>
          </section>
        ))}
      </div>
    </main>
  );
}

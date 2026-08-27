import { FileText, HeartPulse, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { Card } from "@optimitron/neobrutalist-ui/ui/card";
import { Container } from "@optimitron/neobrutalist-ui/ui/container";
import { SectionContainer } from "@optimitron/neobrutalist-ui/ui/section-container";

import Layout from "@/components/layout";
import { StateSupportSection } from "@/components/landing/right-to-try-sections";
import type { StateCampaign, SupporterRole } from "@/lib/right-to-try";
import {
  estimatedRareDiseasePatients,
  estimateStateShare,
  FEDERAL_RIGHT_TO_TRY_YEAR,
  formatPeopleApprox,
  NATIONAL_CONDITION_COUNTS,
  RARE_DISEASES_COUNT,
  STATE_FACT_SOURCES,
  STATE_POPULATIONS,
  UNTREATED_RARE_DISEASE_SHARE_PCT,
} from "@/lib/state-facts";

export function StateCampaignPage({
  campaign,
  initialRole,
}: {
  campaign: StateCampaign;
  initialRole?: SupporterRole;
}) {
  const rarePatients = formatPeopleApprox(
    estimatedRareDiseasePatients(campaign.name),
  );
  const population = formatPeopleApprox(STATE_POPULATIONS[campaign.name]);

  const facts = [
    {
      icon: ShieldCheck,
      title: `Legal here since ${FEDERAL_RIGHT_TO_TRY_YEAR}`,
      text: `Right to Try has been federal law in ${campaign.name} since ${FEDERAL_RIGHT_TO_TRY_YEAR}. It lets some patients ask manufacturers for experimental treatments—but it built no clinics, pays no providers, and publishes no results.`,
      linkLabel: "Federal Right to Try Act",
      href: STATE_FACT_SOURCES.federalRightToTryAct,
      color: "bg-background",
    },
    {
      icon: HeartPulse,
      title: `${rarePatients} neighbors`,
      text: `About ${rarePatients} of ${campaign.name}'s ${population} people live with a rare disease—and ${UNTREATED_RARE_DISEASE_SHARE_PCT}% of the roughly ${RARE_DISEASES_COUNT.toLocaleString("en-US")} rare diseases have no approved treatment to try.`,
      linkLabel: "GAO rare disease report",
      href: STATE_FACT_SOURCES.usRareDiseasePatients,
      color: "bg-brutal-cyan",
    },
    {
      icon: FileText,
      title: "The missing half",
      text: `Montana licensed experimental treatment centers with SB 535. Right to Trial adds the evidence half—pragmatic trials, provider payment, and published results. ${campaign.name} can adopt both at once.`,
      linkLabel: "Read the model act",
      href: "/model-act",
      color: "bg-background",
    },
  ];

  const conditions = NATIONAL_CONDITION_COUNTS.map((condition) => ({
    ...condition,
    stateCount: estimateStateShare(campaign.name, condition.usCount),
  })).sort((a, b) => b.stateCount - a.stateCount);
  const largestCount = conditions[0]?.stateCount ?? 1;

  return (
    <Layout>
      <StateSupportSection
        body={campaign.summary}
        heading={campaign.headline}
        headingAs="h1"
        initialRole={initialRole}
        initialState={campaign.name}
      />

      <SectionContainer bgColor="pink" borderPosition="bottom">
        <Container>
          <h2 className="text-center text-4xl font-black uppercase leading-none tracking-tighter text-brutal-pink-foreground sm:text-5xl md:text-6xl">
            What {campaign.name} has today
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {facts.map(({ icon: Icon, title, text, linkLabel, href, color }) => (
              <Card
                key={title}
                className={`${color} gap-4 rounded-none border-4 border-primary p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]`}
              >
                <Icon className="h-12 w-12" strokeWidth={3} />
                <h3 className="text-2xl font-black uppercase">{title}</h3>
                <p className="font-bold">{text}</p>
                <Link
                  className="font-black uppercase underline underline-offset-4"
                  href={href}
                >
                  {linkLabel}
                </Link>
              </Card>
            ))}
          </div>
          <p className="mx-auto mt-8 max-w-3xl text-center text-sm font-bold">
            Patient estimate: {campaign.name}&apos;s share of the roughly 30
            million Americans with a rare disease (GAO 2025), using Census 2025
            population estimates.
          </p>
        </Container>
      </SectionContainer>

      <SectionContainer bgColor="yellow" borderPosition="bottom">
        <Container>
          <h2 className="text-center text-4xl font-black uppercase leading-none tracking-tighter sm:text-5xl md:text-6xl">
            Who is still waiting in {campaign.name}
          </h2>
          <p className="mx-auto mt-5 max-w-3xl text-center text-lg font-bold sm:text-xl">
            Today&apos;s medicine manages these conditions. It cures none of
            them.
          </p>
          <div className="mx-auto mt-10 flex max-w-3xl flex-col gap-5">
            {conditions.map((condition) => (
              <div key={condition.label}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                  <a
                    className="font-black uppercase underline underline-offset-4"
                    href={condition.sourceUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {condition.label}
                  </a>
                  <span className="font-black">
                    ~{formatPeopleApprox(condition.stateCount)} people
                  </span>
                </div>
                <div className="mt-2 h-8 border-4 border-primary bg-background">
                  <div
                    className="h-full bg-brutal-pink"
                    style={{
                      width: `${Math.max(
                        4,
                        (condition.stateCount / largestCount) * 100,
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="mx-auto mt-8 max-w-3xl text-center text-sm font-bold">
            Estimates: national counts scaled to {campaign.name}&apos;s share of
            the US population (Census 2025). Each condition links to its
            national source.
          </p>
        </Container>
      </SectionContainer>
    </Layout>
  );
}

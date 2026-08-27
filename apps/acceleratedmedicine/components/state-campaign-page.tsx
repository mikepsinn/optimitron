import {
  ArrowRight,
  FileText,
  HeartPulse,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@optimitron/neobrutalist-ui/ui/button";
import { Card } from "@optimitron/neobrutalist-ui/ui/card";
import { Container } from "@optimitron/neobrutalist-ui/ui/container";
import { SectionContainer } from "@optimitron/neobrutalist-ui/ui/section-container";

import Layout from "@/components/layout";
import { StateSupportSection } from "@/components/landing/right-to-try-sections";
import type { StateCampaign, SupporterRole } from "@/lib/right-to-try";
import {
  estimatedRareDiseasePatients,
  FEDERAL_RIGHT_TO_TRY_YEAR,
  formatPeopleApprox,
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

  return (
    <Layout>
      <SectionContainer
        bgColor="background"
        borderPosition="bottom"
        className="py-24 sm:py-28"
      >
        <Container size="lg" className="text-center">
          <p className="mx-auto inline-block rotate-[-1deg] border-4 border-primary bg-brutal-cyan px-4 py-2 font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            {campaign.stageLabel}
          </p>
          <h1 className="mt-7 text-5xl font-black uppercase leading-[0.9] tracking-tighter sm:text-6xl md:text-7xl lg:text-8xl">
            {campaign.headline}
          </h1>
          <p className="mx-auto mt-7 max-w-4xl text-lg font-bold sm:text-xl md:text-2xl">
            {campaign.summary}
          </p>
          <Button
            asChild
            size="lg"
            className="mt-8 rounded-none border-4 border-primary bg-brutal-yellow px-7 py-6 text-base font-black uppercase text-foreground shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
          >
            <a href="#state-support">
              Add my response <MapPin className="h-5 w-5" />
            </a>
          </Button>
        </Container>
      </SectionContainer>

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

      <SectionContainer bgColor="cyan" borderPosition="bottom">
        <Container size="lg" className="text-center">
          <h2 className="text-5xl font-black uppercase leading-none tracking-tighter sm:text-6xl md:text-7xl">
            {campaign.name} can give every patient the Right to Trial.
          </h2>
          <p className="mx-auto mt-6 max-w-3xl text-lg font-bold sm:text-xl">
            Montana showed that a state can open a broader, licensed path.{" "}
            {campaign.name} can go further by making pragmatic trials and shared
            outcomes part of the path from day one.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="rounded-none border-4 border-primary bg-brutal-yellow px-7 py-6 text-base font-black uppercase text-foreground shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
            >
              <Link href="/model-act">
                See the Right to Trial framework{" "}
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              className="rounded-none border-4 border-primary bg-background px-7 py-6 text-base font-black uppercase text-foreground shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
            >
              <Link href="/montana">
                See how Montana did it <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </Container>
      </SectionContainer>

      <StateSupportSection
        initialRole={initialRole}
        initialState={campaign.name}
      />
    </Layout>
  );
}

import { ArrowRight, BookOpen, MapPin, MessageSquareText, Users } from "lucide-react";
import Link from "next/link";

import { Button } from "@optimitron/neobrutalist-ui/ui/button";
import { Card } from "@optimitron/neobrutalist-ui/ui/card";
import { Container } from "@optimitron/neobrutalist-ui/ui/container";
import { SectionContainer } from "@optimitron/neobrutalist-ui/ui/section-container";

import Layout from "@/components/layout";
import { StateSupportSection } from "@/components/landing/right-to-try-sections";
import type { StateCampaign } from "@/lib/right-to-try";

export function StateCampaignPage({ campaign }: { campaign: StateCampaign }) {
  const isMissouri = campaign.name === "Missouri";
  const stageColor = isMissouri ? "bg-brutal-pink" : "bg-brutal-cyan";

  return (
    <Layout>
      <SectionContainer bgColor="background" borderPosition="bottom" className="py-24 sm:py-28">
        <Container size="lg" className="text-center">
          <p className={`mx-auto inline-block rotate-[-1deg] border-4 border-primary ${stageColor} px-4 py-2 font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`}>
            {campaign.stageLabel}
          </p>
          <h1 className="mt-7 text-5xl font-black uppercase leading-[0.9] tracking-tighter sm:text-6xl md:text-7xl lg:text-8xl">
            {campaign.headline}
          </h1>
          <p className="mx-auto mt-7 max-w-4xl text-lg font-bold sm:text-xl md:text-2xl">
            {campaign.summary}
          </p>
          <Button asChild size="lg" className="mt-8 rounded-none border-4 border-primary bg-brutal-yellow px-7 py-6 text-base font-black uppercase shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <a href="#state-support">
              Add my response <MapPin className="h-5 w-5" />
            </a>
          </Button>
        </Container>
      </SectionContainer>

      <SectionContainer bgColor={isMissouri ? "yellow" : "pink"} borderPosition="bottom">
        <Container>
          <h2 className="text-center text-4xl font-black uppercase leading-none tracking-tighter sm:text-5xl md:text-6xl">
            {isMissouri
              ? "What the Missouri page is building now"
              : `What ${campaign.name} needs before a full state page`}
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: MessageSquareText,
                title: "Patient questions",
                text: "Which barriers, safeguards, costs, and treatment choices matter most to patients and caregivers?",
              },
              {
                icon: Users,
                title: "Clinical and research voices",
                text: "Who can explain responsible supervision, consent, monitoring, and comparable outcomes?",
              },
              {
                icon: BookOpen,
                title: "State-specific education",
                text: "How does the Montana precedent fit the state's current law, agencies, facilities, and public questions?",
              },
            ].map(({ icon: Icon, title, text }, index) => (
              <Card key={title} className={`${index === 1 ? "bg-brutal-cyan" : "bg-background"} gap-4 rounded-none border-4 border-primary p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]`}>
                <Icon className="h-12 w-12" strokeWidth={3} />
                <h3 className="text-2xl font-black uppercase">{title}</h3>
                <p className="font-bold">{text}</p>
              </Card>
            ))}
          </div>
        </Container>
      </SectionContainer>

      {isMissouri ? (
        <SectionContainer bgColor="cyan" borderPosition="bottom">
          <Container size="lg" className="text-center">
            <h2 className="text-5xl font-black uppercase leading-none tracking-tighter sm:text-6xl md:text-7xl">
              The proposal comes after the listening.
            </h2>
            <p className="mx-auto mt-6 max-w-3xl text-lg font-bold sm:text-xl">
              There is no bill number on this page because the Missouri proposal
              is still being built. The Institute is starting with Montana&apos;s
              enacted framework, then gathering local patient, clinical,
              research, and implementation priorities.
            </p>
            <Button asChild size="lg" className="mt-8 rounded-none border-4 border-primary bg-brutal-yellow px-7 py-6 text-base font-black uppercase shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <Link href="/model-act">
                Review the starting framework <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </Container>
        </SectionContainer>
      ) : null}

      <StateSupportSection initialState={campaign.name} />
    </Layout>
  );
}

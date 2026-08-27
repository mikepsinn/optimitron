import type { Metadata } from "next";
import {
  ArrowRight,
  Building2,
  ClipboardCheck,
  Database,
  ExternalLink,
  FileText,
  HeartPulse,
  Scale,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@optimitron/neobrutalist-ui/ui/button";
import { Card } from "@optimitron/neobrutalist-ui/ui/card";
import { Container } from "@optimitron/neobrutalist-ui/ui/container";
import { SectionContainer } from "@optimitron/neobrutalist-ui/ui/section-container";

import Layout from "@/components/layout";
import { StateSupportSection } from "@/components/landing/right-to-try-sections";
import { RIGHT_TO_TRY_SOURCES } from "@/lib/right-to-try";

export const metadata: Metadata = {
  title: "Right to Trial Model Framework",
  description:
    "An educational framework for state patient access, licensed experimental treatment centers, informed consent, oversight, and useful outcome evidence.",
  alternates: { canonical: "https://acceleratedmedicine.org/model-act" },
  openGraph: {
    title: "Right to Trial Model Framework",
    description:
      "An educational framework for state patient access, licensed experimental treatment centers, informed consent, oversight, and useful outcome evidence.",
    images: [
      {
        alt: "Institute for Accelerated Medicine — patient access, pragmatic trials, and public evidence.",
        height: 630,
        url: "https://acceleratedmedicine.org/assets/acceleratedmedicine/iam-og-1200x630.png",
        width: 1200,
      },
    ],
    url: "https://acceleratedmedicine.org/model-act",
  },
  twitter: {
    card: "summary_large_image",
    title: "Right to Trial Model Framework",
    description:
      "An educational framework for state patient access, licensed experimental treatment centers, informed consent, oversight, and useful outcome evidence.",
    images: [
      "https://acceleratedmedicine.org/assets/acceleratedmedicine/iam-og-1200x630.png",
    ],
  },
};

export default function ModelActPage() {
  const parts = [
    {
      icon: HeartPulse,
      number: "01",
      title: "Patient eligibility",
      text: "Let an informed adult consider an experimental treatment after the patient and treating clinician evaluate approved options.",
    },
    {
      icon: Building2,
      number: "02",
      title: "Licensed treatment centers",
      text: "Create a state license with qualified leadership, facility standards, inspection, records, and enforcement.",
    },
    {
      icon: ClipboardCheck,
      number: "03",
      title: "Informed consent",
      text: "Put known risks, possible benefits, alternatives, costs, conflicts, privacy, and the right to stop in plain language.",
    },
    {
      icon: ShieldCheck,
      number: "04",
      title: "Professional oversight",
      text: "Keep clinicians and facilities accountable to licensing boards, scope-of-practice rules, and safety reporting.",
    },
    {
      icon: Scale,
      number: "05",
      title: "Provider participation and fair costs",
      text: "Let clinicians and treatment centers be paid for treatment and trial services. Disclose every charge before care.",
    },
    {
      icon: Database,
      number: "06",
      title: "Comparable outcomes",
      text: "Collect the same outcomes for each condition and publish de-identified results so patients, clinicians, and researchers can compare treatments.",
    },
  ];

  return (
    <Layout>
      <SectionContainer
        bgColor="yellow"
        borderPosition="bottom"
        className="py-24 sm:py-28"
      >
        <Container size="lg" className="text-center">
          <FileText className="mx-auto h-16 w-16" strokeWidth={3} />
          <h1 className="mt-5 text-5xl font-black uppercase leading-[0.9] tracking-tighter sm:text-6xl md:text-7xl lg:text-8xl">
            A Right to Trial framework for every state.
          </h1>
          <p className="mx-auto mt-7 max-w-4xl text-lg font-bold sm:text-xl md:text-2xl">
            Start with Montana&apos;s enacted licensing framework. Add pragmatic
            trials, provider payment, and published outcomes. Give every patient
            the right and practical ability to participate in a clinical trial
            for the most promising treatments.
          </p>
        </Container>
      </SectionContainer>

      <SectionContainer bgColor="background" borderPosition="bottom">
        <Container>
          <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
            {parts.map(({ icon: Icon, number, title, text }, index) => (
              <Card
                key={title}
                className={`${index === 5 ? "bg-brutal-cyan" : index % 2 === 0 ? "bg-brutal-pink" : "bg-brutal-yellow"} gap-4 rounded-none border-4 border-primary p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]`}
              >
                <div className="flex items-center justify-between gap-3">
                  <Icon className="h-12 w-12" strokeWidth={3} />
                  <span className="text-4xl font-black">{number}</span>
                </div>
                <h2 className="text-2xl font-black uppercase">{title}</h2>
                <p className="font-bold">{text}</p>
              </Card>
            ))}
          </div>
        </Container>
      </SectionContainer>

      <SectionContainer bgColor="pink" borderPosition="bottom">
        <Container
          size="lg"
          className="text-center text-brutal-pink-foreground"
        >
          <h2 className="text-5xl font-black uppercase leading-none tracking-tighter sm:text-6xl md:text-7xl">
            Use enacted text as the starting point.
          </h2>
          <p className="mx-auto mt-6 max-w-3xl text-lg font-bold sm:text-xl">
            The framework above is an educational outline. Montana&apos;s
            enrolled bill and final rules provide the official enacted language,
            definitions, licensing structure, and implementation detail.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="rounded-none border-4 border-primary bg-brutal-yellow px-7 py-6 text-base font-black uppercase text-foreground shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
            >
              <a
                href={RIGHT_TO_TRY_SOURCES.montanaSb535}
                rel="noreferrer"
                target="_blank"
              >
                Open SB 535 <ExternalLink className="h-5 w-5" />
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              className="rounded-none border-4 border-primary bg-background px-7 py-6 text-base font-black uppercase text-foreground shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
            >
              <Link href="/montana">
                Read the Montana guide <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </Container>
      </SectionContainer>

      <StateSupportSection />
    </Layout>
  );
}

import type { Metadata } from "next";
import {
  ArrowRight,
  Building2,
  ClipboardCheck,
  ExternalLink,
  FileCheck2,
  HeartPulse,
  Scale,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@optimitron/neobrutalist-ui/ui/button";
import { Card } from "@optimitron/neobrutalist-ui/ui/card";
import { Container } from "@optimitron/neobrutalist-ui/ui/container";
import { SectionContainer } from "@optimitron/neobrutalist-ui/ui/section-container";

import Layout from "@/components/layout";
import {
  MontanaProofSection,
  StateSupportSection,
} from "@/components/landing/right-to-try-sections";
import { RIGHT_TO_TRY_SOURCES } from "@/lib/right-to-try";

export const metadata: Metadata = {
  title: "Montana Universal Right to Try | Right to Trial Initiative",
  description:
    "A plain-language guide to Montana SB 535, experimental treatment center licensing, patient safeguards, and the evidence opportunity.",
  alternates: { canonical: "https://acceleratedmedicine.org/montana" },
  openGraph: {
    title: "Montana Universal Right to Try | Right to Trial Initiative",
    description:
      "A plain-language guide to Montana SB 535, experimental treatment center licensing, patient safeguards, and the evidence opportunity.",
    images: [
      {
        alt: "Right to Trial Initiative — patient access, pragmatic trials, and public evidence.",
        height: 630,
        url: "https://acceleratedmedicine.org/assets/acceleratedmedicine/iam-og-1200x630.png",
        width: 1200,
      },
    ],
    url: "https://acceleratedmedicine.org/montana",
  },
  twitter: {
    card: "summary_large_image",
    title: "Montana Universal Right to Try | Right to Trial Initiative",
    description:
      "A plain-language guide to Montana SB 535, experimental treatment center licensing, patient safeguards, and the evidence opportunity.",
    images: [
      "https://acceleratedmedicine.org/assets/acceleratedmedicine/iam-og-1200x630.png",
    ],
  },
};

const shadow = "shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]";

export default function MontanaPage() {
  const provisions = [
    {
      icon: Building2,
      title: "Licensed centers",
      text: "Experimental treatment centers must obtain a state license and operate within Montana's facility rules.",
    },
    {
      icon: Stethoscope,
      title: "Clinical review",
      text: "A treating health care provider identifies the patient as eligible after considering approved options.",
    },
    {
      icon: ClipboardCheck,
      title: "Written consent",
      text: "The patient receives the treatment's possible outcomes, approved alternatives, insurance limits, and costs.",
    },
    {
      icon: ShieldCheck,
      title: "Safety and records",
      text: "Centers must meet professional, safety, recordkeeping, inspection, and reporting requirements.",
    },
    {
      icon: Scale,
      title: "Professional accountability",
      text: "Licensing boards retain authority over professional conduct and care provided under the law.",
    },
    {
      icon: HeartPulse,
      title: "A broader treatment definition",
      text: "The statute covers drugs, biologics, devices, procedures, and individualized treatments that meet its conditions.",
    },
  ];

  return (
    <Layout>
      <SectionContainer bgColor="background" borderPosition="bottom" className="py-24 sm:py-28">
        <Container size="lg" className="text-center">
          <p className="mx-auto inline-block rotate-[-1deg] border-4 border-primary bg-brutal-green px-4 py-2 font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            Enacted precedent
          </p>
          <h1 className="mt-7 text-5xl font-black uppercase leading-[0.9] tracking-tighter sm:text-6xl md:text-7xl lg:text-8xl">
            What Montana&apos;s Universal Right to Try law actually does.
          </h1>
          <p className="mx-auto mt-7 max-w-4xl text-lg font-bold sm:text-xl md:text-2xl">
            Montana SB 535 creates a licensed, supervised path for eligible
            patients to consider experimental treatment after reviewing approved
            choices with a treating clinician.
          </p>
          <Button asChild size="lg" className="mt-8 rounded-none border-4 border-primary bg-brutal-yellow px-7 py-6 text-base font-black uppercase text-foreground shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <a href={RIGHT_TO_TRY_SOURCES.montanaSb535} rel="noreferrer" target="_blank">
              Read enrolled SB 535 <ExternalLink className="h-5 w-5" />
            </a>
          </Button>
        </Container>
      </SectionContainer>

      <MontanaProofSection />

      <SectionContainer bgColor="cyan" borderPosition="bottom">
        <Container>
          <h2 className="text-center text-4xl font-black uppercase leading-none tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
            Six parts worth carrying forward.
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {provisions.map(({ icon: Icon, title, text }, index) => (
              <Card key={title} className={`${index % 2 === 0 ? "bg-background" : "bg-brutal-yellow"} ${shadow} gap-4 rounded-none border-4 border-primary p-6`}>
                <Icon className="h-12 w-12" strokeWidth={3} />
                <h3 className="text-2xl font-black uppercase">{title}</h3>
                <p className="font-bold">{text}</p>
              </Card>
            ))}
          </div>
        </Container>
      </SectionContainer>

      <SectionContainer bgColor="background" borderPosition="bottom">
        <Container>
          <h2 className="text-center text-4xl font-black uppercase leading-none tracking-tighter sm:text-5xl md:text-6xl">
            This is already happening.
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Rules in force",
                text: "The operating rules for experimental treatment centers took effect July 25, 2026, with an independent five-expert review board evaluating treatments.",
              },
              {
                title: "$12,500 to apply",
                text: "A company with a drug through preliminary safety testing pays $12,500 to ask the review board for approval to offer it in Montana.",
              },
              {
                title: "First applications filed",
                text: "Treatments for neuropathy and hearing loss are already under review. The first licensed clinics are expected around the end of 2026.",
              },
            ].map(({ title, text }, index) => (
              <Card
                key={title}
                className={`${index === 1 ? "bg-brutal-cyan" : "bg-brutal-yellow"} ${shadow} gap-4 rounded-none border-4 border-primary p-6`}
              >
                <h3 className="text-2xl font-black uppercase">{title}</h3>
                <p className="font-bold">{text}</p>
              </Card>
            ))}
          </div>
          <p className="mx-auto mt-8 max-w-3xl text-center font-bold">
            Reported by{" "}
            <a
              className="underline underline-offset-4"
              href="https://www.technologyreview.com/2026/07/30/1140942/montana-experimental-medical-hub-pushed-forward-right-to-try/"
              rel="noreferrer"
              target="_blank"
            >
              MIT Technology Review (July 30, 2026)
            </a>{" "}
            · Board details at{" "}
            <a
              className="underline underline-offset-4"
              href="https://montanaetrb.org"
              rel="noreferrer"
              target="_blank"
            >
              montanaetrb.org
            </a>
          </p>
        </Container>
      </SectionContainer>

      <SectionContainer bgColor="pink" borderPosition="bottom">
        <Container size="lg" className="text-center text-brutal-pink-foreground">
          <FileCheck2 className="mx-auto h-16 w-16" strokeWidth={3} />
          <h2 className="mt-5 text-5xl font-black uppercase leading-none tracking-tighter sm:text-6xl md:text-7xl">
            The law opens access. Better outcome data makes the access learn.
          </h2>
          <p className="mx-auto mt-6 max-w-3xl text-lg font-bold sm:text-xl">
            SB 535 establishes access, licensing, consent, and oversight. The
            Institute&apos;s decentralized FDA proposal would add standardized
            outcome measures and pooled public evidence across participating
            patients and centers.
          </p>
          <Button asChild size="lg" className="mt-8 rounded-none border-4 border-primary bg-brutal-yellow px-7 py-6 text-base font-black uppercase text-foreground shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <Link href="/#evidence">
              See the evidence model <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </Container>
      </SectionContainer>

      <SectionContainer bgColor="yellow" borderPosition="bottom">
        <Container size="lg">
          <h2 className="text-center text-4xl font-black uppercase sm:text-5xl md:text-6xl">
            Official Montana sources
          </h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {[
              ["SB 535 enrolled bill", RIGHT_TO_TRY_SOURCES.montanaSb535],
              ["SB 422 enrolled bill", RIGHT_TO_TRY_SOURCES.montanaSb422],
              ["Final 2026 rules", RIGHT_TO_TRY_SOURCES.montanaRules],
              ["Current Montana Code", RIGHT_TO_TRY_SOURCES.montanaLaw],
              ["Treatment center licensing", RIGHT_TO_TRY_SOURCES.montanaLicensing],
            ].map(([label, href]) => (
              <a key={label} className="flex items-center justify-between gap-4 border-4 border-primary bg-background p-5 text-lg font-black uppercase shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5" href={href} rel="noreferrer" target="_blank">
                {label} <ExternalLink className="h-5 w-5 shrink-0" />
              </a>
            ))}
          </div>
        </Container>
      </SectionContainer>

      <StateSupportSection initialState="Montana" />
    </Layout>
  );
}

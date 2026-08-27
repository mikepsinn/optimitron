import {
  ArrowRight,
  BookOpen,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Database,
  ExternalLink,
  Gauge,
  HeartPulse,
  Landmark,
  MapPin,
  Microscope,
  Scale,
  Share2,
  Stethoscope,
  Users,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@optimitron/neobrutalist-ui/ui/button";
import { Card } from "@optimitron/neobrutalist-ui/ui/card";
import { Container } from "@optimitron/neobrutalist-ui/ui/container";
import { SectionContainer } from "@optimitron/neobrutalist-ui/ui/section-container";

import { RightToTrySupportForm } from "@/components/right-to-try-support-form";
import {
  RIGHT_TO_TRY_SOURCES,
  STATE_CAMPAIGNS,
  stateCampaignHref,
} from "@/lib/right-to-try";
import type { StateCampaignStage, SupporterRole } from "@/lib/right-to-try";
import {
  calculateRightToTrialImpact,
  RIGHT_TO_TRIAL_DISCOVERY_MULTIPLIER_DEFAULT,
  RIGHT_TO_TRIAL_IMPACT_PAPER_URL,
  RIGHT_TO_TRIAL_SOURCE_PARAMETERS,
} from "@/lib/right-to-trial-impact";

const buttonShadow =
  "rounded-none border-4 border-primary px-7 py-6 text-base font-black uppercase shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]";

function SourceLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      className="inline-flex items-center gap-1 font-black underline decoration-2 underline-offset-4 hover:text-brutal-pink"
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      {children} <ExternalLink className="h-4 w-4" />
    </a>
  );
}

export function UniversalRightToTryHero() {
  return (
    <SectionContainer
      bgColor="background"
      borderPosition="bottom"
      className="overflow-hidden py-24 sm:py-28 lg:py-32"
    >
      <Container>
        <div className="grid items-center gap-10 lg:grid-cols-[1.35fr_0.65fr]">
          <div>
            <p className="mb-5 inline-block rotate-[-1deg] border-4 border-primary bg-brutal-cyan px-4 py-2 text-sm font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:text-base">
              Right to Trial
            </p>
            <h1 className="text-5xl font-black uppercase leading-[0.9] tracking-tighter sm:text-6xl md:text-7xl lg:text-8xl">
              Every patient has the Right to Trial.
            </h1>
            <p className="mt-7 max-w-4xl text-lg font-bold sm:text-xl md:text-2xl">
              Every patient should be able to join a pragmatic clinical trial
              for the most promising treatments. Every result should help the
              next patient. Montana opened the door. Now every state can turn
              access into evidence.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Button
                asChild
                size="lg"
                className={`${buttonShadow} bg-brutal-pink`}
              >
                <Link href="/montana">
                  See Montana&apos;s precedent{" "}
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                className={`${buttonShadow} bg-brutal-yellow`}
              >
                <a href="#state-support">
                  Bring Right to Trial to my state{" "}
                  <MapPin className="h-5 w-5" />
                </a>
              </Button>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-sm">
            <div className="rotate-2 border-4 border-primary bg-brutal-yellow p-7 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
              <Landmark className="h-16 w-16" strokeWidth={3} />
              <p className="mt-5 text-lg font-black uppercase">Montana</p>
              <p className="text-6xl font-black uppercase leading-none">
                SB 535
              </p>
              <p className="mt-4 text-lg font-bold">
                Signed in 2025. Final rules effective in 2026. Experimental
                treatment center applications are available now.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </SectionContainer>
  );
}

export function MontanaProofSection() {
  const milestones = [
    {
      year: "2015",
      title: "Right to Try begins",
      text: "Montana creates an initial access path for eligible patients.",
    },
    {
      year: "2023",
      title: "SB 422 broadens eligibility",
      text: "The state removes the terminal-illness restriction from its Right to Try law.",
    },
    {
      year: "2025",
      title: "SB 535 creates licensed centers",
      text: "The law defines experimental treatments and establishes state licensing, safety, consent, and oversight requirements.",
    },
    {
      year: "2026",
      title: "The doors can open",
      text: "Final rules take effect and Montana publishes the experimental treatment center application.",
    },
  ];

  return (
    <SectionContainer
      id="montana-proof"
      bgColor="yellow"
      borderPosition="bottom"
    >
      <Container>
        <div className="mx-auto max-w-4xl text-center">
          <p className="font-black uppercase">An enacted state precedent</p>
          <h2 className="mt-2 text-4xl font-black uppercase leading-none tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
            Montana already moved the line.
          </h2>
          <p className="mx-auto mt-5 max-w-3xl text-lg font-bold sm:text-xl">
            Montana&apos;s Universal Right to Try law is enacted, regulated, and
            ready for licensed experimental treatment centers. The precedent
            exists. Right to Trial carries it forward.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-4">
          {milestones.map((milestone, index) => (
            <Card
              key={milestone.year}
              className={`${index === 2 ? "bg-brutal-pink" : index === 3 ? "bg-brutal-cyan" : "bg-background"} gap-3 rounded-none border-4 border-primary p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]`}
            >
              <p className="text-4xl font-black">{milestone.year}</p>
              <h3 className="text-xl font-black uppercase">
                {milestone.title}
              </h3>
              <p className="font-bold">{milestone.text}</p>
            </Card>
          ))}
        </div>

        <p className="mt-10 text-center font-bold">
          Read the official{" "}
          <SourceLink href={RIGHT_TO_TRY_SOURCES.montanaSb535}>
            enrolled SB 535
          </SourceLink>
          ,{" "}
          <SourceLink href={RIGHT_TO_TRY_SOURCES.montanaRules}>
            final rules
          </SourceLink>
          , and{" "}
          <SourceLink href={RIGHT_TO_TRY_SOURCES.montanaLicensing}>
            licensing page
          </SourceLink>
          .
        </p>
      </Container>
    </SectionContainer>
  );
}

export function RightToTryEvolutionSection() {
  const columns = [
    {
      icon: Scale,
      label: "Before",
      title: "A narrow exception",
      bullets: [
        "Eligibility can depend on a narrow diagnosis or federal pathway.",
        "No dedicated state license for an experimental treatment center.",
        "Patients may still have nowhere lawful and supervised to go.",
      ],
      color: "bg-background",
    },
    {
      icon: Building2,
      label: "Montana SB 535",
      title: "A licensed access path",
      bullets: [
        "Licensed centers operate under state rules and inspection.",
        "Patients review approved options with a treating clinician.",
        "Consent, safety, records, and professional oversight are explicit.",
      ],
      color: "bg-brutal-pink",
    },
    {
      icon: Database,
      label: "Right to Trial",
      title: "Every patient becomes evidence",
      bullets: [
        "Use standard outcome measures before and after treatment.",
        "Pool comparable results across patients and centers.",
        "Publish useful treatment evidence for the next decision.",
      ],
      color: "bg-brutal-cyan",
    },
  ];

  return (
    <SectionContainer bgColor="background" borderPosition="bottom">
      <Container>
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="text-4xl font-black uppercase leading-none tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
            Open the door. Then learn from every person who walks through it.
          </h2>
          <p className="mx-auto mt-6 max-w-3xl text-lg font-bold sm:text-xl">
            Montana created a licensed path to treatment. Right to Trial adds
            pragmatic trials, standardized outcomes, and shared evidence so each
            patient can help the next one.
          </p>
        </div>

        <div className="mt-12 grid gap-7 lg:grid-cols-3">
          {columns.map(
            ({ icon: Icon, label, title, bullets, color }, index) => (
              <div key={label} className="relative">
                <Card
                  className={`${color} h-full gap-4 rounded-none border-4 border-primary p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <Icon className="h-12 w-12" strokeWidth={3} />
                    <span className="text-5xl font-black">{index + 1}</span>
                  </div>
                  <p className="font-black uppercase">{label}</p>
                  <h3 className="text-3xl font-black uppercase leading-none">
                    {title}
                  </h3>
                  <ul className="space-y-3 font-bold">
                    {bullets.map((bullet) => (
                      <li key={bullet} className="flex gap-2">
                        <CheckCircle2
                          className="mt-0.5 h-5 w-5 shrink-0"
                          strokeWidth={3}
                        />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
                {index < columns.length - 1 ? (
                  <ArrowRight
                    className="absolute -right-6 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 rounded-full border-4 border-primary bg-brutal-yellow p-1 lg:block"
                    strokeWidth={3}
                  />
                ) : null}
              </div>
            ),
          )}
        </div>
      </Container>
    </SectionContainer>
  );
}

export function PatientAccessFlowSection() {
  const steps = [
    {
      icon: Stethoscope,
      title: "Review approved options",
      text: "The patient and treating clinician review the condition, prior care, and approved choices.",
    },
    {
      icon: ClipboardCheck,
      title: "Choose with informed consent",
      text: "The patient receives the known risks, possible benefits, costs, alternatives, and right to stop.",
    },
    {
      icon: HeartPulse,
      title: "Treat under licensed supervision",
      text: "A licensed center and qualified professionals provide care, maintain records, and meet safety rules.",
    },
    {
      icon: Microscope,
      title: "Make the outcome useful",
      text: "Standard measures turn one person's result into comparable evidence for future patients and clinicians.",
    },
  ];

  return (
    <SectionContainer bgColor="pink" borderPosition="bottom">
      <Container>
        <h2 className="text-center text-4xl font-black uppercase leading-none tracking-tighter text-brutal-pink-foreground sm:text-5xl md:text-6xl lg:text-7xl">
          One patient. One supervised choice. One more useful result.
        </h2>
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ icon: Icon, title, text }, index) => (
            <Card
              key={title}
              className="gap-4 rounded-none border-4 border-primary bg-background p-5 shadow-[7px_7px_0px_0px_rgba(0,0,0,1)]"
            >
              <div className="flex items-center justify-between">
                <Icon className="h-11 w-11" strokeWidth={3} />
                <span className="text-4xl font-black">{index + 1}</span>
              </div>
              <h3 className="text-xl font-black uppercase">{title}</h3>
              <p className="font-bold">{text}</p>
            </Card>
          ))}
        </div>
      </Container>
    </SectionContainer>
  );
}

export function RightToTrialImpactPreviewSection() {
  const centralImpact = calculateRightToTrialImpact(
    RIGHT_TO_TRIAL_DISCOVERY_MULTIPLIER_DEFAULT,
  );

  return (
    <SectionContainer bgColor="yellow" borderPosition="bottom">
      <Container>
        <div className="grid items-center gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="rotate-[-2deg] border-4 border-primary bg-brutal-cyan p-7 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
            <Gauge className="h-14 w-14" strokeWidth={3} />
            <p className="mt-5 font-black uppercase">Treatment timeline</p>
            <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center">
              <div>
                <p className="text-5xl font-black leading-none">
                  {RIGHT_TO_TRIAL_SOURCE_PARAMETERS.statusQuoAverageWait.value.toFixed(
                    1,
                  )}
                </p>
                <p className="font-black uppercase">years</p>
              </div>
              <ArrowRight className="h-10 w-10" strokeWidth={3} />
              <div>
                <p className="text-5xl font-black leading-none">
                  {centralImpact.averageWaitYears.toFixed(1)}
                </p>
                <p className="font-black uppercase">years</p>
              </div>
            </div>
            <p className="mt-5 border-t-4 border-primary pt-5 text-3xl font-black uppercase leading-none">
              {centralImpact.yearsEarlier.toFixed(1)} years returned to patients
            </p>
          </div>

          <div>
            <p className="font-black uppercase">Explore the impact</p>
            <h2 className="mt-2 text-4xl font-black uppercase leading-none tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
              What changes when every patient can help discover the next
              treatment?
            </h2>
            <p className="mt-6 max-w-3xl text-lg font-bold sm:text-xl">
              Move the discovery rate. Change the trial budget. See how Right to
              Trial could compress the treatment queue, include more patients,
              and make every result useful.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Button
                asChild
                size="lg"
                className={`${buttonShadow} bg-brutal-pink text-foreground`}
              >
                <Link href="/impact">
                  Explore the numbers <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                className={`${buttonShadow} bg-background text-foreground`}
              >
                <a
                  href={RIGHT_TO_TRIAL_IMPACT_PAPER_URL}
                  rel="noreferrer"
                  target="_blank"
                >
                  Read the impact paper <ExternalLink className="h-5 w-5" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </SectionContainer>
  );
}

export function StateSupportSection({
  initialRole,
  initialState,
}: {
  initialRole?: SupporterRole;
  initialState?: string;
}) {
  return (
    <SectionContainer
      id="state-support"
      bgColor="cyan"
      borderPosition="bottom"
      className="scroll-mt-24"
    >
      <Container size="lg">
        <div className="mx-auto mb-10 max-w-4xl text-center">
          <p className="font-black uppercase">
            Bring Right to Trial to every state
          </p>
          <h2 className="mt-2 text-4xl font-black uppercase leading-none tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
            Should every patient in your state have the Right to Trial?
          </h2>
          <p className="mx-auto mt-5 max-w-3xl text-lg font-bold sm:text-xl">
            Tell us where you live and what role you can play. Your response
            helps the Institute build the next state page, clinician briefing,
            and public event.
          </p>
        </div>
        <RightToTrySupportForm
          initialRole={initialRole}
          initialState={initialState}
        />
      </Container>
    </SectionContainer>
  );
}

export function StateCampaignMapSection() {
  const stageClasses: Record<StateCampaignStage, string> = {
    "enacted-model": "bg-brutal-green",
    active: "bg-brutal-pink",
    listening: "bg-background",
  };

  return (
    <SectionContainer bgColor="yellow" borderPosition="bottom">
      <Container>
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-black uppercase leading-none tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
            Montana proved a path. Missouri is the next active state.
          </h2>
          <p className="mx-auto mt-5 max-w-3xl text-lg font-bold sm:text-xl">
            Pick any state and put it on the map. Montana is the enacted
            precedent. Missouri is active now. Every other state can be next.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3 font-black uppercase">
          <span className="border-4 border-primary bg-brutal-green px-3 py-2">
            Enacted precedent
          </span>
          <span className="border-4 border-primary bg-brutal-pink px-3 py-2">
            Active education
          </span>
          <span className="border-4 border-primary bg-background px-3 py-2">
            Listening
          </span>
        </div>

        <div className="mt-8 grid grid-cols-5 gap-2 sm:grid-cols-10">
          {STATE_CAMPAIGNS.map((campaign) => (
            <Link
              key={campaign.abbreviation}
              aria-label={`${campaign.name}: ${campaign.stageLabel}`}
              className={`${stageClasses[campaign.stage]} flex aspect-square items-center justify-center border-4 border-primary text-sm font-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] sm:text-base`}
              href={stateCampaignHref(campaign)}
              title={`${campaign.name}: ${campaign.stageLabel}`}
            >
              {campaign.abbreviation}
            </Link>
          ))}
        </div>
      </Container>
    </SectionContainer>
  );
}

export function RoleActionSection() {
  const actions = [
    {
      icon: HeartPulse,
      role: "Patients and caregivers",
      action: "Tell us what access would change",
      text: "A short story can show why a lawful, supervised option matters when approved treatments are not enough.",
      href: "#state-support",
      color: "bg-brutal-pink",
    },
    {
      icon: Stethoscope,
      role: "Clinicians",
      action: "Help define responsible care",
      text: "Bring practical insight on consent, treatment review, monitoring, records, and patient safety.",
      href: "/states/missouri?role=clinician#state-support",
      color: "bg-brutal-yellow",
    },
    {
      icon: Microscope,
      role: "Researchers",
      action: "Make every outcome comparable",
      text: "Help define the small, standard outcome set that turns treatment access into cumulative evidence.",
      href: "/research",
      color: "bg-brutal-cyan",
    },
    {
      icon: Users,
      role: "Public educators",
      action: "Build a useful state page",
      text: "Collect local questions, identify credible speakers, and explain the model without slogans or fog.",
      href: "/contact",
      color: "bg-background",
    },
  ];

  return (
    <SectionContainer bgColor="background" borderPosition="bottom">
      <Container>
        <h2 className="text-center text-4xl font-black uppercase leading-none tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
          This only becomes real when the right humans show up.
        </h2>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {actions.map(({ icon: Icon, role, action, text, href, color }) => (
            <Link
              key={role}
              className={`${color} flex min-h-64 flex-col border-4 border-primary p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]`}
              href={href}
            >
              <div className="flex items-center justify-between gap-4">
                <p className="font-black uppercase">{role}</p>
                <Icon className="h-12 w-12" strokeWidth={3} />
              </div>
              <h3 className="mt-5 text-3xl font-black uppercase leading-none">
                {action}
              </h3>
              <p className="mt-4 font-bold">{text}</p>
              <span className="mt-auto flex items-center gap-2 pt-6 font-black uppercase">
                Continue <ArrowRight className="h-5 w-5" />
              </span>
            </Link>
          ))}
        </div>
      </Container>
    </SectionContainer>
  );
}

export function MissouriCampaignSection() {
  return (
    <SectionContainer bgColor="pink" borderPosition="bottom">
      <Container size="lg" className="text-center text-brutal-pink-foreground">
        <p className="font-black uppercase">Next active state: Missouri</p>
        <h2 className="mt-3 text-5xl font-black uppercase leading-none tracking-tighter sm:text-6xl md:text-7xl">
          Help Missouri lead the next Right to Trial state.
        </h2>
        <p className="mx-auto mt-6 max-w-3xl text-lg font-bold sm:text-xl">
          Patients, clinicians, researchers, and public educators can build a
          Missouri model where access creates evidence and every outcome helps
          the next patient.
        </p>
        <Button
          asChild
          size="lg"
          className={`${buttonShadow} mt-8 bg-brutal-yellow text-foreground`}
        >
          <Link href="/states/missouri">
            Open the Missouri page <ArrowRight className="h-5 w-5" />
          </Link>
        </Button>
      </Container>
    </SectionContainer>
  );
}

export function UniversalRightToTryFinalCTA() {
  return (
    <SectionContainer bgColor="yellow" borderPosition="none">
      <Container size="lg" className="text-center">
        <Share2 className="mx-auto h-16 w-16" strokeWidth={3} />
        <h2 className="mt-5 text-5xl font-black uppercase leading-none tracking-tighter sm:text-6xl md:text-7xl">
          Montana opened the door. Bring Right to Trial to your state.
        </h2>
        <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
          <Button
            asChild
            size="lg"
            className={`${buttonShadow} bg-brutal-pink`}
          >
            <a href="#state-support">
              Record my state <MapPin className="h-5 w-5" />
            </a>
          </Button>
          <Button asChild size="lg" className={`${buttonShadow} bg-background`}>
            <Link href="/model-act">
              Read the model framework <BookOpen className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </Container>
    </SectionContainer>
  );
}

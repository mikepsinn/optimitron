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
import type {
  StateAbbreviation,
  StateCampaignStage,
  SupporterRole,
} from "@/lib/right-to-try";
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
              The Right to Trial
            </p>
            <h1 className="text-5xl font-black uppercase leading-[0.9] tracking-tighter sm:text-6xl md:text-7xl lg:text-8xl">
              We can eradicate disease.
            </h1>
            <p className="mt-7 max-w-4xl text-lg font-bold sm:text-xl md:text-2xl">
              Give every patient the right to join a clinical trial for the most
              promising treatments—with a clinician, at a licensed treatment
              center, wherever they live. Every patient gets more options. Every
              result helps us find what works.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Button
                asChild
                size="lg"
                className={`${buttonShadow} bg-brutal-pink`}
              >
                <Link href="/montana">
                  See how Montana did it <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                className={`${buttonShadow} bg-brutal-yellow text-foreground`}
              >
                <a href="#state-support">
                  Bring it to my state <MapPin className="h-5 w-5" />
                </a>
              </Button>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-sm">
            <div className="rotate-2 border-4 border-primary bg-brutal-yellow p-7 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
              <Landmark className="h-16 w-16" strokeWidth={3} />
              <p className="mt-5 text-lg font-black uppercase">
                How Montana is accelerating clinical discovery
              </p>
              <p className="text-6xl font-black uppercase leading-none">
                SB 535
              </p>
              <p className="mt-4 text-lg font-bold">
                Montana removed the terminal-illness restriction, licensed
                experimental treatment centers, and required outcome monitoring.
                Patients and providers now have a practical path to more
                treatment options.
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
          <p className="font-black uppercase">
            How Montana is accelerating clinical discovery
          </p>
          <h2 className="mt-2 text-4xl font-black uppercase leading-none tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
            Patients can reach treatments. Providers can deliver them.
          </h2>
          <p className="mx-auto mt-5 max-w-3xl text-lg font-bold sm:text-xl">
            Montana removed the terminal-illness restriction in 2023. In 2025,
            SB 535 created licensed experimental treatment centers, direct
            provider-patient payment agreements, outcome monitoring, adverse
            event reporting, and an access requirement funded by 2% of each
            center&apos;s net annual profits.
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
      label: "Traditional Right to Try",
      title: "Permission without a delivery system",
      bullets: [
        "Federal eligibility is limited to patients with a life-threatening disease or condition.",
        "Manufacturers and providers may still decline to participate.",
        "Montana's earlier law did not license treatment centers or create comparable public results.",
      ],
      color: "bg-background",
    },
    {
      icon: Building2,
      label: "Montana SB 422 + SB 535",
      title: "A practical treatment pathway",
      bullets: [
        "Montana removed the terminal-illness restriction in 2023.",
        "Licensed centers and direct payment agreements give providers a place and a way to deliver treatment.",
        "Centers must monitor outcomes and adverse events and devote 2% of net annual profits to access.",
      ],
      color: "bg-brutal-pink",
    },
    {
      icon: Database,
      label: "Right to Trial proposal",
      title: "Every patient can participate",
      bullets: [
        "Let every patient join a pragmatic trial for the most promising treatments.",
        "Give providers a clear way to be paid for treatment and trial services.",
        "Collect and publish standardized results so everyone can see what works.",
      ],
      color: "bg-brutal-cyan",
    },
  ];

  return (
    <SectionContainer bgColor="background" borderPosition="bottom">
      <Container>
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="text-4xl font-black uppercase leading-none tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
            What Montana changed. What Right to Trial adds.
          </h2>
          <p className="mx-auto mt-6 max-w-3xl text-lg font-bold sm:text-xl">
            Earlier Right to Try laws created permission for a narrow group of
            patients, but not a delivery system or a public evidence system.
            Montana built the delivery path. Right to Trial adds pragmatic
            trials and published results.
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
      title: "Find promising treatments",
      text: "See the treatments and trials most likely to help with your condition.",
    },
    {
      icon: ClipboardCheck,
      title: "Choose with a clinician",
      text: "Review the possible benefits, risks, costs, alternatives, and your right to stop.",
    },
    {
      icon: HeartPulse,
      title: "Receive supervised treatment",
      text: "Get care from qualified professionals at a licensed treatment center.",
    },
    {
      icon: Microscope,
      title: "Report what happened",
      text: "Your result becomes part of a public comparison of treatment outcomes.",
    },
  ];

  return (
    <SectionContainer bgColor="pink" borderPosition="bottom">
      <Container>
        <h2 className="text-center text-4xl font-black uppercase leading-none tracking-tighter text-brutal-pink-foreground sm:text-5xl md:text-6xl lg:text-7xl">
          Find a treatment. Join a trial. Report what happened.
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
            <p className="mt-5 font-black uppercase">
              Average wait for a first treatment
            </p>
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
              {centralImpact.yearsEarlier.toFixed(1)} years sooner
            </p>
          </div>

          <div>
            <p className="font-black uppercase">The world we can create</p>
            <h2 className="mt-2 text-4xl font-black uppercase leading-none tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
              Discover treatments while today&apos;s patients are still alive.
            </h2>
            <p className="mt-6 max-w-3xl text-lg font-bold sm:text-xl">
              At today&apos;s pace, the average untreated disease waits 222
              years for its first effective treatment. Give willing patients a
              place in low-cost clinical trials, and the central estimate falls
              to 41 years.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Button
                asChild
                size="lg"
                className={`${buttonShadow} bg-brutal-pink text-foreground`}
              >
                <Link href="/impact">
                  See how much faster <ArrowRight className="h-5 w-5" />
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
  heading = "Should every patient in your state have the right to join a clinical trial for the most promising treatments?",
  body = "Tell us your state and why patients there need more options. Every response shows where support is strongest and helps more people learn what Right to Trial would change.",
  headingAs: Heading = "h2",
}: {
  initialRole?: SupporterRole;
  initialState?: string;
  heading?: string;
  body?: string;
  headingAs?: "h1" | "h2";
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
          <Heading className="mt-2 text-4xl font-black uppercase leading-none tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
            {heading}
          </Heading>
          <p className="mx-auto mt-5 max-w-3xl text-lg font-bold sm:text-xl">
            {body}
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

// Standard US tile-grid map positions: [row, column] on an 11-column grid.
const STATE_TILE_POSITIONS: Record<StateAbbreviation, [number, number]> = {
  AK: [0, 0], ME: [0, 10],
  WI: [1, 5], VT: [1, 9], NH: [1, 10],
  WA: [2, 0], ID: [2, 1], MT: [2, 2], ND: [2, 3], MN: [2, 4], IL: [2, 5],
  MI: [2, 7], NY: [2, 8], MA: [2, 9],
  OR: [3, 0], NV: [3, 1], WY: [3, 2], SD: [3, 3], IA: [3, 4], IN: [3, 5],
  OH: [3, 6], PA: [3, 7], NJ: [3, 8], CT: [3, 9], RI: [3, 10],
  CA: [4, 0], UT: [4, 1], CO: [4, 2], NE: [4, 3], MO: [4, 4], KY: [4, 5],
  WV: [4, 6], VA: [4, 7], MD: [4, 8], DE: [4, 9],
  AZ: [5, 1], NM: [5, 2], KS: [5, 3], AR: [5, 4], TN: [5, 5], NC: [5, 6],
  SC: [5, 7],
  OK: [6, 3], LA: [6, 4], MS: [6, 5], AL: [6, 6], GA: [6, 7],
  HI: [7, 0], TX: [7, 3], FL: [7, 8],
};

export function StateCampaignMapSection() {
  const stageClasses: Record<StateCampaignStage, string> = {
    "enacted-model": "bg-brutal-green",
    listening: "bg-background",
  };

  return (
    <SectionContainer bgColor="yellow" borderPosition="bottom">
      <Container>
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-black uppercase leading-none tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
            Montana proved it. Put your state on the map.
          </h2>
          <p className="mx-auto mt-5 max-w-3xl text-lg font-bold sm:text-xl">
            Montana is the enacted precedent. The original Right to Try spread
            from one state in 2014 to 41 states by 2018 — tap your state to
            see what Right to Trial would mean there, then add your voice.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3 font-black uppercase">
          <span className="border-4 border-primary bg-brutal-green px-3 py-2">
            Enacted precedent
          </span>
          <span className="border-4 border-primary bg-background px-3 py-2">
            Listening
          </span>
        </div>

        <div className="mx-auto mt-8 grid max-w-3xl grid-cols-[repeat(11,minmax(0,1fr))] gap-1 sm:gap-2">
          {/* Render in tile order so keyboard focus follows the map. */}
          {[...STATE_CAMPAIGNS]
            .sort((a, b) => {
              const [rowA, colA] = STATE_TILE_POSITIONS[a.abbreviation];
              const [rowB, colB] = STATE_TILE_POSITIONS[b.abbreviation];
              return rowA - rowB || colA - colB;
            })
            .map((campaign) => {
              const [row, column] = STATE_TILE_POSITIONS[campaign.abbreviation];
              return (
                <Link
                  key={campaign.abbreviation}
                  aria-label={`${campaign.name}: ${campaign.stageLabel}`}
                  className={`${stageClasses[campaign.stage]} flex aspect-square items-center justify-center border-2 border-primary text-[10px] font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:border-4 sm:text-base sm:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] sm:hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]`}
                  href={stateCampaignHref(campaign)}
                  style={{
                    gridColumnStart: column + 1,
                    gridRowStart: row + 1,
                  }}
                  title={`${campaign.name}: ${campaign.stageLabel}`}
                >
                  {campaign.abbreviation}
                </Link>
              );
            })}
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
      action: "Tell your story",
      text: "Show what another supervised treatment option would mean when approved treatments are not enough.",
      href: "#state-support",
      color: "bg-brutal-pink",
    },
    {
      icon: Stethoscope,
      role: "Clinicians",
      action: "Give patients another option",
      text: "Help make consent, treatment review, monitoring, records, and patient safety work in real care.",
      href: "#state-support",
      color: "bg-brutal-yellow",
    },
    {
      icon: Microscope,
      role: "Researchers",
      action: "Turn care into discoveries",
      text: "Choose the small set of outcomes that lets one patient's result improve treatment rankings for everyone.",
      href: "/research",
      color: "bg-brutal-cyan",
    },
    {
      icon: Users,
      role: "Public educators",
      action: "Make the case in your state",
      text: "Share the patient story, answer local questions, and show what Montana already proved possible.",
      href: "/contact",
      color: "bg-background",
    },
  ];

  return (
    <SectionContainer bgColor="background" borderPosition="bottom">
      <Container>
        <h2 className="text-center text-4xl font-black uppercase leading-none tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
          Choose how you want to help patients get answers faster.
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
                Get started <ArrowRight className="h-5 w-5" />
              </span>
            </Link>
          ))}
        </div>
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
          Montana created a path. Bring Right to Trial to your state.
        </h2>
        <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
          <Button
            asChild
            size="lg"
            className={`${buttonShadow} bg-brutal-pink`}
          >
            <a href="#state-support">
              Bring it to my state <MapPin className="h-5 w-5" />
            </a>
          </Button>
          <Button
            asChild
            size="lg"
            className={`${buttonShadow} bg-background text-foreground`}
          >
            <Link href="/model-act">
              Read the proposed law <BookOpen className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </Container>
    </SectionContainer>
  );
}

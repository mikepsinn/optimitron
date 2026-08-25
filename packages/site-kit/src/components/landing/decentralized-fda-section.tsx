import type { ReactNode } from "react";
import {
  ArrowRight,
  BarChart3,
  Check,
  ClipboardCheck,
  FileSearch,
  FlaskConical,
  Search,
  ShieldCheck,
  Stethoscope,
  Users,
} from "lucide-react";
import { Card } from "@optimitron/neobrutalist-ui/ui/card";
import { Container } from "@optimitron/neobrutalist-ui/ui/container";
import { SectionContainer } from "@optimitron/neobrutalist-ui/ui/section-container";

interface WorkflowItem {
  title: string;
  description: string;
}

const brutalShadow = "shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]";

function PreviewFrame({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`h-full border-4 border-primary bg-background ${brutalShadow}`}
      aria-label={`${label} illustrative interface`}
    >
      <div className="flex items-center justify-between gap-3 border-b-4 border-primary bg-primary px-4 py-3 text-primary-foreground">
        <span className="text-sm font-black uppercase">{label}</span>
        <span className="border-2 border-primary-foreground px-2 py-1 text-[10px] font-black uppercase">
          Illustrative interface
        </span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function WorkflowList({
  items,
  color,
}: {
  items: WorkflowItem[];
  color: string;
}) {
  const columns = items.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-5";

  return (
    <ol className={`grid gap-4 md:grid-cols-2 ${columns}`}>
      {items.map((item, index) => (
        <li
          key={item.title}
          className={`${color} border-4 border-primary p-4 ${brutalShadow}`}
        >
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center border-2 border-primary bg-background text-lg font-black">
              {index + 1}
            </span>
            <h4 className="font-black uppercase">{item.title}</h4>
          </div>
          <p className="mt-3 text-sm font-bold">{item.description}</p>
        </li>
      ))}
    </ol>
  );
}

function TreatmentExplorerDemo() {
  const options = [
    { name: "Approved treatments", tag: "Published evidence", width: "88%" },
    {
      name: "Recruiting pragmatic trials",
      tag: "Check eligibility",
      width: "72%",
    },
    { name: "Other studied options", tag: "More uncertainty", width: "48%" },
  ];

  return (
    <PreviewFrame label="Treatment explorer">
      <div className="flex items-center gap-2 border-4 border-primary bg-brutal-yellow px-3 py-3 font-black">
        <Search className="h-5 w-5" />
        <span>Search a condition</span>
      </div>
      <div className="mt-4 space-y-3">
        {options.map((option) => (
          <div key={option.name} className="border-2 border-primary p-3">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <span className="font-black">{option.name}</span>
              <span className="w-fit bg-brutal-cyan px-2 py-1 text-xs font-black uppercase">
                {option.tag}
              </span>
            </div>
            <div className="mt-3 h-3 border-2 border-primary bg-background">
              <div
                className="h-full bg-brutal-pink"
                style={{ width: option.width }}
              />
            </div>
          </div>
        ))}
      </div>
    </PreviewFrame>
  );
}

function OutcomeLabelDemo() {
  const rows = [
    ["Benefit patients reported", "See range"],
    ["Common side effects", "See frequency"],
    ["Who was represented", "See population"],
    ["Evidence certainty", "See limitations"],
  ];

  return (
    <PreviewFrame label="Outcome label">
      <div className="border-4 border-primary bg-brutal-cyan p-4">
        <div className="text-2xl font-black uppercase">What happened?</div>
        <p className="mt-1 font-bold">
          Benefits, harms, costs, sources, and uncertainty in one readable
          label.
        </p>
      </div>
      <div className="mt-4 divide-y-2 divide-primary border-2 border-primary">
        {rows.map(([label, action]) => (
          <div
            key={label}
            className="flex items-center justify-between gap-3 p-3 font-bold"
          >
            <span>{label}</span>
            <span className="shrink-0 text-xs font-black uppercase text-brutal-pink">
              {action}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 text-sm font-black uppercase">
        Every conclusion links back to its evidence.
      </div>
    </PreviewFrame>
  );
}

function RoutineCareEvidenceDemo() {
  const records = [
    ["Consent reviewed", "Patient controls participation"],
    ["Treatment taken", "Recorded"],
    ["Symptoms and function", "Short check-in"],
    ["Side effects", "Report now"],
  ];

  return (
    <PreviewFrame label="Routine-care evidence">
      <div className="grid gap-3 sm:grid-cols-2">
        {records.map(([title, detail]) => (
          <div key={title} className="border-2 border-primary p-3">
            <div className="flex items-start gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center border-2 border-primary bg-brutal-green">
                <Check className="h-4 w-4" strokeWidth={4} />
              </span>
              <div>
                <div className="font-black">{title}</div>
                <div className="mt-1 text-xs font-black uppercase text-brutal-pink">
                  {detail}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 border-4 border-primary bg-brutal-yellow p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="font-black uppercase">Your outcome over time</div>
            <div className="text-sm font-bold">
              Bring the trend back to your clinician. Add a de-identified result
              to the pooled evidence only with consent.
            </div>
          </div>
          <BarChart3 className="h-10 w-10 shrink-0" strokeWidth={3} />
        </div>
      </div>
    </PreviewFrame>
  );
}

function ProviderDashboardDemo() {
  const options = [
    ["Eligible study", "Why it may fit"],
    ["Approved option", "Outcome evidence"],
    ["Supportive care", "Burden and cost"],
  ];

  return (
    <PreviewFrame label="Patient-specific evidence review">
      <div className="border-4 border-primary bg-brutal-cyan p-4">
        <div className="font-black uppercase">Patient priorities</div>
        <div className="mt-2 flex flex-wrap gap-2 text-xs font-black uppercase">
          <span className="border-2 border-primary bg-background px-2 py-1">
            Daily function
          </span>
          <span className="border-2 border-primary bg-background px-2 py-1">
            Fewer side effects
          </span>
          <span className="border-2 border-primary bg-background px-2 py-1">
            Remote visits
          </span>
        </div>
      </div>
      <div className="mt-4 space-y-3">
        {options.map(([option, detail], index) => (
          <div
            key={option}
            className="flex items-center gap-3 border-2 border-primary p-3"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-brutal-yellow font-black">
              {index + 1}
            </span>
            <div>
              <div className="font-black">{option}</div>
              <div className="text-sm font-bold text-muted-foreground">
                {detail}
              </div>
            </div>
          </div>
        ))}
      </div>
    </PreviewFrame>
  );
}

function SharedDecisionDemo() {
  return (
    <PreviewFrame label="Shared decision and monitoring">
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          ["Option A", "Benefit, harms, burden, limitations"],
          ["Option B", "Benefit, harms, burden, limitations"],
        ].map(([title, detail], index) => (
          <div
            key={title}
            className={`${index === 0 ? "bg-brutal-yellow" : "bg-brutal-cyan"} border-4 border-primary p-4`}
          >
            <div className="font-black uppercase">{title}</div>
            <div className="mt-2 text-sm font-bold">{detail}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {[
          ["Symptoms", "Review trend"],
          ["Function", "Review change"],
          ["Side effects", "Review signal"],
        ].map(([label, value]) => (
          <div key={label} className="border-2 border-primary p-3">
            <div className="text-sm font-black uppercase">{label}</div>
            <div className="mt-2 text-xs font-bold">{value}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 border-2 border-primary bg-brutal-pink p-3 text-center font-black uppercase text-brutal-pink-foreground">
        Patient preference remains part of the evidence
      </div>
    </PreviewFrame>
  );
}

const patientWorkflow: WorkflowItem[] = [
  {
    title: "Find",
    description:
      "Search approved treatments, eligible studies, and other studied options.",
  },
  {
    title: "Compare",
    description:
      "Read benefits, harms, costs, sources, and uncertainty on one outcome label.",
  },
  {
    title: "Choose",
    description:
      "Review the evidence with a licensed clinician and consent voluntarily.",
  },
  {
    title: "Measure",
    description:
      "Track symptoms, function, side effects, and treatment use during routine care.",
  },
  {
    title: "Learn",
    description:
      "See your own trend and help the next patient make a less blind decision.",
  },
];

const providerWorkflow: WorkflowItem[] = [
  {
    title: "Review",
    description:
      "Start with the patient's diagnosis, priorities, records, and eligibility.",
  },
  {
    title: "Decide together",
    description:
      "Compare options, document informed consent, and coordinate routine care.",
  },
  {
    title: "Monitor",
    description:
      "Follow progress and safety while standardized outcomes improve the evidence.",
  },
];

export default function DecentralizedFDASection() {
  return (
    <SectionContainer
      id="decentralized-fda-section"
      bgColor="cyan"
      borderPosition="bottom"
      padding="lg"
    >
      <Container>
        <div className="mx-auto max-w-5xl text-center">
          <div className="mb-4 inline-block border-4 border-primary bg-brutal-yellow px-4 py-2 text-sm font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            Consumer Reports for drugs
          </div>
          <h2 className="text-4xl font-black uppercase tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
            A decentralized framework for drug assessment
          </h2>
          <p className="mx-auto mt-6 max-w-4xl text-lg font-bold sm:text-xl md:text-2xl">
            Connect treatment access to standardized, public outcomes so every
            patient decision can improve the next one.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2 text-xs font-black uppercase sm:text-sm">
            {[
              "Search any treatment",
              "See real outcomes",
              "Contribute to evidence",
              "Compare cost-effectiveness",
            ].map((feature) => (
              <span
                key={feature}
                className="border-2 border-primary bg-background px-3 py-2"
              >
                {feature}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-12 border-4 border-primary bg-primary p-5 text-center text-primary-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <p className="font-bold">
            These are educational interface examples, not medical advice or a
            promise that every option is available. Treatment decisions stay
            with patients and licensed clinicians.
          </p>
        </div>

        <section className="mt-16" aria-labelledby="patient-workflow-heading">
          <div className="mb-8 flex flex-col items-center gap-3 text-center">
            <Users className="h-12 w-12" strokeWidth={3} />
            <h3
              id="patient-workflow-heading"
              className="text-4xl font-black uppercase tracking-tighter sm:text-5xl md:text-6xl"
            >
              How it works for patients
            </h3>
            <p className="max-w-3xl text-lg font-bold sm:text-xl">
              More useful choices, lighter participation, and a clearer picture
              of what happened.
            </p>
          </div>
          <WorkflowList items={patientWorkflow} color="bg-brutal-yellow" />
          <div className="mt-10 grid items-stretch gap-6 lg:grid-cols-3">
            <TreatmentExplorerDemo />
            <OutcomeLabelDemo />
            <RoutineCareEvidenceDemo />
          </div>
        </section>

        <section className="mt-20" aria-labelledby="provider-workflow-heading">
          <div className="mb-8 flex flex-col items-center gap-3 text-center">
            <Stethoscope className="h-12 w-12" strokeWidth={3} />
            <h3
              id="provider-workflow-heading"
              className="text-4xl font-black uppercase tracking-tighter sm:text-5xl md:text-6xl"
            >
              How it works for providers
            </h3>
            <p className="max-w-3xl text-lg font-bold sm:text-xl">
              Decision support, not a black-box command. Every comparison should
              expose its sources, assumptions, and uncertainty.
            </p>
          </div>
          <div className="mx-auto max-w-5xl">
            <WorkflowList items={providerWorkflow} color="bg-brutal-cyan" />
          </div>
          <div className="mt-10 grid items-stretch gap-6 lg:grid-cols-2">
            <ProviderDashboardDemo />
            <SharedDecisionDemo />
          </div>
        </section>

        <section className="mt-20" aria-labelledby="research-workflow-heading">
          <Card
            className={`gap-0 rounded-none border-4 border-primary bg-brutal-yellow p-0 ${brutalShadow}`}
          >
            <div className="border-b-4 border-primary p-6 text-center">
              <FlaskConical
                className="mx-auto mb-3 h-10 w-10"
                strokeWidth={3}
              />
              <h3
                id="research-workflow-heading"
                className="text-3xl font-black uppercase sm:text-4xl"
              >
                And the evidence loop works for researchers
              </h3>
            </div>
            <div className="grid md:grid-cols-4">
              {[
                {
                  icon: ClipboardCheck,
                  title: "Define",
                  text: "Publish the protocol, outcomes, eligibility, and analysis plan.",
                },
                {
                  icon: Users,
                  title: "Enroll",
                  text: "Invite eligible patients through routine care with voluntary consent.",
                },
                {
                  icon: ShieldCheck,
                  title: "Monitor",
                  text: "Watch safety and completeness while visits and paperwork stay light.",
                },
                {
                  icon: FileSearch,
                  title: "Publish",
                  text: "Release complete results, methods, limitations, and de-identified outcomes.",
                },
              ].map(({ icon: Icon, title, text }) => (
                <div
                  key={title}
                  className="border-primary p-5 md:border-r-4 md:last:border-r-0"
                >
                  <Icon className="h-8 w-8" strokeWidth={3} />
                  <h4 className="mt-3 text-xl font-black uppercase">{title}</h4>
                  <p className="mt-2 text-sm font-bold">{text}</p>
                </div>
              ))}
            </div>
          </Card>
        </section>

        <div className="mt-12 flex justify-center">
          <a
            href="https://dfda.earth"
            className={`inline-flex items-center gap-2 border-4 border-primary bg-brutal-pink px-6 py-4 text-lg font-black uppercase text-brutal-pink-foreground ${brutalShadow} transition-transform hover:-translate-x-1 hover:-translate-y-1`}
          >
            Explore the dFDA <ArrowRight className="h-5 w-5" strokeWidth={4} />
          </a>
        </div>
      </Container>
    </SectionContainer>
  );
}

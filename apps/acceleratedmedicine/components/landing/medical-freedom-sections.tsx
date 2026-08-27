"use client";

import { motion } from "framer-motion";
import {
  ArrowDown,
  ArrowRight,
  BarChart3,
  BookOpen,
  Database,
  HeartPulse,
  Search,
  ShieldCheck,
  Stethoscope,
  Users,
} from "lucide-react";
import Link from "next/link";

import {
  CURRENT_CLINICAL_TRIAL_PARTICIPATION_RATE,
  DFDA_FIRST_TREATMENTS_PER_YEAR,
  DFDA_NET_SAVINGS_RD_ONLY_ANNUAL,
  DFDA_PATIENTS_FUNDABLE_ANNUALLY,
  CURRENT_TRIAL_SLOTS_AVAILABLE,
  DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT,
  DFDA_QUEUE_CLEARANCE_YEARS,
  DFDA_TRIAL_CAPACITY_MULTIPLIER,
  DFDA_TRIAL_COST_REDUCTION_FACTOR,
  DFDA_TRIAL_COST_REDUCTION_PCT,
  DFDA_TRIALS_PER_YEAR_CAPACITY,
  DISEASES_WITHOUT_EFFECTIVE_TREATMENT,
  PATIENT_WILLINGNESS_TRIAL_PARTICIPATION_PCT,
  RARE_DISEASES_COUNT_GLOBAL,
  RECOVERY_TRIAL_COST_PER_PATIENT,
  RECOVERY_TRIAL_COST_REDUCTION_FACTOR,
  TRADITIONAL_PHASE3_COST_PER_PATIENT,
  WILLING_TRIAL_PARTICIPANTS_GLOBAL,
  type Parameter,
} from "@optimitron/data/parameters";
import { Button } from "@optimitron/neobrutalist-ui/ui/button";
import { Card } from "@optimitron/neobrutalist-ui/ui/card";
import { Container } from "@optimitron/neobrutalist-ui/ui/container";
import { SectionContainer } from "@optimitron/neobrutalist-ui/ui/section-container";
import { ParameterValue } from "@/components/shared/ParameterValue";

const brutalShadow =
  "shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all";

function EvidenceNumber({
  param,
  precision,
  className,
}: {
  param: Parameter;
  precision?: number;
  className?: string;
}) {
  return (
    <ParameterValue
      param={param}
      format={precision === undefined ? undefined : { precision }}
      className={className}
    />
  );
}

export function MedicalFreedomHero() {
  const brutalEase: [number, number, number, number] = [0.87, 0, 0.13, 1];
  const wordVariants = {
    hidden: { scale: 20, rotate: -25 },
    visible: {
      scale: 1,
      rotate: 0,
      transition: { duration: 0.5, ease: brutalEase },
    },
  };

  return (
    <SectionContainer
      bgColor="background"
      borderPosition="bottom"
      className="overflow-hidden py-32"
    >
      <Container className="px-6">
        <motion.div
          className="flex flex-col items-center gap-3"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.1 } },
          }}
        >
          <motion.h1
            variants={wordVariants}
            className="text-center text-4xl font-black uppercase leading-none tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl"
          >
            <EvidenceNumber
              param={DISEASES_WITHOUT_EFFECTIVE_TREATMENT}
              precision={2}
              className="text-inherit"
            />{" "}
            diseases have
          </motion.h1>
          <motion.h1
            variants={wordVariants}
            className="text-center text-4xl font-black uppercase leading-none tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl"
          >
            zero effective
          </motion.h1>
          <motion.h1
            variants={{
              hidden: { scale: 25, rotate: 45 },
              visible: {
                scale: [25, 0.8, 1],
                rotate: [45, -15, 0],
                transition: {
                  duration: 0.6,
                  ease: brutalEase,
                  times: [0, 0.7, 1],
                },
              },
            }}
            whileHover={{
              rotate: [0, -5, 5, -5, 5, 0],
              transition: { duration: 0.5 },
            }}
            className="cursor-pointer text-center text-5xl font-black uppercase leading-none tracking-tighter text-brutal-pink sm:text-6xl md:text-7xl lg:text-8xl"
          >
            treatments.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-6 max-w-4xl text-center text-lg font-bold leading-tight sm:text-xl md:text-2xl lg:text-3xl"
          >
            Patients are ready to try. The evidence system cannot include nearly
            enough of them.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="mt-8 flex flex-col items-center gap-4 sm:flex-row"
          >
            <Button
              asChild
              size="lg"
              className={`border-4 border-primary bg-brutal-pink px-8 py-6 text-lg font-black uppercase text-brutal-pink-foreground ${brutalShadow}`}
            >
              <a href="#benefits">
                Show me the benefits <ArrowDown className="h-5 w-5" />
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className={`border-4 border-primary bg-background px-8 py-6 text-lg font-black uppercase ${brutalShadow}`}
            >
              <a href="#evidence">
                Show me the evidence <Search className="h-5 w-5" />
              </a>
            </Button>
          </motion.div>
        </motion.div>
      </Container>
    </SectionContainer>
  );
}

export function ParticipationGapSection() {
  const stats = [
    {
      param: PATIENT_WILLINGNESS_TRIAL_PARTICIPATION_PCT,
      label: "Willing to participate",
      detail: "Patients say yes when asked.",
      color: "bg-background",
      precision: 1,
    },
    {
      param: CURRENT_CLINICAL_TRIAL_PARTICIPATION_RATE,
      label: "Currently participate",
      detail: "The system mostly never asks.",
      color: "bg-brutal-pink",
      precision: 2,
    },
    {
      param: CURRENT_TRIAL_SLOTS_AVAILABLE,
      label: "Annual trial participants",
      detail: "For the entire world.",
      color: "bg-brutal-cyan",
      precision: 1,
    },
  ];

  return (
    <SectionContainer id="benefits" bgColor="yellow" borderPosition="bottom">
      <Container>
        <div className="mb-10 text-center">
          <h2 className="text-4xl font-black uppercase tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
            Patients are ready.
          </h2>
          <h2 className="text-4xl font-black uppercase tracking-tighter text-brutal-pink sm:text-5xl md:text-6xl lg:text-7xl">
            The trial system isn&apos;t.
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {stats.map((stat) => (
            <Card
              key={stat.label}
              className={`${stat.color} gap-3 rounded-none border-4 border-primary p-6 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]`}
            >
              <div className="text-5xl font-black sm:text-6xl">
                <EvidenceNumber param={stat.param} precision={stat.precision} />
              </div>
              <div className="text-lg font-black uppercase">{stat.label}</div>
              <p className="font-bold">{stat.detail}</p>
            </Card>
          ))}
        </div>

        <div className="mt-10 border-4 border-primary bg-primary p-6 text-center text-primary-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="text-4xl font-black text-brutal-yellow sm:text-5xl md:text-6xl">
            <EvidenceNumber
              param={WILLING_TRIAL_PARTICIPANTS_GLOBAL}
              precision={2}
            />
          </div>
          <p className="mt-2 text-lg font-black uppercase sm:text-xl">
            people with chronic disease are willing to participate
          </p>
          <p className="mt-3 font-bold">
            Click any underlined number to inspect its source, assumptions, and
            uncertainty.
          </p>
        </div>
      </Container>
    </SectionContainer>
  );
}

export function MedicalFreedomAccessSection() {
  const benefits = [
    {
      icon: ShieldCheck,
      title: "Get another option",
      description:
        "When approved treatments have failed, informed adults can still make a choice with their clinician.",
      color: "bg-brutal-yellow",
    },
    {
      icon: Database,
      title: "Track what happened",
      description:
        "The same simple before-and-after measures show whether treatment helped.",
      color: "bg-brutal-cyan",
    },
    {
      icon: Users,
      title: "Publish comparable results",
      description:
        "De-identified results show which treatments helped, which failed, and for whom.",
      color: "bg-brutal-pink",
    },
  ];

  return (
    <SectionContainer bgColor="background" borderPosition="bottom">
      <Container>
        <div className="mx-auto mb-12 flex max-w-5xl flex-col items-center gap-4 text-center">
          <h2 className="text-4xl font-black uppercase tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
            The other problem.
          </h2>
          <h3 className="text-3xl font-black tracking-tighter sm:text-4xl md:text-5xl">
            When patients try treatments, the rest of us learn almost nothing.
          </h3>
          <p className="max-w-3xl text-lg font-bold sm:text-xl">
            There are about{" "}
            <EvidenceNumber param={RARE_DISEASES_COUNT_GLOBAL} precision={0} />{" "}
            rare diseases. Roughly{" "}
            <EvidenceNumber
              param={DISEASES_WITHOUT_EFFECTIVE_TREATMENT}
              precision={2}
            />{" "}
            still lack an effective treatment.
          </p>
          <p className="max-w-3xl text-lg font-bold sm:text-xl">
            Right to Try creates access. Standardized outcomes turn isolated
            treatment decisions into comparable evidence about what works.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {benefits.map(({ icon: Icon, title, description, color }) => (
            <Card
              key={title}
              className={`${color} gap-4 rounded-none border-4 border-primary p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]`}
            >
              <Icon className="h-12 w-12" strokeWidth={3} />
              <h4 className="text-2xl font-black uppercase">{title}</h4>
              <p className="font-bold">{description}</p>
            </Card>
          ))}
        </div>
      </Container>
    </SectionContainer>
  );
}

export function MedicalFreedomBridgeSection() {
  return (
    <SectionContainer bgColor="pink" borderPosition="bottom">
      <Container>
        <h2 className="text-center text-3xl font-black uppercase leading-tight text-white sm:text-4xl md:text-5xl lg:text-7xl">
          Give patients access. <br />
          Measure every outcome.
        </h2>
      </Container>
    </SectionContainer>
  );
}

export function PragmaticTrialEvidenceSection() {
  return (
    <SectionContainer id="evidence" bgColor="yellow" borderPosition="bottom">
      <Container>
        <h2 className="mb-12 text-center text-3xl font-black uppercase leading-tight sm:text-4xl md:text-5xl lg:text-7xl">
          Oxford&apos;s RECOVERY trial proved research can cost dramatically
          less
        </h2>

        <div className="grid items-stretch gap-6 md:grid-cols-3">
          <Card className="gap-3 rounded-none border-4 border-primary bg-background p-6 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-5xl font-black text-brutal-pink sm:text-6xl">
              <EvidenceNumber param={RECOVERY_TRIAL_COST_PER_PATIENT} />
            </div>
            <div className="text-lg font-black uppercase">RECOVERY result</div>
            <p className="font-bold">Per patient in a real pragmatic trial.</p>
          </Card>

          <Card className="gap-3 rounded-none border-4 border-primary bg-brutal-cyan p-6 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-5xl font-black sm:text-6xl">
              <EvidenceNumber param={DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT} />
            </div>
            <div className="text-lg font-black uppercase">
              Pragmatic-trial cost
            </div>
            <p className="font-bold">Reference cost per participant.</p>
          </Card>

          <Card className="gap-3 rounded-none border-4 border-primary bg-primary p-6 text-center text-primary-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-5xl font-black sm:text-6xl">
              <EvidenceNumber param={TRADITIONAL_PHASE3_COST_PER_PATIENT} />
            </div>
            <div className="text-lg font-black uppercase">
              Traditional phase 3
            </div>
            <p className="font-bold">Median cost per participant.</p>
          </Card>
        </div>

        <div className="mt-10 grid gap-4 border-4 border-primary bg-background p-6 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] sm:grid-cols-3">
          <div>
            <div className="text-4xl font-black text-brutal-pink">
              <EvidenceNumber
                param={RECOVERY_TRIAL_COST_REDUCTION_FACTOR}
                precision={0}
              />
            </div>
            <div className="font-black uppercase">Demonstrated by RECOVERY</div>
          </div>
          <div>
            <div className="text-4xl font-black text-brutal-pink">
              <EvidenceNumber
                param={DFDA_TRIAL_COST_REDUCTION_FACTOR}
                precision={1}
              />
            </div>
            <div className="font-black uppercase">Reference cost ratio</div>
          </div>
          <div>
            <div className="text-4xl font-black text-brutal-pink">
              <EvidenceNumber
                param={DFDA_TRIAL_COST_REDUCTION_PCT}
                precision={1}
              />
            </div>
            <div className="font-black uppercase">Lower trial cost</div>
          </div>
        </div>
      </Container>
    </SectionContainer>
  );
}

export function ModeledBenefitsSection() {
  const modelStats = [
    {
      param: DFDA_PATIENTS_FUNDABLE_ANNUALLY,
      label: "Patients supported per year",
      color: "bg-background",
      precision: 1,
    },
    {
      param: DFDA_TRIALS_PER_YEAR_CAPACITY,
      label: "Pragmatic trials per year",
      color: "bg-brutal-yellow",
      precision: 1,
    },
    {
      param: DFDA_FIRST_TREATMENTS_PER_YEAR,
      label: "First treatments per year",
      color: "bg-brutal-cyan",
      precision: 0,
    },
    {
      param: DFDA_QUEUE_CLEARANCE_YEARS,
      label: "Years to cover the untreated queue",
      color: "bg-brutal-pink",
      precision: 1,
    },
    {
      param: DFDA_TRIAL_CAPACITY_MULTIPLIER,
      label: "Trial-capacity increase",
      color: "bg-background",
      precision: 1,
    },
    {
      param: DFDA_NET_SAVINGS_RD_ONLY_ANNUAL,
      label: "Annual net R&D savings",
      color: "bg-brutal-yellow",
      precision: 1,
    },
  ];

  return (
    <SectionContainer
      id="model"
      bgColor="cyan"
      borderPosition="bottom"
      className="scroll-mt-[121px]"
    >
      <Container>
        <div className="mx-auto mb-12 max-w-5xl text-center">
          <h2 className="text-4xl font-black uppercase tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
            What happens when every patient can participate
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {modelStats.map((stat) => (
            <Card
              key={stat.label}
              className={`${stat.color} gap-3 rounded-none border-4 border-primary p-6 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]`}
            >
              <div className="text-4xl font-black sm:text-5xl">
                <EvidenceNumber param={stat.param} precision={stat.precision} />
              </div>
              <div className="font-black uppercase">{stat.label}</div>
            </Card>
          ))}
        </div>
      </Container>
    </SectionContainer>
  );
}

export function PatientImpactSection() {
  const steps = [
    {
      icon: Stethoscope,
      title: "One patient gets an option",
      text: "A person with no adequate approved treatment can make an informed choice with a clinician.",
      color: "bg-brutal-yellow",
    },
    {
      icon: HeartPulse,
      title: "Their result changes the rankings",
      text: "The same simple measures show how their treatment compares with every other option.",
      color: "bg-background",
    },
    {
      icon: Users,
      title: "The evidence is published",
      text: "De-identified results reveal what helps, what fails, and which patients respond best.",
      color: "bg-brutal-cyan",
    },
  ];

  return (
    <SectionContainer bgColor="pink" borderPosition="bottom">
      <Container>
        <h2 className="mb-12 text-center text-4xl font-black uppercase leading-tight text-brutal-pink-foreground sm:text-5xl md:text-6xl lg:text-7xl">
          Treatment becomes evidence
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {steps.map(({ icon: Icon, title, text, color }, index) => (
            <Card
              key={title}
              className={`${color} gap-4 rounded-none border-4 border-primary p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]`}
            >
              <div className="flex items-center justify-between">
                <Icon className="h-12 w-12" strokeWidth={3} />
                <span className="text-4xl font-black">{index + 1}</span>
              </div>
              <h3 className="text-2xl font-black uppercase">{title}</h3>
              <p className="font-bold">{text}</p>
            </Card>
          ))}
        </div>
      </Container>
    </SectionContainer>
  );
}

export function EducationCallToAction() {
  const actions = [
    {
      href: "#evidence",
      eyebrow: "Option 1: Learn",
      title: "Inspect the evidence",
      text: "See the observed trial costs, source studies, and calculation inputs.",
      color: "bg-brutal-cyan",
      icon: BookOpen,
    },
    {
      href: "#model",
      eyebrow: "Option 2: Check",
      title: "Check the math",
      text: "Open every number. Check its inputs. Decide whether the benefits survive your assumptions.",
      color: "bg-brutal-yellow",
      icon: BarChart3,
    },
    {
      href: "/donate",
      eyebrow: "Option 3: Support",
      title: "Fund the research",
      text: "Support a 501(c)(3) working to make treatment evidence faster, cheaper, and public.",
      color: "bg-brutal-pink",
      icon: HeartPulse,
    },
  ];

  return (
    <SectionContainer bgColor="background" borderPosition="bottom">
      <Container>
        <h2 className="mb-12 text-center text-4xl font-black uppercase sm:text-5xl md:text-6xl lg:text-7xl">
          Do something
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {actions.map(({ href, eyebrow, title, text, color, icon: Icon }) => (
            <Link
              key={title}
              href={href}
              className={`${color} flex min-h-72 flex-col border-4 border-primary p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]`}
            >
              <div className="mb-4 flex items-start justify-between gap-4">
                <span className="font-black uppercase">{eyebrow}</span>
                <Icon className="h-10 w-10 shrink-0" strokeWidth={3} />
              </div>
              <h3 className="text-3xl font-black uppercase">{title}</h3>
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

export function MedicalFreedomFinalCTA() {
  const statements = [
    "Patient access: expanded",
    "Evidence: pooled",
    "Results: public",
    "Research cost: lower",
    "Time: now",
  ];

  return (
    <SectionContainer
      bgColor="yellow"
      borderPosition="none"
      className="overflow-hidden"
    >
      <Container size="md" className="overflow-hidden text-center">
        <div className="mb-12 space-y-4">
          {statements.map((statement, index) => (
            <motion.div
              key={statement}
              initial={{ scale: 0.5, opacity: 0 }}
              whileInView={{ scale: [0.5, 1.2, 1], opacity: 1 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.4,
                delay: 0.1 + index * 0.08,
                times: [0, 0.6, 1],
              }}
              className={`text-xl font-black uppercase sm:text-2xl md:text-3xl ${index === statements.length - 1 ? "text-brutal-pink" : ""}`}
            >
              {statement}
            </motion.div>
          ))}
        </div>

        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <Button
            asChild
            size="lg"
            className={`border-4 border-primary bg-background px-8 py-6 text-lg font-black uppercase text-foreground ${brutalShadow}`}
          >
            <a href="#evidence">
              Read the evidence <BookOpen className="h-5 w-5" />
            </a>
          </Button>
          <Button
            asChild
            size="lg"
            className={`border-4 border-primary bg-brutal-pink px-8 py-6 text-lg font-black uppercase text-brutal-pink-foreground ${brutalShadow}`}
          >
            <Link href="/donate">
              Support the research <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </div>

        <div className="mt-8 text-lg font-black uppercase sm:text-xl md:text-2xl">
          Enroll. Pool. Publish. Learn.
        </div>
      </Container>
    </SectionContainer>
  );
}
